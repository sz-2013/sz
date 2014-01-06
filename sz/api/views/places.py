# -*- coding: utf-8 -*-
from django.http import Http404
from rest_framework import permissions, status
from rest_framework.reverse import reverse
from sz.api.views import SzApiView, news_feed_service, place_service
from sz.api import serializers, forms
from sz.api import response as sz_api_response
from sz import settings
from sz.settings import LEBOWSKI_MODE_TEST
from lebowski.api.views import places as lebowski_places

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
        return sz_api_response.Response(serialized_news_feed)

class PlaceVenueExplore(SzApiView):
    """
    Wrapper for Venue explore - get places list from 4sk and create it in db
    For example, 
    [places for position (50.2616113, 127.5266082) radius 250](?latitude=50.2616113&longitude=127.5266082&radius=250).
    """
    if not LEBOWSKI_MODE_TEST:
        permission_classes = (permissions.IsAuthenticated,)
    def _serialize_item(self, item):
        item_serializer = serializers.PlaceSerializer(instance=item[u'place'])
        serialized_item = {
            "place": item_serializer.data, "creator": item["creator"]}
        return serialized_item          
    def get(self, request,format=None):
        params = self.validate_and_get_params(
            forms.PlaceExploreRequestForm, request.QUERY_PARAMS)
        params['limit'] = 10
        params[u'creator'] = request.user.email  if not LEBOWSKI_MODE_TEST \
            else request.QUERY_PARAMS.get('email')        
        places_list, creator = place_service.explore_in_venues(**params)
        if places_list:
            engins_data = lebowski_places.PlacesCreate().create(places_list, creator)
            return sz_api_response.Response(**engins_data)        
        return sz_api_response.Response({})  

class PlaceVenueSearch(SzApiView):
    """
    Wrapper for Venue search - get places list from db
    For example, 
    [places for position (50.2616113, 127.5266082) radius 250](?latitude=50.2616113&longitude=127.5266082&radius=250).
    """
    permission_classes = (permissions.IsAuthenticated,)
    def _serialize_item(self, item):
        item_serializer = serializers.PlaceSerializer(instance=item[u'place'])
        serialized_item = {
            "place": item_serializer.data, 'distance':round(item['distance'])}
        return serialized_item          
    def _serialize_list(self, places):
        return map(self._serialize_item ,places) if type(places) is list else []
    def get(self, request,format=None):
        params = self.validate_and_get_params(
            forms.PlaceSearchRequestForm, request.QUERY_PARAMS)
        params['user'] = request.user.email
        params['limit'] = 10
        places_list = place_service.search_in_venue(**params)
        place_response = map(self._serialize_item, places_list)
        return sz_api_response.Response(place_response)    

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
        # return sz_api_response.Response(response_builder.build(place, messages))