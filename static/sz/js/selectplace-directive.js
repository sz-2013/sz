var raphaelDirective = angular.module("selectplace-directive", []);

raphaelDirective.directive('szSelectPlace', [ '$rootScope', function ( $rootScope ) {   
    return {
        restrict: "E",
        replace: true,
        transclude: true,
        scope: {      
            placeslist:  '=placeslist',
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
                                '<li ng-repeat="item in placeslist" data-placeitem="{{item.place.id}}">'+
                                    '<span>'+
                                        '<div class="item-main">'+
                                            '<button type="button" class="btn btn-link pull-right btn-dark" ng-click="showDetail(item.place.id)">'+
                                                '<i class="fa fa-arrow-right fa-2x"></i>'+
                                            '</button>'+
                                            '<div ng-click="selectThis(item)">'+
                                                '<div class="item-name">{{item.place.name}}</div>'+
                                                '<div class="item-address">{{item.place.address}}</div>'+
                                            '</div>'+
                                        '</div>'+
                                        '<div class="item-detail">'+
                                            '<button type="button" class="btn btn-link pull-left btn-dark" ng-click="hideDetail(item.place.id)">'+
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
            $scope.fade_cls = "fade"
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
                element.find("[data-dismiss=modal]").click()
                $scope.$emit("selectItem", item)
            }
            
                /**/
                /*element.modal({show:false});*/
            

            function init(){                                
                element.modal({show:true});
            }
        /*    $scope.selectThis = function(item){
                $scope.$emit("choosePlace", item)
            }

            $scope.$on("choosePlace", function(e, item){
                console.log(item)
            });*/

            $scope.$watch("placeslist", function(){
                if($scope.placeslist) init()
            })
        }
    }
}]);