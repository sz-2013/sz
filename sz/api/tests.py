# -*- coding: utf-8 -*-
import uuid
import json
from django.utils import unittest
from sz.api import posts, serializers
from sz.core import models, gis as gis_core

GENDERS = ['u', 'm', 'f']
RACES = ['futuri', 'amadeus', 'united']
EMAIL = "sz@sz.com"
PSWD = '123'

LATITUDE = 40.7755555
LONGITUDE = -73.9747221
RADIUS = 250

PLACE_NAME = 'CoolPlace'
PLACE_LAT = 40.76022
PLACE_LON = -73.98439
CITY_ID = 1
POSITION = gis_core.ll_to_point(PLACE_LON, PLACE_LAT)


def generate_stuff():
    return str(uuid.uuid4()).split('-')[0]


def generate_email():
    return "%s@sz.com" % generate_stuff()


def get_race():
    return models.Races.objects.get_or_create(name=RACES[0])[0]


def get_gender():
    return models.Gender.objects.get_or_create(name=GENDERS[0])[0]


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

    def check_place_data(self, data, place, user=None):
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
        self.assertEqual(data.get('place_city'), place.city)    # int
        self.assertEqual(
            data.get('place_longitude'), place.longitude())  # float
        self.assertEqual(
            data.get('place_latitude'), place.latitude())  # float
        self.assertEqual(
            data.get('place_gamemap_position'),
            place.get_gamemap_position() or [])
        self.assertEqual(data.get('place_role'), place.role.name)
        self.assertEqual(data.get('place_date'), place.get_string_date())
        self.assertEqual(
            data.get('place_last_message_date'), place.get_last_message_date())
        self.assertEqual(data.get('place_state'), place.is_active)

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
            self.check_val_type(data, 'place_user', float)
        if data.get('place_opener'):
            self.check_val_type(data, 'place_opener', int)

    def check_user_data(self, data, user):
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
            data.get('user_date_confirm'), user.get_string_date_confirm())

        self.check_val_type(data, 'user_faces', list)
        self.check_val_type(data, 'user_places', int)

        self.check_val_type(data, 'user_zp', list, 2)
        zp, zp_add = data.get('user_zp')
        self.check_val_type(zp, 'user_zp[0](zp_value))', float)
        self.check_val_type(zp_add, 'user_zp[1](zp_add_value))', float)

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
        self.assertEqual(
            data.get('user_date_confirm'),
            self.user.get_string_date_confirm())


class PlaceDetailSerialiserTest(StandartDataSerializerTest):
    def check_standart_data(self):
        data = serializers.PlaceStandartDataSerializer(
            instance=self.place).data

        self.assertEqual(data.get('place_id'), self.place.id)
        self.assertEqual(data.get('place_name'), self.place.name)
        self.assertEqual(data.get('place_city'), self.place.city_id)
        self.assertEqual(data.get('place_latitude'), self.place.latitude())
        self.assertEqual(data.get('place_longitude'), self.place.longitude())
        self.assertEqual(data.get('place_address'), self.place.address)
        self.assertEqual(
            data.get('place_gamemap_position'),
            self.place.get_gamemap_position())
        self.assertEqual(data.get('place_date'), self.place.get_string_date())
        self.assertEqual(data.get('place_role'), self.place.role.name)
        self.assertEqual(data.get('place_fsqid'), self.place.fsq_id)
        self.assertEqual(
            data.get('place_owner_race'), self.place.get_owner_race())
        return data

    def test_standart_data(self):
        self.check_standart_data()

    def test_place_detail_serialiser(self):
        distance = 100
        data = serializers.place_detail_serialiser(
            self.place, self.user, distance)
        self.check_standart_data()
        self.assertEqual(data.get('is_owner'), False)
        self.assertEqual(data.get('distance'), distance)


