# -*- coding: utf-8 -*-
import datetime
import hashlib
import os
import random
import re
import uuid
import time

from django.db import transaction
from django.core import validators
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.contrib.gis.db import models
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _
from imagekit import models as imagekit_models
from imagekit import processors
from south.modelsinspector import add_introspection_rules

from sz import settings

CATEGORIES = [
    {'alias':u'Сумки','description':u'','name':'bags','keywords':[u'авоська',u'баул',u'борсетка',u'дипломат',u'клатч',u'кофр',u'несессер',u'подсумок',u'портфель',u'ранец',u'ридикюль',u'рюкзак',u'саквояж',u'сумка',u'фуросики',u'футляр',u'чемодан'],},
    {'alias':u'Головные уборы','description':u'','name':'head','keywords':[u'акубра',u'афганка',u'балаклава',u'балморал',u'бандана',u'бейсболка',u'берет',u'бескозырка',u'боливар',u'борсалино',u'буденовка',u'венок',u'вуаль',u'галеро',u'гренадерка',u'дастар',u'двууголка',u'диадема',u'ермолка',u'канотье',u'капор',u'каса',u'каска',u'кепи',u'кепка',u'кипа',u'клош',u'колпак',u'конфидератка',u'коппола',u'корона',u'косынка',u'котелок',u'куфия',u'мантилья',u'наушники',u'панама',u'папаха',u'пилотка',u'платок',u'плюмаж',u'повязка',u'сомбреро',u'треуголка',u'трилби',u'тэм-о-шентер',u'тюбитейка',u'тюрбан',u'ушанка',u'феска',u'фуражка',u'хиджаб',u'хомбург',u'цилиндр',u'чепец',u'шапка',u'шапокляк',u'шлем'],},
    {'alias':u'Верхняя одежда','description':u'','name':'outer','keywords':[u'альстер',u'анорак',u'балмаакан',u'берберри',u'бомбер',u'бострог',u'бурнус',u'бушлат',u'ватник',u'ветровка',u'дафлкот',u'дождевик',u'дубленка',u'зипун',u'инвернес',u'коверт',u'колет',u'косуха',u'котарди',u'куртка',u'макинтош',u'ментик',u'пальто',u'парка',u'пехора',u'пихора',u'плащ',u'плащ-палатка',u'полупальто',u'полушубок',u'пончо',u'пуховик',u'телогрейка',u'тренч',u'тренчкот',u'тужурка',u'тулуп',u'хавелок',u'чапан',u'честерфилд',u'шинель',u'штормовик',u'шуба'],},
    {'alias':u'Обувь','description':u'','name':'shoes','keywords':[u'балетки',u'бахилы',u'башмак',u'берцы',u'болотники',u'босоножки',u'ботильоны',u'ботинки',u'ботинки',u'ботфорты',u'боты',u'броги',u'бродни',u'бурки',u'бутсы',u'валенки',u'вьетнамки',u'галоши',u'гриндерс',u'гэта',u'дезерты',u'дерби',u'джазовки',u'доктор мартинс',u'калоши',u'кеды',u'конверс',u'кроссовки',u'лодочки',u'лоферы',u'мартинсы',u'мокасины',u'монки',u'мюли',u'оксфорды',u'пимы',u'пинетки',u'полуботинки',u'полукеды',u'пуанты',u'сабо',u'сандалии',u'сапоги',u'сланцы',u'слипоны',u'сникерсы',u'таби',u'тапки',u'трикони',u'туфли',u'тэйлорс',u'угги',u'унты',u'унты',u'шлепанцы',u'шлепки',u'штиблеты'],},
    {'alias':u'Нижнее белье','description':u'','name':'under','keywords':[u'бикини',u'боди',u'бойшортс',u'боксеры',u'брифы',u'бюстглалтер',u'бюстье',u'виктория сикретс',u'комбинация',u'корсаж',u'корсет',u'купальник',u'кюлот',u'лифчик',u'панталоны',u'пенюар',u'пижама',u'плавки',u'подвязки',u'семейники',u'слипы',u'стринги',u'танга',u'термобелье',u'тонг',u'трусы',u'халат',u'чайки'],},
    {'alias':u'Аксесуары','description':u'','name':'accessories','keywords':[u'бабочка',u'бижутерия',u'боа',u'браслеты',u'брелок',u'варежки',u'галстук',u'горжетка',u'зонт',u'камербанд',u'кашне',u'ключница',u'кошелек',u'краги',u'маска',u'митенки',u'монокль',u'муфта',u'шарф',u'напульсник',u'оби',u'очки',u'палстрон',u'перчатки',u'платок',u'подтяжки',u'портупея',u'варежки',u'пояс',u'ремень',u'руковицы',u'рэйбан',u'рэйбэн',u'стельки',u'торк',u'торквес',u'фенечки',u'четки',u'шаль',u'шнурки'],},
    {'alias':u'Футболки, майки, рубашки','description':u'','name':'top1','keywords':[u'алкоголичка',u'бадлон',u'банлон',u'безрукавка',u'блузка',u'бодлон',u'водолазка',u'гимнастерка',u'косоворотка',u'лонгслив',u'майка',u'поло',u'рубашка',u'седре',u'сорочка',u'спагетти',u'тельняшка',u'толстовка',u'топ',u'тэнниска',u'фланелевка',u'футболка',u'фуфайка'],},
    {'alias':u'Кофты, пиджаки','description':u'','name':'top2','keywords':[u'болеро',u'джемпер',u'жакет',u'жилет',u'камзол',u'кардиган',u'кофта',u'лопапейса',u'накидка',u'палантин',u'пиджак',u'пуловер',u'свитер',u'смокинг',u'сюртук',u'фрак',u'френч',u'худи'],},
    {'alias':u'Чулочно-носочные изделия','description':u'','name':'socks','keywords':[u'чулки',u'гетры',u'гольфы',u'гольфины',u'колготки',u'колготы',u'носки',u'портянки',u'рейтузы',u'термобелье'],},
    {'alias':u'Штаны и шорты','description':u'','name':'trousers','keywords':[u'бермуды',u'бриджи',u'брюки',u'бэгги',u'джегенсы',u'джинсы',u'капри',u'карго',u'леггинсы',u'ледерхозе',u'лосины',u'скинни',u'хакама',u'шаровары',u'шорты',u'штаны'],},
    {'alias':u'Костюмы, платья','description':u'','name':'suits','keywords':[u'кейгори',u'кимоно',u'комбинизон',u'костюм',u'кэтсьют',u'платье',u'сарафан',u'сари',u'тоги',u'тройка',u'туника',u'фурсьют'],},
    {'alias':u'Юбки','description':u'','name':'skirts','keywords':[u'американка',u'годе',u'карандаш',u'килт',u'колокол',u'кринолин',u'мини',u'парео',u'пачка',u'полусолнце',u'саронг',u'солнце',u'тюлбпан',u'юбка'],},
]

