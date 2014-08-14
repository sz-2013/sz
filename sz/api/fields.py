import json
import datetime
from rest_framework import fields
from rest_framework import relations
from rest_framework import serializers
from django import forms
from django.utils.translation import ugettext_lazy as _
from django.core.exceptions import ValidationError
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


class ListField(forms.Field):
    default_error_messages = {
        'wrong_type': _(u'ListField must be a list instance'),
    }

    def _to_list(self, value):
        return json.loads(value)

    def to_python(self, value):
        if value in self.empty_values:
            return None
        return self._to_list(value)

    def _validate_elements(self, value):
        pass

    def validate(self, value):
        if value:
            if not isinstance(value, list):
                raise forms.ValidationError(self.error_messages['wrong_type'])
            self._validate_elements(value)


class FacesListField(ListField):
    def _validate_elements(self, faces_list):
        for f in faces_list:
            request_form = FacesListInstanceForm(data=f)
            if not request_form.is_valid():
                raise forms.ValidationError(request_form.errors)


class GameMapPathField(ListField):
    notvalidError = 'This list can\'t to be a path: ' + \
                    'a path should contains only continuous boxes.'

    def _validate_elements(self, path):
        is_notvalid = lambda a, b: len([i for i, el in enumerate(a)
                                        if abs(el - b[i]) > 1])
        for i, pos in enumerate(path):
            if i and is_notvalid(pos, path[i-1]):
                raise ValidationError(self.notvalidError)


class IdListField(serializers.WritableField):
    def to_native(self, djangoManyRelatedManager):
        try:
            return [obj.id for obj in djangoManyRelatedManager.all()]
        except AttributeError, e:
            raise forms.ValidationError(e)


class IntFloatListField(serializers.WritableField):
    def from_native(self, data):
        if not isinstance(data, list):
            raise serializers.ValidationError(u'data must be a list')
        if not data:
            return data
        if len(data) != 2:
            raise serializers.ValidationError(u'list is too long')
        data_int = data[0]
        data_float = data[1]
        if not isinstance(data_int, int):
            raise serializers.ValidationError(
                u'first data element must be a int')
        if data_float and not isinstance(data_float, float):
            raise serializers.ValidationError(
                u'second data element must be a float')
        if not data_float and not isinstance(data_float, float):
            raise serializers.ValidationError(
                u'wrong type for second data element')
        return data


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