class RegistrationSerialiserTest(unittest.TestCase):
    # idk but when race and gener in serialiser is ChoiceField -
    # serialiser works in UsersRoot.create, but dont wont works here :(
    s = serializers.RegistrationSerializer

    def setUp(self):
        self.data = get_normal_user_data()

    def test_email_not_unique(self):
        models.User.objects.get_or_create(email=EMAIL)
        self.data.update(email=EMAIL)
        #try to create user with email, which arlyady exist
        s = self.s(data=self.data)
        error = {'email': [u'Email is already used']}
        self.assertEqual(s.errors, error)

    def test_gender_empty(self):
        del self.data['gender']
        s = self.s(data=self.data)
        error = {'gender': [u'Обязательное поле.']}
        self.assertEqual(s.errors, error)

    # def test_gender_wrong(self):
    #     wrong = 'x'
    #     self.data.update(gender=wrong)
    #     s = self.s(data=self.data)
    #     error = {'gender': [u'Выберите корректный вариант.' +
    #                         u' %s нет среди допустимых значений.' % wrong]}
    #     self.assertEqual(s.errors, error)

    def test_race_empty(self):
        del self.data['race']
        s = self.s(data=self.data)
        error = {'race': [u'Обязательное поле.']}
        self.assertEqual(s.errors, error)

    # def test_race_wrong(self):
    #     wrong = 'x'
    #     self.data.update(race=wrong)
    #     s = self.s(data=self.data)
    #     error = {'race': [u'Выберите корректный вариант.' +
    #                       u' %s нет среди допустимых значений.' % wrong]}
    #     self.assertEqual(s.errors, error)

    def test_password_empty(self):
        del self.data['password1']
        s = self.s(data=self.data)
        error = {'password1': [u'Обязательное поле.']}
        self.assertEqual(s.errors, error)

    def test_passwords_not_match(self):
        self.data.update(
            password2="%s-wrong" % self.data.get('password1', ''))
        s = self.s(data=self.data)
        error = {u'non_field_errors': [u"Passwords don't match"]}
        self.assertEqual(s.errors, error)

    def test_all_ok(self):
        s = serializers.RegistrationSerializer(data=self.data)
        self.assertEqual(s.errors, {})
        self.assertTrue(s.is_valid())
        self.assertTrue(isinstance(s.object, models.User))
        return s.object


"""Posts"""


class PostMainTest(unittest.TestCase):
    def test_wrong_url(self):
        data = posts.main_post(data={'data': 0}, prefix='wrong_path')
        self.assertEqual(data.get('status'), 404)
        self.assertEqual(data.get('data'), 'Not Found')

########## USERS


class UserCreatePostTest(unittest.TestCase):
    def test_create_wrong_data(self):
        #@TODO(kunla): uncomment it when bl will answer 400
        # data = posts.users_create({'data': 0})
        # self.assertEqual(data.get('status'), 400)
        # self.assertEqual(data.get('data'), '')
        pass

    def test_create(self):
        #@TODO(kunla): doit
        pass


########## PLACE


class PlaceCreateTest(unittest.TestCase):
    pass


########## Message

class MessageCreateTest(unittest.TestCase):
    pass


"""Views"""

########## USERS
from sz.api.views import users as views_users


class UsersRootTest(BLStandartDataTest):
    def setUp(self):
        self.request = get_normal_user_data()
        self.response = views_users.UsersRoot().create(self.request)

    def test_create(self):
        normal_status = 201
        normal_data = dict(
            email=self.request['email'], is_anonymous=False,
            is_authenticated=True)

        user = models.User.objects.get_or_create(
            email=self.request['email'])[0]

        self.assertEqual(
            self.response.get('status'), normal_status, msg=self.response)
        self.assertEqual(self.response.get('data'), normal_data)

        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_active)
        self.assertFalse(user.is_in_engine)
        self.assertIsNotNone(user.date_joined)
        self.assertIsNone(user.date_confirm)
        self.assertEqual(user.role.name, models.STANDART_ROLE_USER_NAME)
        self.assertIsNone(user.last_box)

    def test_activate(self):
        normal_status = 201

        user = models.User.objects.get_or_create(
            email=self.request['email'])[0]
        activation_key = models.RegistrationProfile.objects.get(
            user=user).activation_key

        activate_response = views_users.activate_user(activation_key)

        user = models.User.objects.get_or_create(
            email=self.request['email'])[0]

        self.assertEqual(
            activate_response.get('status'), normal_status,
            msg=activate_response)
        self.check_user_data(activate_response.get('data'), user)

        self.assertTrue(user.is_active)
        self.assertIsNotNone(user.date_confirm)

    def test_resending_activation_key(self):
        #@TODO(kunla): doit
        pass

    def test_user_instance(self):
        #@TODO(kunla): doit
        pass

########## PLACES
from sz.api.views import places as views_places


class PlacesVenueListTest(BLStandartDataTest):
    def setUp(self):
        self.user = models.User.objects.get_or_create(email=EMAIL)[0]
        query = dict(latitude=LATITUDE, longitude=LONGITUDE, radius=RADIUS)
        self.kwargs = dict(query=query, email=self.user.email)

    def test_explore(self):
        normal_status = 201
        normal_creator = dict(email=self.user.email)

        response = views_places.PlaceVenueExplore().explore(**self.kwargs)
        data = response.get('data', {})

        self.assertEqual(
            response.get('status'), normal_status, msg=response)
        self.check_val_type(data, 'places_explored', int)
        self.check_val_type(data, 'user', dict)
        self.assertEqual(data.get('user'), normal_creator)

    def test_search(self):
        #@TODO(kunla): and what to test here?
        pass


class PlaceRoorTest(BLStandartDataTest):
    pass


class PlaceRoorNewsTest(BLStandartDataTest):
    pass
