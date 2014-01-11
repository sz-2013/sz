# -*- coding: utf-8 -*-
from django.http import Http404
from rest_framework import status
from sz.api import response as sz_api_response, serializers
from rest_framework.reverse import reverse
from sz.api.views import SzApiView
from sz.core import models, gis as gis_core
from sz.settings import LEBOWSKI_MODE_TEST
from sz import mode_test
import random
import shelve
import os


def generate_places(list_len=100, places=None):
    def generate_float():
        return round(
            random.uniform(0.000001, mode_test.STEP*mode_test.COUNT), 6)
    if places is None:
        places = []
    if list_len:
        random_i = [random.randint(0, len(mode_test.PLACES_NAMES) - 1)]
        p = dict(
            name=mode_test.PLACES_NAMES[random_i],
            location={'lng': generate_float(), 'lat': generate_float()})
        places.append(p)
        return generate_places(list_len - 1, places)
    else:
        return places


def get_params(p):
    return dict(
        name=p['name'], city_id=0,
        position=gis_core.ll_to_point(
            p['location']['lng'], p['location']['lat']))


def place_serializers(p):
    p['city_id'] = 0
    return p


model_p = models.Place.objects


class GeneratePlaces(SzApiView):
    def get(self, request, format=None):
        if not LEBOWSKI_MODE_TEST:
            return sz_api_response.Response(
                {'data': 'LEBOWSKI_MODE_TEST is off'})
        if shelve.open('generated_place.shelve'):
            for p in shelve.open('generated_place.shelve')['venues']:
                model_p.filter(**get_params(p)).delete()
            del shelve.open('generated_place.shelve')['venues']
        list_len = int(request.QUERY_PARAMS.get('count', 100))
        data = map(place_serializers, generate_places(list_len=list_len))
        shelve.open('generated_place.shelve')['venues'] = data
        return sz_api_response.Response({'venues': data})


class GetPlaces(SzApiView):
    def get(self, request, format=None):
        places_list = shelve.open('generated_place.shelve')['venues']
        data = {'venues': shelve.open('generated_place.shelve')['venues']}
        return sz_api_response.Response(data)
