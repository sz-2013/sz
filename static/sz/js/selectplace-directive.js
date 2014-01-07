var raphaelDirective = angular.module("selectplace-directive", []);

raphaelDirective.directive('szSelectPlace', [ '$rootScope', function ( $rootScope ) {   
    return {
        restrict: "E",
        replace: true,
        transclude: true,
        scope: {      
            placeslist : '=placeslist',
            show : '=show',
        },
        template:'<div class="modal fade" id="selectPlace" tabindex="-1" role="dialog" aria-labelledby="selectAPlace" aria-hidden="true">'+
                    '<div class="modal-dialog">'+
                        '<div class="modal-content dark-nav">'+
                            '<div class="dark-nav-header">'+
                                '<button type="button" class="close pull-right" data-dismiss="modal" aria-hidden="true">&times;</button>'+
                                '<h2 class="navbar-brand"><a>Select a place</a></h2>'+
                                /*'<div class="input-group">'+
                                    '<span class="input-group-addon"><i class="fa fa-search fa-fw"></i></span>'+
                                    '<input type="text" class="form-control input-sm" placeholder="Search a place..">'+
                                '</div>'+*/
                            '</div>'+
                            '<ul>'+
                                '<li ng-repeat="place in placeslist" data-placeitem="{{place.place_id}}">'+
                                    '<span>'+
                                        '<div class="item-main">'+
                                            '<button type="button" class="btn btn-link pull-right btn-dark" ng-click="showDetail(place.place_id)">'+
                                                '<i class="fa fa-arrow-right fa-2x"></i>'+
                                            '</button>'+
                                            '<div ng-click="selectThis(item)">'+
                                                '<div class="item-name">{{place.place_name}}</div>'+
                                                '<div class="item-address">{{place.place_address}}</div>'+
                                            '</div>'+
                                        '</div>'+
                                        '<div class="item-detail">'+
                                            '<button type="button" class="btn btn-link pull-left btn-dark" ng-click="hideDetail(place.place_id)">'+
                                                '<i class="fa fa-arrow-left fa-2x"></i>'+
                                            '</button>'+
                                            '<div>detail stuff</div>'+
                                        '</div>'+
                                    '</span>'+
                                '</li>'+
                            '</ul>'+
                        '</div>'+
                    '</div>'+
                 '</div>',
        link: function ($scope, element, attrs) {
            /*function setModalHeight(){
                element.find(".modal-body").height( $(window).height() - 140 )
            }*/            
            $scope.showDetail = function(id){
                var li = element.find("[data-placeitem="+id+"]"), w = li.width()/2;
                li.animate({marginLeft: -1*w + 'px'}, w*2)
            }
            $scope.hideDetail = function(id){
                var li = element.find("[data-placeitem="+id+"]"), w = li.width()/2;
                li.animate({marginLeft: 0}, w*2)
            }
            $scope.selectThis = function(item){
                $scope.$emit("selectItem", item)
            }

            /*$scope.$watch("placeslist", function(){
                if($scope.placeslist&&$scope.show) element.modal({show:true});
            })*/
            $scope.$watch("show", function(newval){
                if(newval) element.modal({show: $scope.show});
                else element.find("[data-dismiss=modal]").click() //както это неправильно
            })
        }
    }
}]);