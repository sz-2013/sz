#!/usr/bin/env python
import os
import random

GENDERS_LIST = ['u', 'm', 'f']
RACES_LIST = ['futuri', 'amadeus', 'united']
LATITUDE = 40.7755555
LONGITUDE = -73.9747221
RADIUS = 100
RADIUS_MAX = 1500
RADIUS_STEP = 100


_rand = lambda: round(
    random.random() + random.randint(0, 3), 8)*random.choice([-1, 1])


def _create_from_list(model, arr, params_factory=None):
    if params_factory is None:
        params_factory = lambda name: dict(name=name)
    for el in arr:
        model.objects.get_or_create(**params_factory(el))


def create_races():
    _create_from_list(Races, RACES_LIST)


def create_genders():
    _create_from_list(Gender, GENDERS_LIST)


def create_faces():
    _create_from_list(Face, EMOTION_CHOICES, lambda e: dict(emotion=e[0]))


def create_places():
    user = User.objects.all()[0]
    for radius in xrange(RADIUS, RADIUS_MAX, RADIUS_STEP):
        count = 0
        for i in xrange(20):
            params = dict(user=user, radius=radius,
                          latitude=LATITUDE + _rand(),
                          longitude=LONGITUDE + _rand())
            count += len(place_service.explore_in_venues(**params))
        print '%s --> ok ( %s / %s )' % (
            radius, Place.objects.all().count(), count)


def update_gamemap():
    gamemap_service.update_gamemap(
        dict(latitude=LATITUDE,
             longitude=LONGITUDE))


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sz.settings")

    from sz.static.models import Face, Races, Gender, EMOTION_CHOICES
    from sz.core.models import User
    from sz.place.models import Place
    from sz.gamemap.models import UserPath
    from sz.api.views import place_service
    from sz.api.views import gamemap_service
    # create_races()
    # create_genders()
    # create_faces()
    # create_places()
    update_gamemap()
    # UserPath.objects.create_or_update_path(
    #     user=User.objects.all()[0], city_id=1,
    #     path=[[1, 1], [2, 2], [3, 3], [4, 40]])
