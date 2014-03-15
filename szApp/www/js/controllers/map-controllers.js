function MapController($scope, gameMapService, $rootScope, placeService, $rootScope, $timeout){
    $rootScope.showLoader = false;
    
    $scope.showGameMap = true;
    $scope.showGamePath = false;

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
        var params = $scope.coordinates;
        gameMapService.getMap(params, function(r){
            var path = r.path;
            var newpath = new Array;
            for (var i = path.length - 1; i >= 0; i--) {
                var pos = path[i];
                var boxes = r.columns[pos[0].toString()].filter(function(b){
                    return b.place_gamemap_position[1] == pos[1]});
                var box = boxes.length ? clone(boxes[0]) : {place_gamemap_position: pos};
                if(boxes.length){
                    box.place_owner_race = $scope.races[Math.floor(Math.random() * 3)].name;
                    box.is_owner = (Math.floor(Math.random() * 10)===1);
                }
                newpath.push(box)
            };
            for (var i = r.map_width; i > 0; i--) {
                var c = r.columns[i];
                for (var j = c.length - 1; j >= 0; j--) {
                    var box = c[j];
                    box.place_owner_race = $scope.races[Math.floor(Math.random() * 3)].name;
                    box.is_owner = (Math.floor(Math.random() * 10)===1);
                    c[j] = box;
                };
            };
            r.path = newpath;
            //f(r.path.length) $scope.showGamePath = true;
            $scope.gamemap = r;
            $rootScope.showLoader = false;
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
