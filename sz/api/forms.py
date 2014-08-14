# -*- coding: utf-8 -*-
from django import forms
from sz import settings
# from sz.core import models
from sz.api.fields import FacesListField, GameMapPathField


class PositionRequestForm(forms.Form):
    latitude = forms.FloatField(
        required=True, min_value=-90.0, max_value=90.0, label=u'Широта')
    longitude = forms.FloatField(
        required=True, min_value=-180.0, max_value=180.0, label=u'Долгота')


class PositionWithRadiusRequestForm(PositionRequestForm):
    radius = forms.IntegerField(
        required=True, min_value=0, max_value=5000,
        label=u'Удалённость', initial=settings.BLOCKS_RADIUS)


class PlaceExploreRequestForm(PositionWithRadiusRequestForm):
    query = forms.CharField(required=False, label=u'Запрос')


class PlaceSearchRequestForm(PlaceExploreRequestForm):
    pass


class PaginatedRequestForm(forms.Form):
    max_id = forms.IntegerField(required=False, min_value=0)
    limit = forms.IntegerField(
        required=False, min_value=1,
        max_value=50, initial=settings.DEFAULT_PAGINATE_BY)
    offset = forms.IntegerField(required=False, min_value=0)


class MessageRequestForm(PaginatedRequestForm):
    query = forms.CharField(required=False, label=u'Запрос')
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


class GameMapRequestForm(PositionRequestForm):
    pass


class GameMapPathRequestForm(PositionRequestForm):
    pass


class GameMapTileRequestForm(PositionRequestForm):
    x = forms.IntegerField(required=True)
    y = forms.IntegerField(required=True)


class MessagePhotoPreviewRequestForm(forms.Form):
    photo = forms.ImageField(required=True)
    photo_width = forms.FloatField(required=True)
    photo_height = forms.FloatField(required=True)
    faces_list = FacesListField(required=False)


class MessageAddRequestForm(PositionRequestForm):
    place = forms.IntegerField(required=True)
    text = forms.CharField(required=False)
    photo_id = forms.IntegerField(required=False)
    faces_list = FacesListField(required=False)


class GameMapPathPostRequestForm(forms.Form):
    path = GameMapPathField(required=True)
