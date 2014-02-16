/**
 * Based on jquery.baraja.js v1.0.0
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2012, Codrops
 * http://www.codrops.com
 */


angular.module('map-directive', [])
    .directive('mapPathPreview', [function(){
        // Runs during compile
        return {
            // name: '',
            // priority: 1,
            // terminal: true,
            scope: {
                path: '=path'
            }, // {} = isolate, true = child, false/undefined = no change
            // controller: function($scope, $element, $attrs, $transclude) {},
            // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
            restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
            template: 
                '<div baraja="gamemap.path" id="map-mapPathParent">'+
                    '<ul id="map-mapPathContainer" class="baraja-container first-child-shadow">'+
                    '</ul>'+
                    '<nav class="text-left">'+
                        '<button class="btn circle-btn" ng-click="prevPathBox()">'+
                            '<i class="fa fa-chevron-left fa-2x"></i>'+
                        '</button>'+
                        '<button class="btn circle-btn pull-right" ng-click="nextPathBox()">'+
                            '<i class="fa fa-chevron-right fa-2x"></i>'+
                        '</button>'+
                    '</nav>'+
                '</div>',
            // templateUrl: '',
            replace: true,
            transclude: true,
            // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
            link: function($scope, elm, attrs) {
                $scope.prevPathBox = function(){$scope.baraja.previous();}
                $scope.nextPathBox = function(){$scope.baraja.next();}
                var startLabel = 'mapbox-start-label';
                var endLabel = 'mapbox-end-label'
                var ul = elm.children('ul')
                function init(){
                    for (var i = $scope.path.length - 1; i >= 0; i--) {
                        var box = $scope.path[i];
                        var pic = random(1, 56);
                        var el = '<li class="map-mapPathCard ' + box.place_owner_race + (box.is_owner ? ' is_owner' : '') +'">' + 
                                    '<img src="../media/baraja/'+ pic +'.jpg" alt="image"/>'+
                                    '<h6 class="overflow-hidden">' + (box.place_name || 'Empy box') + '</h6>'+
                                    '<i ng-show="box.is_owner" class="fa fa-check-circle-o fa-2x mapbox-isowner-label"></i>'+
                                    ( (i === 0 || i === $scope.path.length - 1) ? '<i class="fa fa-bookmark ' + ( i === 0 ? startLabel : endLabel) + '"></i>' : '') +                                    
                                 '</li>';
                        ul.prepend(el);
                    };

                    $scope.baraja = ul.baraja();

                }
                $scope.$watch('path', function(val){
                    if(val) init()
                })
            }
        };
    }]);