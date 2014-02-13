function MapController($scope, gameMapService, $rootScope, placeService, $rootScope){
    $rootScope.showLoader = false;
    function _getMap(){
        $rootScope.showLoader = true;
        var params = $scope.coordinates;
        gameMapService.getMap(params, function(r){
            $rootScope.showLoader = false;
            $scope.gamemap = r;
            console.log($scope.gamemap)
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
