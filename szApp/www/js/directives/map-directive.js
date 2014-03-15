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
var Modernizr = window.Modernizr;
var transEndEventNames = {
    'WebkitTransition' : 'webkitTransitionEnd',
    'MozTransition' : 'transitionend',
    'OTransition' : 'oTransitionEnd',
    'msTransition' : 'MSTransitionEnd',
    'transition' : 'transitionend'
};
var GameMapHelper = function(self){
    this.self = self;
}
GameMapHelper.prototype = {
    _resetTransition : function( $el ) {
        $el.css( {
            '-webkit-transition' : 'none',
            '-moz-transition' : 'none',
            '-ms-transition' : 'none',
            '-o-transition' : 'none',
            'transition' : 'none'
        } );
    },
    _setOrigin : function( $el, x, y ) {

        $el.css( 'transform-origin' , x + '% ' + y + '%' );

    },
    _setTransition : function( $el, prop, speed, easing, delay ) {
        if( !this.self.supportTransitions ) {
            return false;
        }
        if( !prop ) {
            prop = 'all';
        }
        if( !speed ) {
            speed = this.self.options.speed;
        }
        if( !easing ) {
            easing = this.self.options.easing;
        }
        if( !delay ) {
            delay = 0;
        }

        var styleCSS = '';
        
        prop === 'transform' ?
            styleCSS = {
                '-webkit-transition' : '-webkit-transform ' + speed + 'ms ' + easing + ' ' + delay + 'ms',
                '-moz-transition' : '-moz-transform ' + speed + 'ms ' + easing + ' ' + delay + 'ms',
                '-ms-transition' : '-ms-transform ' + speed + 'ms ' + easing + ' ' + delay + 'ms',
                '-o-transition' : '-o-transform ' + speed + 'ms ' + easing + ' ' + delay + 'ms',
                'transition' : 'transform ' + speed + 'ms ' + easing + ' ' + delay + 'ms'
            } :
            styleCSS = {
                '-webkit-transition' : prop + ' ' + speed + 'ms ' + easing + ' ' + delay + 'ms',
                '-moz-transition' : prop + ' ' + speed + 'ms ' + easing + ' ' + delay + 'ms',
                '-ms-transition' : prop + ' ' + speed + 'ms ' + easing + ' ' + delay + 'ms',
                '-o-transition' : prop + ' ' + speed + 'ms ' + easing + ' ' + delay + 'ms',
                'transition' : prop + ' ' + speed + 'ms ' + easing + ' ' + delay + 'ms'
            }

        $el.css( styleCSS );
    },
    _applyTransition : function( $el, styleCSS, fncomplete, force ) {
        if( this.self.supportTransitions ) {

            if( fncomplete ) {

                $el.on( this.self.transEndEventName, fncomplete );

                if( force ) {
                    fncomplete.call();
                }

            }
            setTimeout( function() { $el.css( styleCSS ); }, 25 );

        }
        else {

            $el.css( styleCSS );

            if( fncomplete ) {

                fncomplete.call();
                
            }

        }

    },
}


function createCard( cont, box, data, extra ){
    var pic = random(1, 56);
    var data = data || '';
    var extra = extra || '';
    var el = '<' + cont + ' ' + data + '  class="map-mapPathCard ' + box.place_owner_race + (box.is_owner ? ' is_owner' : '') +'">' + 
                '<img src="../media/baraja/'+ pic +'.jpg" alt="image"/>'+
                '<div class="map-mapPathCard-bottom"><h5 class="overflow-hidden">' + (box.place_name || 'Emypy box') + '</h5></div>'+
                (box.place_owner_race ? 
                    ('<div class="mapbox-owner-label' + (box.is_owner ? ' mapbox-isowner-label': '') + '">' +
                        '<i class="fa fa-check-circle-o fa-2x"></i>' +
                    '</div>') : '') +  
                extra +                                   
             '</' + cont + '>';
    return el
}

var map;

