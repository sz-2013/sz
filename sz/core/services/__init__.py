# -*- coding: utf-8 -*-
import math
import random
from django.db.models import Max
from django.db import IntegrityError
from sz import settings
from sz.core.services import parameters
from sz.core.services.parameters import names as params_names
from sz.core.gis import venue
from sz.core import queries, gis as gis_core
from sz.core.models import User as modelUser
from sz.message.models import Message as modelMessage
from sz.place.models import Place as modelPlace


class FeedService:
    def _make_result(self, items, count, params):
        return dict(count=count, items=items, params=params.get_api_params())

    def _make_place_distance_item(self, place, params):
        if place.position:
            latitude, longitude = parameters.get_position_from_dict(
                params.get_api_params())
            args = [longitude, latitude, place.longitude(), place.latitude()]
            distance = gis_core.distance(*args)
            azimuth = gis_core.azimuth(*args)
        else:
            distance = None
            azimuth = None
        return dict(place=place, distance=distance, azimuth=azimuth)

    def _get_max_id(self):
        return modelMessage.objects.aggregate(max_id=Max('id'))["max_id"]

    def _make_distance_items_list(self, params, places):
        return [self._make_place_distance_item(p, params) for p in places]


class PlaceService(FeedService):
#place is created, when user send on server a explore_in_venues request
#place is removed, if place did not have an owner moer then %TIME%
    def __init__(self, city_service):
        self.city_service = city_service

    def create_place(self, params, city_id, creator, radius):
        distance = gis_core.distance(
            creator['longitude'], creator['latitude'],
            params[u'location'].get('lng'), params[u'location'].get('lat'))
        #filter only in radius
        if distance > radius:
            return False
        location = params.get(u'location', {})
        position = gis_core.ll_to_point(
            location.get(u'lng'), params[u'location'].get(u'lat'))
        place_params = dict(
            address=location.get('address'),
            crossStreet=location.get('crossStreet'),
            contact=location.get('contact'),
            fsq_id=params.get('id'),
            city_id=city_id,
            position=position,
            name=params.get('name')
        )
        foursquare_cat = params.get(u'categories')[0] \
            if len(params.get(u'categories', [])) else {}
        if foursquare_cat:
            foursquare_icon = foursquare_cat.get('icon', {})
            place_params['foursquare_icon_suffix'] = foursquare_icon.get(
                u'suffix')
            place_params['foursquare_icon_prefix'] = foursquare_icon.get(
                u'prefix')
        '''
        Зачем здесь экспешн ?
        Да потому что из-за уникальной географической позиции в
        городе тестирования city_id определяется поразному в разных
        точках города и с таким ид, name, position  место не находится,
        но и создавать не даст
        '''
        try:
            p, is_create = modelPlace.objects.get_or_create(**place_params)
        except IntegrityError:
            p = modelPlace.objects.filter(
                position=position, name=params.get('name'))
            p = p[0] if p else None
        return p if (p and not p.is_active) else False

    def _filter_place(self, p, creator, radius):
        distance = gis_core.distance(
            creator['longitude'], creator['latitude'],
            p[u'location'].get('lng'), p[u'location'].get('lat'))
        #filter only in radius
        if distance > radius:
            return False
        position = gis_core.ll_to_point(
            p[u'location'].get(u'lng'), p[u'location'].get(u'lat'))
        place = modelPlace.objects.filter(name=p['name'], position=position)
        #take only not created or not active in db places
        is_create = place[0].is_active if place else False
        return not is_create

    def explore_in_venues(self, **kwargs):
        """Gets places around point from external db

        Gets places around point. Filter by radius, query and
        return list of places, which NOT created in szdb OR created
        but NOT active (anyway a place should be dont created in BL).

        Args:
            **kwargs:
                latitude - the point latitude
                longitude  - the point longitude
                query - string key for filter
                radius - radius for filter
                user - <User>

        Returns:
            [<Place>,..]
        """
        params = parameters.PlaceSearchParametersFactory.create(
            kwargs, self.city_service).get_db_params()
        latitude = params.get(params_names.LATITUDE)
        longitude = params.get(params_names.LONGITUDE)
        city_id = params.get(params_names.CITY_ID)
        query = params.get(params_names.QUERY)
        radius = params.get(params_names.RADIUS)
        creator = {
            'email': kwargs[u'user'].email,
            'latitude': latitude, 'longitude': longitude
        }
        #get place_list from 4qk
        result = venue.search(
            {'latitude': latitude, 'longitude': longitude},
            query, radius
        )
        places_list = []
        for p in result['venues']:
            new_place = self.create_place(p, city_id, creator, radius)
            if new_place:
                places_list.append(new_place)
        return places_list

    def search_in_venue(self, **kwargs):
        """Gets places around point from sz db

        Gets places around point. Filter by radius, query and
        return list of places.

        Args:
            **kwargs:
                latitude - the point latitude
                longitude  - the point longitude
                query - string key for filter
                radius - radius for filter
        Returns:
            [<Place>,..]
        """
        params = parameters.PlaceSearchParametersFactory.create(
            kwargs, self.city_service)
        places_list = queries.search_places(**params.get_db_params())
        return self._make_distance_items_list(params, places_list)


