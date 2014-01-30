# -*- coding: utf-8 -*-
from django.http import Http404
from rest_framework import permissions, status
from rest_framework.reverse import reverse
from sz.api.views import SzApiView
from sz.api import serializers, forms
from sz.api import response as sz_api_response
from sz.core import models
from lebowski.api.views import messages as lebowski_messages
from sz.settings import LEBOWSKI_MODE_TEST


class MessagePhotoPreview(SzApiView):
    if not LEBOWSKI_MODE_TEST:
        permission_classes = (permissions.IsAuthenticated,)

    def get_object(self, pk):
        try:
            print pk
            return models.MessagePreview.objects.get(pk=pk)
        except models.MessagePreview.DoesNotExist:
            raise Http404

    def unface(self, **kwargs):
        """Create or update a <MessagePhotoPreview> instance in db

        Args:
            **kwargs:
                root_url - sz url.
                user - a message creator identifier(email).
                photo - img file.
                also here a **reguest.DATA and pk(not req.)

        Returns:
            {
                'photo': {'full': URL, 'reduced': URL, 'thumbnail': URL},
                'id': ID,
                'face_id': ID
            }
        """
        preview = models.MessagePreview.objects.unface_photo(**kwargs)
        data = dict(
            photo=preview.get_photo_absolute_urls(kwargs.get('root_url')),
            id=preview.id, face_id=preview.face.id)
        s = status.HTTP_200_OK if kwargs.get('pk') else status.HTTP_201_CREATED
        return dict(data=data, status=s)

    def post(self, request, pk=None, format=None):
        """Here we create <MessagePhotoPreview> with photo and user only

        Args:
            reguest:
                user - a message creator.
                FILES - an Image instance.
                DATA:
                    photo_height - h photo in client.
                    photo_width - w photo in client.
                    face_id - a <face> id.
                    faces_list - list with faces positions
                                        [{x, y, height, width}, ...].

            pk (not req.) - pk of a <MessagePhotoPreview>,
                which needed to update

        Returns:
            self.unface()
        """
        if pk:
            if request.user.email != self.get_object(pk).user.email:
                return sz_api_response.Response(
                    status=status.HTTP_403_FORBIDDEN)
        params = self.validate_and_get_params(
            forms.MessagePhotoPreview, request.DATA, request.FILES)
        if not LEBOWSKI_MODE_TEST:
            user = request.user.email
        else:
            user = models.User.objects.get(email=request.DATA.get('email'))

        params.update(user=user, pk=pk,
                      root_url=reverse('client-index', request=request))
        response = self.unface(**params)
        return sz_api_response.Response(**response)


# class MessagePreviewInstance(SzApiView):
#     """ Retrieve or delete a message preview. """

#     def get_object(self, pk):
#         try:
#             return models.MessagePreview.objects.get(pk=pk)
#         except models.MessagePreview.DoesNotExist:
#             raise Http404

#     def get(self, request, pk, format=None):
#         message_preview = self.get_object(pk)
#         if not LEBOWSKI_MODE_TEST:
#             user = request.user
#         else:
#             user = models.User.objects.get(email=request.DATA.get('email'))
#         if message_preview.user != user:
#             return sz_api_response.Response(
#                 status=status.HTTP_403_FORBIDDEN)
#         serializer = serializers.MessagePreviewSerializer(
#             instance=message_preview)
#         place_serializer = serializers.PlaceSerializer(
#             instance=message_preview.place)
#         data = serializer.data
#         root_url = reverse('client-index', request=request)
#         data['photo'] = message_preview.get_photo_absolute_urls_and_size(
#             root_url)
#         data['place'] = place_serializer.data
#         return sz_api_response.Response(data)

#     def delete(self, request, pk, format=None):
#         return sz_api_response.Response()
#         # message_preview = self.get_object(pk)
#         # if message_preview.user != request.user:
#         #   return sz_api_response.Response(status=status.HTTP_403_FORBIDDEN)
#         # message_preview.delete()
#         # return sz_api_response.Response(status=status.HTTP_204_NO_CONTENT)

#     def put(self, request, pk, format=None):
#         message_preview = self.get_object(pk)
#         if not LEBOWSKI_MODE_TEST:
#             user = request.user
#         else:
#             user = models.User.objects.get(email=request.DATA.get('email'))
#         if message_preview.user != user:
#             return sz_api_response.Response(status=status.HTTP_403_FORBIDDEN)
#         serializer = serializers.MessagePreviewSerializer(
#             message_preview, data=request.DATA, files=request.FILES)
#         if serializer.is_valid():
#             serializer.save()
#             return sz_api_response.Response(serializer.data)
#         else:
#             return sz_api_response.Response(
#                 serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MessageAdd(SzApiView):
    if not LEBOWSKI_MODE_TEST:
        permission_classes = (permissions.IsAuthenticated,)

    def create(self, **kwargs):
        """Create a <MessagePhotoPreview> instance in db.

        Args:
            user - a message creator identifier(email)
            alse here a **request.DATA

        Returns:
            {
                'id': ID, 'text': TEXT, 'face': FACE, 'place': PLACE,
                'photo': {'full': URL, 'reduced': URL, 'thumbnail': URL},
            }
        """
        serializer = serializers.MessageAddSerializer(data=kwargs)
        if serializer.is_valid():
            data = serializers.MessageSerializer(
                instance=serializer.object).data
            return dict(data=data, status=status.HTTP_201_CREATED)
        return dict(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, format=None):
        """Here we create <Message> with photo ot text or both

        Must contains at least or photo_id or text.

        Args:
            reguest:
                user - a message creator.
                DATA:
                    latitude - latitude of point from which user send a msg
                    longitude - latitude of point from which user send a msg
                    place - id of a terget place.
                    photo_id(not req.)  - id of a <MessagePhotoPreview>.
                    text(not req.)  - text.

        Returns:
            self.create()
        """
        params = dict(user=request.user.id, **request.DATA)
        response = self.create(**params)
        return sz_api_response.Response(**response)
