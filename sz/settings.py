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
    # 'lebowski',
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

