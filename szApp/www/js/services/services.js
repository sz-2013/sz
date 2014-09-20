'use strict';


var szServices = angular.module('sz.client.services', ['ngResource']);

var ip = '192.168.0.101:8080'
//var ip = '91.142.158.33:8080'
var apiIp = (window.location.protocol=="http:") ?
    window.location.origin : ('http://' + ip);

szServices.factory('staticValueService', function($resource){
    return $resource(apiIp + '/api/static/:listCtrl/:ctrl', {ctrl:''}, {
        categories: { method:'GET', params:{listCtrl: 'categories'}, isArray:false },
        races: { method:'GET', params:{listCtrl: 'races'}, isArray:false },
        genders: { method:'GET', params:{listCtrl: 'genders'}, isArray:false },
        faces: { method:'GET', params:{listCtrl: 'faces'}, isArray:false },
        charsImg: { method:'GET', params:{listCtrl: 'chars', ctrl: 'images'}, isArray:false },
    });
});


szServices.factory('sessionService', function($resource){
    var resource = $resource(apiIp + '/api/auth/:action', {}, {
        login: { method:'POST', params:{action: 'login'}, isArray:false },
        logout: { method:'POST', params:{action: 'logout'}, isArray:false },
        current: { method:'GET', params:{action: 'user'}, isArray:false }
    });
    return resource
});


szServices.factory('userService', function($http,$resource){
    return $resource(apiIp + '/api/users/:action', {}, {
        register: {method: 'POST', params: {action:'register'}, isArray: false},
        resend_activation_key: {method:'POST', params: {action: 'resend-activation-key'}, isArray:false},
        profile: {method: 'GET', params: {action: 'profile'}, isArray: false}
    });
});


szServices.factory('gameMapService', function($resource){
    return $resource(apiIp + '/api/gamemap/:cntrl', {}, {
        /*getMap: { method:'GET' , isArray:true },*/
        getPath: { method:'GET' , isArray:false, params: {cntrl: 'path'} },
        getTile: { method:'GET' , isArray:false, params: {cntrl: 'tile'} },
        postPath: { method:'POST' , isArray:false, params: {cntrl: 'path'} },
    });
});


szServices.factory('placeService', function($resource){
    return $resource(apiIp + '/api/places/:listCtrl:placeId/:docCtrl', {placeId: '@id'}, {
      /*  $newsfeed: { method:'GET', params:{docCtrl: 'newsfeed' }, isArray:false },*/
        newsfeed: { method:'GET', params:{listCtrl: 'newsfeed', placeId: '' }, isArray:false },
    /*    search: { method:'GET', params:{listCtrl: 'search' }, isArray:true },*/
        searchInVenues: { method:'GET', params:{listCtrl: 'search-in-venues' }, isArray:false },
        exploreInVenues:{ method:'GET', params:{listCtrl: 'explore-in-venues' }, isArray:false },
        detailShort: { method:'GET', params:{docCtrl: 'detail/short' }, isArray:false },
        /*detail: { method:'GET', params:{docCtrl: 'detail' }, isArray:false },*/
    });
});


szServices.factory('messageService', function($http, $resource, $rootScope){
/*    var url = apiIp + '/api/messages/add';

    var preview = function(preview, id, success, error){
        var previewurl = url + '/photopreviews/' + ( id || '' );
        var error = error || function(e){console.log(e); $rootScope.showLoader = false;}
        preview.append('csrfmiddlewaretoken', $http.defaults.headers.post['X-CSRFToken'])
        var xhr = new XMLHttpRequest();
        xhr.open('POST', previewurl, true);
        xhr.setRequestHeader('X-CSRF-Token', $http.defaults.headers.post['X-CSRFToken']);
        xhr.onerror = error;
        xhr.onload = function(e){
            try{var r = eval("("+xhr.responseText+")");}
            catch(e){var r = {'exception': e}}
            finally{
                if(r.exception===undefined&&(xhr.status==200||xhr.status==201)) var obj = {fn:success, r:r.data}
                else var obj = {fn:error, r:r}
                if(obj.fn) $rootScope.$apply(function(){obj.fn(obj.r)});
            }
        };
        xhr.send(preview);
    }

    var resource = {}
    resource.create = function(message, success, error){
        $http({
            method: 'POST',
            url: url,
            data: message,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        })
    }
    resource.preview = preview
    return resource;*/
});

szServices.factory('messageCreate', ['$rootScope', '$http', function($rootScope, $http){
    var url = apiIp + '/api/messages/add';
    function getXmlHttp(){
        var xmlhttp;
        try {
            xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            try {
                xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (E) {
                xmlhttp = false;
            }
        }
        if (!xmlhttp && typeof XMLHttpRequest!='undefined') {
            xmlhttp = new XMLHttpRequest();
        }
        return xmlhttp;
    }
    return function(data, onSuccess, onError){
        var onSuccess = onSuccess || function(r){console.log(r)}
        var onError = onError || function(r){console.log(JSON.parse(r.responseText))}
        data.append('csrfmiddlewaretoken', $http.defaults.headers.post['X-CSRFToken'])
        var xhr = getXmlHttp();

        xhr.onload = xhr.onerror = function(r) {
            if(this.status == 200 || this.status == 201 || this.responseText == 'OK' || this.statusText == 'OK') {
                onSuccess(JSON.parse(this.responseText).data)
                return;
            }
            onError(this);
        };
        xhr.upload.onprogress = function(event) {
            //onProgress(event.loaded, event.total);
            console.log([event.loaded, event.total])
        }

        xhr.open("POST", url, true);
        xhr.setRequestHeader('X-CSRF-Token', $http.defaults.headers.post['X-CSRFToken']);
        xhr.send(data);
    }
}])




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