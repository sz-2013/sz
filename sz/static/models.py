# -*- coding: utf-8 -*-
import os
from django.contrib.gis.db import models
from django.utils.translation import ugettext_lazy as _
from imagekit import models as imagekit_models
from imagekit import processors
from sz.core.utils import get_img_absolute_urls, get_system_path_media
from sz.core.image_utils import FitImage

STANDART_ROLE_PLACE_NAME = "shop"
EMPTY_ROLE_PLACE_NAME = "empty"


ROLE_PLACE_CHOICES = (
    ("shop", "SHOP"),
    ("empty", "EMPTY PLACE"),
)

ROLE_USER_CHOICES = (
    ("player", "Player"),
)
STANDART_ROLE_USER_NAME = "player"


EMOTION_CHOICES = (
    ("smile", "Smile"),
    ("lol", "LOL"),
    ("bad", "Bad"),
    ("indifferent", "Indifferent")
)


class Face(models.Model):
    emotion = models.CharField(
        max_length=16, verbose_name=_('emotion'), choices=EMOTION_CHOICES)
    race = models.ForeignKey(
        'Races', verbose_name=_('race'), blank=True, null=True)

    def get_img_absolute_urls(self, host_url="", img=None):
        return get_img_absolute_urls(host_url, self.face)

    def get_face_path(self, filename):
        race_name = self.race and self.race.name or 'all'
        ext = filename.split('.')[-1]
        filename = "%s-%s.%s" % (self.emotion, race_name, ext)
        directory = 'faces'
        return os.path.join(directory, filename)

    face = imagekit_models.ProcessedImageField(
        upload_to=get_face_path, null=False, blank=True,
        # processors=[processors.ResizeToFit(150, 150), ],
        options={'quality': 85}
    )

    def get_fit_face(self, w, h=None):
        source_file = open(get_system_path_media(self.face.url))
        if not h:
            h = w
        return FitImage(source=source_file, width=w, height=h).generate()

    def __unicode__(self):
        return u"%s_%s" % (
            self.emotion, self.race.name if self.race else 'all')

    class Meta:
        verbose_name = _('face')
        verbose_name_plural = _('face')


class Races(models.Model):
    """user race: {'futuri':1,'amadeus':2, 'united':3} """
    description = models.CharField(max_length=256, null=True, blank=True)

    def get_img_absolute_urls(self, host_url="", img=None):
        return get_img_absolute_urls(host_url, self.blazon)

    def get_blazon_path(self, filename):
        ext = filename.split('.')[-1]
        filename = "%s.%s" % (self.name, ext)
        directory = 'blazons'
        return os.path.join(directory, filename)

    blazon = imagekit_models.ProcessedImageField(
        upload_to=get_blazon_path, null=False, blank=True, default=None,
        processors=[processors.ResizeToFit(150, 150), ],
        options={'quality': 85}
    )
    name = models.CharField(max_length=32)

    def __unicode__(self):
        return self.name


class Gender(models.Model):
    """user gender: {'u':1,'m':2,'f':3}"""
    name = models.CharField(max_length=1)

    def __unicode__(self):
        return self.name


class RoleUser(models.Model):
    """user role: player, bot, other"""
    name = models.CharField(
        max_length=32, choices=ROLE_USER_CHOICES, unique=True)

    def __unicode__(self):
        return self.name


class RolePlace(models.Model):
    """place role: shop, bot castle, other"""
    name = models.CharField(
        max_length=32, choices=ROLE_PLACE_CHOICES, unique=True)

    def __unicode__(self):
        return self.name
