function loginSuccess($scope, $rootScope, $location, session){
    $scope.session = session;
    $rootScope.showLoader = false;
    $location.path($scope.urls.getPath('homePathAuth'))
}


function LoginController($scope, $location, sessionService, $rootScope){
    $scope.$emit('navigation-hideall');
    /*$scope.$emit('setBodyScroll', false)*/
    $scope.inProgress = false;
    $scope.loginAlert = new Object;
    $scope.showResendBut = false;
    $rootScope.bodyScroll = false;

    $scope.setGender = function(gender){
        console.log(gender)
        $scope.user.gender = gender
    }

    $scope.isEmailAlert = function(){
        if($scope.loginAlert===undefined) return false
        return $scope.loginAlert.email || $scope.loginAlert.non_field_errors
    }

    $scope.isPswdAlert = function(){
        if($scope.loginAlert===undefined) return false
        return $scope.loginAlert.password || $scope.loginAlert.non_field_errors
    }

    $scope.login = function(e){
        if(e!==undefined&&e.keyCode!==undefined&&e.keyCode!==13) return
        $scope.inProgress = true;
        $rootScope.showLoader = true;
        $scope.session.email = $scope.email;
        $scope.session.password = $scope.password;
        var session = $scope.session.$login(
            function(response){
                loginSuccess($scope, $rootScope, $location, session)
            },
            function(error){
                if(error.status==400){
                    $scope.loginAlert = error.data.data
                }
                else{
                    $scope.user = {email: email}
                    $scope.showResendBut = true;
                }
                $scope.inProgress = false;
                $rootScope.showLoader = false;
            }
        );
    }
}


function RigistrationController($scope, userService, $rootScope, $location){
    $scope.$emit('navigation-hideall');
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
    $rootScope.showLoader = false;
    $scope.isEmailAlert = function(maxlength){
        return ($scope.user.email && $scope.loginAlert && $scope.user.email.length!=0) ||
               maxlength
    }

    $scope.isPswdAlert = function(maxlength){
        return ($scope.loginAlert && (
                        ($scope.loginAlert.password1/* && $scope.loginAlert.email.password1!=0*/) ||
                        ($scope.loginAlert.password2/* && $scope.loginAlert.email.password2!=0*/) ||
                        ($scope.loginAlert.password/* && $scope.loginAlert.email.password!=0*/))
                    ) || maxlength
    }

    $scope.isPswd2Alert = function(){
        return ($scope.loginAlert && ($scope.loginAlert.password1 || $scope.loginAlert.password)) ||
               ($scope.user.password1&&$scope.user.password2&&$scope.user.password1!=$scope.user.password2)
    }

    $scope.registration = function(){
        $scope.loginAlert = {
            'email':[],
            'password1':[],
            'race':[]
        };
        if( !$scope.user.email ){ $scope.loginAlert.email.push( $scope.tmlText.errorsText.email.nullvalue ) }
        if( !$scope.user.race ){ $scope.loginAlert.race.push( $scope.tmlText.errorsText.race.nullvalue ) }
        if( !$scope.user.password1 ){ $scope.loginAlert.password1.push( $scope.tmlText.errorsText.password.nullvalue ) }
        if( !$scope.loginAlert.email.length && !$scope.loginAlert.password1.length && !$scope.loginAlert.race.length){
            $scope.inProgress = true;
            $rootScope.showLoader = true;
            var user = $scope.user;
            user.race = $scope.user.race.id;
            for (var i in $scope.genders){
                var g = $scope.genders[i];
                if(g.name==$scope.user.gender){
                    user.gender = g.id;
                }
            }

            userService.register(user,
                function(response){
                    loginSuccess($scope, $rootScope, $location, response)
                },
                function(error){
                    $scope.loginAlert = error.data.data;
                    $scope.inProgress = false;
                    $rootScope.showLoader = false;
            })
        }
    }
}
