# -*- coding: utf-8 -*-
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.views import APIView
from lebowski.api import response as project_api_response


class InvalidRequestException(Exception):

    def __init__(self, errors):
        self.errors = errors


class ProjectApiView(APIView):
    """
        Base class for Lebowsky Web API views
    """

    def handle_exception(self, exc):
        if isinstance(exc, InvalidRequestException):
            return project_api_response.Response(self.request_form_errors, status=status.HTTP_400_BAD_REQUEST)
        base_response = APIView.handle_exception(self, exc)
        return project_api_response.Response(base_response.data, status=base_response.status_code)

    def validate_and_get_params(self, form_class, data=None, files=None):
        request_form = form_class(data=data, files=files)
        if request_form.is_valid():
            return request_form.cleaned_data
        else:
            self.request_form_errors = request_form.errors
            raise InvalidRequestException(request_form.errors)


class ApiRoot(ProjectApiView):
    def get(self, request, format=None):
        return project_api_response.Response({
            'users-create': reverse('users-create', request=request),
            'places-create': reverse('places-create', request=request),
        })

