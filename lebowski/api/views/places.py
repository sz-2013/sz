from rest_framework import permissions, status

from lebowski.api import serializers
from lebowski.api.response import Response as root_api_response
from lebowski.api.views import ProjectApiView
from lebowski.api import posts

class PlacesCreate(ProjectApiView):
    """
    Create place in engibe
    Example of request:
    `place_params`:

        ```json
        {
            "city_id"                 : 0000,
            "address"                 : "Some str, 42", 
            "name"                    : "SZ Point",
            "foursquare_icon_suffix"  : ".png"
            "foursquare_icon_prefix"  : "", 
            "longitude"               : 12.34567890123456,
            "contact"                 : None, 
            "fsq_id"                  : "", 
            "crossStreet"             : None, 
            "latitude"                : 12.34567890123456,
            "position"                : <Point object at 0xaf4ae440L>, 

        }
        ```

        `creator`:

        ```json
        {
            "latitude"  : 12.34567890123456,
            "email"     : "cool_dude@sz.com", 
            "longitude" : 12.34567890123456,
        }
        ```
  
    """
    permission_classes = (permissions.IsAuthenticated,)
    def create(self, place, creator):
        data = {'status': status.HTTP_400_BAD_REQUEST, 'data': False}
        user_latitude = creator.get('latitude')
        user_longitude = creator.get('longitude')
        if not user_latitude or not user_longitude:
            data['data'] = [('user_position', 'user position is required')]
            return data
        serializer_place = serializers.PlaceSerializer(data=place)
        serializer_user = serializers.UserSerializer(data=creator)
        if serializer_place.is_valid() and serializer_user.is_valid():
            place = serializer_place.object
            user = serializer_user.object
            bl_place_data = serializers.PlaceBigLSerializer(
                instance=place).data
            bl_user_data = serializers.UserBigLSerializer(
                instance=user).data
            bl_data = dict(bl_place_data, **bl_user_data)
            bl_data.update(user_longitude=user_longitude, user_latitude=user_latitude)
            # bl_data.update(user_longitude=user_longitude, user_latitude=user_latitude, **bl_user_data)
            print bl_data            
            # data = posts.places_create(bl_data)
            # 
        else:
            errors = serializer_place.errors if serializer_place.errors else {}
            if serializer_user.errors:
                errors.update(**serializer_user.errors)
            data['data'] = errors
        return data
    def post(self, request):
        data = create(request.DATA)
        return root_api_response(data['data'],status=data['status'])