# -*- coding: utf-8 -*-
import random
import uuid
from django.utils import unittest
from sz.api import forms
from sz.api import posts, serializers
from sz.core import models

GENDERS = ['u', 'm', 'f']
RACES = ['futuri', 'amadeus', 'united']
EMAIL = "sz@sz.com"
PSWD = '123'


def generate_email():
    return "%s@sz.com" % uuid.uuid4()


def get_race():
    return models.Races.objects.get_or_create(name=RACES[0])[0]


def get_gender():
    return models.Gender.objects.get_or_create(name=GENDERS[0])[0]


def get_normal_user_data():
    return dict(email=generate_email(), race=get_race().id,
                gender=get_gender().id, password1=PSWD, password2=PSWD, )


def is_float(val):
    return isinstance(val, float if val else int)


def create_unactive_user(email=None):
    if email is None:
        email = generate_email()
    return models.RegistrationProfile.objects.create_inactive_user(
        email, PSWD, get_race(), get_gender())


def validate_bl_standart_user_data(user):
    return

"""Serialisers"""

########## USERS


class BLStandartDataTest(unittest.TestCase):
    def check_user_data(self, user, data):
        self.assertEqual(data.get('user_email'), self.user.email)
        self.assertEqual(data.get('user_id'), self.user.id)
        self.assertEqual(data.get('user_role'),
                         models.STANDART_ROLE_USER_NAME)
        self.assertEqual(data.get('user_gender'), self.user.gender.name)
        self.assertEqual(data.get('user_race'), self.user.race.name)
        self.assertTrue(isinstance(data.get('user_places'), list))
        self.assertTrue(isinstance(data.get('user_faces'), list))
        self.assertTrue(isinstance(data.get('user_date_confirm'), list))

        self.assertTrue(isinstance(data.get('user_zp'), list))
        self.assertEqual(len(data.get('user_zp')), 2)
        zp, zp_add = data.get('user_zp')
        self.assertTrue(is_float(zp))
        self.assertTrue(is_float(zp_add))

        self.assertTrue(isinstance(data.get('user_stats'), dict))
        stats = data.get('user_stats')
        self.assertEqual(
            sorted(stats.keys()),
            sorted(['agility', 'strength', 'fortune', 'intellect']))
        print(stats)
        for stat_name, val in stats.iteritems():
            self.assertTrue(isinstance(val, list))
            self.assertEqual(len(val), 2)
            lvl, lvl_up_cost = val
            self.assertTrue(isinstance(lvl, int))
            self.assertTrue(
                isinstance(lvl_up_cost, float if lvl_up_cost else int))


class RegistrationSerialiserTest(unittest.TestCase):
    s = serializers.RegistrationSerializer

    def setUp(self):
        self.data = get_normal_user_data()

    # def test_email_not_unique(self):
    #     create_unactive_user(EMAIL)
    #     self.data.update(email=EMAIL)
    #     #try to create user with email, which arlyady exist
    #     s = self.s(data=self.data)
    #     error = {'email': [u'Email is already used']}
    #     self.assertEqual(s.errors, error)

    # def test_gender_empty(self):
    #     del self.data['gender']
    #     s = self.s(data=self.data)
    #     error = {'gender': [u'Обязательное поле.']}
    #     self.assertEqual(s.errors, error)

    # def test_gender_wrong(self):
    #     wrong = 'x'
    #     self.data.update(gender=wrong)
    #     s = self.s(data=self.data)
    #     error = {'gender': [u'Выберите корректный вариант.' +
    #                         u' %s нет среди допустимых значений.' % wrong]}
    #     self.assertEqual(s.errors, error)

    # def test_race_empty(self):
    #     del self.data['race']
    #     s = self.s(data=self.data)
    #     error = {'race': [u'Обязательное поле.']}
    #     self.assertEqual(s.errors, error)

    # def test_race_wrong(self):
    #     wrong = 'x'
    #     self.data.update(race=wrong)
    #     s = self.s(data=self.data)
    #     error = {'race': [u'Выберите корректный вариант.' +
    #                       u' %s нет среди допустимых значений.' % wrong]}
    #     self.assertEqual(s.errors, error)

    # def test_password_empty(self):
    #     del self.data['password1']
    #     s = self.s(data=self.data)
    #     error = {'password1': [u'Обязательное поле.']}
    #     self.assertEqual(s.errors, error)

    # def test_passwords_not_match(self):
    #     self.data.update(
    #         password2="%s-wrong" % self.data.get('password1', ''))
    #     s = self.s(data=self.data)
    #     error = {u'non_field_errors': [u"Passwords don't match"]}
    #     self.assertEqual(s.errors, error)

    # def test_all_ok(self):
    #     s = serializers.RegistrationSerializer(data=self.data)
    #     self.assertEqual(s.errors, {})
    #     self.assertTrue(s.is_valid())
    #     self.assertTrue(isinstance(s.object, models.User))
    #     return s.object


"""Posts"""

########## USERS


class UserCreatePostTest(unittest.TestCase):
    def test_create(self):
        pass


"""Views"""

########## USERS
from sz.api.views import users as views_user


class UsersRootTest(BLStandartDataTest):
    def setUp(self):
        self.request = get_normal_user_data()
        self.response = views_user.UsersRoot().create(self.request)
        self.user = models.User.objects.get(email=self.request['email'])

    def test_create(self):
        normal_status = 201
        normal_data = dict(
            email=self.request['email'], is_anonymous=False,
            is_authenticated=True)

        self.assertEqual(self.response.get('status'), normal_status)
        self.assertEqual(self.response.get('data'), normal_data)

        self.assertFalse(self.user.is_superuser)
        self.assertFalse(self.user.is_active)
        self.assertFalse(self.user.is_in_engine)
        self.assertIsNotNone(self.user.date_joined)
        self.assertIsNone(self.user.date_confirm)
        self.assertEqual(self.user.role.name, models.STANDART_ROLE_USER_NAME)
        self.assertIsNone(self.user.last_box)

    def test_activate(self):
        normal_status = 201
        activation_key = models.RegistrationProfile.objects.get(
            user=self.user).activation_key
        activate_response = views_user.activate_user(activation_key)
        self.assertEqual(activate_response.get('status'), normal_status)

        self.check_user_data(
            self.user, activate_response.get('data'))

        self.assertTrue(self.user.is_active)
        self.assertIsNotNone(self.user.date_confirm)
