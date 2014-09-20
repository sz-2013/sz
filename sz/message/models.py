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
from sz.static.models import Face, Tag
from django.core.files.uploadedfile import InMemoryUploadedFile


class MessageManager(models.Manager):
    def createMessage(self, **attrs):
        data = dict(
            user_id=attrs.get('user_id'),
            place_id=attrs.get('place_id'),
            photo=attrs.get('photo'),
        )
        photo = data.get('photo')
        if isinstance(photo, InMemoryUploadedFile):
            data['photo'].name = "%s.%s" % (
                photo.name, photo.content_type.split('/')[1])
        message = self.create(**data)

        tags = attrs.get('tags')
        if tags:
            for tag in tags:
                tag['tag'] = Tag.objects.get_or_create(name=tag['name'])[0]
                del tag['name']
                MessageTag.objects.create(
                    message=message, **tag
                )
        faces = attrs.get('faces')
        if faces:
            message.faces_set.add(faces)
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


class Message(models.Model):
    class Meta:
        verbose_name = _('message')
        verbose_name_plural = _('messages')
    objects = MessageManager()

    def get_photo_path(self, filename):
        directory = time.strftime("photos/%Y/%m/%d")
        return get_photo_path(filename, directory)

    user = models.ForeignKey(User, verbose_name=_('user'))
    place = models.ForeignKey('place.Place', verbose_name=u"место")
    faces = models.ManyToManyField('static.Face', blank=True)
    tags = models.ManyToManyField('static.Tag', blank=True)
    photo = imagekit_models.ProcessedImageField(
        upload_to=get_photo_path,
        verbose_name=u"фотография",
        processors=[processors.ResizeToFit(1350, 1200), ],
        options={"quality": 85}
    )

    date = models.DateTimeField(
        auto_now_add=True, null=True, blank=True,
        editable=False, verbose_name=u"дата добавления")

    def get_photo_absolute_urls(self, photo_host_url=""):
        if self.photo:
            img_dict = dict(full=self.photo, reduced=self.reduced_photo,
                            thumbnail=self.thumbnail)
            return get_img_dict_absolute_url(img_dict, photo_host_url)
        return None

    reduced_photo = imagekit_models.ImageSpecField(
        [processors.ResizeToFit(435), ],
        source="photo", options={"quality": 85})

    thumbnail = imagekit_models.ImageSpecField(
        [processors.ResizeToFill(90, 90), ],
        source="photo", options={"quality": 85})

    def __unicode__(self):
        return u"%s: %s (%s)" % (self.pk, self.photo.name, self.place.name)

    def get_string_date(self):
        return get_string_date(self.date)


class MessageTag(models.Model):
    message = models.ForeignKey(Message)
    tag = models.ForeignKey(Tag)
    x = models.FloatField()
    y = models.FloatField()
    w = models.FloatField()
    h = models.FloatField()
    rx = models.FloatField()
    by = models.FloatField()
