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

    def create(self, data):
        """Create a not active user

        Args in request.DATA:
            email: user email is string, must be unique.
            password1: is string, must mutch with password2.
            password2: is string, must mutch with password1.
            race: race.id is int.
            gender: gender.is is int.

        Access: Any

        Returns:
            serializer.is_valid():
                201, {"email": email, "is_anonymous": False,
                      "is_authenticated": True}
            else:
                400, serializer.errors

        LEBOWSKI_MODE_TEST:
            activates a new user, returns same
        """
        serializer = serializers.RegistrationSerializer(data=data)
        if serializer.is_valid():
            user = serializer.object
            user_serializer = serializers.AuthUserSerializer(instance=user)
            data = user_serializer.data
            if settings.LEBOWSKI_MODE_TEST:
                RegistrationProfile.objects.activate(
                    RegistrationProfile.objects.get(user=user).activation_key)
                data['bl'] = activate_user(user)
            return dict(data=data, status=status.HTTP_201_CREATED)
        return dict(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        response = self.create(request.DATA)
        return sz_api_response(**response)


class UsersRootResendingActivationKey(SzApiView):
    """ Sends an email with a confirmation key """
    if not settings.LEBOWSKI_MODE_TEST:
        permission_classes = (permissions.AllowAny, )

    def resend(self, data, email):
        serializer = serializers.ResendingConfirmationKeySerializer(
            data=data
        )
        if serializer.is_valid():
            if settings.LEBOWSKI_MODE_TEST:
                key = RegistrationProfile.objects.get(
                    user__email=email.activation_key)
                return dict(data={'key': key})
            else:
                return {}
        return dict(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        response = self.resend(request.DATA, request.DATA[u"email"])
        return sz_api_response(**response)


class UserInstanceSelf(SzApiView):
    """ Retrieve profile information for the action user """
    if not settings.LEBOWSKI_MODE_TEST:
        permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, format=None):
        user = request.user
        serializer = serializers.UserSerializer(instance=user)
        return sz_api_response(serializer.data)
