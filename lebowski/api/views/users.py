from rest_framework import permissions, status

from lebowski.api import serializers
from lebowski.api.response import Response as root_api_response
from lebowski.api.views import ProjectApiView

# from lebowski.api.posts import users_create as engine_create_user
from lebowski.api import posts


class UsersCreate(ProjectApiView):
    permission_classes = (permissions.IsAuthenticated,)

    def create(self, data):
        serializer = serializers.UserSerializer(data=data)
        if serializer.is_valid():
            user = serializer.object
            user_data = serializers.UserBigLSerializer(instance=user).data
            engine_data = posts.users_create(user_data)
            if engine_data['status'] == 201:
                user.create_in_engine()
            return engine_data
        return {"data": serializer.errors,
                "status": status.HTTP_400_BAD_REQUEST}

    def post(self, request):
        return root_api_response(self.create(request.DATA))
