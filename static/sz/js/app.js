'use strict';
var szApp = angular.module(
    'sz.client', 
    ['sz.client.directives', 
    'sz.client.services', 
    'ngResource', 
    'ngCookies', 
    'leaflet-directive', 
    'raphael-directive',
    'slidebar-directive'
    ]
)

szApp.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/', {templateUrl: 'partials/home.html', controller: HomeController})
        .when('/login', {templateUrl: 'partials/login.html', controller: LoginController})
        .when('/registration', {templateUrl: 'partials/registration.html', controller: RigistrationController})
        .when('/places/select', {templateUrl: 'partials/place-select.html', controller: PlaceSelectionController})
        .when('/messages/:previewId/edit', {templateUrl: 'partials/message-edit.html', controller: MessageEditorController})
        .when('/messages/:previewId/publish', {templateUrl: 'partials/message-pub.html', controller: MessagePublisherController})
        .when('/feed', {templateUrl: 'partials/news-feed.html', controller: NewsFeedController})

        .when('/raphael', {templateUrl: 'raphael.html', controller: RaphaelController})
        /*.when('/newsfeed', {templateUrl: 'partials/newsfeed.html', controller: NewsFeedController})*/
        /*.otherwise({redirectTo: '/'});*/
}]);

szApp.config(['$httpProvider', function($httpProvider){
    $httpProvider.responseInterceptors.push(function($q) {
        return function(promise){
            return promise.then(function(response) {
                if (angular.isDefined(response.data.data))
                    response.data = response.data.data;
                return response;
            }, function(response) {
                console.error(angular.toJson(response.data));
                return $q.reject(response);
            });
        }
    });
}]);

szApp.constant('ENDPOINT','LOCAL');