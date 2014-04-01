function MapController($scope, gameMapService, $rootScope, placeService, $rootScope, $timeout){
    $rootScope.showLoader = false;

    $scope.showGameMap = false;
    $scope.showGamePath = false;
    $scope.gameMap = {}
    $scope.$on('setActivePoint', function(e, gBox){
        $scope.activePoint = gBox;
    })
    $scope.$on('setPPoints',function(e, ppoints){
        $scope.gameMap.ppoints = ppoints.map(function(p){return p._gBox});
    })
    $scope.$on('setGameMap', function(e, val, nav){
        var t = 500;
        if(val){
            $scope.showGamePath = false;
            $scope.showGameMap = true;
            if(!nav){
                $scope.$emit('navigation-hideall');
                $scope.$emit('navigation-setTL', 'map_backtopath');
            }
        }
        else{
            $scope.showGameMap = false;
            $scope.showGamePath = true;
            $scope.$emit('navigation-setNormal');
            $scope.$emit('navigation-setTR', 'map_runpath');
        }
    });
    $scope.$on('setMapInCenter', function(e, val){
        $scope.mapInCenter = val;
    })
    $scope.$on('runPath', function(e, val){
        console.log('run!')
    })
    function _getGameBox(place){
        return getGameBox(place.place_gamemap_position, $scope.gameMap.points)
    }
    function _getMap(){
        $rootScope.showLoader = true;
        $scope.showGameMap = true;
        var params = $scope.coordinates;
        gameMapService.getMap(params, function(r){
            $scope.gameMap.points = r;          //[{place_serializer.data}, {}]
            gameMapService.getPath(params, function(r){          //r - {path: [[x, y], ...], currentBox: place_serializer.data, prevBox: place_serializer.data}
                $scope.gameMap.curr = _getGameBox(r.current_box);
                $scope.gameMap.path = r.path.map(function(pos){
                    return getGameBox(pos, $scope.gameMap.points) //gameBox.js function
                });
                $scope.activePoint = $scope.gameMap.curr;
                $scope.gameMap.prev = _getGameBox(r.prev_box);
                //сначала строим путь на карте, а потом уже отображаем пафпревью
                $rootScope.showLoader = false;
            });
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

    $scope.$watch('coordinates', function(coordinates){
        //if(coordinates) _explore()
        if(coordinates) _getMap()
    });
}
