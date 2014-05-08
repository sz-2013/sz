# -*- coding: utf-8 -*-
from django.contrib.gis.db import models
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _
from sz.core.models import User
from sz.static.models import RolePlace, \
    STANDART_ROLE_PLACE_NAME, EMPTY_ROLE_PLACE_NAME


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
    objects = PlaceManager()
    #name&position - уникальный индификатор
    name = models.CharField(max_length=128, verbose_name=u"название",
                            blank=True, null=True)
    # если имя - пустое, те место явлется просто болванкой,
    # то позиция может быть пустой
    position = models.PointField(
        verbose_name=u"координаты", blank=True, null=True)
    city_id = models.IntegerField(
        db_index=True, null=False, blank=False,
        help_text=u"идентификатор в GeoNames",)
    is_active = models.BooleanField(
        default=False, help_text=_(
            'Designates whether this place should be treated as '
            'active. Unselect this instead of place has no owner too long'
            ' (by engine initiate).'
        )
    )
    date = models.DateTimeField(
        default=timezone.now, verbose_name=u"дата создания")
    date_is_active = models.DateTimeField(
        default=timezone.now, verbose_name=u"дата активации")

    # IRL stuff
    address = models.CharField(
        max_length=128, null=True, blank=True, verbose_name=u"адрес",)
    crossStreet = models.CharField(
        max_length=128, null=True, blank=True,
        verbose_name=u"пересечение улиц")
    contact = models.CharField(
        max_length=512, null=True, blank=True, verbose_name=u"контакты",)

    # Game stuff
    role = models.ForeignKey(
        'static.RolePlace', verbose_name=_('role'), blank=True, null=True
    )
    gamemap_position = models.CommaSeparatedIntegerField(
        max_length=7, default=None, null=True, blank=True,
        verbose_name="position 'x,y' in a gamemap")
    owner = models.ForeignKey(
        'core.User', help_text='owner of a place', blank=True, null=True)
    openner_race = models.ForeignKey(
        'static.Races', help_text='genotype of a place', blank=True, null=True)
    lvl = models.PositiveIntegerField(
        default=0, help_text="Lvl of a place's ms or a place's mine")

    #4sk stuff
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
