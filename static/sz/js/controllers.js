function MasterPageController($scope,$cookies, $http, $location, session, staticValueService) { 
    $scope.geoAccur = 4
    var races = staticValueService.races({}, function(r) { 
        $scope.races = []; 
        $.each(r.data,function(key, race){            
            race['fortune'] = Math.floor(4 + Math.random() * 5)
            race['agillity'] = Math.floor(4 + Math.random() * 5)
            race['strength'] = Math.floor(4 + Math.random() * 5)
            race['intellect'] = Math.floor(4 + Math.random() * 5)            
            $scope.races.push(race)
        })
    });
    var categories = staticValueService.categories({}, function(r) { $scope.categories = r.data; });
    var genders = staticValueService.genders({}, function(r) { $scope.genders = r.data; });

    $scope.myClasses = {
        'btn': {
            'main':'btn btn-primary btn-lg',
            'mainBig' :'btn btn-primary btn-lg btn-block',
            'second':'btn btn-default btn-lg',
            'radio':'btn btn-default',
        },
    }
    $scope.mainNav = {
        newsfeed:'',
        search:'',
        post:''
    }
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
    $scope.redirectAuth = function(){
        /*if($scope.session.is_authenticated){
            var path = $scope.url.homePathAuth
            $location.path(path.slice(1,path.length))
        }        */
    }    
    $scope.redirectAnon = function(){
        /*if($scope.session.is_anonimous){
            var path = $scope.url.homePathAuth
            $location.path(path.slice(1,path.length))
        }        */
    }
    $scope.showContent = true;
    $scope.partials = {
        'regConfirm':'partials/registration-confirmation.html',
        'messageEdit':'partials/message-edit-sub.html',
    }
    //and Place url
    $scope.url = {
        'newsfeed':'#/feed',
        'search':'#/',
        'placeSelect':'#/places/select',
        'messageEdit':function(id){
            var url = '#/messages/' + id.toString() + '/edit'
            return url
        },
        'messagePub':function(id){
            var url = '#/messages/' + id.toString() + '/publish'
            return url
        },
        'place':function(id){
            var url = '#/places/' + id
            return url
        },
        'user':'#',
        'login':'#/login',
        'passRecovery':'#',
        'signinNext':'#/feed',
        'registration':'#',
        'homePathAnon':'#',
        'homePathAuth':'#/feed',
        'brand':'#',
        'registration':'#/registration',
        'wiki':'#'
    }    
    $scope.headersIncude = {
        'main':'partials/headers/main.html'
    }
    $scope.headerCurrent = $scope.headersIncude.main
    $scope.setHeader = function(value){
        $scope.headerCurrent = $scope.headersIncude[value]
    }
    $scope.isTopMenuCollapsed = true;
    $scope.toggleTopMenu = function(){
        $scope.isTopMenuCollapsed = !$scope.isTopMenuCollapsed;
    }
    
}

var events = {}

MasterPageController.$inject = ['$scope','$cookies', '$http', '$location', 'sessionService', 'staticValueService'];

function HomeController($scope){}

