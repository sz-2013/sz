# -*- coding: utf-8 -*-
import json
import random
import uuid
from django.core.files import File
from django.test.client import RequestFactory
from django.utils import unittest
from sz.api import posts, serializers
from sz.core import models, gis as gis_core
from sz.core.models import EMOTION_CHOICES, get_system_path_media


def get_file(path):
    src = open(get_system_path_media(path))
    return File(src)

GENDERS = ['u', 'm', 'f']
RACES = ['futuri', 'amadeus', 'united']
FACES = [get_file('faces/3.png')]
EMAIL = "sz@sz.com"
PSWD = '123'
PHOTO = dict(file='photos/1.jpg', photo_height=1024, photo_width=768)
LATITUDE = 40.7755555
LONGITUDE = -73.9747221
RADIUS = 250

PLACE_NAME = 'CoolPlace'
PLACE_LAT = 40.76022
PLACE_LON = -73.98439
CITY_ID = 1
POSITION = gis_core.ll_to_point(PLACE_LON, PLACE_LAT)

api_root = '/api/'
API = {
    'user': {
        'create': api_root + 'users/register/',
    },
    'place': {
        'explore': api_root + 'places/explore-in-venues/',
        'search': api_root + 'search-in-venues',
    },
    'message': {
        'photopreview': api_root + 'messages/add/photopreviews/',
        'create': api_root + 'messages/add/'
    },
    'gamemap': {
        'get_gamemap': api_root + 'gamemap/',
    },
}


def generate_stuff():
    return str(uuid.uuid4()).split('-')[0]


def generate_faces_list(pic_width, pic_height, n=3):
    face = get_face()

    def gener_face(k):
        return dict(
            x=random.randint(0, pic_width), y=random.randint(0, pic_height),
            width=k*face.face.width, height=k*face.face.height,
            face_id=face.id)
    k_list = map(lambda i: i/100.0, random.sample(xrange(20, 50), n))
    return json.dumps(map(gener_face, k_list))


def generate_email():
    return "%s@sz.com" % generate_stuff()


def get_race():
    return models.Races.objects.get_or_create(name=RACES[0])[0]


def get_gender():
    return models.Gender.objects.get_or_create(name=GENDERS[0])[0]


def get_face():
    return models.Face.objects.get_or_create(
        emotion=EMOTION_CHOICES[0][0], face=FACES[0])[0]


def get_photo(k=1):
    photo = dict(file=PHOTO['file'])
    photo['photo_width'] = PHOTO['photo_width']*k
    photo['photo_height'] = PHOTO['photo_height']*k
    return photo


def get_data(response):
    content = json.loads(response.render().content)
    return content.get('data') if isinstance(content, dict) else content


def get_response(path, method, views,
                 query=None, files=None, data=None, user=None, kwargs=None):
    """Generate request.

    Args:
        path - path for request, str.
        method - method for request, str.
        views - str,
        normal_code - expected code, num.
        query - query for request, dict
        data - data for request, dict
        user - <User> instance
        files - dict, for ex
            {"photo": SHORT_PATH} or {"photo": PHOTO_FILE}
        kwargs - dict

    Returns:
        response
    """
    factory = RequestFactory()
    request = getattr(factory, method.lower())(path)
    request._dont_enforce_csrf_checks = True
    if files:
        files_storage = {}
        for name, f in files.iteritems():
            if isinstance(f, basestring):
                f = get_file(f)
            if isinstance(f, File):
                files_storage[name] = f
        request.FILES.update(**files_storage)
    if data:
        request.POST.update(**data)
    if query:
        # query_list = ["%s=%s" % (k, v) for k, v in query.iteritems()]
        # request.GET = QueryDict(';'.join(query_list))
        request.GET = query
    if user:
        request.user = user
    if not kwargs:
        kwargs = {}
    return views.as_view()(request, **kwargs)


def get_string_date(date):
    return [date.year, date.month, date.day,
            date.hour, date.minute, date.second] if date else []


def get_normal_user_data():
    return dict(email=generate_email(), race=get_race().id,
                gender=get_gender().id, password1=PSWD, password2=PSWD, )