class GameMapService(FeedService):
    def __init__(self, city_service):
        self.city_service = city_service

    def update_gamemap(self, params):
        """Create a gamemap for specified city

        Build a square map for city.

        Args:
            params:
                latitude - the point latitude
                longitude  - the point longitude

        Returns:
            None
        """
        city_id = self.city_service.get_city_by_position(
            params.get('longitude'), params.get('latitude'))['geoname_id']
        #dont forget add is_active in filter
        places_list = modelPlace.objects.filter(city_id=city_id)
        #нужно получить нечетное целое число, чтобы оно стало длиной ребра
        num = math.sqrt(len(places_list))
        #если корень из длины - четное или не целое число
        #нужер найти ближайшее сверху нечетное
        if num % 1 or not num % 2:
            #прибавляем к нему единицу.
            #четное станет нечетным. нечетное - четным.
            num = int(num + 1)
            #и поэтому к нему мы снова прибавим единицу.
            if not num % 2:
                num += 1
        #на всякий случай опять делаем инт, чтобы округлилось вниз
        map_width = int(num)
        #теперь мы получаем список,
        #который представляет собой проекции мест на ось х
        places_sorted_by_x = sorted(places_list, key=lambda p: p.position.x)

        def generate_list(arr, n):
            length = len(arr)
            # Возвращаем срезы длинной в n, если до конца больше, чем на 2n
            # иначе возвращаем остаток списка
            sub_list = lambda i: arr[i:i+n] if ((i+n*2) < length) else arr[i:]
            return [sub_list(i) for i in xrange(0, length, n)
                    if ((i + n) < length)]
        #теперь проекцию нужно сгрупировать по (len/map_width) элементов
        #в списки [[p1, p2,..], ....],
        #где каждый сублист фактически означает один столбец
        places_x = generate_list(
            places_sorted_by_x, len(places_list)/map_width)

        #берем столбец
        for x, gr in enumerate(places_x):
            #и сортируем его ячейки по рядам
            places_y = sorted(gr, key=lambda p_y: p_y.position.y)
            #если длина столбца меньше map_width - дополняем его
            #пустыми ячейками в случайных местах
            cell_deficit = map_width - len(places_y)
            if cell_deficit > 0:
                random_num = random.sample(xrange(map_width), cell_deficit)
                map(lambda i: places_y.insert(i, None), random_num)
            for y, p in enumerate(places_y):
                if p:
                    p.update_gamemap(x + 1, y + 1)
        return

    # def get_gamemap(self, user, **kwargs):
    #     """Return a square map of the city

    #     Args:
    #         **kwargs:
    #             latitude - the point latitude
    #             longitude  - the point longitude
    #             user - <User>, who did it request

    #     Return:
    #         list of places with distance
    #     """
    #     params = parameters.PlaceSearchParametersFactory.create(
    #         kwargs, self.city_service)
    #     places_list = filter(
    #         lambda p: p.gamemap_position,
    #         queries.search_places(**params.get_db_params()))
    #     return self._make_distance_items_list(params, places_list)

    def get_gamemap_path(self, user, **kwargs):
        """Return a path between last and current user position

        Args:
            **kwargs:
                latitude - the point latitude
                longitude  - the point longitude
                user - <User>, who did it request

        Return:
            last_box - a last box, where the user did something,
            current_box - a current user box,
            path - [(x, y), (x, y)] - path from last_box to curr_box
        """
        def _get_path(prev, curr):
            end = prev.get_gamemap_position()
            start = curr.get_gamemap_position()

            def _compare(a, b):
                if a > b:
                    return -1
                if a < b:
                    return 1
                return 0

            def _get(_path=None):
                if _path is None:
                    _path = [start]
                last = _path[-1]
                next_x = _compare(last[0], end[0]) + last[0]
                next_y = start[1]
                if next_x == end[0]:
                    next_y = _compare(last[1], end[1]) + last[1]
                _path.append([next_x, next_y])
                if next_x == end[0] and next_y == end[1]:
                    return _path
                return _get(_path)

            return _get()

        params = parameters.PlaceSearchParametersFactory.create(
            kwargs, self.city_service)
        user = modelUser.objects.get(email=user)
        places_list = filter(
            lambda p: p.gamemap_position,
            queries.search_places(**params.get_db_params()))
        curr = places_list[0]
        prev = random.choice(places_list)
        return dict(
            path=_get_path(prev, curr),
            prev_box=self._make_place_distance_item(prev, params),
            current_box=self._make_place_distance_item(curr, params),
        )

    def get_gamemap_tile(self, user, **kwargs):
        """Returns needed <Place> object be gamemap_position

        Kwargs:
            - x, y - gamemap_position
            - latitude, longitude - user current position
        """
        params = parameters.PlaceSearchParametersFactory.create(
            kwargs, self.city_service)
        place = queries.get_place(
            kwargs.get('x'), kwargs.get('y'), **params.get_db_params())
        return self._make_place_distance_item(place, params)


