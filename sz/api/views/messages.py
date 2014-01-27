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
                photo_height - h photo in client.
                photo_width - w photo in client.
                face_id - a <face> id.
                faces_list - list with faces positions
                                    [{x, y, height, width}, ...].

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

    def request_into_params(self, request, pk=None):
        params = self.validate_and_get_params(
            forms.MessagePhotoPreview, request.DATA, request.FILES)
        if not LEBOWSKI_MODE_TEST:
            user = request.user.email
        else:
            user = models.User.objects.get(email=request.DATA.get('email'))

        params.update(user=user, pk=pk,
                      root_url=reverse('client-index', request=request))
        return params

    def put(self, request, pk, format=None):
        """Here we update photo at <MessagePhotoPreview>"""
        params = self.request_into_params(request, pk)
        if params['user'] != self.get_object(pk).user.email:
            return sz_api_response.Response(status=status.HTTP_403_FORBIDDEN)
        return sz_api_response.Response(**self.unface(**params))

    def post(self, request, pk=None, format=None):
        """Here we create <MessagePhotoPreview> with photo and user only"""
        if pk and pk != '0':
            return sz_api_response.Response(status=status.HTTP_400_BAD_REQUEST)
        params = self.request_into_params(request)
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
    """ Publishes a message preview. """

    def create(**kwargs):
        """Create a <MessagePhotoPreview> instance in db.

        Args:
            user - a message creator identifier(email)

            text - message text
            OR
            photo_id - a <MessagePhotoPreview> id

        Returns:
            ''
        """
        return

    # def get_object(self, pk):
    #     try:
    #         return models.MessagePreview.objects.get(pk=pk)
    #     except models.MessagePreview.DoesNotExist:
    #         raise Http404

    # def get_face(self, pk):
    #     try:
    #         return models.Face.objects.get(pk=pk)
    #     except models.Face.DoesNotExist:
    #         raise Http404

    def post(self, request, pk, format=None):
        """
        Here we create <Message> with user and text/<MessagePreview>
        """
        # message_preview = self.get_object(pk)
        # if not LEBOWSKI_MODE_TEST:
        #     user = request.user
        # else:
        #     user = models.User.objects.get(email=request.DATA.get('email'))
        # if message_preview.user != user:
        #     return sz_api_response.Response(status=status.HTTP_403_FORBIDDEN)
        # serializer = serializers.MessagePreviewForPublicationSerializer(
        #     message_preview, data=request.DATA)
        # if serializer.is_valid():
        #     face = self.get_face(request.DATA[u'face'])
        #     photo = message_preview.photo
        #     if photo:
        #         #??!! переделать это дерьмо
        #         faces_list = request.DATA[u'photo']
        #         # if not faces_list or \
        #         #     not faces_list.get('list') or \
        #         #     not faces_list.get('box') or
        #         #     not faces_list['box'].get('face'):
        #         #     return sz_api_response.Response(
        #         #         {'faces and box is requered fields'},
        #         #         status=status.HTTP_400_BAD_REQUEST)
        #         photo = message_service.unface_photo(
        #             faces_list.get('list'), faces_list.get('box'),
        #             message_preview)
        #         if not photo:
        #             return sz_api_response.Response(
        #                 {'faces was not added to photo'},
        #                 status=status.HTTP_400_BAD_REQUEST)
        #     serializer.save()
        #     message = models.Message(text=message_preview.text, photo=photo,
        #                              place=message_preview.place,
        #                              face=face, user=message_preview.user)
        #     message.save()
        #     for category in message_preview.categories.all():
        #         message.categories.add(category)
        #     message_preview.delete()
        #     categorization_service.assert_stems(message)
        #     #next string need to change on lebowski answer
        #     message_serializer = serializers.MessageSerializer(
        #         instance=message)
        #     place_serializer = serializers.PlaceSerializer(
        #         instance=message.place)
        #     user_serializer = serializers.UserSerializer(
        #         instance=message.user)
        #     user_data = dict(
        #         user_serializer.data,
        #         **{
        #             "latitude": request.DATA.get('latitude', 0),
        #             "longitude": request.DATA.get('longitude', 0)
        #             }
        #         )
        #     # data = message_serializer.data
        #     engine_data = lebowski_messages.MessagesCreate().create({
        #         'message': message_serializer.data,
        #         'place': place_serializer.data,
        #         'creator': user_data
        #     })
        #     root_url = reverse('client-index', request=request)
        #     data = dict(
        #         photo=message.get_photo_absolute_urls(root_url),
        #         place=place_serializer.data)
        #     if LEBOWSKI_MODE_TEST:
        #         data['bl'] = engine_data
        #     else:
        #         data.update(**engine_data)
        #     print data
        #     return sz_api_response.Response(data)
        # else:
        #     return sz_api_response.Response(
        #         serializer.errors, status=status.HTTP_400_BAD_REQUEST)