def get_full_user_data():
    return dict(email=generate_email(), race=get_race(), gender=get_gender(),
                role=models.RoleUser.objects.get_or_create(
                    name=models.STANDART_ROLE_USER_NAME)[0])


def get_nornal_place_data():
    return dict(
        name=generate_stuff(), city_id=CITY_ID, position=POSITION,
        address=generate_stuff(), fsq_id=generate_stuff())


def get_place_query(**kwargs):
    return json.dumps(kwargs)

"""Serializers"""

########## USERS


class BLStandartDataTest(unittest.TestCase):
    def _getdata_(self, status_code, path, method, view,
                  data=None, user=None, query=None):
        response = get_response(
            path, method, view, data=data, user=user, query=query)
        self.assertEqual(
            response.status_code, status_code, msg=response.render())
        return get_data(response)

    def check_val_type(self, data, name, val_type, val_len=None):
        if isinstance(data, dict):
            val = data.get(name)
        else:
            val = data
        if val_type is float:
            val_type = float if val else int
        self.assertTrue(
            isinstance(val, val_type),
            msg="Wrong type for %s: %s instead of %s" % (
                name, type(val), val_type))
        if val_len is not None:
            self.assertEqual(len(val), val_len)

    def check_place_data(self, data, place, bl_test=True, user=None,
                         is_owner=None, distance=None, place_user=True,
                         place_opener=True):
        """
        (STANDART_PLACE_DATA)
        [https://github.com/sz-2013/sz/wiki/BL:-STANDART_PLACE_DATA]
        """
        def check_profit(name):
            self.check_val_type(data, name, dict)
            for profit_name, profit_value in data.get('name').iteritems():
                _profit_name = '%s: %s' % (name, profit_name)
                self.check_val_type(profit_value, _profit_name, 3)
                [self.check_val_type(p, '%s[%s]' % (_profit_name, i), int)
                 for i, p in enumerate(profit_value)]

        self.assertEqual(data.get('place_id'), place.id)
        self.assertEqual(data.get('place_name'), place.name)
        self.assertEqual(data.get('place_city'), place.city_id)    # int
        self.assertEqual(
            data.get('place_longitude'), place.longitude())  # float
        self.assertEqual(
            data.get('place_latitude'), place.latitude())  # float
        self.assertEqual(data.get('place_address'), place.address)   # str
        self.assertEqual(
            data.get('place_gamemap_position'), place.get_gamemap_position())
        self.assertEqual(data.get('place_role'), place.role.name)
        self.assertEqual(
            data.get('place_date'), get_string_date(place.date_is_active))
        self.assertEqual(data.get('place_last_message_date'),
                         get_string_date(place.get_last_message_date()),
                         msg="%s - %s" % (
                             type(data.get('place_last_message_date')),
                             type(get_string_date(
                                 place.get_last_message_date()))
                         ))
        self.assertEqual(data.get('place_state'), place.is_active)

        if bl_test:
            self.check_val_type(data, 'place_lvl', int)

            check_profit('place_profit_owner')
            check_profit('place_profit_race')
            check_profit('place_penalty')

            self.check_val_type(data, 'place_towers', list, 0)

            self.check_val_type(data, 'place_owner', list, 2)
            owner_id, owner_sp = data.get('place_owner')
            self.assertEqual(owner_id, place.owner and place.owner.id)
            self.check_val_type(owner_sp, 'place_owner[1] (owner_sp)', float)

            self.assertEqual(data.get('place_owner'), place.get_owner_race())

        if user:
            self.check_val_type(data, 'place_user', list)
            if place_user:
                user_sp = data['place_user']
                self.assertEqual(len(user_sp), 2)
                self.check_val_type(user_sp[0], 'user_sp: current sp', float)
                self.check_val_type(user_sp[1], 'user_sp: sp_add', float)
            if place_opener:
                self.assertEqual(data.get('place_opener'), user.id)
        if data.get('place_opener'):
            self.check_val_type(data, 'place_opener', int)

        if is_owner is not None:
            if isinstance(is_owner, bool):
                self.assertEqual(data.get('is_owner'), is_owner)
            else:
                self.assertIn('is_owner', data)
        if distance is not None:
            if isinstance(distance, bool):
                self.assertIn('distance', data)
            else:
                self.assertEqual(data.get('distance'), distance)
        return data

    def check_user_data(self, data, user, bl_test=True):
        """
        (STANDART_USER_DATA)
        [https://github.com/sz-2013/sz/wiki/BL:-STANDART_USER_DATA]
        """
        self.assertEqual(data.get('user_id'), user.id)
        self.assertEqual(data.get('user_email'), user.email)
        self.assertEqual(data.get('user_race'), user.race.name)
        self.assertEqual(data.get('user_role'), user.role.name)
        self.assertEqual(data.get('user_gender'), user.gender.name)
        self.assertEqual(
            data.get('user_date_confirm'), get_string_date(user.date_confirm))

        self.check_val_type(data, 'user_faces', list)
        self.check_val_type(data, 'user_places', int)

        if bl_test:
            self.check_val_type(data, 'user_zc', list, 2)
            zp, zp_add = data.get('user_zc')
            self.check_val_type(zp, 'user_zc[0](zp_value))', float)
            self.check_val_type(zp_add, 'user_zc[1](zp_add_value))', float)

            self.check_val_type(data, 'user_stats', dict)
            stats = data.get('user_stats')
            self.assertEqual(
                sorted(stats.keys()),
                sorted(['agility', 'strength', 'fortune', 'intellect']))
            for stat_name, val in stats.iteritems():
                _stat_name = 'user_stats: %s' % stat_name
                self.check_val_type(val, _stat_name, list, 2)
                lvl, lvl_up_cost = val
                self.check_val_type(lvl, "%s[0](lvl)" % (_stat_name), int)
                self.check_val_type(
                    lvl_up_cost, "%s[1](lvl_up_cost)" % (_stat_name), float)

            self.check_val_type(data, 'user_inventory', list)
            self.check_val_type(data, 'user_radius', int)
        return data

    def user_create_inactive(self, user_data=None):
        if user_data is None:
            user_data = get_normal_user_data()
        data = self._getdata_(201, API['user']['create'], 'post',
                              views_users.UsersRoot, user_data)
        user = models.User.objects.filter(email=data['email'])
        self.assertEqual(len(user), 1)
        user = user[0]
        return dict(user=user, data=data)

    def user_create_in_bl(self):
        user = self.user_create_inactive()['user']
        activation_key = models.RegistrationProfile.objects.get(
            user=user).activation_key

        activate_response = views_users.activate_user(activation_key)
        user = models.User.objects.filter(email=user.email)
        self.assertEqual(len(user), 1)
        user = user[0]
        return dict(user=user, activate_response=activate_response)

    def place_explore(self, user=None):
        if user is None:
            user = self.user_create_in_bl()
        query = dict(latitude=LATITUDE, longitude=LONGITUDE, radius=RADIUS)

        data = self._getdata_(
            201, API['place']['explore'], 'GET',
            views_places.PlaceVenueExplore, user=user, query=query)
        return data


