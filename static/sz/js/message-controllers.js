
function MessageAddController($scope, messagePreviewService, $routeParams, $location, placeService){  
    /*$scope.setHeader("message")*/
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
                var places_list = placeService.searchInVenues(params, function(r) { 
                    $scope.places_list = r.places
                    $scope.showPlaceSelect = true;
                    $scope.$emit("setShowLoader", false)
                });    
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
