
angular.module("navs-directive", [])
    .directive('szSideBar', function ($rootScope) {
        return {
            // name: '',
            // priority: 1,
            // terminal: true,
            scope: {
                ismobile:'=ismobile',
                show:'=show',
                steffect:'=steffect',
            }, // {} = isolate, true = child, false/undefined = no change
            // controller: function($$scope, $element, $attrs, $transclude) {},
            // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
            restrict: "E", // E = Element, A = Attribute, C = Class, M = Comment
            template: '<button class="btn btn-primary pull-left"><i class="fa fa-reorder fa-lg"></i></button>',
            // templateUrl: '',
            replace: true,
            transclude: true,
            // compile: function(tElement, tAttrs, function transclude(function($scope, cloneLinkingFn){ return function linking($scope, elm, attrs){}})),
            link: function($scope, element, attrs, controller) {
                /**
                 * sidebarEffects.js v1.0.0
                 * http://www.codrops.com
                 *
                 * Licensed under the MIT license.
                 * http://www.opensource.org/licenses/mit-license.php
                 * 
                 * Copyright 2013, Codrops
                 * http://www.codrops.com
                 */
                var params = attrs.params || {},
                    container_id = params.container_id || 'mainPage',
                    container_class = params.container_class || 'st-container',
                    open_class = params.open_class || 'st-menu-open',
                    menu_class = params.menu_class || 'st-menu',
                    effect = $scope.stEffect || 'st-effect-8',
                    eventstart = $scope.ismobile ? 'touchstart' : 'click';
                function hasParentClass( e, classname ) {
                    if(e === document) return false;
                    if( $(e).hasClass(classname) ) {
                        return true;
                    }
                    return e.parentNode && hasParentClass( e.parentNode, classname );
                }

                var container = document.getElementById( container_id ),            
                    resetMenu = function() {
                        $(container).removeClass(open_class)
                        document.removeEventListener("backbutton", resetMenu, false);
                        document.removeEventListener( eventstart, bodyClickFn );
                    },                
                    bodyClickFn = function(evt) {
                        // event type (if mobile use touch events)
                        if( !hasParentClass( evt.target, menu_class ) )
                            $scope.$apply(function(){$scope.show = false;});
                    };

                function open_navs(){ 
                    container.className = container_class; // clear
                    $(container).addClass(effect);
                    $( "." + menu_class ).scrollTop(0)
                    setTimeout( function() {
                        $(container).addClass(open_class)
                    }, 25 );
                    document.addEventListener("backbutton", resetMenu, false);
                    document.addEventListener( eventstart, bodyClickFn );
                }
                $scope.$watch('show', function(val){
                    console.log(val)
                    if(val===true) open_navs();
                    if(val===false) resetMenu();
                });
                element.bind( eventstart, function( ev ) {
                    ev.stopPropagation();
                    ev.preventDefault();
                    $scope.$apply(function(){$scope.show = true;});
                }); 
                
            }
        }
    })
    .directive('szSubPage', [ function ( ) {   
        return function($scope, element, attrs) {

        };
    }])
    .directive('szModal', [ function ( ) {   
        return function($scope, element, attrs) {

        };
    }])