class StandartDataSerializerTest(BLStandartDataTest):
    def setUp(self):
        data_user = get_full_user_data()
        self.user = models.User.objects.get_or_create(**data_user)[0]

        data_place = get_nornal_place_data()
        self.place = models.Place.objects.get_or_create(**data_place)[0]


class UserStandartDataSerializerTest(StandartDataSerializerTest):
    def test_data(self):
        data = serializers.UserStandartDataSerializer(
            instance=self.user).data

        self.assertEqual(data.get('user_id'), self.user.id)
        self.assertEqual(data.get('user_email'), self.user.email)
        self.assertEqual(data.get('user_gender'), self.user.gender.name)
        self.assertEqual(data.get('user_race'), self.user.race.name)
        self.assertEqual(data.get('user_role'), self.user.role.name)
        self.assertEqual(data.get('user_date_confirm'),
                         get_string_date(self.user.date_confirm))


class PlaceDetailSerialiserTest(StandartDataSerializerTest):
    def check_standart_data_place(self, data, is_owner=None, distance=None):
        return self.check_place_data(data, self.place, bl_test=False,
                                     is_owner=is_owner, distance=distance)

    def test_standart_data(self):
        data = serializers.PlaceStandartDataSerializer(
            instance=self.place).data
        self.check_standart_data_place(data)

    def test_place_detail_serialiser(self):
        distance = 100
        data = serializers.place_detail_serialiser(
            self.place, self.user, distance)
        self.check_standart_data_place(data, is_owner=False, distance=distance)