function LoginController($scope, $location){
    $scope.$watch('session',function(){        
        if($scope.session){            
            $scope.redirectAuth()
        }
    }) 
    $scope.tmlText = {
        'header':{
            'main':'Sign In'
        },
        'btn':{
            'signin':'Sign In',
            'reg':'Registration'    
        },
        'lbl':{
            'inputPassword':'Password',
            'inputEmail':'Email',
        },
        'cb':{
            'remember':'Remember me'
        },
        'el':{
            'forgotpass':'Forgot your password?'    
        }        
    }
    $scope.inProgress = false;
    $scope.loginAlert = new Object;
    $scope.showResendBut = false;
    $scope.login = function(email, password){
        $scope.inProgress = true;
        $scope.session.email = email;
        $scope.session.password = password;
        var session = $scope.session.$login(            
            function(response){      
                $scope.session = session
                $scope.inProgress = false;
                $location.path($scope.url.homePathAuth)
            },
            function(error){                         
                if(error.status==400){   
                    $scope.loginAlert = error.data.data
                }
                else{
                    $scope.user = {"email":email}
                    $scope.showResendBut = true;
                }
                $scope.inProgress = false;
            }
        );

    }
}
function RigistrationController($scope, userService){    
    //Dont forget uncoment this
  /*  $scope.$watch('session',function(){
        if($scope.session){$scope.redirectAuth()}
    }) */
    $scope.user = {'gender':'u'};
    $scope.tmlText = {
        'header': {
            'main':'Registration',
        },
        'hint':{
            'gender': 'If it is a secret or if you are not sure - choose "Smile".',
            'race':'A race will determine your characteristics and talents. Be attentively, because you will can not change it in the future.',
            'wiki':'See more about it on wiki.'
        },
        'lbl':{
            'inputEmail':'Email',
            'inputPassword1':'Password',
            'inputPassword2':'Password again',
            'gender':'Choose your gender',
            'race':'Choose your race',
            'fortune':'Fortune: ',
            'agillity':'Agillity: ',
            'strength':'Strength: ',
            'intellect':'Intellect: ',
        },
        'btn':{
            'registration':'Do it!'
        },
    }
    var errorsText = {
        'email':{
            'nullvalue':'You must give a some email to us',
            'short':'Your email is to short for email',
            'long':'Your email is to long for email'
        },
        'password':{
            'nullvalue':'You need a password',
            'short':'Your password is to short',
            'long':'Your password is to long, crazy criptomaniac',
            'notmatch':'Passwords are not match'
        },      
        'race':{
            'nullvalue':'You must choose a race',
        },
    }
    $scope.tmlText.errorsText = errorsText

    $scope.inProgress = false;
    $scope.regStage1 = true
    var values_is_right = function(){
        if(
            $scope.user.email && $scope.user.email.length<72 && $scope.user.email.length>2 && 
            $scope.user.race && 
            $scope.user.password1 && $scope.user.password1.length>2 && $scope.user.password1.length<128 &&
            $scope.user.password2 && $scope.user.password1==$scope.user.password2
        ){return true}         
    }
    $scope.registration = function(){
        if(values_is_right()){
            $scope.inProgress = true
            var user = $scope.user
            user.race = $scope.user.race.id
            for (var i in $scope.genders){
                var g = $scope.genders[i]
                if(g.name==$scope.user.gender){
                    user.gender = g.id
                }
            }                    
            userService.register(user,
                function(response){
                    $scope.regStage1 = false
                    $scope.inProgress = false
                },
                function(error){
                    $scope.loginAlert = error.data.data
                    $scope.inProgress = false
            })            
        }
        else{
            $scope.loginAlert = {
                'email':[],
                'password1':[],
                'race':[]
            };
            if(!$scope.user.email){$scope.loginAlert.email.push($scope.tmlText.errorsText.email.nullvalue)}
            if(!$scope.user.race){$scope.loginAlert.race.push($scope.tmlText.errorsText.race.nullvalue)}
            if(!$scope.user.password1){$scope.loginAlert.password1.push($scope.tmlText.errorsText.password.nullvalue)} 
        }
    }


}

function RegistrationConfirmation($scope, userService){
    $scope.inProgress = false;
    $scope.tmlText = {
        'header':{'main':'Confirmation'},
        'el':{
            'response':'We did it again',
            'instruction':'We sent a letter with key on your email. Please, check your inbox and visit the link from our email for confirmation your registration'
        },
        'btn':{
            'resend':'Resend a key',
            'return':'Back to site',
            'loading':'Sending'
        }

    }
    $scope.confirmation = function(email){
        delete $scope.confirmationResponse
        delete $scope.confirmationError
        $scope.inProgress = true;
        userService.resend_activation_key({'email': email},
        function(response){
            $scope.inProgress = false;
            $scope.confirmationResponse = $scope.tmlText.el.response;
        },
        function(error){
            $scope.inProgress = false;
            $scope.confirmationError = error.data});
    }
}

