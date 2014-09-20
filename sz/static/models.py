# -*- coding: utf-8 -*-
import os
from django.contrib.gis.db import models
from django.utils.translation import ugettext_lazy as _
from imagekit import models as imagekit_models
from imagekit import processors
from sz.core.utils import get_img_absolute_urls, get_system_path_media, \
    get_photo_path, get_img_dict_absolute_url
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

BUILDING_TYPE = [
    ("ms", "MatherShip"),
    ("lh", "LightHouse"),
    ("tp", "Teleport"),
    ("hp", "Hospital"),
    ("sl", "Slowler"),
    ("gl", "Golodusha"),
    ("bs", "Bathyscaphe"),
    ("mt", "Market"),
    ("st", "Storage"),
]

CHAR_POSITION = [
    ('nrm', 'normal')
]


class ImagesModel(models.Model):
    DIRECTORY = lambda self: ''
    IMG_SIZE = (600, 600)

    def get_image_path(self, filename):
        return os.path.join(self.DIRECTORY(), filename)

    def get_img_absolute_urls(self, photo_host_url=""):
        img_dict = dict()
        for n in ['img', 'thumbnail', 'reduced']:
            if hasattr(self, n):
                img_dict[n] = getattr(self, n)
        return get_img_dict_absolute_url(img_dict, photo_host_url)

    class Meta:
        abstract = True

    img = imagekit_models.ProcessedImageField(
        upload_to=get_image_path,
        processors=[processors.ResizeToFit(*IMG_SIZE), ],
        options={"quality": 85}
    )
    thumbnail = imagekit_models.ImageSpecField(
        [processors.ResizeToFill(150, 150), ],
        source="img", options={"quality": 85})


class Face(models.Model):
    directory = 'faces'

    emotion = models.CharField(
        max_length=16, verbose_name=_('emotion'), choices=EMOTION_CHOICES)
    race = models.ForeignKey(
        'Races', verbose_name=_('race'), blank=True, null=True)

    def get_img_absolute_urls(self, host_url="", img=None):
        return get_img_absolute_urls(host_url, self.face)

    def _get_filename(self, filename):
        race_name = self.race and self.race.name or 'all'
        ext = filename.split('.')[-1]
        return ("%s-%s" % (self.emotion, race_name), ext)

    def get_face_path(self, filename):
        filename = '%s.%s' % self._get_filename(filename)
        return os.path.join(self.directory, filename)

    def get_sim_path(self, filename):
        filename = '%s-sim.%s' % self._get_filename(filename)
        return os.path.join(self.directory, filename)

    face = imagekit_models.ProcessedImageField(
        upload_to=get_face_path, null=False, blank=True,
        # processors=[processors.ResizeToFit(150, 150), ],
        options={'quality': 85}
    )
    simulacrum = imagekit_models.ProcessedImageField(
        upload_to=get_sim_path, null=False, blank=True,
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


class Races(ImagesModel):
    """user race: {'futuri':1,'amadeus':2, 'united':3} """
    DIRECTORY = lambda self: 'races'

    description = models.CharField(max_length=256, null=True, blank=True)

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


class Tag(models.Model):
    """tag, what will be mark on photo"""
    name = models.CharField(max_length=128, unique=True)

    def __unicode__(self):
        return self.name


class RolePlace(models.Model):
    """place role: shop, bot castle, other"""
    name = models.CharField(
        max_length=32, choices=ROLE_PLACE_CHOICES, unique=True)

    def __unicode__(self):
        return self.name


class BuildingImageManager(models.Manager):
    def _get_image(self, b_type, race_name, lvl, host=''):
        if race_name:
            img = self.filter(
                b_type=b_type, lvl=lvl, race=Races.objects.get(name=race_name))
            return img and img[0].get_img_absolute_urls(host) or None
        # return 'random fake image here'

    def get_building(self, lvl, place_race, host, b_type='ms'):
        race = Races.objects.filter(name=place_race)
        if race:
            bld_image = self.filter(b_type=b_type, lvl=lvl, race=race[0])
            null_image = self.filter(b_type='ms', lvl=0, race=race[0])
            data = dict(bg=null_image[0].get_img_absolute_urls(host),
                        lvl=lvl, description=bld_image[0].description)
            if bld_image:
                data['img'] = bld_image[0].get_img_absolute_urls(host)
            return data
        return dict(img=None)


class BuildingImage(ImagesModel):
    DIRECTORY = lambda self: 'buildings/%s' % self.race.name

    def get_image_path(self, filename):
        return os.path.join(self.DIRECTORY(), '%s_%s.%s' % (
            self.b_type, self.lvl, filename.split('.')[1]))

    b_type = models.CharField(
        max_length=32, choices=BUILDING_TYPE)
    race = models.ForeignKey(Races, blank=True, null=True)
    lvl = models.PositiveIntegerField(default=0)
    objects = BuildingImageManager()
    description = models.TextField()

    reduced = imagekit_models.ImageSpecField(
        [processors.ResizeToFit(400), ],
        source="img", options={"quality": 85})

    class Meta:
        unique_together = ('race', 'b_type', 'lvl')

    def __unicode__(self):
        return "%s - %s (%s)" % (self.race, self.b_type, self.lvl)


class CharImage(ImagesModel):
    position = models.CharField(
        max_length=64, choices=CHAR_POSITION, default='nrm')
    race = models.ForeignKey(Races)
    gender = models.ForeignKey(Gender)

    class Meta:
        unique_together = ('position', 'race', 'gender')

    def __unicode__(self):
        return "%s/%s (%s)" % (self.race, self.gender, self.position)