########## USERS
from sz.api.views import users as views_users


class UsersRootTest(BLStandartDataTest):
    def _get_data(self, status_code, method, view, data=None):
        response = get_response(
            API['user']['create'], method, view, data=data)
        self.assertEqual(
            response.status_code, status_code, msg=response.render())
        return get_data(response)

    def test_create(self):
        user_data = get_normal_user_data()
        normal_data = dict(email=user_data['email'], is_anonymous=False,
                           is_authenticated=True)
        user_dict = self.user_create_inactive(user_data)
        data = user_dict['data']
        user = user_dict['user']

        self.assertEqual(data, normal_data)

        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_active)
        self.assertFalse(user.is_in_engine)
        self.assertIsNotNone(user.date_joined)
        self.assertIsNone(user.date_confirm)
        self.assertEqual(user.role.name, models.STANDART_ROLE_USER_NAME)
        self.assertIsNone(user.last_box)

    def test_create_in_db(self):
        user_dict = self.user_create_in_bl()
        user = user_dict['user']
        activate_response = user_dict['activate_response']

        self.assertEqual(
            activate_response.get('status'), 201, msg=activate_response)
        self.check_user_data(activate_response.get('data'), user)

        self.assertTrue(user.is_active)
        self.assertIsNotNone(user.date_confirm)

    def test_user_instance(self):
        #@TODO(kunla): doit
        pass

########## PLACES
from sz.api.views import places as views_places


class PlacesVenueListTest(BLStandartDataTest):
    def setUp(self):
        self.user = self.user_create_in_bl()['user']
        self.query = dict(
            latitude=LATITUDE, longitude=LONGITUDE, radius=RADIUS)

    def _get_data(self, status_code, action, view):
        response = get_response(
            API['place'][action], 'GET', view,
            query=self.query, user=self.user)
        self.assertEqual(
            response.status_code, status_code, msg=response.render())
        return get_data(response)

    def test_explore(self):
        models.Place.objects.all().delete()
        data = self.place_explore(self.user)
        self.check_val_type(data, 'places_explored', int)
        self.check_val_type(data, 'user', dict)
        user_data = data.get('user')
        # print user_data
        self.check_user_data(user_data, self.user, data['places_explored'])

    def test_search(self):
        data = self._get_data(200, 'search', views_places.PlaceVenueSearch)
        self.check_val_type(data, 'places', list)
        for d in data['places']:
            p = models.Place.objects.get(id=d.get('place_id'))
            self.check_place_data(data=d, place=p, bl_test=False,
                                  is_owner=0, distance=True)


class PlaceRootTest(BLStandartDataTest):
    pass


class PlaceRootNewsTest(BLStandartDataTest):
    pass


########## GAMEMAP
from sz.api.views import place_service, gamemap_service


class GameMapTest(BLStandartDataTest):
    def setUp(self):
        models.Place.objects.all().delete()
        self.user = models.User.objects.get_or_create(
            **get_full_user_data())[0]
        self.params = dict(latitude=LATITUDE, longitude=LONGITUDE,
                           radius=RADIUS, user=self.user)
        places = place_service.explore_in_venues(**self.params)
        [p.create_in_engine() for p in places]

    def test_update_gamemap(self):
        for p in models.Place.objects.all():
            self.assertIsNone(p.get_gamemap_position())
        gamemap_service.update_gamemap(self.params)
        for p in models.Place.objects.all():
            self.check_val_type(
                p.get_gamemap_position(), 'gamemap_position', list, 2)

    def test_get_gamemap(self):
        def _get_data(current_box):
            params = dict(latitude=current_box.latitude(),
                          longitude=current_box.longitude(), radius=RADIUS)
            response = get_response(
                API['gamemap']['get_gamemap'], 'GET', views_places.GameMapRoot,
                query=params, user=self.user)
            self.assertEqual(
                response.status_code, 200, msg=response.render())
            return get_data(response)
        gamemap_service.update_gamemap(self.params)
        current_box = models.Place.objects.all()[0]
        data = _get_data(current_box)
        self.assertIsNone(data.get('last_box'))
        self.check_val_type(data, 'current_box', dict)
        self.check_place_data(data=data['current_box'], place=current_box,
                              bl_test=False, is_owner=0, distance=True)
        self.check_val_type(data['map_width'], 'map_width', int)
        self.check_val_type(data['map_height'], 'map_height', int)
        self.check_val_type(data, 'gamemap', list)
        for box in data['gamemap']:
            place = models.Place.objects.get(pk=box['place_id'])
            self.check_place_data(data=box, place=place,
                                  bl_test=False, is_owner=0, distance=True)


