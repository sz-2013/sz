# -*- coding: utf-8 -*-
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.views import APIView
from sz.api import response as sz_api_response
from sz.core import services
from sz.core.services import gis
# from sz.settings import LEBOWSKI_MODE_TEST

# if LEBOWSKI_MODE_TEST:
#     city_service = gis.SZCityService()
# else:
#     city_service = gis.GeonamesCityService()
# city_service = gis.BlagoveshchenskCityService()
city_service = gis.NYCityService()
place_service = services.PlaceService(city_service)
gamemap_service = services.GameMapService(city_service)
# categorization_service = morphology.CategorizationService(
#     models.Category.objects.all(), morphology.RussianStemmingService())
message_service = services.MessageService(city_service)
news_feed_service = services.NewsFeedService(message_service)


class InvalidRequestException(Exception):

    def __init__(self, errors):
        self.errors = errors


class SzApiView(APIView):
    """
        Base class for SZ Web API views
    """

    def handle_exception(self, exc):
        if isinstance(exc, InvalidRequestException):
            return sz_api_response.Response(
                self.request_form_errors, status=status.HTTP_400_BAD_REQUEST)
        base_response = APIView.handle_exception(self, exc)
        return sz_api_response.Response(
            base_response.data, status=base_response.status_code)

    def validate_and_get_params(self, form_class, data=None, files=None):
        request_form = form_class(data=data, files=files)
        if request_form.is_valid():
            return request_form.cleaned_data
        else:
            self.request_form_errors = request_form.errors
            raise InvalidRequestException(request_form.errors)


class ApiRoot(SzApiView):
    def get(self, request, format=None):
        return sz_api_response.Response({
            'static': {
                'static_races': reverse('static-races', request=request),
                'static_genders': reverse('static-genders', request=request),
                'static_faces': reverse('static-faces', request=request),
                'static_rolesuser': reverse(
                    'static-roles-user', request=request),
                # 'categories': reverse('category-list', request=request),
            },
            # 'test_mode': {
            #     'generate_places':reverse('generate-places',request=request),
            #     'testmode_places':reverse('testmode-places',request=request),
            # },
            'place': {
                'places_news': reverse('place-news', request=request),
                'places_search_in_venues': reverse(
                    'place-search-in-venues', request=request),
                'places_explore_in_venues': reverse(
                    'place-explore-in-venues', request=request),
                'place_detail_messages': reverse(
                    'place-detail-messages',
                    request=request, kwargs={'pk': 22}),
                'place_detail': reverse(
                    'place-detail', request=request, kwargs={'pk': 22}),
                # 'places-search': reverse('place-search', request=request),
            },
            'auth': {
                'login': reverse('auth-login', request=request),
                'logout': reverse('auth-logout', request=request),
                'current_user': reverse('auth-user', request=request),
            },
            'user': {
                'users_registration': reverse(
                    'users-registration', request=request),
                'users_profile': reverse('users-profile', request=request),
            },
            'message': {
                # 'messages-search': reverse(
                #    'message-search', request=request),
            },
            'gamemap': {
                # 'map': reverse('gamemap', request=request),
                'path': reverse('gamemap-path', request=request),
                'tile': reverse('gamemap-tile', request=request),
            },
            # 'city-nearest': reverse('city-nearest', request=request),
        })