STANDART_ROLE_USER_NAME = "player"
STANDART_ROLE_PLACE_NAME = "shop"



"""Static clases"""

EMOTION_CHOICES = (
    ('smile', 'Smile'),
    ('lol', "LOL"),
    ('bad', 'Bad'),
    ('indifferent', 'Indifferent')
)

LANGUAGE_CHOICES = (
    ('en', _('English')),
    ('ru', _('Russian')),
)

ROLE_USER_CHOICES = (
    ('player','Player'),
)

ROLE_PLACE_CHOICES = (
    ('shop','SHOP'),
)


def get_string_date(date):
    return [date.year, date.month, date.day, date.hour, \
        date.minute, date.second] if date else []

class ModifyingFieldDescriptor(object):
    """ Modifies a field when set using the field's (overriden) .to_python() method. """

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


def get_img_absolute_urls(host_url="",img=None):
    host_url = host_url + 'media/'
    if img: 
        return host_url + img.url
    else:
        return None

class Races(models.Model):
    """user race: {'futuri':1,'amadeus':2, 'united':3} """
    description = models.CharField(max_length=256, null=True, blank=True)
    def get_img_absolute_urls(self, host_url="", img=None):
        return get_img_absolute_urls(host_url,self.blazon)
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

class Face(models.Model):
    emotion = models.CharField(
        max_length=16, verbose_name=_('emotion'),
        choices=EMOTION_CHOICES
    )
    race = models.ForeignKey(Races, verbose_name=_('race'),
                              blank=True, null=True)
    def get_img_absolute_urls(self, host_url="", img=None):
        return get_img_absolute_urls(host_url,self.face)
    def get_face_path(self, filename):
        race_name = self.race and self.race.name or 'all'
        ext = filename.split('.')[-1]
        filename = "%s-%s.%s" % (self.emotion,race_name, ext)
        directory = 'faces'
        return os.path.join(directory, filename)

    face = imagekit_models.ProcessedImageField(
        upload_to=get_face_path, null=False, blank=True,
        processors=[processors.ResizeToFit(150, 150), ], options={'quality': 85}
    )
    def __unicode__(self):
        return u"%s_%s" % (self.emotion, self.race.name if self.race else 'all')

    class Meta:
        verbose_name = _('face')
        verbose_name_plural = _('face')