angular.module('map-directive', [])
    .directive('mapPathPreview', [function(){
        // Runs during compile
        return {
            // name: '',
            // priority: 1,
            // terminal: true,
            scope: {
                path: '=path',                
            }, // {} = isolate, true = child, false/undefined = no change
            // controller: function($scope, $element, $attrs, $transclude) {},
            // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
            restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
            template: 
                '<div id="map-mapPathParent">'+
                    '<ul id="map-mapPathContainer" class="baraja-container first-child-shadow">'+
                    '</ul>'+
                    '<nav class="text-center">'+
                        '<button class="btn circle-btn" ng-click="prevPathBox()">'+
                            '<i class="fa fa-chevron-left fa-2x"></i>'+
                        '</button>'+
                        '<button class="btn circle-btn" ng-click="showGameMap()">'+
                            '<i class="fa fa-cogs fa-2x"></i>'+
                        '</button>'+
                        '<button class="btn circle-btn pull-right" ng-click="nextPathBox()">'+
                            '<i class="fa fa-chevron-right fa-2x"></i>'+
                        '</button>'+
                    '</nav>'+
                '</div>',
            // templateUrl: '',
            replace: true,
            transclude: true,
            // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, element, attrs){}})),
            link: function($scope, element, attrs) {
                $scope.prevPathBox = function(){$scope.baraja.previous();}
                $scope.nextPathBox = function(){$scope.baraja.next();}
                $scope.showGameMap = function(){
                    $scope.$emit('setGameMap', true)
                }
                var startLabel = 'mapbox-start-label';
                var endLabel = 'mapbox-end-label'
                var ul = element.children('ul')


                function init(){
                    for (var i = $scope.path.length - 1; i >= 0; i--) {
                        var box = $scope.path[i];
                        var pic = random(1, 56);
                        var extra = ( (i === 0 || i === $scope.path.length - 1) ? '<i class="fa fa-bookmark ' + ( i === 0 ? startLabel : endLabel) + '"></i>' : '');
                        var el = createCard( 'li', box, null, extra );
                        ul.prepend(el);
                    };

                    $scope.baraja = ul.baraja();
                    $scope.$emit('setMapInCenter', true)
                }

                $scope.$watch('path', function(val){if(val) init() })
            }
        };
    }])
    .directive('gameMap', [function(){
        // Runs during compile
        return {
            // name: '',
            // priority: 1,
            // terminal: true,
            scope: {
                'center': '=center',
                'path': '=path',
                'points': '=points',
            }, // {} = isolate, true = child, false/undefined = no change
            // controller: function($scope, $element, $attrs, $transclude) {},
            // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
            restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
            template: '<div id="gamemap"></div>',
            // templateUrl: '',
            replace: true,
            // transclude: true,
            // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, element, attrs){}})),
            link: function($scope, element, attrs) {
                
                //var path;
                var elem = element[0];
                function _initCont(){
                    elem.style.display = 'block';
                    elem.style.height = document.getElementById('mainArea').style.height || '314px';
                }

                function _initClick(){
                    map.on('click', function(e){
                        if ( e.originalEvent.target.localName == 'circle' ) return
                        var gPoint = map.gm.latlng2gm(e.latlng);
                        var tile = map.gm.getTile(gPoint.x, gPoint.y);
                        var inner = tile.getElementsByClassName('gmtile-inner')[0];
                        var gBox = tile._gBox;
                        if( gBox.owner == 'nobody' ) return

                        L.DomUtil.addClass(inner, 'gmtile-inner-wavein');
                        inner.addEventListener( 'webkitTransitionEnd', function( e ) {
                            L.DomUtil.removeClass(inner, 'gmtile-inner-wavein');
                        }, false );
                    });                    
                }

                function _init(){
                    _initCont()
                    map = L.szMap(
                        elem.getAttribute('id'),
                        $scope.points,
                        $scope.center);
                    //doPath()
                }

                function doPath(){
                    var center = map.gm.latlng2gm( map.getCenter() );
                    var path = map.gm.generatePath( [center.x, center.y] )
                    var pathLen = path.length;
                    for (var i = 0; i < pathLen; i++) {
                        var point =  map.gm.pathPoint(i, path);
                    }; 
                    _initClick();               
                }

                $scope.$watch('points', function(val){if(val) _init(); });
                
            }
        };
    }]);;