
function MessageAddController($scope, messageService, $routeParams, $location, placeService){  
    function _getPlacesList(){
        /*$scope.$emit("setShowLoader", true)*/
        var params = {}
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

    /*$scope.setHeader("message")*/

    if ($routeParams.placeId){
        placeService.get(
            {placeId: $routeParams.placeId},
            function(r){ $scope.messagePlace = r;
        })
    }
 /*   else{
        $scope.$watch('coordinates',
            function(){if($scope.coordinates) _getPlacesList()}
        )
    }*/

    $scope.showStandartFileModel = true;

    $scope.$on("selectItem", function(e, item){
        $scope.messagePlace = item;
        $scope.showPlaceSelect = undefined;
    });    

    $scope.$on("setShowPlaceSelect",function(e ,val){
        $scope.showPlaceSelect = val
    })

    $scope.photo = {'name':''};
    $scope.removePhoto = function(){$scope.photo = $scope.photo }

    $scope.$watch('faces', function(val){
        if(val!=undefined&&val.length) $scope.messageFace = $scope.faces[0]
    })
    $scope.isFaceActive = function(f){
        is_face = $scope.messageFace&&$scope.messageFace.id==f.id
        return is_face ? 'active' : ''
    }    
    $scope.$on('selectFace', function(e, face){
        $scope.messageFace = face
    })
    $scope.getActiveFace = function(){
        return $scope.messageFace && $scope.messageFace.face
    }

    $scope.$on('setPhotoPreviewBox', function(e, val){$scope.photoPreviewBox = val });
    
    $scope.pPhoto = {photo: undefined}
    $scope.unfacePhoto = function(){
        $scope.showEditPhoto = undefined;
        $scope.$watch('photoPreviewBox', function(newval, oldval){
            if(newval!==undefined){
                var preview = new FormData();
                preview.append('photo', $scope.photoPreview)
                preview.append('photo_height', newval.photo_height)
                preview.append('photo_width', newval.photo_width)
                preview.append('face_id', $scope.messageFace.id)
                preview.append('faces_list', JSON.stringify(newval.faces_list))
                $scope.photoPreviewBox = undefined
                messageService.previewCreate(preview, function(r){
                    $scope.pPhoto = r;
                    $scope.pPhoto.photo = $scope.pPhoto.photo.thumbnail;
                });
            }
        });
        //$scope.messagePhotoId=undefined
    }

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
