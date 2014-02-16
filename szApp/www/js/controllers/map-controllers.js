function MapController($scope, gameMapService, $rootScope, placeService, $rootScope){
    $rootScope.showLoader = false;
    $scope.randomPic = function(){
        return random(1, 56)
    }
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
                var box = boxes.length ? clone(boxes[0]) : {};
                if(boxes.length){
                    box.place_owner_race = $scope.races[Math.floor(Math.random() * 3)].name;
                    box.is_owner = (Math.floor(Math.random() * 10)===1);
                }
                newpath.push(box)
            };
            r.path = newpath;
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
