# -*- coding: utf-8 -*-
import datetime
import hashlib
import os
from PIL import Image
import random
import re
import StringIO
import time
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.contrib.gis.db import models
from django.core import validators
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.utils import timezone
from django.db import transaction
from django.utils.translation import ugettext_lazy as _
from imagekit import models as imagekit_models
from imagekit import processors
from south.modelsinspector import add_introspection_rules
from sz import settings
from sz.core.image_utils import FitImage
from sz.core.utils import diff_lists

from sz.core.utils import float_to_int, get_string_date, \
    get_img_dict_absolute_url, get_img_absolute_urls, get_system_path_media

# south -----------------------------------------------------------------------


class ModifyingFieldDescriptor(object):
    """
    Modifies a field when set using the field's (overriden)
    .to_python() method.
    """

    def __init__(self, field):
        self.field = field

    def __get__(self, instance, owner=None):
        if instance is None:
            raise AttributeError('Can only be accessed via an instance.')
        return instance.__dict__[self.field.name]

    def __set__(self, instance, value):
        instance.__dict__[self.field.name] = self.field.to_python(value)


class LowerCaseCharField(models.CharField):
    def to_python(self, value):
        value = super(LowerCaseCharField, self).to_python(value)
        if isinstance(value, basestring):
            return value.lower()
        return value

    def contribute_to_class(self, cls, name):
        super(LowerCaseCharField, self).contribute_to_class(cls, name)
        setattr(cls, self.name, ModifyingFieldDescriptor(self))

add_introspection_rules([], ["^sz\.core\.models\.LowerCaseCharField"])

# -----------------------------------------------------------------------------


ACTIVATION_KEY_PATTERN = re.compile('^[a-f0-9]{32}$')

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


class UserManager(BaseUserManager):
    def _create_user(self, email, password):
        now = timezone.now()
        user = self.model(
            email=UserManager.normalize_email(email),
            is_active=True, is_superuser=False,
            last_login=now, date_joined=now
        )
        user.set_password(password)
        return user

    def create_user(self, email, race, gender, password=None):
        if not race:
            raise ValueError('Users must select a race')
        if not email:
            raise ValueError('Users must have an email address')

        user = self._create_user(email, password)
        user.race = race
        user.gender = gender
        user.role = RoleUser.objects.get_or_create(
            name=STANDART_ROLE_USER_NAME)[0]
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password):
        user = self._create_user(email, password)
        user.is_superuser = True
        user.is_active = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    email = models.CharField(
        _('email address'), max_length=72, unique=True,
        db_index=True, validators=[validators.EmailValidator()])
    radius = models.IntegerField(default=250, blank=True, null=True)
    is_superuser = models.BooleanField(
        _('superuser status'), default=False,
        help_text=_('Designates that this user has all permissions without '
                    'explicitly assigning them.'))
    is_active = models.BooleanField(
        _('active'), default=True,
        help_text=_(
            'Designates whether this user should be treated as '
            'active. Unselect this instead of deleting accounts.'))
    is_in_engine = models.BooleanField(
        _('create in engine'), default=False,
        help_text=_(
            'After confirmation user is created in game engine.'
            'If it be done successfully - tis field will be true'))
    date_joined = models.DateTimeField(
        _('date joined'), default=timezone.now)
    date_confirm = models.DateTimeField(
        _('date of create in engine'), default=None, blank=True, null=True)

    objects = UserManager()
    race = models.ForeignKey(
        Races, verbose_name=_('race'), blank=True, null=True)
    gender = models.ForeignKey(
        Gender, verbose_name=_('gender'), blank=True, null=True)
    role = models.ForeignKey(
        RoleUser, verbose_name=_('role'), blank=True, null=True)
    faces = models.ManyToManyField(
        Face, verbose_name=_('faces'), blank=True, null=True)
    last_box = models.ForeignKey(
        'Place', verbose_name=_('last user position'), blank=True, null=True)

    USERNAME_FIELD = 'email'

    def get_full_name(self):
        # Overcode standart django methods
        # The user is identified by their email address
        return self.email

    def get_short_name(self):
        # Overcode standart django methods
        # The user is identified by their email address
        return self.email

    def create_in_engine(self):
        self.is_in_engine = True
        self.date_confirm = timezone.now()
        self.save()
        return self

    def get_own_places(self):
        return len(self.place_set.all())

    def get_faces_id(self):
        return sorted([f.id for f in self.faces.all()])

    def __unicode__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True

    def update_faces(self, faces_new):
        faces_old = self.get_faces_id()
        faces_for_remove = diff_lists(faces_old, faces_new)
        faces_for_add = diff_lists(faces_new, faces_old)
        for f in faces_for_remove:
            self.faces.remove(Face.objects.get(id=f))
        for f in faces_for_add:
            self.faces.add(Face.objects.get(id=f))
        return self

    def update_radius(self, r):
        self.radius = r
        self.save()

    # def get_string_date_confirm(self):
    #     return get_string_date(self.date_confirm)

    @property
    def is_staff(self):
        return self.is_superuser

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')