class RoleUser(models.Model):
    """user role: player, bot, other"""
    name = models.CharField(max_length=32, 
        choices=ROLE_USER_CHOICES, unique=True)
    def __unicode__(self):
        return self.name

class RolePlace(models.Model):
    """place role: shop, bot castle, other"""
    name = models.CharField(max_length=32, 
        choices=ROLE_PLACE_CHOICES, unique=True)
    def __unicode__(self):
        return self.name

	
class Category(models.Model):

    alias = models.SlugField(
        verbose_name=u"псевдоним", max_length=32,
        db_index=True, unique=True)

    name = models.CharField(verbose_name=u"наименование", 
        max_length=64, db_index=True)

    description = models.CharField(
        verbose_name=u"описание", max_length=256,
        null=True, blank=True)

    keywords = models.TextField(
        verbose_name=u"ключевые слова", max_length=2048,
        help_text=u"ключевые слова, разделённые запятыми, регистр неважен")

    def get_keywords_list(self):
        normalized_keywords = u' '.join(self.keywords.split()).lower()
        return sorted(
            [kw.strip() for kw in normalized_keywords.split(',')])

    def save(self, *args, **kwargs):
        self.keywords = u', '.join(self.get_keywords_list())
        super(Category, self).save(*args, **kwargs)

    def __unicode__(self):
        return u"%s" % self.name

    class Meta:
        verbose_name = _('category')
        verbose_name_plural = _('categories')


class Stem(models.Model):

    stem = LowerCaseCharField(
        verbose_name=u"основа слова", max_length=32,
        db_index=True, unique=True)

    language = LowerCaseCharField(
        verbose_name=u"язык", db_index=True, max_length=2,
        choices=LANGUAGE_CHOICES)

    def __unicode__(self):
        return u"%s" % self.stem

    class Meta:
        unique_together = ('stem', 'language',)

"""Volatile clases"""

class UserManager(BaseUserManager):
    def _create_user(self, email, password):
        now = timezone.now()
        user = self.model(
            email=UserManager.normalize_email(email),
            is_active=False, is_superuser=False,
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
        db_index=True, validators=[validators.EmailValidator()]
    )    
    is_superuser = models.BooleanField(
        _('superuser status'), default=False,
        help_text=_('Designates that this user has all permissions without '
                    'explicitly assigning them.'))
    is_active = models.BooleanField(
        _('active'), default=True,
        help_text=_(
            'Designates whether this user should be treated as '
            'active. Unselect this instead of deleting accounts.'
        )
    )
    is_in_engine = models.BooleanField(
        _('create in engine'), default=False,
        help_text=_(
            'After confirmation user is created in game engine.'
            'If it be done successfully - tis field will be true'
        )
    )
    date_joined = models.DateTimeField(
        _('date joined'), default=timezone.now
    )
    date_confirm = models.DateTimeField(
        _('date confirmation'), default=None, blank=True, null=True
    )

    objects = UserManager()    
    race = models.ForeignKey(
        Races, verbose_name=_('race'),
        blank=True, null=True
    )
    gender = models.ForeignKey(
        Gender, verbose_name=_('gender'), blank=True, null=True
    )
    role = models.ForeignKey(
        RoleUser, verbose_name=_('role'), blank=True, null=True
    )
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
        self.save()

    def __unicode__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True

    def get_string_date_confirm(self):
        return get_string_date(self.date_confirm)

    @property
    def is_staff(self):
        return self.is_superuser

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')


