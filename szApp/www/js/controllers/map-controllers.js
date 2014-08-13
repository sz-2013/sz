function MapController($scope, gameMapService, $rootScope, placeService, $rootScope, $timeout){
    $scope.$on('getGBoxFromApi', function(e, x, y, fnName){
        var params = $scope.coordinates;
        params.x = x;
        params.y = y;
        gameMapService.getTile(params, function(r){
            $scope.$broadcast(fnName, r)
        })
    });

    $scope.$on('setActivePoint', function(e, pos){$scope.activePoint = pos; });
    $scope.$on('setPPoints',function(e, ppoints){//set path points
        $scope.gameMap.ppoints = ppoints.map(function(p){return p._gBox});
    });

    $scope.$on('setGameMap', setGameMap);
    $scope.$on('setCurrentGBox', function(e, gbox){
        console.log(gbox)
        if($rootScope.showLoader) $rootScope.showLoader = false;
        $scope.gameMap.currentGBox = gbox})

    $scope.$on('runPath', function(e, val){console.log('run!') })

    $scope.$on('gBoxDetail', function(e){
        if($scope.gameMap.currentGBox &&
           $scope.gameMap.currentGBox.buildings &&
           $scope.gameMap.currentGBox.buildings.length){
                $scope.showDetail = true
                $scope.$emit('navigation-hideall');
        }
    });

    $scope.$on('customPath', function(e){setGameMap(null, !$scope.showGameMap)});

    /*------------------------------------------------------------------------*/

    $rootScope.showLoader = false;

    $scope.showGameMap = false;
    $scope.showGamePath = false;
    $scope.showDetail = false;
    $scope.gameMap = {}

    /*------------------------------------------------------------------------*/
    function setNormalMenu(){
        $scope.$emit('navigation-setNormal');
        $scope.$emit('navigation-setTR', 'map_runpath');
        $scope.$emit('navigation-setBR', 'map_custompath');
    }

    function setGameMap(e, val){
        $scope.showGameMap = val;
        $scope.showGamePath = !val;
        if( val ){
            $scope.$emit('navigation-hideall');
            //$scope.$emit('navigation-setTL', 'map_backtopath');
            $scope.$emit('navigation-setTR', 'map_ppcontrol');
            $scope.$emit('navigation-setBR', 'map_custompath');
        } else{ setNormalMenu() }
    }

    function _getGameBox(place){
        return getGameBox(place.place_gamemap_position, $scope.gameMap.points)
    }

    function _getMap(){
        $scope.showGameMap = true;
        $rootScope.showLoader = true;
        var params = $scope.coordinates;
        gameMapService.getPath(params, function(r){          //r - {path: [[x, y], ...], currentBox: place_serializer.data, prevBox: place_serializer.data}
            $scope.gameMap.pathPositions = r.path
            $scope.activePoint = r.current_box.place_gamemap_position; //[x, y]
        });
    }

    function _explore_r(r){
        var val = parseInt(r.places_explored, 10);
        if(val) $scope.badges.setBadges({name:'explored', places: val});
        _getMap()
    }

    function _explore(){
        $rootScope.showLoader = true;
        var params = $scope.coordinates;
        params.radius = 250;
        placeService.exploreInVenues(params, _explore_r);
    }

    /*------------------------------------------------------------------------*/

    $scope.setHideDetail = function(){
        $scope.showDetail = false
        setNormalMenu()
    }

    /*------------------------------------------------------------------------*/

    $scope.$watch('coordinates', function(coordinates){
        //if(coordinates) _explore()
        if(coordinates) _getMap()
    });

}
