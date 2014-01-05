# -*- coding: utf-8 -*-
from django.utils.translation import ugettext_lazy as _
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers
from sz.core import models, gis as gis_core


class UserCreateSerializer(serializers.Serializer):
    id = serializers.Field()
    email = serializers.EmailField(required=True)
    race = serializers.ChoiceField(required=True, choices=[
        (race.pk, race.name) for race in models.Races.objects.all()
    ])
    gender = serializers.ChoiceField(required=True, choices=[
        (gender.pk, gender.name) for gender in models.Gender.objects.all()
    ])
    role = serializers.ChoiceField(required=True, choices=[
        (role.pk, role.name) for role in models.RoleUser.objects.all()
    ])
    date_confirm = serializers.Field()
    def validate(self, attrs):
        attrs = super(UserCreateSerializer, self).validate(attrs) 
        email = attrs['email']
        try:
            user = models.User.objects.get(email = email)               
        except ObjectDoesNotExist:
            raise serializers.ValidationError(
                _("User with email %s is not create in sz"%email))
        if user.is_in_engine is not False:
            raise serializers.ValidationError(
                _("User with email %s arleady created in lebowski"%email)) 
        return user



class UserSerializer(serializers.Serializer):
    id = serializers.Field()
    # email = serializers.EmailField(required=True)
    email = serializers.CharField(required=True)
    race = serializers.ChoiceField(required=False, choices=[
        (race.pk, race.name) for race in models.Races.objects.all()
    ])
    gender = serializers.ChoiceField(required=False, choices=[
        (gender.pk, gender.name) for gender in models.Gender.objects.all()
    ])
    date_confirm = serializers.Field()
    def validate(self, attrs):   
        attrs = super(UserSerializer, self).validate(attrs) 
        try:
            return models.User.objects.get(email = attrs['email'])
        except ObjectDoesNotExist:
            raise serializers.ValidationError(
                _("User with email %s is not create in sz"%attrs['email']))

class UserBigLSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(source="id")    
    user_email = serializers.EmailField(source="email")
    user_gender = serializers.IntegerField(source="gender.name")    
    user_race = serializers.IntegerField(source="race.name")
    user_role = serializers.IntegerField(source="role.name")
    user_date_confirm = serializers.Field(source="get_string_date_confirm")        


class UserBigLShortSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(source="id")    
    user_email = serializers.EmailField(source="email")


def get_place(latitude, longitude, name):
    try:
        return models.Place.objects.get(
            name=name,position = gis_core.ll_to_point(longitude,latitude))
    except ObjectDoesNotExist:
        raise serializers.ValidationError(_("Place with name %s, lng %f,\
         lat %f is not create in sz"%(name,longitude,latitude)))


class PlaceSerializer():
    # id = serializers.Field()
    name = serializers.CharField(required=True)    
    latitude = serializers.FloatField(required=True)
    longitude = serializers.FloatField(required=True)
    def validate(self, attrs):
        attrs = super(PlaceSerializer, self).validate(attrs) 
        return get_place(
            attrs.get('latitude'), attrs.get('longitude'), attrs.get('name'))

        

class PlaceBigLSerializer(serializers.Serializer):
    place_id = serializers.IntegerField(source="id")
    place_name = serializers.CharField(source="name", required=True)
    place_latitude = serializers.FloatField(source="latitude", required=True)
    place_longitude = serializers.FloatField(source="longitude", required=True)
    place_date = serializers.Field(source="get_string_date")     
    place_role = serializers.Field(source="role.name")
    def validate(self, attrs):
        attrs = super(PlaceBigLSerializer, self).validate(attrs) 
        return get_place(
            attrs.get('place_latitude'), attrs.get('place_longitude'),
            attrs.get('place_name'))

class MessageSerializer(serializers.Serializer):
    id = serializers.CharField(required=True)
    text = serializers.CharField()
    date = serializers.DateTimeField()
    face = serializers.IntegerField()
    categories = serializers.Field()
    photo = serializers.CharField(required=False)
    def validate(self, attrs):
        attrs = super(MessageSerializer, self).validate(attrs) 
        pk = attrs.get('id')
        try:
            attrs['message'] = models.Message.objects.get(pk=pk)
        except ObjectDoesNotExist:
            # raise serializers.ValidationError(_("Message with id %s \
            #     is not create in sz"%pk))
            raise serializers.ValidationError(_("%s"%attrs))
        return attrs            

class MessageBigLSerializer(serializers.Serializer):
    message_id = serializers.IntegerField(source="id")    
    message_photo = serializers.BooleanField(source="is_photo")
    message_text = serializers.CharField(source="text")
    message_categories = serializers.Field(source="categories.all")
    message_date = serializers.Field(source="get_string_date")
    face_id = serializers.IntegerField(source="face.id")
    place_id = serializers.IntegerField(source="place.id")
    user_id = serializers.IntegerField(source="user.id")


