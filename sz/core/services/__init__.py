# -*- coding: utf-8 -*-
import os
import datetime
import math
import random
from PIL import Image, ImageDraw
from django.utils import timezone
from django.db.models import Max
from django.core.files import File
from django.db import IntegrityError
from sz import settings
from sz.settings import LEBOWSKI_MODE_TEST
from sz.core.services import parameters
from sz.core.services.parameters import names as params_names
from sz.core.gis import venue
from sz.core import models, queries, gis as gis_core, utils


class FeedService:
    def _make_result(self, items, count, params):
        return dict(count=count, items=items, params=params.get_api_params())

    def _make_place_distance_item(self, place, params):
        latitude, longitude = parameters.get_position_from_dict(
            params.get_api_params())
        distance = gis_core.distance(
            longitude, latitude, place.longitude(), place.latitude())
        azimuth = gis_core.azimuth(
            longitude, latitude, place.longitude(), place.latitude())
        item = dict(place=place, distance=distance, azimuth=azimuth)
        return item

    def _get_max_id(self):
        return models.Message.objects.aggregate(max_id=Max('id'))["max_id"]

class PlaceService(FeedService):
#place is created, when user send on server a explore_in_venues request
#place is removed, if place did not have an owner moer then %TIME% 
    def __init__(self, city_service):
        self.city_service = city_service

    def create_place(self,params, city_id, creator, radius):
        distance = gis_core.distance(
            creator['longitude'], creator['latitude'],
            params[u'location'].get('lng'), params[u'location'].get('lat'))
        #filter only in radius        
        if distance>radius:
            return False
        location = params.get(u'location',{})
        position = gis_core.ll_to_point(
            location.get(u'lng'), params[u'location'].get(u'lat'))                
        place_params = dict(
            address = location.get('address'),
            crossStreet = location.get('crossStreet'),
            contact = location.get('contact'),
            fsq_id = params.get('id'),            
            city_id = city_id,
            position=position, 
            name=params.get('name')
        )
        foursquare_cat = params.get(u'categories')[0] \
            if len(params.get(u'categories',[])) else {}        
        if foursquare_cat:
            foursquare_icon = foursquare_cat.get('icon',{})
            place_params['foursquare_icon_suffix'] = foursquare_icon.get(u'suffix')
            place_params['foursquare_icon_prefix'] = foursquare_icon.get(u'prefix')        
        '''
        Зачем здесь экспешн ?
        Да потому что из-за уникальной географической позиции в городе тестирования 
        city_id определяется поразному в разных точках города 
        и с таким ид, name, position  место не находится, но и создавать не даст
        '''
        try:
            p, is_create = models.Place.objects.get_or_create(**place_params)
        except IntegrityError:
            p = models.Place.objects.filter(
                position=position, name=params.get('name'))
            if p: p = p[0]
        return p if (p and not p.is_active) else False

    def _filter_place(self, p, creator, radius):
        distance = gis_core.distance(
            creator['longitude'], creator['latitude'],
            p[u'location'].get('lng'), p[u'location'].get('lat'))
        #filter only in radius        
        if distance>radius:
            return False
        position = gis_core.ll_to_point(
            p[u'location'].get(u'lng'), p[u'location'].get(u'lat'))
        place = models.Place.objects.filter(name=p['name'], position=position)
        #take only not created or not active in db places
        is_create = place[0].is_active if place else False
        return not is_create

    def explore_in_venues(self, **kwargs):
        params = parameters.PlaceSearchParametersFactory.create(
            kwargs, self.city_service).get_db_params()
        latitude = params.get(params_names.LATITUDE)
        longitude = params.get(params_names.LONGITUDE)
        city_id = params.get(params_names.CITY_ID)
        query = params.get(params_names.QUERY)
        radius = params.get(params_names.RADIUS)
        creator = {
            'email':kwargs[u'creator'], 'latitude':latitude, 'longitude':longitude
        }
        #get place_list from 4qk        
        result = venue.search(
            {'latitude': latitude, 'longitude': longitude},
            query, radius
        )
        places_list = []
        for p in result['venues']:
            new_place = self.create_place(p,city_id,creator,radius)
            if new_place:
                places_list.append(new_place)
        return places_list, creator

    def _make_distance_items_list(self, params, places):
        return [self._make_place_distance_item(p,params) for p in places]

    def search_in_venue(self, **kwargs):
        params = parameters.PlaceSearchParametersFactory.create(
            kwargs, self.city_service)
        places_list = queries.search_places(**params.get_db_params())
        return self._make_distance_items_list(params, places_list)
    def get_gamemap(self, **kwargs):
        params = parameters.PlaceSearchParametersFactory.create(
            kwargs, self.city_service)
        city_id = params.get_db_params().get(params_names.CITY_ID)
        places_list = models.Place.objects.filter(city_id=city_id)
        #нужно получить нечетное целое число, чтобы оно стало длиной ребра
        num = math.sqrt(len(places_list)) 
        #если корень из длины - четное или не целое число
        #нужер найти ближайшее сверху нечетное
        if num%1 or not num%2:
            #прибавляем к нему единицу. четное станет нечетным. нечетное - четным.
            num=int(num+1)
            #и поэтому к нему мы снова прибавим единицу.
            if not num%2: num+=1
        #на всякий случай опять делаем инт, чтобы округлилось вниз
        map_width = int(num)
        #теперь мы получаем два списка,
        #которые представляют собой проекции мест на оси
        places_sorted_by_x = sorted(places_list, key=lambda p: p.position.x )
        def generate_list(places, n):
            len_places = len(places)
            def sub_list(i):
                return places[i:i+n] if (i+n*2)<len_places else places[i:]
            return [sub_list(i) for i in xrange(0, len_places, n) \
                if (i+n)<len_places]
        #теперь проекции нужно сгрупировать по (len/map_width) элементов
        #два группированных списка [(0, [p1, p2,..]), ....], 
        #где каждый (..) фактически означает номер клетки
        places_x = generate_list(places_sorted_by_x, len(places_list)/map_width)
        places_data = []        
        def random_cell(len_random, max_random, rand_num=None):
            if rand_num is None: rand_num = []
            num = random.randint(0, max_random)
            if num not in rand_num: rand_num

        #берем столбец
        for x, gr in enumerate(places_x): 
            #и сортируем его ячейки по рядам
            places_y = sorted(gr, key=lambda p_y:p_y.position.y)            
            #если длина столбца меньше map_width - дополняем его пустыми ячейками
            #в случайных местах
            cell_deficit = map_width - len(places_y)
            random_num = random.sample(xrange(map_width), cell_deficit)
            map(lambda i: places_y.insert(i, None), random_num)
            for y, p in enumerate(places_y):
                item = self._make_place_distance_item(p, params) if p \
                    else dict(place=None)
                item['position'] = [x+1, y+1]
                places_data.append(item)
        # columns = [item['position'][0] for item in places_data]
        # map_height = sorted(
        #     map(lambda y: columns.count(y), columns) , reverse=True)[0]
        map_height = map_width
        return places_data, map_width, map_height



