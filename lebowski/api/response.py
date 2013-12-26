# -*- coding: utf-8 -*-
from rest_framework.response import Response as RestFrameworkResponse
from rest_framework.reverse import reverse

from sz.core import models

# from sz.core import gis as gis_core

class Response(RestFrameworkResponse):
    """
    An HttpResponse that allows it's data to be rendered into
    arbitrary media types.
    """
    def __init__(self, data=None, status=200,
                 template_name=None, headers=None, info=dict()):
        """
        Alters the init arguments slightly.
        For example, drop 'template_name', and instead use 'data'.

        Setting 'renderer' and 'media_type' will typically be defered,
        For example being set automatically by the `APIView`.
        """
        super(Response, self).__init__(None, status=status, template_name=template_name, headers=headers)
        self.data = {'data': data, 'meta': {'code': status, 'info': info}}

def get_string_date(date):
    return [date.year, date.month, date.day, date.hour, date.minute, date.second]


# def users_response(data):
#     response = {
#         'user_id':data['id'],
#         'user_email':data['email'],
#         'user_date_confirm':get_string_date(data['date_confirm']),
#         'user_race':data.get("race") and int(data["race"]) or 0,
#         'user_gender':data.get("gender") and int(data["gender"]) or 0, 
#     }
#     return response

def users_coordinate_response(serialiser,position):
    if serialiser.is_valid():
        serialiser.object["user_latitude"] = position.get("latitude")
        serialiser.object["user_longitude"] = position.get("longitude")
    return serialiser


# def places_create_response(data):    
#     data_place,data_creator = data
#     response = {
#         #place
#         'place_id':data_place['id'],
#         'place_name':data_place['name'],
#         'place_date':get_string_date(data_place['date']),
#         'place_longitude':data_place['longitude'],
#         'place_latitude':data_place['latitude'],    
#         #user
#         'user_id':data_creator['id'],
#         'user_latitude':data_creator['user_latitude'],
#         'user_longitude':data_creator['user_longitude'],
#     }
#     return response

