# -*- coding: utf-8 -*-
from django.http import Http404
from rest_framework import permissions, status
from rest_framework.reverse import reverse
from sz.api.views import SzApiView
from sz.api import forms, posts, serializers
from sz.api import response as sz_api_response
from sz.message import models
from django.core.files.uploadedfile import InMemoryUploadedFile


# class MessagePhotoPreview(SzApiView):
#     if not LEBOWSKI_MODE_TEST:
#         permission_classes = (permissions.IsAuthenticated,)

#     def get_object(self, pk):
#         try:
#             return models.MessagePreview.objects.get(pk=pk)
#         except models.MessagePreview.DoesNotExist:
#             raise Http404

#     def post(self, request, pk=None, format=None):
#         """Here we create <MessagePhotoPreview> with photo and user only

#         Args:
#             reguest:
#                 user - a message creator.
#                 FILES - an Image instance.
#                 DATA:
#                     photo_height - h photo in client.
#                     photo_width - w photo in client.
#                     faces_list - SRING of list with faces positions
#                                         [{x, y, height, width}, ...].

#             pk (not req.) - pk of a <MessagePhotoPreview>,
#                 which needed to update

#         Returns:
#             {
#                 'photo': {'full': URL, 'reduced': URL, 'thumbnail': URL},
#                 'id': ID,
#                 'faces_id': [ID, ..]
#             }
#         """
#         if pk:
#             if request.user.email != self.get_object(pk).user.email:
#                 return sz_api_response.Response(
#                     status=status.HTTP_403_FORBIDDEN)
#         params = self.validate_and_get_params(
#             forms.MessagePhotoPreviewRequestForm, request.DATA, request.FILES)
#         if not LEBOWSKI_MODE_TEST:
#             user = request.user.email
#         else:
#             user = models.User.objects.get(email=request.DATA.get('email'))
#         root_url = reverse('client-index', request=request)
#         params.update(pk=pk, user=user)
#         preview = models.MessagePreview.objects.unface_photo(**params)
#         data = dict(
#             photo=preview.get_photo_absolute_urls(root_url),
#             id=preview.id, faces_id=preview.get_faces_id())
#         s = status.HTTP_200_OK if pk else status.HTTP_201_CREATED
#         return sz_api_response.Response(data=data, status=s)
from sz.message.models import Message


class MessageAdd(SzApiView):
    permission_classes = (permissions.IsAuthenticated,)

    def _create_in_bl(self, message, user, params):
        return

        bl_data = serializers.UserStandartDataShortSerializer(
            instance=user).data
        bl_data['user_longitude'] = params.get('latitude')
        bl_data['user_latitude'] = params.get('longitude')
        bl_data.update(serializers.PlaceStandartDataShortSerializer(
            instance=message.place).data)
        bl_data['message_faces'] = params.get('faces_list', [])
        bl_data['message_photo'] = True if message.photo else False
        bl_data['message_text'] = message.text

        engine_data = posts.messages_create(bl_data)
        if engine_data.get('status') == status.HTTP_201_CREATED:
            user_s = serializers.UserStandartDataSerializer(
                data=engine_data['data'].get('user', {}),
                instance=user)
            if not user_s.is_valid():
                return sz_api_response.Response(
                    data=user_s.errors,
                    status=status.HTTP_400_BAD_REQUEST)

            place_s = serializers.PlaceStandartDataSerializer(
                data=engine_data['data'].get('place', {}),
                instance=message.place)
            if not place_s.is_valid():
                return sz_api_response.Response(
                    data=place_s.errors,
                    status=status.HTTP_400_BAD_REQUEST)

        return sz_api_response.Response(**engine_data)

    def post(self, request, format=None):
        """Here we create <Message> with photo

        Args:
            reguest:
                user - a message creator.
                DATA:
                    latitude - latitude of point from which user send a msg
                    longitude - latitude of point from which user send a msg
                    place - id of a terget place.
                    photo - file.
                    faces(not req.) - array of usage faces list
                    tags(not req) - array of clothes on photo

        Returns:
            {}
        """
        user = request.user
        params = self.validate_and_get_params(
            forms.MessageAddRequestForm, request.DATA, request.FILES)
        params['user_id'] = user.id
        message = Message.objects.createMessage(**params)
        self._create_in_bl(message, user, params)
        return sz_api_response.Response(
            status=status.HTTP_201_CREATED, data={})