class PlaceManager(models.GeoManager):
    def get_by_gamemap_pos(self, x, y, city_id):
        """Возвращает либо нужное место либо пустую балванку,
        чтобы на карте оно отрисовалось как "Empty place"
        """
        empty_params = dict(
            city_id=city_id, role=RolePlace.objects.get_or_create(
                name=EMPTY_ROLE_PLACE_NAME)[0])
        places = self.filter(
            city_id=city_id, gamemap_position="%s,%s" % (x, y)) or \
            self.filter(**empty_params)
        if places:
            return places[0]
        return self.create(**empty_params)


class Place(models.Model):
    #name&position - уникальный индификатор
    name = models.CharField(max_length=128, verbose_name=u"название",
                            blank=True, null=True)
    # если имя - пустое, те место явлется просто болванкой,
    # то позиция может быть пустой
    position = models.PointField(
        verbose_name=u"координаты", blank=True, null=True)
    objects = PlaceManager()

    city_id = models.IntegerField(
        db_index=True, null=False, blank=False,
        verbose_name=u"идентификатор в GeoNames",)
    is_active = models.BooleanField(
        _('active'),
        default=False,
        help_text=_(
            'Designates whether this place should be treated as '
            'active. Unselect this instead of place has no owner too long'
            ' (by engine initiate).'
        )
    )
    role = models.ForeignKey(
        RolePlace, verbose_name=_('role'), blank=True, null=True
    )
    date = models.DateTimeField(
        default=timezone.now, verbose_name=u"дата создания")
    date_is_active = models.DateTimeField(
        default=timezone.now, verbose_name=u"дата активации")

    # lvl = models.IntegerField(default=None,
    #     null=True, blank=True, verbose_name=u"lvl in a engine",)
    gamemap_position = models.CommaSeparatedIntegerField(
        max_length=7, default=None, null=True, blank=True,
        verbose_name="position 'x,y' in a gamemap")
    owner = models.ForeignKey(
        User, verbose_name=_('owner of a place'), blank=True, null=True)

    address = models.CharField(
        max_length=128, null=True, blank=True, verbose_name=u"адрес",)
    crossStreet = models.CharField(
        max_length=128, null=True, blank=True,
        verbose_name=u"пересечение улиц")
    contact = models.CharField(
        max_length=512, null=True, blank=True, verbose_name=u"контакты",)

    fsq_id = models.CharField(
        max_length=24, null=True, blank=True,
        verbose_name=u"идентификатор в Foursquare",)
    foursquare_icon_prefix = models.CharField(
        max_length=128, null=True, blank=True,
        verbose_name=u"префикс пиктограммы категории в 4sq")
    foursquare_icon_suffix = models.CharField(
        max_length=16, null=True, blank=True,
        verbose_name=u"суффикс (расширение) пиктограммы категории в 4sq")

    def longitude(self):
        return self.position and self.position.x

    def latitude(self):
        return self.position and self.position.y

    def foursquare_details_url(self):
        return "https://foursquare.com/v/%s" % self.fsq_id

    # def get_string_date(self):
    #     return get_string_date(self.date_is_active)

    def get_last_message_date(self):
        return self.message_set.all() and \
            self.message_set.order_by('-date')[0].date or None

    def get_gamemap_position(self):
        return self.gamemap_position and map(
            lambda pos: int(pos), self.gamemap_position.split(','))

    # def get_fake_owner_data(self):
    #     return [self.owner.id, 0.0] if self.owner else []

    def create_in_engine(self, attrs):
        self.is_active = True
        self.date_is_active = timezone.now()
        self.save()
        return self.update(attrs)

    def update(self, attrs):
        print attrs
        owner = attrs['place_owner']
        self.update_owner(owner[0] if owner else None)
        return self

    def update_gamemap(self, x, y):
        self.gamemap_position = "%s,%s" % (x, y)
        self.save()
        return self

    def update_owner(self, new_id):
        old_id = self.owner if self.owner.id else None
        if old_id != new_id:
            new = User.objects.get(id=new_id) if new_id else None
            self.owner = new
            self.save()
        return self

    # def get_owner_info(self):
    #     owner_id =
    #     return

    def get_owner_race(self):
        return self.owner.race if self.owner else None

    def is_owner(self, user):
        """As user can received <User>, userid or user email"""
        if not user or not self.owner:
            return False
        if isinstance(user, int):
            user_id = user
        elif isinstance(user, basestring):
            user_list = User.objects.filter(email=user)
            if not user_list:
                return False
            user_id = user_list[0].id
        elif isinstance(user, User):
            user_id = user.id
        else:
            return False
        return user_id == self.owner.id

    def __unicode__(self):
        return u"%s" % self.name + (
            self.address and (u", %s" % self.address) or u"")

    class Meta:
        unique_together = ('position', 'name',)
        verbose_name = _('place')
        verbose_name_plural = _('places')
        ordering = ("name",)

    def save(self, *args, **kwargs):
        def _get_role(name):
            return RolePlace.objects.get_or_create(name=name)[0]

        if not self.__dict__.get('role_id'):
            self.role = _get_role(STANDART_ROLE_PLACE_NAME)
        empty_role = _get_role(EMPTY_ROLE_PLACE_NAME)
        if self.__dict__.get('role_id') != empty_role.id:
            if not self.position:
                raise ValueError('Position is required')
            if not self.name:
                raise ValueError('Position is required')
        else:
            if Place.objects.filter(city_id=self.city_id, role=empty_role):
                raise ValueError(
                    'City %s arleady have empty place template' % self.city_id)
        super(Place, self).save(*args, **kwargs)


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
        """Unface received photo.

        Draw all not transparent pixels from face from faces_list to the photo
        with PIL and magic.

        Args:
            **kwargs:
                user - a message creator identifier(email).
                photo - img file
                photo_height - h photo in client
                photo_width - w photo in client
                faces_list - list with faces positions
                    [{x, y, height, width, face_id},..]

        Returns:
            self._create_preview(unfaced_photo, **kwargs)
        """
        photo = Image.open(kwargs.get('photo'))
        # photo = Image.open()
        full_width, full_height = map(float_to_int, photo.size)

        k_by_x = full_width / kwargs.get('photo_width')
        k_by_y = full_height / kwargs.get('photo_height')

        for face in kwargs.get('faces_list', []):
            w = float_to_int(face.get('width', 0) * k_by_x)
            h = float_to_int(face.get('height', 0) * k_by_y)
            x = float_to_int(face.get('x', 0) * k_by_x)
            y = float_to_int(face.get('y', 0) * k_by_y)
            face_full = Face.objects.get(id=face.get('face_id'))
            face_img = Image.open(face_full.get_fit_face(w, h))
            photo.paste(face_img, (x, y), face_img)

        photo_io = StringIO.StringIO()
        photo.save(photo_io, format='JPEG')
        unfaced_photo = InMemoryUploadedFile(
            photo_io, None, 'foo.jpg', 'image/jpeg', photo_io.len, None)
        return self._create_or_update_preview(unfaced_photo, **kwargs)


