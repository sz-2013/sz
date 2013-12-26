from django.conf.urls import patterns, url
from lebowski.api import views as root
from lebowski.api.views import users, places, messages


urlpatterns = patterns('',
	url(r'^$', root.ApiRoot.as_view()),
	url(r'^users/create/?$', users.UsersCreate.as_view(),
        name='users-create'),
	url(r'^places/create/?$', places.PlacesCreate.as_view(),
        name='places-create'),
	url(r'^messages/create/?$', messages.MessagesCreate.as_view(),
        name='messages-create'),

)