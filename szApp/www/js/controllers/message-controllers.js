function MessageAddController($scope, messageService, $routeParams, $location, placeService, $rootScope, camera, messageCreate){
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

    $scope.$on('message-photoZip', function(e){$scope.$broadcast('photoZip'); });
    $scope.$on('messageSend', function(e, photo, facesList){
        $rootScope.showLoader = true;
        /*
        messageService.create(message,
            function(r){
                //$scope.urls.getPath('afterMessageAdd($scope.messagePlace.place_id)')
            }
        );*/
        var data = new FormData()
        data.append('latitude', $scope.coordinates.latitude)
        data.append('longitude', $scope.coordinates.longitude)
        data.append('place_id', $scope.messagePlace.place_id)
        data.append('photo', photo)
        data.append('faces', facesList)
        data.append('tags', new Array)
        var onSuccess = function(r){
            $scope.$apply(function(){
                $rootScope.showLoader = false;
                console.log('yeeeep')
                console.log(r)
            })
        }
        messageCreate(data, onSuccess)

    });




    $scope.$on('setphotoSuccessHandler', function(e, fn){$scope.photoSuccessHandler = fn; });
    $scope.$on('setphotoFailHandler', function(e, fn){$scope.photoFailHandler = fn });
    $scope.$on('setshowStandartFileModel', function(e, val){$scope.showStandartFileModel = val;});
    $scope.$on('setCropPreview', function(e, fn){$scope.cropPreview = fn;});
    $scope.$on('setShowPhotoPreview', function(e, val){$scope.setShowPhotoPreview(val) });
    $scope.$on('setFileModelSrc', function(e, el){$scope.photoSrc = el;});
    $scope.$on('showFaces', function(e){$scope.showFacesArea = !$scope.showFacesArea;$scope.showAddTag = false});
    $scope.$on('addTag', function(){$scope.showAddTag = !$scope.showAddTag;$scope.showFacesArea = false});
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

    $scope.$watch('faces', function(faces){
        if(faces && faces.length) $scope.setActiveFace(faces[0])
    });


    $scope.setActiveFace = function(face){
        $scope.activeFace = face
    }
    $scope.isFaceActive = function(face){
        return ($scope.activeFace && $scope.activeFace.id == face.id) ? 'active' : ''
    }
}