class MessageService(FeedService):
    default_limit = settings.DEFAULT_PAGINATE_BY
    media_url = settings.MEDIA_ROOT + '/'
    def __init__(self, city_service, categorization_service):
        self.city_service = city_service
        self.categorization_service = categorization_service    
    def unface_photo(self, faces_list, photo_box, message):    
        #set def face id if somewhere i forget set it
        face_id_undef = models.Face.objects.all()[0].pk
        #open original photo        
        message_photo = message.photo
        full_photo_src = self.media_url+message.photo.url
        full_photo = Image.open(full_photo_src)
        full_photo_W = full_photo.size[0]
        full_photo_H = full_photo.size[1]
        full_photo_pix = full_photo.load()
        reduced_photo_W = photo_box.get('width',1)
        reduced_photo_H = photo_box.get('height',1)
        #first - make img with all faces                     
        faces_map = Image.new("RGBA", (full_photo_W,full_photo_H), (0,0,0,0))
        draw_faces_map = ImageDraw.Draw(faces_map)    
        #for each face in list - change face size and
        #draw in needed position  on faces_map
        for faceBox in faces_list:
            #now we must convert reduced position in full-size oposition
            new_face_w = int(
                faceBox.get("width",0)*full_photo_W/reduced_photo_W)            
            new_face_h = int(
                faceBox.get("height",0)*full_photo_H/reduced_photo_H)
            new_face_x = int(
                faceBox.get("x",0)*full_photo_W/reduced_photo_W)
            new_face_y = int(
                faceBox.get("y",0)*full_photo_H/reduced_photo_H)
            #get a face_pattern
            try:
                face_pattern = models.Face.objects.get(
                    pk=faceBox.get("face",face_id_undef)).face
            except:
                return False
            else:
                new_face = Image.open(self.media_url+face_pattern.url).resize(
                    (new_face_w, new_face_h), Image.ANTIALIAS)
                pix = new_face.load()    
                for w in range(new_face_w):
                    for h in range(new_face_h):
                        point = pix[w,h]
                        if point!=(0,0,0,0):
                            pointW = w + new_face_x
                            pointH = h + new_face_y
                            draw_faces_map.point((pointW, pointH), point)  
        del draw_faces_map
        faces_map_pix = faces_map.load()
        #now draw a composite image from faces_map and original photo
        draw_photo = ImageDraw.Draw(full_photo)
        for w in range(full_photo_W): 
            for h in range(full_photo_H):     
                point = faces_map_pix[w,h]
                if point==(0,0,0,0):
                    point = full_photo_pix[w,h]
                draw_photo.point((w, h), point)
        del draw_photo
        full_photo.save(full_photo_src)
        new_photo = open(full_photo_src)
        message.photo = None    
        os.remove(full_photo_src)    
        return File(new_photo)
    def get_place_messages(self, place, current_max_id=None, \
        default_limit=None, **kwargs):
        if current_max_id is None:
            current_max_id = self._get_max_id()
        if default_limit is None:
            default_limit = self.default_limit
        params = parameters.PlaceMessagesParametersFactory.create(
            kwargs, self.categorization_service, current_max_id, default_limit)
        messages, count = queries.place_messages(place, **params.get_db_params())
        return self._make_result(messages, count, params)

    def __get_search_item(self, message, params):
        item = self._make_place_distance_item(message.place, params)
        item['message'] = message
        return item

    def search(self, current_max_id=None, default_limit=None, **kwargs):
        if current_max_id is None:
            current_max_id = self._get_max_id()
        if default_limit is None:
            default_limit = self.default_limit
        params = parameters.NewsParametersFactory.create(
            kwargs, self.categorization_service, self.city_service,
            current_max_id, default_limit)
        messages, count = queries.search_messages(**params.get_db_params())
        items = [self.__get_search_item(message, params) for message in messages]
        return self._make_result(items, count, params)

