function PlaceSelectController($scope, placeService){
    $scope.$emit('navigation-setTR', '');
    function _can_create_message(){
        //здесь проверяем, что место последнего чекина игрока совпадает с текущими координатами
        //если нет - перенаправляем на map
        return true
    }

    function _redirect_to_map(){

    }

    function _get_places_list(){
        var params = $scope.coordinates;
        params.radius = 3000;
        placeService.searchInVenues(params, function(r){
            $scope.placesList = r.places
        });
    }

    $scope.$watch('coordinates', function(coordinates){
        if(coordinates){
            if ( !_can_create_message() ) _redirect_to_map()
            _get_places_list()
        }
    });
}
