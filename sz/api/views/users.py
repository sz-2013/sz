# -*- coding: utf-8 -*-
from rest_framework import permissions, status
from sz import settings
from sz.api import posts, serializers
from sz.api.response import Response as sz_api_response
from sz.api.views import SzApiView


USDS = serializers.UserStandartDataSerializer


class UsersRoot(SzApiView):
    if not settings.LEBOWSKI_MODE_TEST:
        permission_classes = (permissions.AllowAny, )

    def post(self, request):
        """Create an user

        request.DATA:
            - email
            - password1
            - password2
            - race_id
            - gender_id

        If data is valid - create user, sends a (USER_SNATDART_DATA)
        [https://github.com/sz-2013/sz/wiki/BL:-STANDART_USER_DATA]
        to BL and calls user.create_in_engine()
        """
        serializer = serializers.RegistrationSerializer(data=request.DATA)
        if serializer.is_valid():
            user = serializer.object
            # user_data = USDS(instance=user).data
            # engine_data = posts.users_create(user_data)
            # if engine_data['status'] == status.HTTP_201_CREATED:
            user = user.create_in_engine()
            data = serializers.AuthUserSerializer(instance=user).data
            return sz_api_response(
                data=data, status=status.HTTP_201_CREATED)
            # return engine_data
        return sz_api_response(
            data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserInstanceSelf(SzApiView):
    """ Retrieve profile information for the action user """
    if not settings.LEBOWSKI_MODE_TEST:
        permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, format=None):
        user = request.user
        serializer = USDS(instance=user)
        return sz_api_response(serializer.data)
