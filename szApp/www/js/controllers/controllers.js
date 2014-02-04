'use strict';
var urls = {
    newsfeed :'#/feed',
    search :'#/',
    placeSelect :'#/places/select',
    map :'#/map',
    messageAdd :function(){
        return '#/messages/add/'
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
    wiki :'#',
    afterMessageAdd: function(placeId){
        return '#'
    },
    getPath: function(name){
        var attrs_and_args = name.split('(')
        var path = attrs_and_args[0]
        var arg = (attrs_and_args.length>1) ? attrs_and_args[1].split(')')[0] : undefined
        if(typeof(path)==='string')return path.slice(1)
        if(typeof(path)==='function')return path(arg).slice(1)
    }

}


var partials = {
    'regConfirm':'partials/registration-confirmation.html',
}

var pageHeaders = {
    'main': 'main-header',
    'messageAdd': 'messageadd-header'
}

function objPop(obj) {
  for (var key in obj) {
    // Uncomment below to fix prototype problem.
    if (!Object.hasOwnProperty.call(obj, key)) continue;
    var result = obj[key];
    // If the property can't be deleted fail with an error.
    if (!delete obj[key]) { throw new Error(); }
    return result;
  } 
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


function MasterPageController($scope, $cookies, $http, $location, $timeout, sessionService, staticValueService, geolocation) {
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
    var coords = {latitude: 40.7755555, longitude: -73.9747221}
    geolocation.getCurrentPosition(
        function (position) {
            //$scope.coordinates = position.coords;
            $scope.coordinates = coords;
        },
        function (error) { 
            $scope.coordinates = coords;
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

    $scope.pageHeaders = pageHeaders;
    function setHeader(header){$scope.currHeader = 'partials/navs/headers/' + $scope.pageHeaders[header] + '.html'}
    $scope.$on("setHeader", function(e, header){setHeader(header)});

    $scope.logout = function(){$scope.session.$logout()}
    $scope.sendMessage = function(){$scope.$broadcast('sendMessage');}

    $scope.$on('$routeChangeStart', function(event, routeData){
        setHeader('main');
        $scope.showSideBar=false;
    });

    $scope.badges = {
        show: false,
        current: undefined,
        queue: [],
        update: function(newlist){
            if( !angular.isArray(newlist) ) var newlist = [newlist]
            for (var i = newlist.length - 1; i >= 0; i--) {
                var b = newlist[i];
                var name = String(Math.random()).slice(2, 12)
                b.name = name;
                $scope.badges.queue.push(b);
            };
            $scope.badges.setCurrent()
        },
        setCurrent: function(){
            if($scope.badges.current === undefined){
                $scope.badges.current = $scope.badges.queue.pop()
                $scope.badges.show = true;
                $timeout($scope.badges.hideBadge, 3000);
            }
        },
        hideBadge: function(){
            $scope.badges.show = false;
            $scope.badges.current = undefined;
            if($scope.badges.queue.length) $timeout($scope.badges.setCurrent, 1000);
        }
    }
}

//MasterPageController.$inject = ['$scope','$cookies', '$http', '$location', 'sessionService', 'staticValueService', 'geolocation'];

function HomeController($scope){}



