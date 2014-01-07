# -*- coding: utf-8 -*-
from rest_framework import permissions, status
from sz import settings
from sz.api import serializers, forms, posts
from sz.api.response import Response as sz_api_response
from sz.api.views import SzApiView
from sz.core.models import RegistrationProfile


def activate_user(user):
    user_data = serializers.UserStandartDataSerializer(instance=user).data
    engine_data = posts.users_create(user_data)
    if engine_data['status'] == 201:
        user.create_in_engine()
    return engine_data

class UsersRoot(SzApiView):
    """ Create a new user """
    if not settings.LEBOWSKI_MODE_TEST:
        permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = serializers.RegistrationSerializer(data=request.DATA)
        if serializer.is_valid():
            user = serializer.object['user']
            user_serializer = serializers.AuthUserSerializer(instance=user)
            data = user_serializer.data
            if settings.LEBOWSKI_MODE_TEST:
                RegistrationProfile.objects.activate(RegistrationProfile.objects.get(user=user).activation_key)
                data['bl'] = activate_user(user)
            return sz_api_response(data)
        return sz_api_response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UsersRootResendingActivationKey(SzApiView):
    """ Sends an email with a confirmation key """
    if not settings.LEBOWSKI_MODE_TEST:
        permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = serializers.ResendingConfirmationKeySerializer(
            data=request.DATA
        )
        if serializer.is_valid():
            if settings.LEBOWSKI_MODE_TEST:
                try:
                    key = RegistrationProfile.objects.get(user__email=request.DATA[u"email"]).activation_key
                except:
                    key = 'No Key'
                return sz_api_response({'key':key})
            else:
                return sz_api_response({})    
        return sz_api_response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class UserInstanceSelf(SzApiView):
    """ Retrieve profile information for the action user """
    if not settings.LEBOWSKI_MODE_TEST:
        permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, format=None):
        user = request.user
        serializer = serializers.UserSerializer(instance=user)
        return sz_api_response(serializer.data)