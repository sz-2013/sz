# -*- coding: utf-8 -*-
from django.contrib.auth import authenticate
from django.contrib.auth.models import AnonymousUser
from django.utils.translation import ugettext_lazy as _
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers
from sz.api import fields as sz_api_fields
from sz.api.fields import IdListField, \
    MessagePhotoPreviewFacesLIstField, StringDataField
from sz.core import gis as gis_core
from sz.core.models import User as modelUser
from sz.message.models import Message as modelMessage
from sz.place.models import Place as modelPlace
from sz.static.models import Races as modelRaces, Gender as modelGender, \
    Face as modelFace, RoleUser as modelRoleUser, CharImage as modelCharImage


class RacesSerializer(serializers.ModelSerializer):
    class Meta:
        model = modelRaces


class GenderSerializer(serializers.ModelSerializer):
    class Meta:
        model = modelGender


class FaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = modelFace


class RoleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = modelRoleUser


class CharImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = modelCharImage
        depth = 1
"""
Auth section
"""


class UserSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    id = serializers.Field()


class AuthUserEmail(serializers.EmailField):
    def field_to_native(self, obj, field_name):
        if isinstance(obj, AnonymousUser):
            field_name = 'username'
        return super(AuthUserEmail, self).field_to_native(obj, field_name)


class AuthUserIsVerified(serializers.BooleanField):
    def field_to_native(self, obj, field_name):
        if isinstance(obj, AnonymousUser):
            return False
        return super(AuthUserIsVerified, self).field_to_native(obj, field_name)


class AuthUserSerializer(serializers.ModelSerializer):
    email = AuthUserEmail()
    is_anonymous = serializers.Field()
    is_authenticated = serializers.Field()
    is_verified = AuthUserIsVerified()

    class Meta:
        model = modelUser
        fields = ('email', 'is_anonymous', 'is_authenticated', )


class AuthenticationSerializer(serializers.Serializer):
    def __init__(self, *args, **kwargs):
        user = self.serializer = kwargs.pop('user', None)
        self.trans_args = {'user': user}
        super(AuthenticationSerializer, self).__init__(*args, **kwargs)

    token = serializers.Field(source='key')
    user = sz_api_fields.NestedField(
        transform=lambda p, a: a.get('user', None),
        serializer=UserSerializer)


class AuthRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(username=email, password=password)
            if user:
                #if not user.is_active:
                #    raise serializers.ValidationError(
                #    'User account is disabled.')
                attrs['user'] = user
                return attrs
            else:
                raise serializers.ValidationError(
                    'Unable to login with provided credentials.')
        else:
            raise serializers.ValidationError(
                'Must include "email" and "password" fields')


class RegistrationSerializer(serializers.Serializer):
    """Serializer for api.views.Users.UsersRoot

    Args:
        email, password1, password2, race (id), gender (id)

    Returns:
        <core.modelUser>

    Raise:
        ValidationError:
            - some from args is not recieved
                (if pwsd2 was not recieved - raise "passwords dont match")
            - email is not unique
            - passwords dont match
    """
    email = serializers.EmailField(required=True)
    password1 = serializers.CharField(required=True)
    password2 = serializers.CharField(required=True)
    race = serializers.ChoiceField(required=True, choices=[
        (race.pk, race.name) for race in modelRaces.objects.all()
    ])
    gender = serializers.ChoiceField(required=True, choices=[
        (gender.pk, gender.name) for gender in modelGender.objects.all()
    ])
    # race = serializers.IntegerField(required=True)
    # gender = serializers.IntegerField(required=True)

    def validate_email(self, attrs, source):
        """
        Check that the blog post is about Django.
        """
        email = attrs[source]
        if modelUser.objects.filter(email=email).count() > 0:
            raise serializers.ValidationError(_("Email is already used"))
        return attrs

    def validate(self, attrs):
        attrs = super(RegistrationSerializer, self).validate(attrs)
        password1 = attrs.get('password1')
        password2 = attrs.get('password2')
        if not password1:
            raise serializers.ValidationError(_("Password is required"))
        if password1 != password2:
            raise serializers.ValidationError(_("Passwords don't match"))
        race = modelRaces.objects.get(pk=attrs.get('race'))
        gender = modelGender.objects.get(pk=attrs.get('gender'))
        return modelUser.objects.create_user(
            attrs.get('email'), race, gender, password1)


"""
User section
"""


class UserStandartDataSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(source="id")
    user_email = serializers.EmailField(source="email")
    user_gender = serializers.CharField(source="gender.name")
    user_race = serializers.CharField(source="race.name")
    user_role = serializers.CharField(source="role.name")
    user_date_joined = StringDataField(source="date_joined")
    user_faces = IdListField(source="faces", required=True)
    user_places = serializers.IntegerField(
        source="get_own_places", required=False)

    def restore_object(self, attrs, instance=None):
        if instance:
            return instance.update_faces(
                attrs.get('user_faces')).update_radius(
                attrs.get('user_radius'))


class UserStandartDataShortSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(source="id")
    user_email = serializers.EmailField(source="email")

"""
Place section
"""


def get_place(latitude, longitude, name):
    try:
        return modelPlace.objects.get(
            name=name, position=gis_core.ll_to_point(longitude, latitude))
    except ObjectDoesNotExist:
        raise serializers.ValidationError(_("Place with name %s, lng %f,\
         lat %f is not create in sz" % (name, longitude, latitude)))