function PlaceSelectionController($scope, placeService){
    //@TODO:половина мест определяется как китай-не знаю даже что с этим делать  
    /*$scope.center = {zoom:1, lat: 0, lng: 0}*/
    $scope.tmlText = {
        header:{
            main:'New post'
        },
        hint:{
            main:'Choose a place for new post',            
            search:'Search',
            explore:'Explore'
        },
        btn:{
            search:''
        },
        el:{
            distancev:'m',
            searchtips:{
                searchLimit:4
            }
        }
    }
    $scope.tmlText.btn.search = $scope.tmlText.hint.search
    
    /*$scope.markers = {}
    $scope.placesQuery = []
    $scope.circles = {}
    var local_icons = {
        blue_icon: L.icon({
            iconUrl: 'http://cdn.leafletjs.com/leaflet-0.6.4/images/marker-icon.png',
            shadowUrl: 'http://cdn.leafletjs.com/leaflet-0.6.4/images/marker-shadow.png',
            iconSize: [25,41],
            shadowSize: [41, 41],            
            iconAnchor: [12, 41],            
            shadowAnchor: [4, 62],
            popupAnchor: [1,-34],
            sense: 'in_radius'
        }),
        green_icon: L.icon({
            iconUrl: 'img/marker-icon-green.png',
            shadowUrl: 'img/marker-shadow.png',
            iconSize: [25,41],
            shadowSize: [41, 41],            
            iconAnchor: [12, 41],            
            shadowAnchor: [4, 62],
            popupAnchor: [1,-34],
            sense: 'new'
        }),
        orange_icon: L.icon({
            iconUrl: 'img/marker-icon-orange.png',
            shadowUrl: 'img/marker-shadow.png',
            iconSize: [25,41],
            shadowSize: [41, 41],            
            iconAnchor: [12, 41],            
            shadowAnchor: [4, 62],
            popupAnchor: [1,-34]
        }),
        gray_icon: L.icon({
            iconUrl: 'img/marker-icon-gray.png',
            shadowUrl: 'img/marker-shadow.png',
            iconSize: [25,41],
            shadowSize: [41, 41],            
            iconAnchor: [12, 41],            
            shadowAnchor: [4, 62],
            popupAnchor: [1,-34],
            sense: 'out_radius'
        }),
        user_icon: L.icon({
            iconUrl: 'img/user-marker.png',
            shadowUrl:'img/marker-shadow.png',
            iconSize: [25,25],
            shadowSize: [0, 0],            
            iconAnchor: [12, 12],            
            shadowAnchor: [4, 62],
            popupAnchor: [1,-12]
        }),
    }*/
    
    var params = {};    
    $scope.inProgress = false    
    /*$scope.$watch('session',function(){
        if($scope.session){
            params.radius = $scope.session.radius || 250
        }
    }) */

    /*function createMarkers(list,icon){
        for(var i in list){
            var p = list[i].place,
                distance = list[i].distance;
            p.distance = Math.round(distance)
            var m = {
                    lat:p.latitude,lng:p.longitude,
                    icon:icon,
                    place:p,
                    message:'<div class="text-center">' + p.distance + ' ' + $scope.tmlText.el.distancev + '</div>'
                },
                key = p.id.toString(); 
            if(!(key in $scope.markers)){
                $scope.markers[key] = m                   
            }            
        }
    }
    function exploreHere(p, tips){
        var markerNewIcon = local_icons.green_icon;
        $scope.inProgress = true     
        var placesNew = placeService.exploreInVenues(p, function(r) { 
            createMarkers(placesNew.data,markerNewIcon)
            if(tips){searchInRecievedPlaces()}
            $scope.inProgress = false            
        });
    }
    function searchHere(p, explore, tips){
        //@TODO:когда начинаешь перемещаться по карте - отсылаются же координаты центра карты
        //и поэтому дистанция не от пользователя, а от центра карты        
        var explore = explore || false,
            tips = tips || false
        if($scope.inProgress==false){
            $scope.inProgress = true     
            var markerInIcon = explore && local_icons.blue_icon || local_icons.gray_icon,
                markerOutIcon = local_icons.gray_icon;            
            var places = placeService.searchInVenues(p, function(r) { 
                createMarkers(places.in_radius,markerInIcon)
                createMarkers(places.out_radius,markerOutIcon)                
                if(explore){exploreHere(p, tips)}
                else{searchInRecievedPlaces()}
                if($scope.center.lat===0&&$scope.center.lng===0) {
                    $scope.center = {'zoom':16, 'lat': params.latitude, 'lng': params.longitude };}
            });
            $scope.inProgress = false
        }
    }
    $scope.searchWithQuery = function(){
        var explore = false
        if($scope.center.lat==params.latitude && $scope.center.lng==params.longitude){var explore=true}
        var p = {
            latitude:$scope.center.lat,
            longitude:$scope.center.lng,
            radius:params.radius,
            query:$scope.searchQuery
        }
        searchHere(p,explore, tips)
    }
    var searchInRecievedPlaces = function (){
        if($scope.searchQuery){
            var query = $scope.searchQuery.toLowerCase();
            $scope.placesQuery = []
            function queryInPlace(p){
                if(p.name.toLowerCase().indexOf(query)>=0){return true}
                if(p.address && p.address.toLowerCase().indexOf(query)>=0){return true}
                return false
            }
            for(var i in $scope.markers){
                if(i!='user'){
                    var m = $scope.markers[i],
                        p = m.place,
                        sense = m.icon.sense;
                    p.sense = sense
                    if(queryInPlace(p)){
                        $scope.placesQuery.push(p)
                    }
                }
            }
            if($scope.placesQuery.length){                
                $scope.showSearchTips = true}
        }
    }
    $scope.showSearchTips = false    
    $scope.$on('searchTipsClick',function(e,place){
        $scope.place = place
        $scope.searchQuery = ''
        $scope.center.lat = place.latitude
        $scope.center.lng = place.longitude
        $scope.markers[place.id.toString()].focus = true        
    })    
    $scope.$on('leafletDirectiveMap.click', function(event,e){
        if($scope.center.lat==0 && $scope.center.lng==0){
            $scope.center = {'zoom':16, 'lat': params.latitude, 'lng': params.longitude }
        }
    }); 
    $scope.$on('leafletDirectiveMarker.click', function(event,e){
        var markerName = e.markerName.toString(),
            m = $scope.markers[markerName];
        $scope.place = m.place
    });
    $scope.$watch('searchQuery',function(){
        $scope.showSearchTips = false
        $scope.tmlText.btn.search = $scope.tmlText.hint.search
        searchInRecievedPlaces()
    })
    $scope.$watch('center.lat',function(){
        if($scope.center.lat!=0 && $scope.center.lng!=0 && 
            $scope.center.lat.toFixed($scope.geoAccur)!=params.latitude.toFixed($scope.geoAccur) &&
            $scope.center.lng.toFixed($scope.geoAccur)!=params.longitude.toFixed($scope.geoAccur)){
            var p = {latitude:$scope.center.lat, longitude:$scope.center.lng, radius: params.radius}
            searchHere(p)
        }
    })*/
    $scope.$watch('coordinates',function(){     
        if($scope.coordinates){                        
            params.latitude = $scope.coordinates.latitude
            params.longitude = $scope.coordinates.longitude
            params.radius = params.radius || 250          
            /*$scope.markers.user = {lat: params.latitude, lng: params.longitude, message: "It is you", icon:local_icons.user_icon}             
            $scope.circles.user = {
                fillColor:'white',
                weight: 1,
                opacity: 1,
                color: '#E31A1C',
                dashArray: '5, 5',
                radius:params.radius,
                type:'circle',
                latlngs: { lat: params.latitude, lng: params.longitude },
            }            */
            /*searchHere(params,true)*/

            //first do explore in point
            var new_places = placeService.exploreInVenues(params, function(r) { 
                console.log(r)
            });
        }        
    })
}
function MessageEditorController($scope){}
function MessageEditorControllerSub($scope, messagePreviewService, $routeParams, $location){    
    if (angular.isDefined($routeParams.placeId))
        placeService.get({placeId: $routeParams.placeId}, function(resp){ $scope.placeHeader = resp; })  
    if (angular.isDefined($routeParams.previewId))
        messagePreviewService.get({previewId: $routeParams.previewId}, function(response){
            $scope.text = response.text || '';            
            $scope.photoUrl = response.photo && response.photo.thumbnail || '';
            $scope.placeHeader = response.place;
        });
    $scope.tmlText ={        
        btn:{submit:'Send'},
        hint:{
            message: 'You should write some text or pick photo for post or set your emotion. Or all.',            
        },
    }
 
    $scope.photo = {'name':''};

    $scope.remove = function(){
        $scope.photo = $scope.photo
    }    
    $scope.send = function() {    
        $scope.inProgress = true;
        var message = new FormData();
        
        message.append( 'place', /*$routeParams.placeId*/150);
        if($scope.text){message.append( 'text', $scope.text);}
        if($scope.photo.name){
            message.append( 'photo', $scope.photo);}

        var redirectToPublish = function(previewId){
            var url = $scope.url.messagePub(previewId);
            var pub_page_url = url.slice(1,url.length);
            $location.path(pub_page_url);
        }

        if (angular.isUndefined($routeParams.previewId))
            messagePreviewService.create(message,
                function(response){
                    $scope.inProgress = false;
                    $scope.response = response;
                    var url = $scope.url.messageEdit(response.id);
                    var edit_page_url = url.slice(1,url.length);
                    history.replaceState(null, "SZ - Edit message", '#' + edit_page_url);
                    redirectToPublish(response.id);
                },
                function(error){alert(angular.toJson(error, true));});
        else
            messagePreviewService.update($routeParams.previewId, message,
                function(response){
                    $scope.inProgress = false;
                    $scope.response = response;
                    redirectToPublish(response.id);
                },
                function(error){alert(angular.toJson(error, true));});
    }


}

