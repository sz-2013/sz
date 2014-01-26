# -*- coding: utf-8 -*-
import json
from django import forms
from django.utils.translation import ugettext_lazy as _
from sz import settings
from sz.core import models


class PlaceExploreRequestForm(forms.Form):
    latitude = forms.FloatField(
        required=True, min_value=-90.0, max_value=90.0, label=u'Широта')
    longitude = forms.FloatField(
        required=True, min_value=-180.0, max_value=180.0, label=u'Долгота')
    query = forms.CharField(required=False, label=u'Запрос')
    radius = forms.IntegerField(
        required=True, min_value=0, max_value=5000,
        label=u'Удалённость', initial=settings.BLOCKS_RADIUS)


class PlaceSearchRequestForm(forms.Form):
    latitude = forms.FloatField(
        required=True, min_value=-90.0, max_value=90.0, label=u'Широта')
    longitude = forms.FloatField(
        required=True, min_value=-180.0, max_value=180.0, label=u'Долгота')
    query = forms.CharField(required=False, label=u'Запрос')
    radius = forms.IntegerField(
        required=False, min_value=0, max_value=5000,
        label=u'Удалённость', initial=settings.BLOCKS_RADIUS)


class PaginatedRequestForm(forms.Form):
    max_id = forms.IntegerField(required=False, min_value=0)
    limit = forms.IntegerField(
        required=False, min_value=1,
        max_value=50, initial=settings.DEFAULT_PAGINATE_BY)
    offset = forms.IntegerField(required=False, min_value=0)


class MessageRequestForm(PaginatedRequestForm):
    query = forms.CharField(required=False, label=u'Запрос')
    category = forms.ModelChoiceField(
        queryset=models.Category.objects.all(),
        required=False, label=u'Категория')
    photo = forms.BooleanField(label=u'Только с фото', required=False)


class NewsRequestForm(MessageRequestForm):
    latitude = forms.FloatField(
        required=True, min_value=-90.0,
        max_value=90.0, label=u'Широта')
    longitude = forms.FloatField(
        required=True, min_value=-180.0,
        max_value=180.0, label=u'Долгота')
    radius = forms.IntegerField(
        required=False, min_value=0,
        max_value=5000, label=u'Удалённость',
        # initial=settings.DEFAULT_RADIUS
        initial=0
    )


class GameMapRequestForm(forms.Form):
    latitude = forms.FloatField(
        required=True, min_value=-90.0, max_value=90.0, label=u'Широта')
    longitude = forms.FloatField(
        required=True, min_value=-180.0, max_value=180.0, label=u'Долгота')


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


class MessagePhotoPreview(forms.Form):
    photo = forms.ImageField(required=True)
    photo_width = forms.FloatField(required=True)
    photo_height = forms.FloatField(required=True)
    face_id = forms.IntegerField(required=False)
    faces_list = FacesListField(required=False)
