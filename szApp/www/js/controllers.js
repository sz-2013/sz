'use strict';

var ajax = {
    init: function(){
        return new XMLHttpRequest();
        },
    send: function(url,method,args,cookies, token,_callback){
        var q=ajax.init();
        q.open(method,url);
        q.onreadystatechange=function(){
                if(this.readyState==4 && this.status==200) {
                    _callback(this.responseText);
                }
            };
        if (cookies) {
            q.setRequestHeader('Cookie',cookies);
            q.setRequestHeader('X-CSRFToken',token);
        }
        if(method=='POST') {
            q.setRequestHeader('Content-type','application/x-www-form-urlencoded');
            q.send(args);
        } else {
            q.send(null);
        }
    }
}

var urls = {
    newsfeed :'#/feed',
    search :'#/',
    placeSelect :'#/places/select',
    map :'#/map',
    messageAdd :function(id){
        var id = id || ''
        return '#/messages/add/' + id.toString()
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
    homePathAuth :'#/',
    brand :'#',
    registration :'#/registration',
    wiki :'#'
}


var partials = {
    'regConfirm':'partials/registration-confirmation.html',
}


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


function MasterPageController($scope, $cookies, $http, $location, sessionService, staticValueService, geolocation) {
    $scope.$on("setShowLoader", function(e, val){$scope.showLoader=val});
    $scope.showContent = true;
    $scope.showFooter = false;
    $scope.showHeder = true;
    $scope.showMainPage = true;
    $scope.eventstart = false;  
    $scope.urls = urls;
    $scope.partials = partials;

    var races = staticValueService.races({}, function(r) {$scope.races = r.data.map(function(race){return randomSets(race) }); });
    var genders = staticValueService.genders({}, function(r) { $scope.genders = r.data; });
    var faces = staticValueService.faces({}, function(r) {$scope.faces = r.data; });

    geolocation.getCurrentPosition(
        function (position) { $scope.coordinates = position.coords;},
        function (error) { 
            $scope.coordinates = { longitude: 128, latitude: 56 };
            console.log(error)}
    )
        
    sessionService.current({}, function(session){
        $scope.session = session 
    });

    $scope.$watch('session.is_anonymous', function(newValue, oldValue) {
        if(newValue===undefined) return
        if(newValue===true&&$location.path()!=$scope.urls.registration.slice(1)){
            $location.path($scope.urls.login.slice(1))
            return
        }
        var token = $scope.session.token
        $http.defaults.headers.post['X-CSRFToken'] = token;
        $http.defaults.headers.put['X-CSRFToken'] = token;
    });

    $scope.logout = function(){
        console.log($http.defaults.headers.post['X-CSRFToken'])
        $scope.session.$logout()
    }    
}

//MasterPageController.$inject = ['$scope','$cookies', '$http', '$location', 'sessionService', 'staticValueService', 'geolocation'];

function HomeController($scope){}