function MessagePublisherController($scope, messagePreviewService,staticValueService, $routeParams, $location){
    $.each($scope.mainNav, function(n, val){
        $scope.mainNav[n] = ''
    })
    $scope.mainNav.post = 'active';
    $scope.tmlText = {
        header:{
            main:'New post'
        },
        hint:{
            emotion: 'Choose your emotion from this place and close all faces on the photo',
            /*faces: 'One of this mask will close your face on a photo'*/
        },
        btn:{
            submit:'Send'
        },
    }
    

    var faces = staticValueService.faces({}, function(r) { 
        $scope.faces = r.data; 
        $scope.faceId = $scope.faces[0].id
    }); 
    $scope.emt='indifferent' 
    $scope.$on('updateFace', function(event, face){
        $scope.face = face
    })
    $scope.action = 1;
    $scope.canvas = {}
    $scope.images = {photo:{events:{mousedown:'drawnewface'} } }
    
    if (angular.isDefined($routeParams.previewId))
    var preview = messagePreviewService.get({previewId: $routeParams.previewId}, function(){
        $scope.preview = preview;
        $scope.preview.photo.faces = {}
        $scope.placeHeader = preview.place;
        $scope.add_categories = []
        if (preview.photo.reduced){
            $scope.photo = preview.photo.reduced
            $scope.canvas.width = $scope.photo.width
            $scope.canvas.height = $scope.photo.height
            $scope.images.photo.src = $scope.photo.url            
        }
        else{
            $scope.photo = ''
            $scope.canvas.height = 1
            $scope.canvas.width = 1
        }
      /*  $.each($scope.categories, function(index,cat){$scope.add_categories.push(cat)});
        $.each($scope.preview.categories, function(index,catID){
            $.each($scope.categories,function(index,cat){
                if(catID == cat.id){
                    $scope.new_message_categories.push(cat)
                }
            });
        });            
        for (i in $scope.add_categories){
            var cat = $scope.add_categories[i];
            for (j in $scope.preview.categories){
                var catID = $scope.preview.categories[j]
                if(catID==cat.id){$scope.add_categories.splice(i,1)}
            }
        }  */              
        
    });    
    
    $scope.addCat = function(){
        if($scope.add_message_category){
            $scope.new_message_categories.push($scope.add_message_category);
            for (i in $scope.add_categories){
                var cat = $scope.add_categories[i];
                if(cat.id==$scope.add_message_category.id){
                    $scope.add_categories.splice(i,1)
                }
            }
            $scope.add_message_category = ''
        }
    }
    
    $scope.$on('raphaelDirectiveFaces.pushBBox', function(e, data){
        $scope.preview.photo.list = data
    }) 
    $scope.$on('raphaelDirectiveCanvas.pushBBox', function(e, data){
        $scope.preview.photo.box = data
    }) 
    $scope.removeCat = function(messageCat,index){
        $scope.new_message_categories.splice(index, 1);
        $scope.add_categories.push(messageCat)
    }
    $scope.send = function(){
        $scope.preview.latitude = $scope.coordinates.latitude
        $scope.preview.longitude = $scope.coordinates.longitude
        $scope.$broadcast('raphaelDirectiveFaces.getBBox')
        $scope.$broadcast('raphaelDirectiveCanvas.getBBox')
        /*$scope.preview.photo.faces.photoBox = $scope.photoBox    */
        $scope.face = $scope.face.id
        $scope.preview.$publish(
            {},
            function(response){
                $scope.response = response
                /*var path = $scope.url.place($scope.preview.place.id)*/
                /*var url = path.slice(1,path.length)
                var path = '/places/' + $scope.preview.place.id;*/
                var path = '/'
                $location.path(path);
            },
            function(error){
                $scope.inProgress = false;
                throw "can't publish";
            }
        )
    }



}
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

