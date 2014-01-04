import random
import math
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
        races.append(False)
        races.append(True)
        num = random.randint(0, len(races)-1)
        return  races[num]
    def _serialize_item(self, item):
        data = serializers.PlaceSerializer(instance=item[u'place']).data
        data['distance'] = item['distance']
        data['owner'] = self._get_random_race()
        return data
    def _create_matrix(self, places, num, matrix=None):
        if matrix is None: matrix = []
        if places:
            if len(places) < num:
                num = len(places)        
            row = places[:num]
            del places[:num]
            matrix.append(row)
            print len(places)
            return self._create_matrix(places, num, matrix)
        else:
            return matrix
    def get(self, request, format=None):
        params = self.validate_and_get_params(
            forms.GameMapRequestForm, request.QUERY_PARAMS)
        #gets all places in player city
        places_list = place_service.get_gamemap(**params)
        places_data = map(self._serialize_item, places_list)        
        num_in_row = int(math.sqrt(len(places_data)))
        matrix = self._create_matrix(places_data, num_in_row)
        return sz_api_response.Response({'map': matrix})