ACTIVATION_KEY_PATTERN = re.compile('^[a-f0-9]{32}$')


class RegistrationManager(models.Manager):

    def activate(self, activation_key):
        if ACTIVATION_KEY_PATTERN.search(activation_key):
            try:
                profile = self.get(activation_key=activation_key)
            except self.model.DoesNotExist:
                return False
            if not profile.activation_key_expired():
                user = profile.user
                user.is_active = True
                user.date_confirm = timezone.now()
                user.save()
                profile.activation_key = self.model.CONFIRMED
                profile.save()
                return user
        return False

    def create_inactive_user(self, email, password, race, gender):
        new_user = User.objects.create_user(email, race, gender, password)
        role, create = RoleUser.objects.get_or_create(name=STANDART_ROLE_USER_NAME)
        new_user.role = role
        new_user.is_active = False
        new_user.save()
        self.create_profile(new_user)
        return new_user

    def send_key(self, email):
        try:
            profile = self.get(user__email=email)
        except self.model.DoesNotExist:
            return False
        profile.is_sending_email_required = True
        profile.save()
        return email

    create_inactive_user = transaction.commit_on_success(create_inactive_user)

    def create_profile(self, user):
        salt = hashlib.md5(str(random.random())).hexdigest()[:5]
        email = user.email
        if isinstance(email, unicode):
            email = email.encode('utf-8')
        activation_key = hashlib.md5(salt + email).hexdigest()
        return self.create(
            user=user, activation_key=activation_key,
            is_sending_email_required=True
        )

    def delete_expired_users(self):
        for profile in self.all():
            try:
                if profile.activation_key_expired():
                    user = profile.user
                    if not user.is_active:
                        user.delete()
                        profile.delete()
            except User.DoesNotExist:
                profile.delete()


class RegistrationProfile(models.Model):
    CONFIRMED = 'CONFIRMED'
    user = models.ForeignKey(User, unique=True, verbose_name=_('user'))
    activation_key = models.CharField(
        _('email confirmation key'), max_length=32,
        validators=[validators.RegexValidator(regex=ACTIVATION_KEY_PATTERN)]
    )
    is_sending_email_required = models.BooleanField(
        default=True,
        help_text=_('Designates whether to send email'),
        db_index=True
    )
    objects = RegistrationManager()

    def activation_key_expired(self):
        expiration_date = datetime.timedelta(
            days=settings.ACCOUNT_CONFIRMATION_DAYS
        )
        return (
            self.activation_key == self.CONFIRMED or
            self.user.date_joined + expiration_date <= timezone.now()
        )

    activation_key_expired.boolean = True

    class Meta:
        verbose_name = _('registration profile')
        verbose_name_plural = _('registration profiles')

class Place(models.Model):
	#BUG - why id is NULL?
    #name&position - уникальный индификатор
    name = models.CharField(max_length=128, verbose_name=u"название")
    position = models.PointField(verbose_name=u"координаты")
    objects = models.GeoManager()

    is_active = models.BooleanField(_('active'), default=False,
        help_text=_(
            'Designates whether this place should be treated as '
            'active. Unselect this instead of place has no owner too long'
            ' (by engine initiate).'
        )
    )
    is_in_engine = models.BooleanField(
        _('create in engine'), default=False,
        help_text=_(
            'After creation place in db, place is created in engine.'
            'If it be done successfully - tis field will be true'
        )
    )
    role = models.ForeignKey(
        RolePlace, verbose_name=_('role'), blank=True, null=True
    )
    date = models.DateTimeField(
        default=timezone.now, verbose_name=u"дата создания")
    date_is_active = models.DateTimeField(
        default=timezone.now, verbose_name=u"дата активации")
    address = models.CharField(
        max_length=128, null=True, blank=True,verbose_name=u"адрес",)
    crossStreet = models.CharField(
        max_length=128, null=True, blank=True, verbose_name=u"пересечение улиц",)
    contact = models.CharField(
        max_length=512, null=True, blank=True, verbose_name=u"контакты",)
    city_id = models.IntegerField(        
        db_index=True, null=False, blank=False,
        verbose_name=u"идентификатор в GeoNames",)    

    fsq_id = models.CharField(
        max_length=24, null=True, blank=True,
        verbose_name=u"идентификатор в Foursquare",)
    foursquare_icon_prefix = models.CharField(
        max_length=128, null=True, blank=True,
        verbose_name=u"префикс пиктограммы категории в Foursquare")
    foursquare_icon_suffix = models.CharField(
        max_length=16, null=True, blank=True,
        verbose_name=u"суффикс (расширение) пиктограммы категории в Foursquare")	

    def longitude(self):
        return self.position.x

    def latitude(self):
        return self.position.y

    def foursquare_details_url(self):
        return "https://foursquare.com/v/%s" % self.fsq_id

    def get_string_date(self):
        return get_string_date(self.date_is_active)

    def create_in_engine(self):
        self.is_in_engine = True
        self.is_active = True
        self.date_is_active = timezone.now()
        self.save()

    def __unicode__(self):
        return u"%s" % self.name + (self.address and (u", %s" % self.address) or u"")
    class Meta:
        unique_together = ('position', 'name',)
        verbose_name = _('place')
        verbose_name_plural = _('places')
        ordering = ("name",)
    def save(self, *args, **kwargs):
        if not self.__dict__.get('role_id'):
            self.role, is_create = RolePlace.objects.get_or_create(name=STANDART_ROLE_PLACE_NAME)
        super(Place, self).save(*args, **kwargs)

