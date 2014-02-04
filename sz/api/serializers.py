# -*- coding: utf-8 -*-
from django.contrib.auth import authenticate
from django.contrib.auth.models import AnonymousUser
from django.utils.translation import ugettext_lazy as _
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers
from sz.api import fields as sz_api_fields
from sz.api.fields import IdListField, IntFloatListField, \
    MessagePhotoPreviewFacesLIstField, StringDataField
from sz.core import models, gis as gis_core


class RacesSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Races


class GenderSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Gender


class FaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Face


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Category


class RoleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.RoleUser


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
        model = models.User
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
        <core.models.User>

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
    # race = serializers.ChoiceField(required=True, choices=[
    #     (race.pk, race.name) for race in models.Races.objects.all()
    # ])
    # gender = serializers.ChoiceField(required=True, choices=[
    #     (gender.pk, gender.name) for gender in models.Gender.objects.all()
    # ])
    race = serializers.IntegerField(required=True)
    gender = serializers.IntegerField(required=True)

    def validate_email(self, attrs, source):
        """
        Check that the blog post is about Django.
        """
        email = attrs[source]
        if models.User.objects.filter(email=email).count() > 0:
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
        race = models.Races.objects.get(pk=attrs.get('race'))
        gender = models.Gender.objects.get(pk=attrs.get('gender'))
        return models.RegistrationProfile.objects.create_inactive_user(
            attrs.get('email'), password1, race, gender)


class ResendingConfirmationKeySerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate(self, attrs):
        attrs = super(
            ResendingConfirmationKeySerializer, self).validate(attrs)
        email = attrs.get('email')
        models.RegistrationProfile.objects.send_key(email)
        return attrs

"""
User section
"""


class UserStandartDataSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(source="id")
    user_email = serializers.EmailField(source="email")
    user_gender = serializers.IntegerField(source="gender.name")
    user_race = serializers.IntegerField(source="race.name")
    user_role = serializers.IntegerField(source="role.name")
    user_date_confirm = StringDataField(source="date_confirm")
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
        return models.Place.objects.get(
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
    # place_lvl = serializers.Field(source="lvl")
    place_owner = IntFloatListField(
        required=False, source="get_fake_owner_data")  # [id, 0.0]
    place_owner_race = serializers.CharField(
        source="get_owner_race", required=False)

    def validate(self, attrs):
        attrs = super(PlaceStandartDataSerializer, self).validate(attrs)
        return get_place(
            attrs.get('place_latitude'), attrs.get('place_longitude'),
            attrs.get('place_name'))

    def restore_object(self, attrs, instance=None):
        if instance:
            owner = attrs['place_owner']
            return instance.update_owner(owner[0] if owner else None)


class PlaceStandartDataShortSerializer(serializers.Serializer):
    place_id = serializers.IntegerField(source="id")
    place_name = serializers.CharField(source="name", required=True)

"""
Message section
"""


class MessagePhotoPreviewFacesListSerializer(serializers.Serializer):
    x = serializers.FloatField(required=True)
    y = serializers.FloatField(required=True)
    width = serializers.FloatField(required=True)
    height = serializers.FloatField(required=True)
    face_id = serializers.IntegerField(required=True)


class MessagePhotoPreviewSerializer(serializers.Serializer):
    user = serializers.CharField(required=True)
    photo = serializers.ImageField(required=True)
    photo_height = serializers.FloatField(required=True)
    photo_width = serializers.FloatField(required=True)
    face_id = serializers.IntegerField(required=True)
    # face_id = serializers.ChoiceField(required=True, choices=[
    #     (face.pk, face.pk) for face in models.Face.objects.all()
    # ])
    faces_list = MessagePhotoPreviewFacesLIstField(required=False)
    pk = serializers.IntegerField(required=False)

    def validate(self, attrs):
        attrs = super(MessagePhotoPreviewSerializer, self).validate(attrs)
        return models.MessagePreview.objects.unface_photo(**attrs)


class MessageAddSerializer(serializers.ModelSerializer):
    photo_id = serializers.IntegerField(required=False)

    class Meta:
        model = models.Message
        read_only_fields = ('date',)
        exclude = ('stems',)

    def validate(self, attrs):
        """
        Check that the start is before the stop.
        """
        text = attrs.get('text').strip() if attrs.get('text') else ''
        photo_id = attrs.get('photo_id', None)
        photo = models.MessagePreview.objects.get(
            pk=photo_id) if photo_id else None
        if not (photo or text != ""):
            raise serializers.ValidationError("Message don't must be empty")
        if photo and photo.user != attrs.get("user"):
            raise serializers.ValidationError(
                "Users in attrs and in MessagePreview mismatch")
        return attrs

    def restore_object(self, attrs, instance=None):
        if not instance:
            instance = models.Message.objects.createMessage(**attrs)
        return instance


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Message

# class MessageBigLSerializer(serializers.Serializer):
#     message_id = serializers.IntegerField(source="id")
#     message_photo = serializers.BooleanField(source="is_photo")
#     message_text = serializers.CharField(source="text")
#     message_categories = serializers.Field(source="categories.all")
#     message_date = serializers.Field(source="get_string_date")
#     face_id = serializers.IntegerField(source="face.id")
#     place_id = serializers.IntegerField(source="place.id")
#     user_id = serializers.IntegerField(source="user.id")