########## MESSAGE
from sz.api.views import messages as views_messages


class MessagePreviewTest(StandartDataSerializerTest):
    def setUp(self):
        data_user = get_full_user_data()
        self.user = models.User.objects.get_or_create(**data_user)[0]

    def _get_data(self, status_code, response):
        self.assertEqual(
            response.status_code, status_code, msg=response.render())
        return get_data(response)

    def _check_data_preview(self, status_code, pk=None):
        photo = get_photo()
        del photo['file']
        faces_list = generate_faces_list(
            photo['photo_width'], photo['photo_height'])
        params = dict(faces_list=faces_list, **photo)

        path = API['message']['photopreview']
        kwargs = dict(pk=pk)
        if pk:
            path += '%s/update/' % pk
        response = get_response(
            path, 'POST', views_messages.MessagePhotoPreview,
            data=params, user=self.user,
            files=dict(photo=PHOTO['file']), kwargs=kwargs)

        data = self._get_data(status_code, response)

        normal_photo_dict = dict(full='', reduced='', thumbnail='')
        self.check_val_type(data, 'photo', dict, 3)
        self.assertEqual(normal_photo_dict.keys(), data.get('photo').keys())
        for url in data.get('photo').values():
            self.assertTrue(isinstance(url, basestring))

        self.check_val_type(data, 'id', int)
        if pk:
            self.assertEqual(data['id'], pk)

        faces_id = list(set(
            [f_data.get('face_id') for f_data in json.loads(faces_list)]))
        self.assertEqual(data.get('faces_id'), faces_id)
        return data['id'], data['photo']['full'].split('/')[-1], faces_id

    def test_message_preview(self):
        self._check_data_preview(201)

    def test_message_preview_update(self):
        pk, photo_name, faces_id = self._check_data_preview(201)

        newpk, newphoto_name, faces_id = self._check_data_preview(200, pk)
        self.assertEqual(pk, newpk)
        self.assertNotEqual(photo_name, newphoto_name)


class MessageAddTest(MessagePreviewTest):
    def setUp(self):
        data_user = get_full_user_data()
        self.user = models.User.objects.get_or_create(**data_user)[0]

        data_place = get_nornal_place_data()
        self.place = models.Place.objects.get_or_create(**data_place)[0]

        self.params = dict(
            place=self.place.id, latitude=LATITUDE, longitude=LONGITUDE)

        self.photo_id, photo_name, self.faces_id = \
            self._check_data_preview(201)

    def __get_data(self, status_code):
        response = get_response(API['message']['create'], 'POST',
                                views_messages.MessageAdd,
                                data=self.params, user=self.user)
        return self._get_data(status_code, response)

    def test_message_empty(self):
        self.__get_data(400)

    def _check_data_create(self):
        data = self.__get_data(201)
        self.assertFalse(
            models.MessagePreview.objects.filter(id=self.photo_id))
        self.check_user_data(data.get('user'), self.user)
        self.check_place_data(
            data.get('place'), place=self.place, user=self.user, is_owner=0,
            distance=True, place_user=True)

    def test_message_create(self):
        self.params['text'] = generate_stuff()
        self.params['photo_id'] = self.photo_id
        self.params['faces_id'] = self.faces_id
        self._check_data_create()

    def test_message_photo_only(self):
        self.params['photo_id'] = self.photo_id
        self.params['faces_id'] = self.faces_id
        self._check_data_create()

    def test_message_text_only(self):
        self.params['text'] = generate_stuff()
        self._check_data_create()
