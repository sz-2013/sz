/*$scope.showStandartFileModel = true;
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
            message.faces_id = $scope.pPhoto.id ? $scope.pPhoto.faces_id : []
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
*/


function MessageAddController($scope, messageService, $routeParams, $location, placeService, $rootScope, camera){
    $rootScope.showLoader = false;

    function setNavs(){
        $scope.$emit('navigation-setNormal');
        $scope.$emit('navigation-setTR', 'message_send');
        $scope.$emit('navigation-setTL', '');
        $scope.$emit('navigation-setBR', 'message_custom');
    }

    $scope.setShowPhotoPreview = function(val){
        $scope.showPhotoPreview = val;
        if(val) $scope.$emit('navigation-hideall');
        else setNavs()
    }

    setNavs()

    $scope.$on('messageSend', function(e){
        $scope.$broadcast('zipImage')
        /*$rootScope.showLoader = true;*/
        /*console.log($scope.photo)
        var message = new Object;
        message.latitude = $scope.coordinates.latitude;
        message.longitude = $scope.coordinates.longitude;
        message.place = $scope.messagePlace.place_id;
        message.photo = {img: $scope.photo, width: '', height: ''}
        message.face = $scope.activeFace*/
        /*messageService.create(message,
            function(r){
                console.log(r)
                $rootScope.showLoader = false;
                $scope.urls.getPath('afterMessageAdd($scope.messagePlace.place_id)')
            }
        );*/
    });
    $scope.$on('setphotoSuccessHandler', function(e, fn){$scope.photoSuccessHandler = fn; });
    $scope.$on('setphotoFailHandler', function(e, fn){$scope.photoFailHandler = fn });
    $scope.$on('setshowStandartFileModel', function(e, val){$scope.showStandartFileModel = val;});
    $scope.$on('setCropPreview', function(e, fn){$scope.cropPreview = fn;});
    $scope.$on('setShowPhotoPreview', function(e, val){$scope.setShowPhotoPreview(val) });
    $scope.$on('setFileModelSrc', function(e, el){$scope.photoSrc = el;});
    $scope.$on('setPhoto', function(e, data){$scope.photo = data; $scope.$apply()});

    function _getMessagePlaceInfo(){
        var placeId = $routeParams.placeId;
        placeService.detailShort({placeId: placeId}, function(r){
            $scope.messagePlace = r;
        });
    }


    $scope.photoSuccessHandler = null;
    $scope.photoFailHandler = function(err){console.log(err)}
    function _makePhoto(){
        if($scope.photoSuccessHandler)
            camera.getPicture($scope.photoSuccessHandler, $scope.photoFailHandler, $routeParams.library)
    }

    $scope.$watch('coordinates', function(val){
        if(val){
            _getMessagePlaceInfo();
            _makePhoto();
        }
    });


    $scope.setActiveFace = function(face){
        $scope.activeFace = face
    }
}