class PlaceSerializer(serializers.Serializer):
    id = serializers.Field()
    name = serializers.CharField(required=True)
    latitude = serializers.FloatField(required=True)
    longitude = serializers.FloatField(required=True)
    date = serializers.Field()

    def validate(self, attrs):
        attrs = super(PlaceSerializer, self).validate(attrs)
        return get_place(
            attrs.get('latitude'), attrs.get('longitude'),
            attrs.get('name'))


def place_detail_serialiser(place, user=False, distance=None):
    data = PlaceStandartDataSerializer(instance=place).data
    data['is_owner'] = place.is_owner(user) if user else False
    data['distance'] = round(distance) if distance else None
    return data


class PlaceStandartDataSerializer(serializers.Serializer):
    place_id = serializers.IntegerField(source="id")
    place_name = serializers.CharField(source="name", required=True)
    place_city = serializers.Field(source="city_id")
    place_latitude = serializers.FloatField(
        source="latitude", required=True)
    place_longitude = serializers.FloatField(
        source="longitude", required=True)
    place_address = serializers.CharField(source="address", required=False)
    place_gamemap_position = serializers.Field(
        source="get_gamemap_position", )  # [x, y]
    place_role = serializers.Field(source="role.name")
    place_date = StringDataField(source="date_is_active")
    place_last_message_date = StringDataField(
        source="get_last_message_date", required=False)
    place_state = serializers.BooleanField(source="is_active")
    place_fsqid = serializers.CharField(source="fsq_id", required=False)
    place_lvl = serializers.IntegerField(source="lvl")
    # place_owner = IntFloatListField(
    #     required=False, source="get_fake_owner_data")  # [id, 0.0]
    place_owner_race = serializers.CharField(
        source="get_owner_race", required=False)
    place_openner_race = serializers.CharField(
        source="openner_race.name", required=False)

    def validate(self, attrs):
        attrs = super(PlaceStandartDataSerializer, self).validate(attrs)
        return get_place(
            attrs.get('latitude'), attrs.get('longitude'), attrs.get('name'))


class PlaceNoGameSerializer(serializers.Serializer):
    place_id = serializers.IntegerField(source="id")
    place_name = serializers.CharField(source="name", required=True)
    place_city = serializers.Field(source="city_id")
    place_latitude = serializers.FloatField(
        source="latitude", required=True)
    place_longitude = serializers.FloatField(
        source="longitude", required=True)
    place_address = serializers.CharField(source="address", required=False)
    place_gamemap_position = serializers.Field(
        source="get_gamemap_position", )  # [x, y]
    place_role = serializers.Field(source="role.name")
    place_date = StringDataField(source="date_is_active")
    place_last_message_date = StringDataField(
        source="get_last_message_date", required=False)
    place_state = serializers.BooleanField(source="is_active")
    place_fsqid = serializers.CharField(source="fsq_id", required=False)


class PlaceStandartDataShortSerializer(serializers.Serializer):
    place_id = serializers.IntegerField(source="id")
    place_name = serializers.CharField(source="name", required=True)

"""
Message section
"""


# class MessagePhotoPreviewFacesListSerializer(serializers.Serializer):
#     x = serializers.FloatField(required=True)
#     y = serializers.FloatField(required=True)
#     width = serializers.FloatField(required=True)
#     height = serializers.FloatField(required=True)
#     face_id = serializers.IntegerField(required=True)


# class MessagePhotoPreviewSerializer(serializers.Serializer):
#     user = serializers.CharField(required=True)
#     photo = serializers.ImageField(required=True)
#     photo_height = serializers.FloatField(required=True)
#     photo_width = serializers.FloatField(required=True)
#     face_id = serializers.IntegerField(required=True)
#     # face_id = serializers.ChoiceField(required=True, choices=[
#     #     (face.pk, face.pk) for face in modelFace.objects.all()
#     # ])
#     faces_list = MessagePhotoPreviewFacesLIstField(required=False)
#     pk = serializers.IntegerField(required=False)

#     def validate(self, attrs):
#         attrs = super(MessagePhotoPreviewSerializer, self).validate(attrs)
#         return modelMessagePreview.objects.unface_photo(**attrs)


class MessageAddSerializer(serializers.Serializer):
    user = serializers.IntegerField(required=True)
    place = serializers.IntegerField(required=True)
    photo = serializers.Field()
    faces = serializers.Field()
    tags = serializers.Field()

    def validate(self, attrs):
        print 'validate'
        print attrs
        return attrs

    def restore_object(self, attrs, instance=None):
        print 'restore_object'
        if not instance:
            instance = modelMessage.objects.createMessage(**attrs)
        return instance


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = modelMessage

# class MessageBigLSerializer(serializers.Serializer):
#     message_id = serializers.IntegerField(source="id")
#     message_photo = serializers.BooleanField(source="is_photo")
#     message_text = serializers.CharField(source="text")
#     message_categories = serializers.Field(source="categories.all")
#     message_date = serializers.Field(source="get_string_date")
#     face_id = serializers.IntegerField(source="face.id")
#     place_id = serializers.IntegerField(source="place.id")
#     user_id = serializers.IntegerField(source="user.id")
