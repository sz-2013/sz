
function MessageAddController($scope, messageService, $routeParams, $location, placeService, $rootScope){  
    $rootScope.showLoader = false;
    $scope.$emit("setHeader", "messageAdd");

    function _getPlacesList(){
        $rootScope.showLoader = true;
        var params = {}
        params.latitude = $scope.coordinates.latitude 
        params.longitude = $scope.coordinates.longitude
        params.radius = 250
        var places_list = placeService.searchInVenues(params, function(r) { 
            $scope.places_list = r.places
            $scope.showPlaceSelect = true;
            $rootScope.showLoader = false;
        });    
    }    
    $scope.$watch('coordinates',
        function(){if($scope.coordinates) _getPlacesList()}
    )

    $scope.showStandartFileModel = true;
    $scope.$on("selectItem", function(e, item){
        $scope.messagePlace = item;
        $scope.showPlaceSelect = undefined;
    });
    $scope.$on("setShowPlaceSelect",function(e ,val){$scope.showPlaceSelect = val});

    $scope.$watch('faces', function(val){if(val!=undefined&&val.length) $scope.messageFace = $scope.faces[0]})
    $scope.isFaceActive = function(f){
        var is_face = $scope.messageFace&&$scope.messageFace.id==f.id;
        return is_face ? 'active' : ''
    }    
    $scope.$on('selectFace', function(e, face){$scope.messageFace = face })
    $scope.getActiveFace = function(){return $scope.messageFace && $scope.messageFace.face }

    $scope.$on('setPhotoPreviewBox', function(e, val){$scope.photoPreviewBox = val });    
    $scope.removePhoto = function(){$scope.pPhoto = {photo: undefined}}
    $scope.removePhoto();
    $scope.unfacePhoto = function(){
        $scope.showEditPhoto = undefined;
        $scope.$watch('photoPreviewBox', function(newval, oldval){
            if(newval!==undefined){
                $rootScope.showLoader = true;
                var preview = new FormData();
                preview.append('photo', $scope.photoPreview);
                preview.append('photo_height', newval.photo_height);
                preview.append('photo_width', newval.photo_width);
                preview.append('face_id', $scope.messageFace.id);
                preview.append('faces_list', JSON.stringify(newval.faces_list));
                $scope.photoPreviewBox = undefined;
                messageService.preview(preview, $scope.pPhoto.id,
                    function(r){
                        $scope.pPhoto = r;
                        $scope.pPhoto.photo = $scope.pPhoto.photo.thumbnail;
                        $rootScope.showLoader = false;
                    }
                );
            }
        });
    }
    
    function setBtn(){$rootScope.enableMessageAddBtn = !(!$scope.text&&!$scope.pPhoto.id);}
    $scope.$watch('text', setBtn);    
    $scope.$watch('pPhoto.id', setBtn);    

    var send = $scope.$on('sendMessage',function() {    
            var message = new Object;
            message.latitude = $scope.coordinates.latitude;
            message.longitude = $scope.coordinates.longitude;
            message.place = $scope.messagePlace.place_id;
            if($scope.pPhoto.id) message.photo_id = $scope.pPhoto.id
            message.text = $scope.text || '';
            $rootScope.showLoader = true;
            messageService.create(message,
                function(r){
                    console.log(r)
                    $rootScope.showLoader = false;
                    $scope.urls.getPath('afterMessageAdd($scope.messagePlace.place_id)')
                }
            );
        })


}
