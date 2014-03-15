function MapController($scope, gameMapService, $rootScope, placeService, $rootScope, $timeout){
    $rootScope.showLoader = false;
    
    $scope.showGameMap = false;
    $scope.showGamePath = false;
    $scope.gameMap = {}
    $scope.$on('setGameMap', function(e, val){
        var t = 500;
        if(val){
            $scope.showGamePath = false;
            /*$timeout(function(){*/
                $scope.showGameMap = true;
                $scope.$emit('navigation-hideall');
                $scope.$emit('navigation-setTL', 'mapbacktopath');
            /*}, t);*/
        }
        else{
            $scope.showGameMap = false;
            /*$timeout(function(){*/
                $scope.showGamePath = true;
                $scope.$emit('navigation-setNormal');                
            /*}, t);*/
        }
    });
    $scope.$on('setMapInCenter', function(e, val){
        $scope.mapInCenter = val;
    })
    function _getMap(){
        $rootScope.showLoader = true;
        $scope.showGameMap = true;
        var params = $scope.coordinates;
        gameMapService.getMap(params, function(r){
            $scope.gameMap.points = r;

            gameMapService.getPath(params, function(r){
                $scope.gameMap.path = r.path;
                $scope.gameMap.curr = r.currentBox;
                $scope.gameMap.prev = r.prevBox;
                //$scope.showGamePath = true; $scope.showGameMap = false;
                $scope.showGameMap = false; $scope.showGameMap = true;
                //if($scope.gameMap.path.length){$scope.showGamePath = true; $scope.showGameMap = false;} else {$scope.showGameMap = true }
                $rootScope.showLoader = false;
            })
        });
    }
    function _explore(){
        $rootScope.showLoader = true;
        var params = $scope.coordinates;
        params.radius = 250;
        placeService.exploreInVenues(params,
            function(r){
                var placesValue = parseInt(r.places_explored);
                if(placesValue){
                    var badges = $scope.badges.setBadges({name:'explored', places: placesValue})
                }
                _getMap()
            }
        );
    }

    $scope.$watch('coordinates', function(coordinates){
        //if(coordinates) _explore()
        if(coordinates) _getMap()
    });
}
