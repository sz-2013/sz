'use strict';
function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}
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
        if(typeof(path)==='string')return this[path].slice(1)
        if(typeof(path)==='function')return this[path](arg).slice(1)
    }

}

var navigationPaths = {
    mainTL: 'partials/navs/navigation/main/score.html',
    mainTR: 'partials/navs/navigation/main/add.html',
    mainBL: 'partials/navs/navigation/main/menu.html',
    mainBR: '',
    map_backtopath: 'partials/navs/navigation/map/backtopath.html',
    map_runpath: 'partials/navs/navigation/map/runpath.html',
    map_ppcontrol: 'partials/navs/navigation/map/ppcontrol.html',
    map_custompath: 'partials/navs/navigation/map/custompath.html',
    map_gboxdetail: 'partials/navs/navigation/map/gboxdetail.html',
}


var partials = {
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


function random(min, max){
    var min = min || 0;
    var max = max || 1
    if(min) var max = max - min;
    var max = max + 1;
    return Math.floor(min + Math.random() * max)
}

function randomSets(r){

    r['fortune'] = random(4, 9)
    r['agillity'] = random(4, 9)
    r['strength'] = random(4, 9)
    r['intellect'] = random(4, 9)
    return r
}


function MasterPageController($scope, $cookies, $http, $location, $timeout, sessionService, staticValueService, geolocation) {
    $scope.$on("setShowLoader", function(e, val){$scope.showLoader=val});
    $scope.showContent = true;
    $scope.showFooter = true;
    $scope.showHeder = true;
    $scope.showMainPage = true;
    $scope.eventstart = false;
    $scope.urls = urls;
    $scope.partials = partials;
    $scope.isForcedLandscape = false;

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

    function redirectAnonymous(){
        var s = $scope.session;
        if(s!==undefined&&s.is_anonymous===true&&$location.path()!==$scope.urls.getPath('registration')){
            $location.path($scope.urls.login.slice(1))
            return true
        }
        return
    }
    $scope.$watch('session.is_anonymous', function(newValue, oldValue) {
        if(newValue===undefined) return
        if(redirectAnonymous()) return
        var token = $scope.session.token
        $http.defaults.headers.post['X-CSRFToken'] = token;
        $http.defaults.headers.put['X-CSRFToken'] = token;
    });

    /*$scope.pageHeaders = pageHeaders;
    function setHeader(header){$scope.currHeader = 'partials/navs/headers/' + $scope.pageHeaders[header] + '.html'}
    $scope.$on("setHeader", function(e, header){setHeader(header)});*/

    $scope.logout = function(){$scope.session.$logout()}
    $scope.sendMessage = function(){$scope.$broadcast('sendMessage');}



    /*$scope.$on('setShowHeaders', function(e, val){
       $scope.showHeder = val;
        $scope.showFooter = val;
    })*/

    var badges = function(){
        var tmChange = 1000;
        var tmShow = 10000;
        function _getBadgesExplored(value){
            return {header: 'Wow!', body: 'You explored ' + value.places + ' new places', cls: 'success'}
        }
        return {
            _in_show: false,
            show: false,
            current: undefined,
            queue: [],
            update: function(newlist){
                if( !angular.isArray(newlist) ) var newlist = [newlist]
                for (var i = newlist.length - 1; i >= 0; i--) {
                    $scope.badges.queue.push(newlist[i]);
                };
                $scope.badges.setCurrent()
            },
            setCurrent: function(){
                if($scope.showLoader) return $timeout($scope.badges.setCurrent, 100);
                if($scope.badges.current === undefined){
                    $scope.badges.current = $scope.badges.queue.pop()
                    $scope.badges.show = true;
                    $timeout($scope.badges.hideBadge, tmShow);
                }
            },
            hideBadge: function(){
                $scope.badges.show = false;
                $scope.badges.current = undefined;
                if($scope.badges.queue.length) $timeout($scope.badges.setCurrent, tmChange);
            },
            setBadges: function(value){
                var badge;
                if(value.name=='explored') var badge = _getBadgesExplored(value)

                if(badge) $scope.badges.update(badge)
            }
        }
    }
    $scope.badges = badges();


    var navigation = function(){
        var paths = navigationPaths
        return {
            currTL: '',
            currTR: '',
            currBL: '',
            currBR: '',
            hideAll: function(){
                this.setTL()
                this.setTR()
                this.setBL()
                this.setBR()
            },
            setTL: function(val){
                this.currTL = val ? paths[val] : ''
            },
            setTR: function(val){
                this.currTR = val ? paths[val] : ''
            },
            setBL: function(val){
                this.currBL = val ? paths[val] : ''
            },
            setBR: function(val){
                this.currBR = val ? paths[val] : ''
            },
            setNormal: function(){
                this.hideAll();
                this.setTL('mainTL')
                this.setTR('mainTR')
                this.setBL('mainBL')
            }
        }
    }

    $scope.navigation = navigation();
    $scope.$on('navigation-hideall', function(){$scope.navigation.hideAll()})
    $scope.$on('navigation-setTL', function(e, val){$scope.navigation.setTL(val)})
    $scope.$on('navigation-setTR', function(e, val){$scope.navigation.setTR(val)})
    $scope.$on('navigation-setBL', function(e, val){$scope.navigation.setBL(val)})
    $scope.$on('navigation-setBR', function(e, val){$scope.navigation.setBR(val)})
    $scope.$on('navigation-setNormal', function(e, val){$scope.navigation.setNormal()})

    $scope.$on('$routeChangeStart', function(event, routeData){
        /*setHeader('main');*/
        redirectAnonymous();
       /* $scope.showHeder = true;
        $scope.showFooter = true;*/
        $scope.navigation.setNormal()
        $scope.bodyScroll = true;
    });

    $scope.$on('setBodyScroll', function(e, val){$scope.bodyScroll = val;});

/*    $scope.$on('map-disablegBoxDetail', function(e, isDisable){
        var cls = isDisable ? 'disabled' : ''
        console.log(cls)
        $scope.disablegBoxDetail = cls;
    });*/

    $scope.map_setHideGameMapShowPath = function(){
        $scope.$broadcast('setGameMap', false);
        $scope.$broadcast('clearPPControl')}
    $scope.map_runPath = function(){$scope.$broadcast('runPath', true) }
    $scope.map_ppcontrol_add = function($event){$scope.$broadcast('ppcontrol_add', $event.currentTarget) }
    $scope.map_ppcontrol_remove = function($event){$scope.$broadcast('ppcontrol_remove', $event.currentTarget) }
    $scope.map_customPath = function(){$scope.$broadcast('customPath')}
    $scope.map_gBoxDetail = function(){$scope.$broadcast('gBoxDetail')}
}

//MasterPageController.$inject = ['$scope','$cookies', '$http', '$location', 'sessionService', 'staticValueService', 'geolocation'];

function HomeController($scope){
    $scope.$emit('setShowHeaders', false)
}



function MapJSController($scope){}