class MessageBase(models.Model):

    date = models.DateTimeField(
        auto_now_add=True, null=True, blank=True,
        editable=False, verbose_name=u"дата добавления")

    text = models.TextField(
        max_length=1024, null=False,
        blank=True, verbose_name=u"сообщение")

    user = models.ForeignKey(User, verbose_name=_('user'))

    place = models.ForeignKey(Place, verbose_name=u"место")

    def get_photo_path(self, filename):
        ext = filename.split('.')[-1]
        filename = "%s.%s" % (uuid.uuid4(), ext)
        directory = time.strftime('photos/%Y/%m/%d')
        return os.path.join(directory, filename)

    photo = imagekit_models.ProcessedImageField(
        upload_to=get_photo_path, verbose_name=u"фотография", null=False, blank=True,
        processors=[processors.ResizeToFit(1350, 1200), ], options={'quality': 85}
    )

    reduced_photo = imagekit_models.ImageSpecField(
        [processors.ResizeToFit(435), ],
        source='photo', options={'quality': 85})

    thumbnail = imagekit_models.ImageSpecField(
        [processors.ResizeToFill(90, 90), ],
        source='photo', options={'quality': 85})  

    def get_photo_absolute_urls_and_size(self, photo_host_url=""):
        urls = self.get_photo_absolute_urls(photo_host_url)
        urls_and_size = {}
        if urls:
            for (name, url) in urls.items():
                photo = \
                    name=='full' and self.photo \
                    or name=='reduced' and self.reduced_photo \
                    or self.thumbnail
                urls_and_size[name] = {
                    'url':url, 'width':photo.width, 'height':photo.height}
        return urls_and_size

    def get_photo_absolute_urls(self, photo_host_url=""):
        # photo_host_url = photo_host_url.rstrip('/')
        photo_host_url = photo_host_url+ 'media/'
        if self.photo:
            return dict(full=photo_host_url + self.photo.url, reduced=photo_host_url + self.reduced_photo.url,
                        thumbnail=photo_host_url + self.thumbnail.url)
        else:
            return None

    categories = models.ManyToManyField(Category, null=True, blank=True)

    class Meta:
        abstract = True
        verbose_name = _('message')
        verbose_name_plural = _('messages')

    def __unicode__(self):
        return u"%s" % self.text

    def save(self, force_insert=False, force_update=False, using=None):
        if self.text is None:
            self.text = ''
        self.text = self.text.strip()
        models.Model.save(self, force_insert=force_insert, force_update=force_update, using=using)

    def is_photo(self):
        return True if self.photo else False

    def get_string_date(self):
        return get_string_date(self.date)


class Message(MessageBase):
    stems = models.ManyToManyField(Stem, null=True, blank=True)
    face = models.ForeignKey(Face, null=True, blank=True)


class MessagePreview(MessageBase):
    pass
