from django.conf.urls import patterns, url
from sz.api import views as root
from sz.api.views import auth, messages, places, static, users


urlpatterns = patterns(
    '',
    url(r'^$', root.ApiRoot.as_view()),

    url(r'^auth/login/?$', auth.AuthLogin.as_view(), name='auth-login'),
    url(r'^auth/logout/?$', auth.AuthLogout.as_view(), name='auth-logout'),
    url(r'^auth/user/?$', auth.AuthUser.as_view(), name='auth-user'),

    # url(r'^messages/search$', messages.MessageRootSearch.as_view(),
    #     name='message-search'),
    # url(r'^messages/(?P<pk>\d+)/?$', messages.MessageInstance.as_view(),
    #     name='message-detail'),
    # url(r'^messages/(?P<pk>\d+)/photo/?$',
    #     messages.MessageInstancePhoto.as_view(),
    #     name='message-detail-photo'),
    url(r'^messages/add/photopreviews/?$',
        messages.MessagePhotoPreview.as_view(),
        name='message-photoprewies-create'),
    url(r'^messages/add/photopreviews/(?P<pk>\d+)/update/?$',
        messages.MessagePhotoPreview.as_view(),
        name='message-photoprewies-update'),
    url(r'^messages/add/?$',
        messages.MessageAdd.as_view(), name='message-add'),
    # url(r'^messages/previews/(?P<pk>\d+)/?$',
    #     messages.MessagePreviewInstance.as_view(),
    #     name='message-previews-detail'),

    # url(r'^gamemap/?$', places.GameMapRoot.as_view(), name='gamemap'),
    url(r'^gamemap/path/?$',
        places.GameMapPath.as_view(), name='gamemap-path'),
    url(r'^gamemap/tile/?$',
        places.GameMapTile.as_view(), name='gamemap-tile'),

    url(r'^places/newsfeed/?$',
        places.PlaceRootNews.as_view(), name='place-news'),
    # url(r'^places/search$', places.PlaceSearch.as_view(),
    #    name='place-search'),
    url(r'^places/search-in-venues/?$',
        places.PlaceVenueSearch.as_view(), name='place-search-in-venues'),
    url(r'^places/explore-in-venues/?$',
        places.PlaceVenueExplore.as_view(), name='place-explore-in-venues'),
    # url(r'^places/(?P<pk>\w+)/newsfeed/?$',
    #    places.PlaceInstanceNewsFeed.as_view(), name='place-detail-news'),
    url(r'^places/(?P<pk>\w+)/messages/?$',
        places.PlaceInstanceMessages.as_view(), name='place-detail-messages'),
    # url(r'^places/(?P<pk>\w+)/?$',
    #    places.PlaceInstance.as_view(), name='place-detail'),

    url(r'^static/races/$',
        static.RacesRoot.as_view(), name='static-races'),
    url(r'^static/genders/$',
        static.GendersRoot.as_view(), name='static-genders'),
    url(r'^static/faces/$',
        static.FacesRoot.as_view(), name='static-faces'),
    url(r'^static/roles-user/$',
        static.RolesUserRoot.as_view(), name='static-roles-user'),

    url(r'^users/register/?$',
        users.UsersRoot.as_view(), name='users-registration'),
    url(r'^users/profile/?$',
        users.UserInstanceSelf.as_view(), name='users-profile'),
)
