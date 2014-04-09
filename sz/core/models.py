# -*- coding: utf-8 -*-
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.contrib.gis.db import models
from django.core import validators
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _
# from south.modelsinspector import add_introspection_rules
from sz.core.utils import diff_lists
from sz.static.models import RoleUser, Face, STANDART_ROLE_USER_NAME
# south -----------------------------------------------------------------------


# class ModifyingFieldDescriptor(object):
#     """
#     Modifies a field when set using the field's (overriden)
#     .to_python() method.
#     """

#     def __init__(self, field):
#         self.field = field

#     def __get__(self, instance, owner=None):
#         if instance is None:
#             raise AttributeError('Can only be accessed via an instance.')
#         return instance.__dict__[self.field.name]

#     def __set__(self, instance, value):
#         instance.__dict__[self.field.name] = self.field.to_python(value)


# class LowerCaseCharField(models.CharField):
#     def to_python(self, value):
#         value = super(LowerCaseCharField, self).to_python(value)
#         if isinstance(value, basestring):
#             return value.lower()
#         return value

#     def contribute_to_class(self, cls, name):
#         super(LowerCaseCharField, self).contribute_to_class(cls, name)
#         setattr(cls, self.name, ModifyingFieldDescriptor(self))

# add_introspection_rules([], ["^sz\.core\.models\.LowerCaseCharField"])

# -----------------------------------------------------------------------------


class UserManager(BaseUserManager):
    def _create_user(self, email, password):
        now = timezone.now()
        user = self.model(
            email=self.normalize_email(email),
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
        'static.Races', verbose_name=_('race'), blank=True, null=True)
    gender = models.ForeignKey(
        'static.Gender', verbose_name=_('gender'), blank=True, null=True)
    role = models.ForeignKey(
        'static.RoleUser', verbose_name=_('role'), blank=True, null=True)
    faces = models.ManyToManyField(
        'static.Face', verbose_name=_('faces'), blank=True, null=True)
    last_box = models.ForeignKey(
        'place.Place', verbose_name=_('last user position'), blank=True, null=True)

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
