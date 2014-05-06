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

    $scope.$on('setGameMap', function(e, val, nav){
        var t = 500;
        if(val){
            $scope.showGamePath = false;
            $scope.showGameMap = true;
            if(!nav){
                $scope.$emit('navigation-hideall');
                $scope.$emit('navigation-setTL', 'map_backtopath');
                $scope.$emit('navigation-setTR', 'map_ppcontrol');
            }
        }
        else{
            $scope.showGameMap = false;
            $scope.showGamePath = true;
            $scope.$emit('navigation-setNormal');
            $scope.$emit('navigation-setTR', 'map_runpath');
            $scope.$emit('navigation-setBR', 'map_custompath');
        }
    });
    //$scope.$on('setMapInCenter', function(e, val){$scope.mapInCenter = val; })

    $scope.$on('runPath', function(e, val){console.log('run!') })

    /*------------------------------------------------------------------------*/

    $rootScope.showLoader = false;

    $scope.showGameMap = false;
    $scope.showGamePath = false;
    $scope.gameMap = {}

    /*------------------------------------------------------------------------*/


    function _getGameBox(place){
        return getGameBox(place.place_gamemap_position, $scope.gameMap.points)
    }

    function _getMap(){
        $rootScope.showLoader = false;
        $scope.showGameMap = true;
        var params = $scope.coordinates;
        gameMapService.getPath(params, function(r){          //r - {path: [[x, y], ...], currentBox: place_serializer.data, prevBox: place_serializer.data}
            $scope.gameMap.pathPositions = r.path
            $scope.activePoint = r.current_box.place_gamemap_position; //[x, y]
            //сначала строим путь на карте, а потом уже отображаем пафпревью
            $rootScope.showLoader = false;
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
        $timeout(function() {
            _explore_r({places_explored: 10})
        }, 100);
        /*placeService.exploreInVenues(params, _explore_r);*/
    }

    /*------------------------------------------------------------------------*/

    $scope.$watch('coordinates', function(coordinates){
        //if(coordinates) _explore()
        if(coordinates) _getMap()
    });
}
