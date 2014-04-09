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


def createRaces():
    _create_from_list(Races, RACES_LIST)


def createGenders():
    _create_from_list(Gender, GENDERS_LIST)


def createFaces():
    _create_from_list(Face, EMOTION_CHOICES, lambda e: dict(emotion=e[0]))


def createPlaces():
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


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sz.settings")

    from sz.static.models import Face, Races, Gender, EMOTION_CHOICES
    from sz.core.models import User
    from sz.place.models import Place
    from sz.api.views import place_service
    createRaces()
    createGenders()
    createFaces()
    createPlaces()
