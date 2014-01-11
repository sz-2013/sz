# -*- coding: utf-8 -*-
from django.contrib import auth
from django.contrib.auth import models as auth_models
from django.middleware import csrf
from rest_framework import permissions, status
from sz.api.serializers import AuthRequestSerializer, AuthUserSerializer
from sz.api.response import Response
from sz.api.views import SzApiView
# from sz.api.status import HTTP_423_LOCKED
HTTP_423_LOCKED = 423


class AuthLogin(SzApiView):
    """ Log a user in """

    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = AuthRequestSerializer(data=request.DATA)
        if serializer.is_valid():
            user = serializer.object['user']
            if not user.is_active:
                return Response('Account is not active', HTTP_423_LOCKED)
            auth.login(request, user)
            user_serializer = AuthUserSerializer(instance=user)
            csrf.get_token(request)
            return Response(user_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AuthLogout(SzApiView):
    """ Log out a user who has been logged """

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        auth.logout(request)
        user = auth_models.AnonymousUser()
        serializer = AuthUserSerializer(instance=user)
        return Response(serializer.data)


class AuthUser(SzApiView):
    """ Retrieve authentication information for the action user """

    permission_classes = (permissions.AllowAny,)

    def get(self, request, format=None):
        user = request.user
        serializer = AuthUserSerializer(instance=user)
        csrf.get_token(request)
        return Response(serializer.data)
