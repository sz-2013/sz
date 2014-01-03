from django.conf.urls import patterns, include, url
from sz import settings

urlpatterns = patterns('',
    url(r'^$', 'lebowski.views.index', name='lebowski-index'),
    url(r'^api/', include('lebowski.api.urls'), name='api'),
#     url(r'^client/(?P<path>.*)$', 'django.views.static.serve', {
#         'document_root': settings.LEBOWSKI_CLIENT_ROOT,
#         }),
)
