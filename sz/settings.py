# -*- coding: utf-8 -*-
# Django settings for sz project.

import os
SZ_ROOT = os.path.dirname(os.path.dirname(__file__))
DEBUG = True
TEMPLATE_DEBUG = DEBUG
LEBOWSKI_MODE_TEST = False
ADMINS = (
    ('Shmot Zhmot', 'shmotzhmot@outlook.com'),
)


AUTH_USER_MODEL = 'core.User'

MANAGERS = ADMINS

# DATABASES = {
#     'default': {
#         #'django.db.backends.sqlite3', # Add 'postgresql_psycopg2', 'mysql', 'sqlite3' or 'oracle'.
#         'ENGINE': 'django.contrib.gis.db.backends.postgis',
#         # 'ENGINE': 'django.db.backends.postgresql_psycopg2',
#         'NAME': 'test',#SZ_ROOT + 'data/sz.db3', # Or path to database file if using sqlite3.
#         'USER': 'test', # Not used with sqlite3.
#         'PASSWORD': '123', # Not used with sqlite3.
#         'HOST': '1.1.1.1', # Set to empty string for localhost. Not used with sqlite3.
#         'PORT': '', # Set to empty string for default. Not used with sqlite3.
#     }
# }
# Hosts/domain names that are valid for this site; required if DEBUG is False
# See https://docs.djangoproject.com/en/1.5/ref/settings/#allowed-hosts
ALLOWED_HOSTS = []

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# In a Windows environment this must be set to your system time zone.
TIME_ZONE = 'Asia/Yakutsk'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'ru-ru'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale.
USE_L10N = True

# If you set this to False, Django will not use timezone-aware datetimes.
USE_TZ = True

# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/var/www/example.com/media/"
MEDIA_ROOT = os.path.join(SZ_ROOT, 'media')

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
# Examples: "http://example.com/media/", "http://media.example.com/"
MEDIA_URL = ''

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/var/www/example.com/static/"
STATIC_ROOT = ''

# URL prefix for static files.
# Example: "http://example.com/static/", "http://static.example.com/"
STATIC_URL = '/static/'

# Additional locations of static files
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    os.path.join(SZ_ROOT, 'static'),
)

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
#    'django.contrib.staticfiles.finders.DefaultStorageFinder',
)

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
#     'django.template.loaders.eggs.Loader',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    # Uncomment the next line for simple clickjacking protection:
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'sz.urls'

# Python dotted path to the WSGI application used by Django's runserver.
WSGI_APPLICATION = 'sz.wsgi.application'

TEMPLATE_DIRS = (
    os.path.join(SZ_ROOT, 'templates'),
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
)

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Uncomment the next line to enable the admin:
    'django.contrib.admin',
    'django.contrib.gis',
    # Uncomment the next line to enable admin documentation:
    # 'django.contrib.admindocs',
    'rest_framework',
    'sz.core',
    'sz.api',
    'lebowski',
    'south',
    'imagekit',
    # 'rest_framework.authtoken',
)

# A sample logging configuration. The only tangible logging
# performed by this configuration is to send an email to
# the site admins on every HTTP 500 error when DEBUG=False.
# See http://docs.djangoproject.com/en/dev/topics/logging for
# more details on how to customize your logging configuration.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse'
        }
    },
    'handlers': {
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler'
        }
    },
    'loggers': {
        'django.request': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
        },
    }
}

FOURSQUARE_CONFIG = {
    'client_id': 'BSQGPWXDOZ40ZANNNJAXJUSBGTSIUW0LSNYOPBYEZCV4PSL1',
    'client_secret': 'CUB01RXAKUXKZ54DW2PADXO30GMOWK5WAX5HA0X05OHL2LM4',
    'redirect_uri': 'https://sz.me/callback'
}

GEONAMES_API_CONFIG = {
    'API_URI': 'http://api.geonames.org/',
    'USERNAME': 'sz.me',
}

# REST_FRAMEWORK = {
#     'DEFAULT_RENDERER_CLASSES': (
#     #    'rest_framework.renderers.JSONRenderer',
#         'sz.api.renderers.UnicodeJSONRenderer',
#     #    'rest_framework.renderers.BrowsableAPIRenderer',
#         'sz.api.renderers.BrowsableAPIRenderer',
#         'rest_framework.renderers.TemplateHTMLRenderer',
#         ),
#     'DEFAULT_PERMISSIONS': (
#         'rest_framework.permissions.IsAuthenticatedOrReadOnly',
#         ),
#     'DEFAULT_AUTHENTICATION_CLASSES': (
#         'rest_framework.authentication.SessionAuthentication',
#         'rest_framework.authentication.TokenAuthentication',
#         ),
# }

from django.conf.global_settings import TEMPLATE_CONTEXT_PROCESSORS
TEMPLATE_CONTEXT_PROCESSORS += (
    'django.core.context_processors.request',
)

CLIENT_ROOT = os.path.join(SZ_ROOT, 'client')

SOUTH_TESTS_MIGRATE = False
GEONAMES_API_CONFIG = {
    'API_URI': 'http://api.geonames.org/',
    'USERNAME': 'sz.me',
    }

#radius for newsfeed
DEFAULT_RADIUS = 300
#radius for explore 
BLOCKS_RADIUS = 250
DEFAULT_PAGINATE_BY = 7

ACCOUNT_CONFIRMATION_DAYS = 7




try:
    from passwords import *
except ImportError:
    pass

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

STANDART_ROLE_NAME = "player"
