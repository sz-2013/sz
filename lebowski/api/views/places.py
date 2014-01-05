from rest_framework import permissions, status

from lebowski.api import serializers
from lebowski.api.response import Response as root_api_response
from lebowski.api.views import ProjectApiView
from lebowski.api import posts
from sz.settings import LEBOWSKI_MODE_TEST

class PlacesCreate(ProjectApiView):
    """
    Create place in engine
    [look here](https://github.com/sz-2013/sz/wiki/PLACE:-CREATE#%D0%9E%D1%82%D0%B2%D0%B5%D1%82-%D0%BE%D1%82-%D0%A1%D1%82%D0%BE%D1%80%D0%BE%D0%BD%D0%BD%D0%B5%D0%B9-%D0%91%D0%94-%D0%BA-sz)
    """
    permission_classes = (permissions.IsAuthenticated,)
    def create(self, places_list, creator):
        data = {'status': status.HTTP_400_BAD_REQUEST, 'data': {}}
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
            engine_data = posts.places_create(bl_data)

            data['data'] = dict(user=creator, places_explored=len(places_list))
            data['status'] = 201
            # data['data'] = dict(user=engine_data["data"].get("user", {}))
            # data['status'] = engine_data.get("status")
            # if engine_data['status'] == 201:
            #     for p_data in engine_data['data'].get('places', []):
            #         s = serializers.PlaceBigLSerializer(data=p_data)
            #         if s.is_valid():
            #             p = s.object
            #             p.create_in_engine()
            #             val+=1
            # data['places_explored'] = val
            # if LEBOWSKI_MODE_TEST:
            #     data['bl'] = engine_data
            #     data['status'] = 201
        else:
            data['data'] = serializer_user.errors
        return data
    def post(self, request):
        data = create(request.DATA)
        return root_api_response(data['data'],status=data['status'])