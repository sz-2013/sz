from rest_framework import permissions, status

from lebowski.api import serializers
from lebowski.api.response import Response as root_api_response
from lebowski.api.response import  users_coordinate_response
from lebowski.api.views import ProjectApiView
from lebowski.api import posts

class PlacesCreate(ProjectApiView):
	"""
	Create place in engibe
	Example of request:
	[
	  {
        "place": {
            "longitude": 127.526587228, 
            "latitude": 50.2642421188, 
            "foursquare_details_url": "https://foursquare.com/v/4c636f6f79d1e21e62cbd815", 
            "id": None, 
            "name": u'\u0410\u0437\u0438\u0430\u0442\u0441\u043a\u043e-\u0422\u0438\u0445\u043e\u043e\u043a\u0435\u0430\u043d\u0441\u043a\u0438\u0439 \u0411\u0430\u043d\u043a', 
            "address": u'\u0443\u043b. \u0410\u043c\u0443\u0440\u0441\u043a\u0430\u044f, 225', 
            "crossStreet": None, 
            "contact": {}, 
            "fsq_id": u'4f62a7afe4b02cbb7d650e72', 
            "foursquare_icon_prefix": "https://foursquare.com/img/categories_v2/shops/mall_", 
            "foursquare_icon_suffix": ".png", 
            "city_id": 1
        }, 
        "creator": 
        	{
        		'email':u'admin@admin.com',
        		'latitude':50.0,
        		'longitude':127.0
        	}
	    }, 
	]
	"""
	permission_classes = (permissions.IsAuthenticated,)
	def create(self, data):		
		serializers_list = [(
			serializers.PlaceSerializer(data=d['place']),
			users_coordinate_response(
					serializers.UserSerializer(data=d['creator']),
					d['creator']
				)			
			) for d in data]
		serializers_not_valid_list = map(
			lambda (p,c):p.errors and p.errors or c.errors and c.errors,
			filter(
				lambda (p,c):p.errors or c.errors,
				serializers_list))
		if not serializers_not_valid_list:			
			places_and_creators_list = [(
				serializers.PlaceBigLSerializer(
					instance=p.object['place']).data,
				dict(
					serializers.UserBigLSerializer(
						instance=c.object['user']).data,
					**{
						'user_latitude':c.object['user_latitude'],
						'user_longitude':c.object['user_longitude']}
					)
				) for (p,c) in serializers_list]
			# places_data_list = map(places_create_response, places_and_creators_list)
			places_data_list = [dict(place_data,**creator_data) for (place_data,creator_data) in places_and_creators_list]
			engine_data = posts.places_create(places_data_list)
			return engine_data
		return {'data':serializers_not_valid_list,'status':status.HTTP_400_BAD_REQUEST}
	def post(self, request):
		data = create(request.DATA)
		return root_api_response(data['data'],status=data['status'])