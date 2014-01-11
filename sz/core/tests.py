# -*- coding: utf-8 -*-
from django.utils import unittest
from sz.core import models, gis as gis_core


def create_user(email="sz@sz.com", race_name="q", gender_name="q"):
    race_list = models.Races.objects.filter(name=race_name)
    race = race_list and race_list[0] or \
        models.Races.objects.create(name=race_name)
    gender_list = models.Gender.objects.filter(name=gender_name)
    gender = gender_list and gender_list[0] or \
        models.Gender.objects.create(name=gender_name)
    user_params = {"email": email, "race": race, "gender": gender}
    if not models.User.objects.filter(email=user_params['email']):
        user = models.User.objects.create(**user_params)
    else:
        user = models.User.objects.get(email=user_params['email'])
    return user


class PlaceMain(unittest.TestCase):
    def setUp(self, name="LebowskiStyle", latitude=50.0, longitude=127.0):
        place_param = {
            "name": name,
            "position": gis_core.ll_to_point(longitude, latitude),
            "city_id": 1
        }
        if not models.Place.objects.filter(name=place_param["name"]):
            self.place = models.Place.objects.create(**place_param)
        else:
            self.place = models.Place.objects.get(
                name=place_param["name"], position=place_param["position"])
        self.place_attrs = {
            "name": self.place.name,
            "latitude": self.place.latitude(),
            "longitude": self.place.longitude()
        }

from sz.core import services

"""
#########################################
#Service test
#########################################
"""


class PlaceServiceTestCase(unittest.TestCase):
    def setUp(self):
        self.service = services.PlaceService

    def test_explore_in_venues(self):
        """
        Function gets a params
            {
                "latitude":LATITUDE,
                "longitude":LONGITUDE,
                "radius":DEF_BLOCK_RAD,
                "query":QUERY,
                "creator":USER_EMAIL
            }
        where lat and lng - it is user's position.
        Function send this params in 4qk, and if 4qk return
        list of places, check this places in db.
        If place dont create in db - function do it.
        If place create in db, but place.is_active = False
        function make place is active.
        Function return list
            [
                {
                    "creator":
                        {
                            "email":EMAIL,
                            "latitude":LATITUDE,
                            "longitude":LONGITUDE
                        },
                    "place":
                        {
                            "latitude":LATITUDE,
                            "longitude":LONGITUDE,
                            "name":NAME,
                            "id":ID,
                            ... #other place's params
                        }
                }
                ....
            ]
        """
        #do it please, dont forget
        creator = create_user(email="place_service1@sz.com")
