import json
from rest_framework import fields
from rest_framework import relations
from django import forms
from django.utils.translation import ugettext_lazy as _
# from sz.api import pagination
# from sz.api import services


class NestedField(fields.Field):
    def __init__(self, *args, **kwargs):
        self.serializer = kwargs.pop('serializer', None)
        self.paginate_by = kwargs.pop('paginate_by', None)
        self.transform = kwargs.pop('transform', None)
        assert self.transform, 'transform is required'
        kwargs['source'] = '*'
        super(NestedField, self).__init__(*args, **kwargs)

    def to_native(self, obj):
        """
        Converts the field's value into it's simple representation.
        """
        args = hasattr(self.parent, 'trans_args') and \
            self.parent.trans_args or None
        value = self.transform(obj, args)
        if self.serializer:
            # if issubclass(self.serializer, pagination.PaginationSerializer):
            #     if self.paginate_by:
            #         value = services.paginated_content(
            #    value, paginate_by=self.paginate_by)
            #     else:
            #         value = services.paginated_content(value)
            serializer = self.serializer(instance=value)
            value = serializer.data
        return value


class ResourceField (relations.HyperlinkedIdentityField):
    def field_to_native(self, obj, field_name):
        url = super(ResourceField, self).field_to_native(obj, field_name)
        return {'url': url, }


class FacesInFacesListFeils(forms.Field):
    default_error_messages = {
        'wrong_type': _(u'face in faces_list must be a dict instance'),
        'wrong_keys': _(u'"x", "y", "width" and "height" must be in a face'),
    }

    def validate(self, value):
        if not isinstance(value, dict):
            raise forms.ValidationError(self.error_messages['wrong_type'])
        if not value.get('x') and not value.get('y') and \
           not value.get('width') and not value.get('height'):
                raise forms.ValidationError(self.error_messages['wrong_keys'])


class FacesListField(forms.Field):
    default_error_messages = {
        'wrong_type': _(u'faces_list must be a list instance'),
    }

    def _to_list(self, value):
        return json.loads(value)

    def to_python(self, value):
        if value in self.empty_values:
            return None
        return self._to_list(value)

    def validate(self, value):
        if value:
            if not isinstance(value, list):
                raise forms.ValidationError(self.error_messages['wrong_type'])
            f = FacesInFacesListFeils()
            map(f.clean, value)
