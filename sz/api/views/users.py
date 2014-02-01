# -*- coding: utf-8 -*-
from rest_framework import permissions, status
from sz import settings
from sz.api import forms, posts, serializers
from sz.api.response import Response as sz_api_response
from sz.api.views import SzApiView
from sz.core.models import RegistrationProfile


def activate_user(activation_key):
    """Activate an user

    Get <core.models.User> with recieved key from db.
    If <User> is not activated yet - sends a (USER_SNATDART_DATA)
    [https://github.com/sz-2013/sz/wiki/BL:-STANDART_USER_DATA]
    to BL and calls user.create_in_engine()

    Args:
        activation_key: string

    Returns:
        USER_SNATDART_DATA
    """
    user = RegistrationProfile.objects.activate(activation_key)
    if not user:
        return dict(status=status.HTTP_400_BAD_REQUEST)
    user_data = serializers.UserStandartDataSerializer(instance=user).data
    engine_data = posts.users_create(user_data)
    if engine_data['status'] == status.HTTP_201_CREATED:
        user.create_in_engine()
    return engine_data


class UsersRoot(SzApiView):
    if not settings.LEBOWSKI_MODE_TEST:
        permission_classes = (permissions.AllowAny, )

    def post(self, request):
        serializer = serializers.RegistrationSerializer(data=request.DATA)
        if serializer.is_valid():
            user = serializer.object
            user_serializer = serializers.AuthUserSerializer(instance=user)
            data = user_serializer.data
            if settings.LEBOWSKI_MODE_TEST:
                RegistrationProfile.objects.activate(
                    RegistrationProfile.objects.get(user=user).activation_key)
                data['bl'] = activate_user(user)
            return sz_api_response(data=data, status=status.HTTP_201_CREATED)
        return sz_api_response(
            data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UsersRootResendingActivationKey(SzApiView):
    """ Sends an email with a confirmation key """
    if not settings.LEBOWSKI_MODE_TEST:
        permission_classes = (permissions.AllowAny, )

    def post(self, request):
        serializer = serializers.ResendingConfirmationKeySerializer(
            data=request.DATA
        )
        if serializer.is_valid():
            if settings.LEBOWSKI_MODE_TEST:
                key = RegistrationProfile.objects.get(
                    user__email=request.DATA[u"email"]).activation_key
                return sz_api_response(data={'key': key})
            else:
                return sz_api_response()
        return sz_api_response(
            data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserInstanceSelf(SzApiView):
    """ Retrieve profile information for the action user """
    if not settings.LEBOWSKI_MODE_TEST:
        permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, format=None):
        user = request.user
        serializer = serializers.UserSerializer(instance=user)
        return sz_api_response(serializer.data)
