function MapController($scope, gameMapService, $rootScope, placeService, $rootScope){
    $rootScope.showLoader = false;
    function _getMap(){
        var params = $scope.coordinates;
        params.radius = 250;
        gameMapService.getMap(params, function(r){
            console.log(r)
        });
    }
    function _explore(){
        /*var newbadges = {body: 'test', header: 'info'}
        $scope.badges.update(newbadges)*/
        $rootScope.showLoader = true;
        var params = $scope.coordinates;
        params.radius = 250;
        placeService.exploreInVenues(params,
            function(r){
                var placesValue = parseInt(r.places_explored);
                if(placesValue){
                    var badges = $scope.badges.setBadges({name:'explored', places: placesValue})
                }
                gameMapService.getMap(params, function(r){
                    $rootScope.showLoader = false;
                    $scope.map = r
                });
                
            }
        );
    }
    $scope.$watch('coordinates', function(coordinates){
        if(coordinates) _explore()
    });
}
