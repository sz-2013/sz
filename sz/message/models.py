# -*- coding: utf-8 -*-
import time
from django.contrib.gis.db import models
from django.utils.translation import ugettext_lazy as _
from imagekit import models as imagekit_models
from imagekit import processors
from sz.core.models import User
from sz.core.image_utils import unface_photo
from sz.core.utils import get_string_date, get_img_dict_absolute_url, \
    get_photo_path
from sz.static.models import Face


class MessageManager(models.Manager):
    def createMessage(self, **attrs):
        photo = None
        if 'photo_id' in attrs:
            photo_id = attrs.pop('photo_id')
            if photo_id:
                preview = MessagePreview.objects.get(id=photo_id)
                photo = preview.photo
                preview.delete()
        message = self.model(**attrs)
        message.photo = photo
        message.save()
        return message

    def _create_or_update_preview(self, unfaced_photo, **kwargs):
        if not kwargs.get('pk'):
            preview = self.model(
                photo=unfaced_photo,
                user=User.objects.get(email=kwargs.get('user')))
        else:
            preview = self.model.objects.get(pk=kwargs.get('pk'))
            preview.photo = unfaced_photo
        preview.save()
        preview.faces.clear()
        faces_id_list = [f_data.get('face_id') for f_data in
                         kwargs.get('faces_list', [])]
        for face_id in faces_id_list:
            face = Face.objects.get(id=face_id)
            preview.faces.add(face)
        preview.save()
        return preview

    def unface_photo(self, **kwargs):
        unfaced_photo = unface_photo(Face.objects, **kwargs)
        return self._create_or_update_preview(unfaced_photo, **kwargs)


class MessagePreview(models.Model):
    objects = MessageManager()

    faces = models.ManyToManyField('static.Face', blank=True, null=True)
    user = models.ForeignKey('core.User', related_name='mpreviews')

    def get_photo_absolute_urls(self, photo_host_url=""):
        if self.photo:
            img_dict = dict(full=self.photo, reduced=self.reduced_photo,
                            thumbnail=self.thumbnail)
            return get_img_dict_absolute_url(img_dict, photo_host_url)
        else:
            return None

    def get_photo_path(self, filename):
        directory = time.strftime("CACHE/images/photos/%Y/%m/%d")
        return get_photo_path(filename, directory)

    photo = imagekit_models.ProcessedImageField(
        upload_to=get_photo_path,
        processors=[processors.ResizeToFit(1350, 1200), ],
        options={"quality": 85}
    )
    reduced_photo = imagekit_models.ImageSpecField(
        [processors.ResizeToFit(435), ],
        source="photo", options={"quality": 85})
    thumbnail = imagekit_models.ImageSpecField(
        [processors.ResizeToFill(90, 90), ],
        source="photo", options={"quality": 85})

    def get_faces_id(self):
        return [face.id for face in self.faces.all()]


class Message(models.Model):
    class Meta:
        verbose_name = _('message')
        verbose_name_plural = _('messages')
    objects = MessageManager()

    user = models.ForeignKey(
        User, verbose_name=_('user'))
    place = models.ForeignKey(
        'place.Place', verbose_name=u"место")
    date = models.DateTimeField(
        auto_now_add=True, null=True, blank=True,
        editable=False, verbose_name=u"дата добавления")
    text = models.TextField(
        max_length=1024, null=False,
        blank=True, verbose_name=u"сообщение")

    face = models.ForeignKey('static.Face', null=True, blank=True)

    def get_photo_path(self, filename):
        directory = time.strftime("photos/%Y/%m/%d")
        return get_photo_path(filename, directory)

    def get_photo_absolute_urls(self, photo_host_url=""):
        if self.photo:
            img_dict = dict(full=self.photo, reduced=self.reduced_photo,
                            thumbnail=self.thumbnail)
            return get_img_dict_absolute_url(img_dict, photo_host_url)
        return None

    photo = imagekit_models.ProcessedImageField(
        upload_to=get_photo_path,
        verbose_name=u"фотография", null=False, blank=True,
        processors=[processors.ResizeToFit(1350, 1200), ],
        options={"quality": 85}
    )

    reduced_photo = imagekit_models.ImageSpecField(
        [processors.ResizeToFit(435), ],
        source="photo", options={"quality": 85})

    thumbnail = imagekit_models.ImageSpecField(
        [processors.ResizeToFill(90, 90), ],
        source="photo", options={"quality": 85})

    def __unicode__(self):
        return u"%s" % self.text

    def is_photo(self):
        return True if self.photo else False

    def get_string_date(self):
        return get_string_date(self.date)
