'use strict';
var szApp = angular.module(
    'sz.client',
    [
    'phonegap-servive',
    'sz.client.services',
    'sz.client.directives',
    'ngResource',
    'ngRoute',
    'ngCookies',
    'ngAnimate',
    /*'sz.raphael.directives',*/
    /*'navs-directive',*/
    'map-directive',
  /*  'leaflet-directive',
    ,*/
    /*'gamemap-directive',*/
//    'selectplace-directive'
    ]
)

szApp.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/', {templateUrl: 'partials/map.html', controller: MapController})
        .when('/login', {templateUrl: 'partials/login.html', controller: LoginController})
        .when('/registration', {templateUrl: 'partials/registration.html', controller: RigistrationController})
        .when('/messages/add/', {templateUrl: 'partials/message-add.html', controller: MessageAddController})
        .when('/map', {templateUrl: 'partials/map.html', controller: MapController})
        /*

        .when('/map', {templateUrl: 'partials/map.html', controller: GameMapController})
        //.when('/places/select/:placeId', {templateUrl: 'partials/place-select.html', controller: PlaceSelectionController})

        .when('/messages/:previewId/publish', {templateUrl: 'partials/message-pub.html', controller: MessagePublisherController})
        .when('/feed', {templateUrl: 'partials/news-feed.html', controller: NewsFeedController})

        //.when('/raphael', {templateUrl: 'raphael.html', controller: RaphaelController})
        .when('/newsfeed', {templateUrl: 'partials/newsfeed.html', controller: NewsFeedController})*/
        .otherwise({redirectTo: '/'});
}]);

szApp.config(['$httpProvider', function($httpProvider, $rootScope){
    $httpProvider.responseInterceptors.push(function($q, $rootScope) {
        return function(promise){
            return promise.then(function(response) {
                if (angular.isDefined(response.data.data))
                    response.data = response.data.data;
                return response;
            }, function(response) {
                console.error(angular.toJson(response.data));
                $rootScope.showLoader = false;
                return $q.reject(response);
            });
        }
    });
}]);

szApp.constant('ENDPOINT','LOCAL');