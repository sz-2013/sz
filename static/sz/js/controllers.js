function randomSets(r){
    function random(){
        return Math.floor(4 + Math.random() * 5)
    }
    r['fortune'] = random() 
    r['agillity'] = random()
    r['strength'] = random()
    r['intellect'] = random()
    return r
}

function MasterPageController($scope, $cookies, $http, $location, session, staticValueService) { 
    $scope.geoAccur = 4
    $scope.$on("setShowLoader", function(e, val){$scope.showLoader=val});
    var races = staticValueService.races({}, function(r) {
        $scope.races = r.data.map(function(race){return randomSets(race) }); 
    });
    var genders = staticValueService.genders({}, function(r) { $scope.genders = r.data; });
    var faces = staticValueService.faces({}, function(r) { 
        $scope.faces = r.data; 
    });
    $scope.$watch('session.email', function(newValue, oldValue) {
        $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
        $http.defaults.headers.put['X-CSRFToken'] = $cookies.csrftoken;
    });
    var getCurrentPosition = function (onSuccess, onError, options) {
        navigator.geolocation.getCurrentPosition(function () {
                var that = this,
                    args = arguments;

                if (onSuccess) {
                    $scope.$apply(function () {
                        onSuccess.apply(that, args);
                    });
                }
            }, function () {
                var that = this,
                    args = arguments;

                if (onError) {
                    $scope.$apply(function () {
                        onError.apply(that, args);
                    });
                }
            },
            options);
    }
    getCurrentPosition(
        function (position) { $scope.coordinates = position.coords; },
        function (error) { $scope.coordinates = { longitude: 128, latitude: 56 };}
    )
    session.current({}, function(session){$scope.session = session });
    /*$scope.$watch('session.is_authenticated', function(){
        if($scope.session.is_authenticated){
            $scope.session.radius = 250
        }
    })*/
    $scope.showContent = true;     
    $scope.headersIncude = {
        'main':'partials/headers/main.html',
        'message':'partials/headers/message.html',
    }
    $scope.headerCurrent = $scope.headersIncude.main
    $scope.setHeader = function(value){
        $scope.headerCurrent = $scope.headersIncude[value]
    }   


    $scope.urls = {
        newsfeed :'#/feed',
        search :'#/',
        placeSelect :'#/places/select',
        map :'#/map',
        messageAdd :function(id){
            var id = id || ''
            return '#/messages/edit/' + id.toString()
        },
        place :function(id){
            var url = '#/places/' + id
            return url
        },
        user :'#',
        login :'#/login',
        passRecovery :'#',
        signinNext :'#/feed',
        homePathAnon :'#',
        homePathAuth :'#/feed',
        brand :'#',
        registration :'#/registration',
        wiki :'#'
    } 
}

var events = {}

MasterPageController.$inject = ['$scope','$cookies', '$http', '$location', 'sessionService', 'staticValueService'];

function HomeController($scope){}



function NewsFeedController($routeParams, $location, $scope, placeService){
    $.each($scope.mainNav, function(n, val){
        $scope.mainNav[n] = ''
    })
    $scope.mainNav.newsfeed = 'active';
    $scope.radiusActive = 0
    $scope.changePath = function(){
        var params = {}
        if($scope.category)params.category = $scope.category.id;
        if($scope.radiusActive)params.radius = $scope.radiusActive;
        var url = $scope.url.newsfeed;
        $location.path(url.slice(1,url.length)).search(params)
    }   
    $scope.loadMorePlaces = function(){
        if ($scope.feed.params.offset + $scope.feed.params.limit < $scope.feed.count)
        {
            $scope.feed.params.offset += $scope.feed.params.limit;
            var feed = placeService.newsfeed($scope.feed.params, function() {
                    if(feed.results.length>0){
                        $.each(feed.results,function(index,r){
                            $scope.feed.results.push(r)
                        });
                        $scope.feed.params = feed.params;
                    }
                }
            );
        }
    } 
    $scope.$watch('coordinates', function(newValue, oldValue) {
        if (angular.isDefined($scope.coordinates)){
            var params = {};
            if($routeParams.radius){
                params.radius = $routeParams.radius
                $scope.radiusActive = params.radius
            }
            if($routeParams.query) params.query = $routeParams.query;
            if($routeParams.category) {
                params.category = $routeParams.category;
            }
            params.longitude = $scope.coordinates.longitude;
            params.latitude = $scope.coordinates.latitude;
            $scope.feed = placeService.newsfeed(
                params, function(){
                    if(params.category){
                        $scope.$watch('categories', function(){if($scope.categories){
                            var category = $scope.categories.filter(function(c){return c.id==params.category})
                            $scope.category = (category.length==1) ? category[0] : ''                            
                        }})
                    }
                }
            );
        }
    });
}



function RaphaelController($scope){}

function GameMapController($scope, placeService, gameMapService, $routeParams, $location){
    $scope.isMessage = $routeParams.message
    $scope.messagePlace = $routeParams.place
    
    var params =new Object;    
    $scope.inProgress = false    
    /*$scope.$emit("setShowLoader", true)*/
    $scope.$watch('coordinates',function(){     
        if($scope.coordinates){                        
            /*params.latitude = $scope.coordinates.latitude 
            params.longitude = $scope.coordinates.longitude*/
            params.latitude = 50.2616113
            params.longitude = 127.5266082
            /*params.latitude = 0
            params.longitude = 0*/
            params.radius = 250
            /*var new_places = placeService.exploreInVenues(params, function(r) { 
                $scope.explored_val = r.places_explored
                $scope.zp_add_val = 10*/
                $scope.explored_val = 0
                var gamemap = gameMapService.getMap(params, function(r){
                    $scope.gamemap = r.gamemap
                    $scope.current_box = r.current_box
                    $scope.showMap = $scope.current_box ? $scope.current_box.id : false
                    $scope.last_box = r.last_box
                    $scope.map_width = r.map_width
                    $scope.map_height = r.map_height
                    $scope.radius = params.radius
                    if(!$scope.messagePlace){
                        var places_list = placeService.searchInVenues(params, function(r) { 
                            $scope.places_list = r.places
                            $scope.showPlaceSelect = true;
                            $scope.$emit("setShowLoader", false)
                        });    
                    }
                    else $scope.$emit("setShowLoader", false)
                });
           /* });*/
        }        
    })   
}