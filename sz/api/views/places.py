# -*- coding: utf-8 -*-
from django.http import Http404
from rest_framework import permissions, status
from rest_framework.reverse import reverse
from sz import settings
from sz.api import serializers, forms, posts
from sz.api.response import Response as sz_api_response
from sz.api.views import SzApiView, news_feed_service,\
    place_service, gamemap_service
from sz.core import models


class PlaceRoot(SzApiView):
    if not settings.LEBOWSKI_MODE_TEST:
        permission_classes = (permissions.IsAuthenticated, )
    LIMIT = 10

    def _serialize_item(self, item, user):
        """Place instance serializer

        Args:
            item - {<Place>, distance},
                where <Place> - a <Place> instance, distance - int
            user - a <User> instance

        Return:
            serializers.place_detail_serialiser(**params)
        """
        if not item:
            return
        params = dict(
            place=item['place'], distance=item['distance'], user=user)
        return serializers.place_detail_serialiser(**params)

    def validate_req_params(self, query):
        params = self.validate_and_get_params(
            self.form, query)
        params['limit'] = self.LIMIT
        return params


class PlaceRootNews(SzApiView):
    """
    News feed that represents a list of places of whom
    somebody recently left a message
    For example, [news feed for location (50.2616113, 127.5266082)]
    (?latitude=50.2616113&longitude=127.5266082).
    """

    def get(self, request, format=None):
        params = self.validate_and_get_params(
            forms.NewsRequestForm, request.QUERY_PARAMS)
        news_feed = news_feed_service.get_news(**params)
        photo_host = reverse('client-index', request=request)
        response_builder = sz_api_response.NewsFeedResponseBuilder(
            photo_host, request)
        serialized_news_feed = response_builder.build(news_feed)
        return sz_api_response(serialized_news_feed)


class PlaceVenueExplore(PlaceRoot):
    """
    Wrapper for Venue explore - get places list from 4sk and create it in db
    For example,
    [places for position (50.2616113, 127.5266082) radius 250]
    (?latitude=50.2616113&longitude=127.5266082&radius=250).

    Returns:
        ?????
    """
    form = forms.PlaceExploreRequestForm

    def get(self, request, format=None):
        params = self.validate_req_params(request.QUERY_PARAMS)
        creator = request.user
        params['user'] = creator
        places_list = place_service.explore_in_venues(**params)
        if places_list:
            bl_data = serializers.UserStandartDataSerializer(
                instance=creator).data
            bl_data['user_longitude'] = params.get('latitude')
            bl_data['user_latitude'] = params.get('longitude')
            bl_data['places'] = map(
                lambda p: serializers.place_detail_serialiser(
                    place=p, user=creator),
                places_list)
            # engine_data = posts.places_create(bl_data)

            data = {}
            data['data'] = dict(
                user=creator.email, places_explored=len(places_list))
            data['status'] = status.HTTP_201_CREATED
            gamemap_service.update_gamemap(params)

            # data['data'] = dict(user=engine_data["data"].get("user", {}))
            # data['status'] = engine_data.get("status")
            # if engine_data['status'] == status.HTTP_201_CREATED:
            #     for p_data in engine_data['data'].get('places', []):
            #         s = serializers.PlaceStandartDataSerializer(data=p_data)
            #         if s.is_valid():
            #             p = s.object
            #             p.create_in_engine()
            #             val+=1
            #    gamemap_service.update_gamemap(params)
            # data['places_explored'] = val
            # if settings.LEBOWSKI_MODE_TEST:
            #     data['bl'] = engine_data
            #     data['status'] = status.HTTP_201_CREATED
            return sz_api_response(**data)
        return sz_api_response(
            data=dict(user=creator.email, places_explored=len(places_list)))


class PlaceVenueSearch(PlaceRoot):
    """
    Wrapper for Venue search - get places list from db
    For example,
    [places for position (50.2616113, 127.5266082) radius 250]
    (?latitude=50.2616113&longitude=127.5266082&radius=250).

    Returns:
        [self._serialize_item(item, request.user), ..]
    """
    form = forms.PlaceSearchRequestForm

    def get(self, request, format=None):
        params = self.validate_req_params(request.QUERY_PARAMS)
        places_list = place_service.search_in_venue(**params)
        place_response = map(
            lambda item: self._serialize_item(item, request.user), places_list)
        data = dict(places=place_response)
        return sz_api_response(data)


class PlaceInstanceMessages(SzApiView):

    def get_object(self, pk):
        try:
            return models.Place.objects.get(pk=pk)
        except models.Place.DoesNotExist:
            raise Http404

    def get(self, request, pk, format=None):
        return {}
        # params = self.validate_and_get_params(
        #    forms.MessageRequestForm, request.QUERY_PARAMS)
        # place = self.get_object(pk)
        # messages = message_service.get_place_messages(place, **params)
        # photo_host = reverse('client-index', request=request)
        # response_builder = sz_api_response.PlaceMessagesResponseBuilder(
        #    photo_host, request)
        # return sz_api_response(response_builder.build(place, messages))


class GameMapRoot(PlaceRoot):
    form = forms.PlaceSearchRequestForm

    def get(self, request, format=None):
        params = self.validate_req_params(request.QUERY_PARAMS)
        user = request.user
        gamemap = gamemap_service.get_gamemap(user, **params)
        data = dict(
            last_box=self._serialize_item(gamemap.get('last_box'), user),
            current_box=self._serialize_item(gamemap.get('current_box'), user),
            map_width=gamemap.get('map_width'),
            map_height=gamemap.get('map_height'),
            gamemap=map(
                lambda i: self._serialize_item(i, user),
                gamemap.get('gamemap', [])),
        )
        return sz_api_response(data)