class MessagePreview(models.Model):
    objects = MessageManager()

    faces = models.ManyToManyField('Face', blank=True, null=True)
    user = models.ForeignKey('User', related_name='mpreviews')

    def get_photo_absolute_urls(self, photo_host_url=""):
        if self.photo:
            img_dict = dict(full=self.photo, reduced=self.reduced_photo,
                            thumbnail=self.thumbnail)
            return get_img_dict_absolute_url(img_dict, photo_host_url)
        else:
            return None

    def get_photo_path(self, filename):
        ext = filename.split('.')[-1]
        filename = "%s.%s" % (uuid.uuid4(), ext)
        directory = time.strftime("CACHE/images/photos/%Y/%m/%d")
        return os.path.join(directory, filename)

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
        Place, verbose_name=u"место")
    date = models.DateTimeField(
        auto_now_add=True, null=True, blank=True,
        editable=False, verbose_name=u"дата добавления")
    text = models.TextField(
        max_length=1024, null=False,
        blank=True, verbose_name=u"сообщение")

    face = models.ForeignKey(Face, null=True, blank=True)

    def get_photo_path(self, filename):
        ext = filename.split('.')[-1]
        filename = "%s.%s" % (uuid.uuid4(), ext)
        directory = time.strftime("photos/%Y/%m/%d")
        return os.path.join(directory, filename)

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

    # def save(self, force_insert=False, force_update=False, using=None):
    #     if self.text is None:
    #         self.text = ''
    #     self.text = self.text.strip()
    #     models.Model.save(
    #         self, force_insert=force_insert,
    #         force_update=force_update, using=using)

    def is_photo(self):
        return True if self.photo else False

    def get_string_date(self):
        return get_string_date(self.date)







# class UserPathManager(models.Model):
#     pass


# class UserPath(models.Model):
#     objects = UserPathManager()
