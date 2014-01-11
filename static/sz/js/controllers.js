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
    var categories = staticValueService.categories({}, function(r) { $scope.categories = r.data; });
    var genders = staticValueService.genders({}, function(r) { $scope.genders = r.data; });
    var faces = staticValueService.faces({}, function(r) { 
        $scope.faces = r.data; 
    }); 
    $scope.myClasses = {
        'btn': {
            'main':'btn btn-primary btn-lg',
            'mainBig' :'btn btn-primary btn-lg btn-block',
            'second':'btn btn-default btn-lg',
            'radio':'btn btn-default',
        },
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
        mapSelect :'#/map?message=true',
        messageEdit :function(id){
            var id = id || ''
            return '#/messages/edit/' + id.toString()
        },
        messagePub :function(id){
            return '#/messages/' + id.toString() + '/publish'
        },
        place :function(id){
            var url = '#/places/' + id
            return url
        },
        user :'#',
        login :'#/login',
        passRecovery :'#',
        signinNext :'#/feed',
        registration :'#',
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

function LoginController($scope, $location){
    $scope.$watch('session',function(){        
        if($scope.session){            
            $scope.redirectAuth()
        }
    });
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
    $scope.user = {'gender':'u'};
    var errorsText = {
        email:{
            'nullvalue':'You must give a some email to us',
            'short':'Your email is to short for email',
            'long':'Your email is to long for email'
        },
        password:{
            'nullvalue':'You need a password',
            'short':'Your password is to short',
            'long':'Your password is to long, crazy criptomaniac',
            'notmatch':'Passwords are not match'
        },      
        race:{
            'nullvalue':'You must choose a race',
        },
    }
    $scope.tmlText = {}
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
    $scope.confirmation = function(email){
        delete $scope.confirmationResponse
        delete $scope.confirmationError
        $scope.inProgress = true;
        userService.resend_activation_key({'email': email},
        function(response){
            $scope.inProgress = false;
            $scope.confirmationResponse = 'We did it again';
        },
        function(error){
            $scope.inProgress = false;
            $scope.confirmationError = error.data});
    }
}


function MessageEditorController($scope, messagePreviewService, $routeParams, $location, placeService){  
    $scope.setHeader("message")  
    if ($routeParams.placeId){
        placeService.get({placeId: $routeParams.placeId}, function(r){ $scope.messagePlace = r; })  
    }
    else{
        /*$scope.$emit("setShowLoader", true)*/
        var params = {}
        $scope.$watch('coordinates',function(){     
            if($scope.coordinates){                        
                /*params.latitude = $scope.coordinates.latitude 
                params.longitude = $scope.coordinates.longitude*/
                params.latitude = 50.2616113
                params.longitude = 127.5266082
                /*params.latitude = 0
                params.longitude = 0*/
                params.radius = 250
              /*  var places_list = placeService.searchInVenues(params, function(r) { 
                    $scope.places_list = r.places
                    $scope.showPlaceSelect = true;
                    $scope.$emit("setShowLoader", false)
                }); */   
            }        
        })   
    }    
    $scope.$on("selectItem", function(i, item){
        $scope.messagePlace = item;
        $scope.showPlaceSelect = false;
    });    
    $scope.showPlaceSelect = false;
    $scope.$on("setShowPlaceSelect",function(i ,val){
        $scope.showPlaceSelect = val
    })
    $scope.messageCategoriesList = new Array;
    $scope.$on("addCategory", function(i, newcat){
        
        if($scope.messageCategoriesList.filter(function(cat){return cat.id==newcat.id}).length){
            //remove cat
        }
        else{
            //add cat
            $scope.messageCategoriesList.push(newcat)
        }
    });
    $scope.$on("setShowEditPhoto", function(i, val){
        $scope.showEditPhoto = val
    })

/*    if (angular.isDefined($routeParams.previewId))
        messagePreviewService.get({previewId: $routeParams.previewId}, function(response){
            $scope.text = response.text || '';            
            $scope.photoUrl = response.photo && response.photo.thumbnail || '';            
        });  */  
    $scope.photo = {'name':''};

    $scope.remove = function(){$scope.photo = $scope.photo }
    $scope.send = function() {    
        console.log($scope.text)
        /*$scope.inProgress = true;
        var message = new FormData();        
        message.append( 'place', 150); //$routeParams.placeId
        if($scope.text){message.append( 'text', $scope.text);}
        if($scope.photo.name){
            message.append( 'photo', $scope.photo);}

        var redirectToPublish = function(previewId){
            var url = $scope.urls.messagePub(previewId);
            var pub_page_url = url.slice(1,url.length);
            $location.path(pub_page_url);
        }

        messagePreviewService.create(
            message,
            function(response){
                $scope.inProgress = false;
                $scope.response = response;
                var url = $scope.urls.messageEdit(response.id);
                var edit_page_url = url.slice(1,url.length);
                history.replaceState(null, "SZ - Edit message", '#' + edit_page_url);
                redirectToPublish(response.id);
            },
            function(error){alert(angular.toJson(error, true));});*/
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
    

    $scope.faceId = $scope.faces[0].id
    
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
    
    function send(){
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