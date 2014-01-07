# -*- coding: utf-8 -*-
from django.http import Http404
from rest_framework import permissions, status
from rest_framework.reverse import reverse
from sz import settings
from sz.api import serializers, forms, posts
from sz.api.response import Response as sz_api_response
from sz.api.views import SzApiView, news_feed_service, place_service, gamemap_service

class PlaceRoot(SzApiView):
    if not settings.LEBOWSKI_MODE_TEST:
        permission_classes = (permissions.IsAuthenticated,)
    LIMIT = 10
    def _serialize_item(self, item, user):
        params = dict(place=item['place'], distance=item['distance'], user=user)
        return serializers.place_detail_serialiser(**params)    
    def validate_req_params(self, request,format=None):
        params = self.validate_and_get_params(
            self.form, request.QUERY_PARAMS)
        params['user'] = request.user.email  if not settings.LEBOWSKI_MODE_TEST \
            else request.QUERY_PARAMS.get('email')        
        params['limit'] = self.LIMIT
        s = serializers.UserSerializer(data={"email": params['user']})
        user = s.object if s.is_valid() else None
        return params, user



class PlaceRootNews(SzApiView):
    """
    News feed that represents a list of places of whom somebody recently left a message
    For example, [news feed for location (50.2616113, 127.5266082)](?latitude=50.2616113&longitude=127.5266082).
    """

    def get(self, request, format=None):
        params = self.validate_and_get_params(forms.NewsRequestForm, request.QUERY_PARAMS)
        news_feed = news_feed_service.get_news(**params)
        photo_host = reverse('client-index', request=request)
        response_builder = sz_api_response.NewsFeedResponseBuilder(photo_host, request)
        serialized_news_feed = response_builder.build(news_feed)
        return sz_api_response(serialized_news_feed)

class PlaceVenueExplore(PlaceRoot):
    """
    Wrapper for Venue explore - get places list from 4sk and create it in db
    For example, 
    [places for position (50.2616113, 127.5266082) radius 250](?latitude=50.2616113&longitude=127.5266082&radius=250).
    """    
    form = forms.PlaceExploreRequestForm

    def get(self, request,format=None):
        params, creator = self.validate_req_params(request)                
        places_list = place_service.explore_in_venues(**params)
        if places_list:
            bl_data = serializers.UserStandartDataSerializer(
                instance=creator).data
            bl_data['user_longitude'] = params.get('latitude')
            bl_data['user_latitude'] = params.get('longitude')
            bl_data['places'] = map(
                lambda p: serializers.place_detail_serialiser(place=p, user=creator), 
                places_list)
            engine_data = posts.places_create(bl_data)

            data = {}
            data['data'] = dict(user=creator, places_explored=len(places_list))
            data['status'] = 201
            gamemap_service.update_gamemap(params)

            # data['data'] = dict(user=engine_data["data"].get("user", {}))
            # data['status'] = engine_data.get("status")
            # if engine_data['status'] == 201:
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
            #     data['status'] = 201
            return sz_api_response(**data)
        return sz_api_response({})  

class PlaceVenueSearch(PlaceRoot):
    """
    Wrapper for Venue search - get places list from db
    For example, 
    [places for position (50.2616113, 127.5266082) radius 250](?latitude=50.2616113&longitude=127.5266082&radius=250).
    """
    form = forms.PlaceSearchRequestForm
    LIMIT = 40
    def get(self, request,format=None):
        params, user = self.validate_req_params(request)    
        places_list = place_service.search_in_venue(**params)
        print len(places_list)
        place_response = map(
            lambda item:self._serialize_item(item, user), places_list)
        current_box = sorted(
            place_response, key=lambda data: data.get('distance'))[0]
        positions_list = [p['place'].get_gamemap_position() for \
            p in places_list if p['place'].gamemap_position]
        x_list = sorted([pos[0] for pos in positions_list])
        y_list = sorted([pos[1] for pos in positions_list])
        gamemap = dict(old_box=None, current_box=current_box,
            map_height=y_list[-1] - y_list[0], 
            map_width=x_list[-1] - x_list[0]
        )
        data = dict(places=place_response, map=gamemap)
        return sz_api_response(data)

class PlaceInstanceMessages(SzApiView):

    def get_object(self, pk):
        try:
            return models.Place.objects.get(pk=pk)
        except models.Place.DoesNotExist:
            raise Http404

    def get(self, request, pk, format=None):
        return {}
        # params = self.validate_and_get_params(forms.MessageRequestForm, request.QUERY_PARAMS)
        # place = self.get_object(pk)
        # messages = message_service.get_place_messages(place, **params)
        # photo_host = reverse('client-index', request=request)
        # response_builder = sz_api_response.PlaceMessagesResponseBuilder(photo_host, request)
        # return sz_api_response(response_builder.build(place, messages))