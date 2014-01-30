function MapController($scope, gameMapService, $rootScope){
    function _getMap(){
        var params = $scope.coordinates;
        params.radius = 250;
        /*gameMapService.getMap(params, function(r){
            console.log(r)
        });*/
    }
    $scope.$watch('coordinates', function(coordinates){if(coordinates) _getMap()});
}