class MessageService(FeedService):
    default_limit = settings.DEFAULT_PAGINATE_BY
    media_url = settings.MEDIA_ROOT + '/'

    def __init__(self, city_service):
        self.city_service = city_service

    def get_place_messages(
            self, place, current_max_id=None,
            default_limit=None, **kwargs):
        if current_max_id is None:
            current_max_id = self._get_max_id()
        if default_limit is None:
            default_limit = self.default_limit
        params = parameters.PlaceMessagesParametersFactory.create(
            kwargs, current_max_id, default_limit)
        messages, count = queries.place_messages(
            place, **params.get_db_params())
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
            kwargs, self.city_service, current_max_id, default_limit)
        messages, count = queries.search_messages(**params.get_db_params())
        items = map(
            lambda message: self.__get_search_item(message, params),
            messages)
        return self._make_result(items, count, params)


class NewsFeedService(FeedService):
    news_items_default_limit = 17
    news_item_default_size = 3
    place_news_default_limit = 9
    gallery_preview_default_size = 9

    def __init__(self, message_service):
        self.message_service = message_service

    def __make_feed_item(self, place, params):
        messages = self.message_service.get_place_messages(
            place, **params.get_api_params())
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
            kwargs, self.message_service.city_service,
            current_max_id, self.news_items_default_limit)
        places, count = queries.places_news_feed(**params.get_db_params())
        kwargs.pop(params_names.LIMIT)
        kwargs.pop(params_names.OFFSET)
        item_params = parameters.PlaceNewsParametersFactory.create(
            kwargs, current_max_id, self.news_item_default_size)
        feed = self._make_result(
            [self.__make_feed_item(place, item_params)
             for place in places], count, params)
        return feed

    def get_place_news(self, place, **kwargs):
        current_max_id = self._get_max_id()
        params = parameters.PlaceNewsParametersFactory.create(
            kwargs, current_max_id, self.place_news_default_limit)
        item = self.__make_feed_item_with_gallery_preview(place, params)
        return item
