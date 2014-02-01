import json
import datetime
from rest_framework import fields
from rest_framework import relations
from rest_framework import serializers
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


class FacesListInstanceForm(forms.Form):
    x = forms.FloatField(required=True)
    y = forms.FloatField(required=True)
    height = forms.FloatField(required=True)
    width = forms.FloatField(required=True)
    face_id = forms.IntegerField(required=True)


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

    def validate(self, faces_list):
        if faces_list:
            if not isinstance(faces_list, list):
                raise forms.ValidationError(self.error_messages['wrong_type'])
            for f in faces_list:
                request_form = FacesListInstanceForm(data=f)
                if not request_form.is_valid():
                    raise forms.ValidationError(request_form.errors)


class StringDataField(serializers.WritableField):
    def to_native(self, date):
        if isinstance(date, datetime.datetime):
            return [date.year, date.month, date.day,
                    date.hour, date.minute, date.second]
        else:
            return []


class MessagePhotoPreviewFacesLIstField(serializers.WritableField):
    def from_native(self, data):
        if data is not None:
            if not isinstance(data, list):
                raise serializers.ValidationError(u'face_list must be a list')
            for face in data:
                s = serializers.MessagePhotoPreviewFacesListSerializer(
                    data=face)
                if not s.is_valid():
                    raise serializers.ValidationError(s.errors)
        return data
