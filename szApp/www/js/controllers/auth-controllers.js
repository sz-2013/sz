
function LoginController($scope, $location, sessionService, $rootScope){
    $scope.inProgress = false;
    $scope.loginAlert = new Object;
    $scope.showResendBut = false;

    $scope.isEmailAlert = function(){
        if($scope.loginAlert===undefined) return false
        return $scope.loginAlert.email || $scope.loginAlert.non_field_errors
    }

    $scope.isPswdAlert = function(){
        if($scope.loginAlert===undefined) return false
        return $scope.loginAlert.password || $scope.loginAlert.non_field_errors
    }

    $scope.login = function(e){
        if(e.keyCode!==undefined&&e.keyCode!==13) return
        $scope.inProgress = true;
        $rootScope.showLoader = true;
        $scope.session.email = $scope.email;
        $scope.session.password = $scope.password;
        var session = $scope.session.$login(            
            function(response){
                $scope.session = session;
                $scope.inProgress = false;
                $rootScope.showLoader = false;
                $location.path($scope.urls.getPath('homePathAuth'))
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
    $rootScope.showLoader = false;
    $scope.regStage1 = true
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
                    $scope.regStage1 = false;
                    $scope.inProgress = false;
                    $rootScope.showLoader = false;
                },
                function(error){
                    $scope.loginAlert = error.data.data;
                    $scope.inProgress = false;
                    $rootScope.showLoader = false;
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


function RegistrationConfirmation($scope, userService, $location, $route){
    $scope.inProgress = false;
    $rootScope.showLoader = false;

    $scope.confirmation = function(email){
        $scope.showConfirmationResponse = false;
        delete $scope.confirmationError
        $scope.inProgress = true;
        $rootScope.showLoader = true;
        var email = $scope.user && $scope.user.email
        userService.resend_activation_key({'email': email},
        function(response){
            $scope.inProgress = false;
            $rootScope.showLoader = false;
            $scope.showConfirmationResponse = true;
        },
        function(error){
            $scope.inProgress = false;
            $rootScope.showLoader = false;
            $scope.confirmationError = error.data});
    }

    $scope.goToLogin = function(){
        var loginUrl = $scope.urls.getPath('login');
        if($location.path()!=loginUrl) $location.path(loginUrl);
        else $route.reload();
    }
}
