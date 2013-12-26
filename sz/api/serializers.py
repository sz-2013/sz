# -*- coding: utf-8 -*-
from django.contrib.auth import authenticate
from django.contrib.auth.models import AnonymousUser
from django.utils.translation import ugettext_lazy as _
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

# class UserSerializer(serializers.Serializer):    
#     email = serializers.EmailField(required=True)

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
        return super(
            AuthUserIsVerified, self
        ).field_to_native(
            obj, field_name
        )


class AuthUserSerializer(serializers.ModelSerializer):
    email = AuthUserEmail()
    is_anonymous = serializers.Field()
    is_authenticated = serializers.Field()
    is_verified = AuthUserIsVerified()

    class Meta:
        model = models.User
        fields = (
            'email',
            'is_anonymous',
            'is_authenticated',
        )


class AuthenticationSerializer(serializers.Serializer):
    def __init__(self, *args, **kwargs):
        user = self.serializer = kwargs.pop('user', None)
        self.trans_args = {'user': user}
        super(AuthenticationSerializer, self).__init__(*args, **kwargs)

    token = serializers.Field(source='key')
    user = sz_api_fields.NestedField(transform=lambda p, a: a.get('user', None), serializer=UserSerializer)


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
        attrs = super(
            ResendingConfirmationKeySerializer, 
            self
        ).validate(attrs)
        email = attrs.get('email')
        models.RegistrationProfile.objects.send_key(email)
        return attrs

class PlaceSerializer(serializers.Serializer):
    id = serializers.Field()
    name = serializers.CharField(required=True)
    latitude = serializers.FloatField(required=True)
    longitude = serializers.FloatField(required=True)
    date = serializers.Field()
    def restore_object(self, instance=None):
        try:
            place = models.Place.objects.get(
                name=name,position = gis_core.ll_to_point(longitude,latitude))
        except:
            raise serializers.ValidationError(_("Place with name %s, lng %f,\
                    lat %f is not create in sz"%(name,longitude,latitude)))
        return place

class MessageBaseSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(required=False)
    class Meta:
        read_only_fields = ('date',)
        exclude = ('place', 'user', 'stems',)

    def validate(self, attrs):
        """
        Check that the start is before the stop.
        """
        text = attrs.get('text', None)
        if text is None:
            text = ''
        else:
            text = attrs['text'].strip()
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