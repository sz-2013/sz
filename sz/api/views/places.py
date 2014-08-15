# -*- coding: utf-8 -*-
from django.http import Http404
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.reverse import reverse
from sz.api import forms, posts, serializers
from sz.api.response import Response as sz_api_response
from sz.api.views import SzApiView, news_feed_service,\
    place_service, gamemap_service
from sz.place import models
from sz.static.models import BuildingImage as modelsBuildingImage


class PlaceRoot(SzApiView):
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
        if not isinstance(item, dict):
            item = dict(place=item)
        params = dict(
            place=item['place'], distance=item.get('distance'), user=user)
        return serializers.place_detail_serialiser(**params)

    def validate_req_params(self, query):
        params = self.validate_and_get_params(
            self.form, query)
        params['limit'] = self.LIMIT
        return params

    def _get_detail(self, request, place, user=None):
        data = self._serialize_item(place, user)
        engine_data = posts.PlacePost().get_detail(data)
        url = reverse('client-index', request=request)
        get_bld = lambda lvl, b_type='ms': \
            modelsBuildingImage.objects.get_building(
                lvl, engine_data['place_openner_race'], url, b_type)
        data.update(engine_data)
        data['place_ms'] = get_bld(engine_data['place_lvl'])
        data['place_buildings'] = map(
            lambda (b_type, lvl): get_bld(0, b_type),
            engine_data['place_buildings'])
        return data


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
        user_data = serializers.UserStandartDataShortSerializer(
            instance=creator).data
        places_len = len(places_list)
        code = status.HTTP_200_OK
        if places_len:
            places_len = 0
            bl_data = user_data
            bl_data['user_longitude'] = params.get('latitude')
            bl_data['user_latitude'] = params.get('longitude')
            places_list = map(
                lambda p: serializers.PlaceStandartDataSerializer(
                    instance=p).data,
                places_list)
            places_tuples = map(
                lambda data: (str(data.get('place_id')), data), places_list)
            bl_data['places'] = dict(places_tuples)
            engine_answer = posts.Place.create(bl_data)
            code = engine_answer.get("status")
            engine_data = engine_answer.get("data", {})
            if code != status.HTTP_201_CREATED:
                return sz_api_response(status=code, data=engine_data)
            user_data = engine_data.get("user")
            for p_id, p_data in engine_data.get('places', {}).iteritems():
                s = serializers.PlaceStandartDataSerializer(data=p_data)
                if s.is_valid():
                    s.object.create_in_engine(p_data)
                    places_len += 1
            gamemap_service.update_gamemap(params)
            # code = status.HTTP_201_CREATED
            # gamemap_service.update_gamemap(params)
        return sz_api_response(
            data=dict(user=user_data, places_explored=places_len), status=code)


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


# class GameMapRoot(PlaceRoot):
#     """For example,[map
#     (50.2616113, 127.5266082)](?latitude=50.2616113&longitude=127.5266082).
#     (I need position for a distance calculate)"""
#     form = forms.GameMapRequestForm

#     def get(self, request, format=None):
#         params = self.validate_req_params(request.QUERY_PARAMS)
#         user = request.user
#         gamemap = gamemap_service.get_gamemap(user, **params)
#         data = map(lambda item: self._serialize_item(item, user), gamemap)
#         return sz_api_response(data)


class PlaceDetail(PlaceRoot):
    def get(self, request, pk, format=None,):
        place = get_object_or_404(models.Place, pk=pk)
        data = self._get_detail(request, place)
        return sz_api_response(data)


class GameMapPath(PlaceRoot):
    """Return path from prev_box to current_box.For example,[new position
    (50.2616113, 127.5266082)](?latitude=50.2616113&longitude=127.5266082)."""
    form = forms.GameMapPathRequestForm

    def get(self, request, format=None):
        params = self.validate_req_params(request.QUERY_PARAMS)
        user = request.user
        gamemap = gamemap_service.get_gamemap_path(user, **params)
        data = dict(
            prev_box=self._serialize_item(gamemap.get('prev_box'), user),
            current_box=self._serialize_item(gamemap.get('current_box'), user),
            path=gamemap.get('path')
        )
        return sz_api_response(data)

    def post(self, request):
        user = request.user
        params = self.validate_and_get_params(
            forms.GameMapPathPostRequestForm, request.DATA)
        return sz_api_response({})


class GameMapTile(PlaceRoot):
    """For example,[new tile
    (1, 1)](?x=1&y=1&latitude=50.2616113&longitude=127.5266082)."""
    form = forms.GameMapTileRequestForm

    def get(self, request, format=None):
        """
        In request:
            latitude, longitude - user current position
            x, y - needed tile gamemap position
        """
        params = self.validate_req_params(request.QUERY_PARAMS)
        user = request.user
        # return {<place>, distance}
        tile = gamemap_service.get_gamemap_tile(user, **params)
        data = self._get_detail(request, tile, user)
        # Если у объекта нет gamemap_position значит это шаблон,
        # но без gamemap_position я не смогу найти его на карте
        data['place_gamemap_position'] = data['place_gamemap_position'] or \
            [params['x'], params['y']]
        return sz_api_response(data)


# class GameMapUpdatePath(PlaceRoot):
#     """Update gamemap path for user.
#     In request.POST:
#         - path [[1, 1],..., [1, 2]] - user path positions
#     Returns:
#         - 200 if path was updated
#         - 400 in case of error"""
#     def post(self, request):
#         user = request.user
#         gamemap_service.update_user_gamemap()
