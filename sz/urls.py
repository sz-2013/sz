from django.conf.urls import patterns, include, url
from django.contrib import admin
from sz import settings

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns(
    '',
    # Examples:
    # url(r'^$', 'sz.views.home', name='home'),
    # url(r'^sz/', include('sz.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^media/(?P<path>.*)$', 'django.views.static.serve', {
        'document_root': settings.MEDIA_ROOT,
        }),
    url(r'^/?$', 'sz.core.views.index', name='client-index'),
    url(r'^!/(?P<path>.*)$', 'django.views.static.serve', {
        'document_root': settings.CLIENT_ROOT,
        }),
    url(r'^!/js/(?P<path>.*)$', 'django.views.static.serve', {
        'document_root': settings.CLIENT_JS,
        }),
    url(r'^!/css/(?P<path>.*)$', 'django.views.static.serve', {
        'document_root': settings.CLIENT_CSS,
        }),
    url(r'^!/libs/(?P<path>.*)$', 'django.views.static.serve', {
        'document_root': settings.CLIENT_LIBS,
        }),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^api/', include('sz.api.urls'), name='api'),
    url(r'^api-auth/',
        include('rest_framework.urls', namespace='rest_framework')),
    url(r'^activate/(?P<activation_key>.*)/?$', 'sz.core.views.activate',
        name='registration-confirm'),
    url(r'^lebowski/', include('lebowski.urls'), name='lebowski'),
)
