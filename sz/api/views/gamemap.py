import random
from sz.api import serializers, forms
from sz.api import response as sz_api_response
from sz.api.views import SzApiView, place_service
from sz.core import models

class GameMapRoot(SzApiView):
    """
    Turn realworld into gamemap.
    [position (50.2616113, 127.5266082) ](?latitude=50.2616113&longitude=127.5266082).
    """
    def _get_random_race(self):
        races = [ r.name for r in models.Races.objects.all() ]
        races.append('nobody')
        num = random.randint(0, len(races)-1)
        return  races[num]
    def _serialize_item(self, item):
        p = item[u'place']
        if p:
            data = serializers.PlaceSerializer(instance=p).data
            data['distance'] = int(round(item['distance']))
            data['owner'] = self._get_random_race()
            data['is_owner'] = True if random.randint(0,10)==1 else False
        else:
            data = dict(distance=None)
        data['position'] = item['position']
        return data
    def get(self, request, format=None):
        params = self.validate_and_get_params(
            forms.GameMapRequestForm, request.QUERY_PARAMS)
        places_list, map_width, map_height = place_service.get_gamemap(**params)
        places_data = map(self._serialize_item, places_list)
        real_boxes = filter(lambda p:p.get('id'), places_data)
        user_box = sorted(real_boxes, key=lambda item: item['distance'])[0]
        return sz_api_response.Response({
            "map":places_data, "map_width": map_width, "map_height": map_height,
            "current_box": user_box, "old_box": {}
        })