class NewsFeedService(FeedService):

    news_items_default_limit = 17
    news_item_default_size = 3
    place_news_default_limit = 9
    gallery_preview_default_size = 9

    def __init__(self, message_service):
        self.message_service = message_service

    def __make_feed_item(self, place, params):
        messages = self.message_service.get_place_messages(place, \
            **params.get_api_params())
        item = self._make_place_distance_item(place, params)
        item['messages'] = messages
        return item

    def __make_feed_item_with_gallery_preview(self, place, params):
        item = self.__make_feed_item(place, params)
        kwargs = params.get_api_params()
        kwargs[params_names.PHOTO] = True
        kwargs[params_names.LIMIT] = self.gallery_preview_default_size
        kwargs[params_names.OFFSET] = 0
        photos = self.message_service.get_place_messages(place, **kwargs)
        item['photos'] = photos
        return item

    def get_news(self, **kwargs):

        current_max_id = self._get_max_id()
        params = parameters.NewsParametersFactory.create(
            kwargs, self.message_service.categorization_service, 
            self.message_service.city_service,
            current_max_id, self.news_items_default_limit)
        places, count = queries.places_news_feed(**params.get_db_params())
        kwargs.pop(params_names.LIMIT)
        kwargs.pop(params_names.OFFSET)
        item_params = parameters.PlaceNewsParametersFactory.create(
            kwargs, self.message_service.categorization_service,
            current_max_id, self.news_item_default_size)        
        feed = self._make_result(
            [self.__make_feed_item(place, item_params)
             for place in places], count, params)
        return feed

    def get_place_news(self, place, **kwargs):
        current_max_id = self._get_max_id()
        params = parameters.PlaceNewsParametersFactory.create(
            kwargs, self.message_service.categorization_service,
            current_max_id, self.place_news_default_limit)
        item = self.__make_feed_item_with_gallery_preview(place, params)
        return item


