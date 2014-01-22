'use strict';


var szServices = angular.module('sz.client.services', ['ngResource']);

//var ip = '192.168.0.101:8080'
var ip = '91.142.158.33:8080'
var apiIp = (window.location.protocol=="http:") ? 
    window.location.origin : ('http://' + ip);

szServices.factory('staticValueService', function($resource){
    return $resource(apiIp + '/api/static/:listCtrl/:docCtrl', {}, {
        categories: { method:'GET', params:{listCtrl: 'categories'}, isArray:false },
        races: { method:'GET', params:{listCtrl: 'races'}, isArray:false },
        genders: { method:'GET', params:{listCtrl: 'genders'}, isArray:false },
        faces: { method:'GET', params:{listCtrl: 'faces'}, isArray:false },
    });
});

szServices.factory('gameMapService', function($resource){
    return $resource(apiIp + '/api/gamemap/', {}, {
        getMap: { method:'GET' , isArray:false },
    });
});


szServices.factory('placeService', function($resource){
    return $resource(apiIp + '/api/places/:listCtrl:placeId/:docCtrl', {placeId: '@id'}, {
      /*  $newsfeed: { method:'GET', params:{docCtrl: 'newsfeed' }, isArray:false },*/
        newsfeed: { method:'GET', params:{listCtrl: 'newsfeed', placeId: '' }, isArray:false },
    /*    search: { method:'GET', params:{listCtrl: 'search' }, isArray:true },*/
        searchInVenues: { method:'GET', params:{listCtrl: 'search-in-venues' }, isArray:false },
        exploreInVenues:{ method:'GET', params:{listCtrl: 'explore-in-venues' }, isArray:false },
    });
});

szServices.factory('userService', function($http,$resource){
    return $resource(apiIp + '/api/users/:action', {}, {
        register: {
            method: 'POST',
            params: {
                action:'register'
            },
            isArray: false
        },
        resend_activation_key: {
            method:'POST',
            params: {
                action: 'resend-activation-key'
            },
            isArray:false
        },
        profile: {
            method: 'GET',
            params: {
                action: 'profile'
            },
            isArray: false
        }
    });
});

szServices.factory('messagePreviewService', function($http, $resource){

    var create = function(message, success, error){
        $http.post(apiIp + '/api/messages/previews', message, {
            headers: { 'Content-Type': false },
            transformRequest: angular.identity,
            params: {format: 'json'}
        }).success(success).error(error);
    }
    var update = function(previewId, message, success, error){
        $http.put(apiIp + '/api/messages/previews/' + previewId, message, {
            headers: { 'Content-Type': false },
            transformRequest: angular.identity,
            params: {format: 'json'}
        }).success(success).error(error);
    }

    var resource = $resource(apiIp + '/api/messages/previews/:previewId/:docCtrl', {previewId: '@id'}, {
        query: { method:'GET', params:{}, isArray:false },
        publish: { method:'POST', params:{docCtrl: 'publish'}, isArray:false }
    });

    resource.create = create;
    resource.update = update;
    return resource;
});

szServices.factory('sessionService', function($resource){
    var resource = $resource(apiIp + '/api/auth/:action', {}, {
        login: { method:'POST', params:{action: 'login'}, isArray:false },
        logout: { method:'POST', params:{action: 'logout'}, isArray:false },
        current: { method:'GET', params:{action: 'user'}, isArray:false }
    });
    return resource
});


/*szServices.factory('geolocationService', function ($rootScope) {
    return {
        getCurrentPosition: function (onSuccess, onError, options) {
            navigator.geolocation.getCurrentPosition(function () {
                    var that = this,
                        args = arguments;

                    if (onSuccess) {
                        $rootScope.$apply(function () {
                            onSuccess.apply(that, args);
                        });
                    }
                }, function () {
                    var that = this,
                        args = arguments;

                    if (onError) {
                        $rootScope.$apply(function () {
                            onError.apply(that, args);
                        });
                    }
                },
                options);
        }
    };
});
*/