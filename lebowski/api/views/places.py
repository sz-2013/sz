from rest_framework import permissions, status

from lebowski.api import serializers
from lebowski.api.response import Response as root_api_response
from lebowski.api.views import ProjectApiView
from lebowski.api import posts

class PlacesCreate(ProjectApiView):
    """
    Create place in engibe
    Example of request:
    
    `places`: [<Place>, ...]

    `creator`:

    `
    {
        "latitude"  : 12.34567890123456,
        "email"     : "cool_dude@sz.com", 
        "longitude" : 12.34567890123456,
    }
    `
  
    """
    permission_classes = (permissions.IsAuthenticated,)
    def create(self, places_list, creator):
        data = {'status': status.HTTP_400_BAD_REQUEST, 'data': False}
        user_latitude = creator.get('latitude')
        user_longitude = creator.get('longitude')
        if not user_latitude or not user_longitude:
            data['data'] = [('user_position', 'user position is required')]
            return data        
        serializer_user = serializers.UserSerializer(data=creator)        
        if serializer_user.is_valid():
            user = serializer_user.object
            bl_data = serializers.UserBigLShortSerializer(
                instance=user).data
            bl_data['user_longitude'] = user_longitude
            bl_data['user_latitude'] = user_latitude
            bl_data['places'] = map(
                lambda p: serializers.PlaceBigLSerializer(instance=p).data, 
                places_list)
            print bl_data            
            # p.create_in_engine()
            # data = posts.places_create(bl_data)
            # 
        else:
            data['data'] = serializer_user.errors
        return data
    def post(self, request):
        data = create(request.DATA)
        return root_api_response(data['data'],status=data['status'])