# -*- coding: utf-8 -*-
from django.contrib.auth import authenticate
from django.contrib.auth.models import AnonymousUser
from django.utils.translation import ugettext_lazy as _
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers

from sz.api import fields as sz_api_fields
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
                #    raise serializers.ValidationError('User account is disabled.')
                attrs['user'] = user
                return attrs
            else:
                raise serializers.ValidationError('Unable to login with provided credentials.')
        else:
            raise serializers.ValidationError('Must include "email" and "password" fields')

class RegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)    
    password1 = serializers.CharField(required=True)
    password2 = serializers.CharField(required=True)
    race = serializers.ChoiceField(required=True, choices=[
        (race.pk, race.name) for race in models.Races.objects.all()
    ])
    gender = serializers.ChoiceField(required=True, choices=[
        (gender.pk, gender.name) for gender in models.Gender.objects.all()
    ])
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
        user = models.RegistrationProfile.objects.create_inactive_user(
            attrs.get('email'), password1, race, gender
        )
        attrs['user'] = user
        return attrs


class ResendingConfirmationKeySerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    def validate(self, attrs):
        attrs = super(ResendingConfirmationKeySerializer, self ).validate(attrs)
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
    user_date_confirm = serializers.Field(source="get_string_date_confirm")  


"""
Place section
"""

def get_place(latitude, longitude, name):
    try:
        return models.Place.objects.get(
            name=name,position = gis_core.ll_to_point(longitude,latitude))
    except ObjectDoesNotExist:
        raise serializers.ValidationError(_("Place with name %s, lng %f,\
         lat %f is not create in sz"%(name,longitude,latitude)))

class PlaceSerializer(serializers.Serializer):
    id = serializers.Field()
    name = serializers.CharField(required=True)
    latitude = serializers.FloatField(required=True)
    longitude = serializers.FloatField(required=True)
    date = serializers.Field()
    def restore_object(self, instance=None):
        attr = super(PlaceSerializer, self).validate(attrs) 
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
    place_latitude = serializers.FloatField(source="latitude", required=True)
    place_longitude = serializers.FloatField(source="longitude", required=True)
    place_address = serializers.CharField(source="address", required=False)
    place_gamemap_position = serializers.Field(source="get_gamemap_position", )  # [x, y]
    place_date = serializers.Field(source="get_string_date")
    place_role = serializers.Field(source="role.name")
    place_fsqid = serializers.CharField(source="fsq_id")
    # place_last_message_date
    # place_lvl = serializers.Field(source="lvl")
    #place_owner = serializers.CommaSeparatedIntegerField(source="get_owner_info") # [id, 0]
    place_owner_race = serializers.CharField(source="get_owner_race")
    def validate(self, attrs):
        attrs = super(PlaceStandartDataSerializer, self).validate(attrs) 
        return get_place(
            attrs.get('place_latitude'), attrs.get('place_longitude'),
            attrs.get('place_name'))


"""
Message section
"""

class MessageBaseSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(required=False)
    class Meta:
        read_only_fields = ('date',)
        exclude = ('place', 'user', 'stems',)

    def validate(self, attrs):
        """
        Check that the start is before the stop.
        """
        text = attrs.get('text').strip() if attrs.get('text') else ''        
        photo = attrs.get('photo', None)
        if not (photo or text != ""):
            raise serializers.ValidationError("Message don't must be empty")
        return attrs

class MessageSerializer(MessageBaseSerializer):

    class Meta:
        model = models.Message
        read_only_fields = ('date',)
        exclude = ('place', 'user', 'stems',)

class MessagePreviewSerializer(MessageBaseSerializer):

    class Meta:
        model = models.MessagePreview
        exclude = ('user',)


class MessagePreviewForPublicationSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.MessagePreview
        fields = ('categories',)


# class MessageBigLSerializer(serializers.Serializer):
#     message_id = serializers.IntegerField(source="id")    
#     message_photo = serializers.BooleanField(source="is_photo")
#     message_text = serializers.CharField(source="text")
#     message_categories = serializers.Field(source="categories.all")
#     message_date = serializers.Field(source="get_string_date")
#     face_id = serializers.IntegerField(source="face.id")
#     place_id = serializers.IntegerField(source="place.id")
#     user_id = serializers.IntegerField(source="user.id")