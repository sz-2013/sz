function LoginController($scope, $location){
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
