angular.module('map-directive', [])
    .directive('mapPathPreview', [function(){
        // Runs during compile
        return {
            // name: '',
            // priority: 1,
            // terminal: true,
            scope: {
                isshow: '=isshow',
                ppoints: '=ppoints',
                center: '=center'
            }, // {} = isolate, true = child, false/undefined = no change
            // controller: function($scope, $element, $attrs, $transclude) {},
            // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
            restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
            template:
                '<div class="simpleSlider">' +
                    '<nav>' +
                        '<button class="btn circle-btn" ng-click="slider.spreadNav()">' +
                            '<i class="fa fa-times"></i>' +
                        '</button>' +
                        '<button class="btn circle-btn">' +
                            '<i class="fa fa-ellipsis-h"></i>' +
                        '</button>' +
                        '<button class="btn circle-btn" ng-click="showGameMap()">' +
                            '<i class="fa fa-cogs"></i>' +
                        '</button>' +
                    '</nav>' +
                    '<ul class="simpleSlider-container gamemap-item">' +
                    '</ul>' +
                '</div>',
            // templateUrl: '',
            replace: true,
            transclude: true,
            // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, element, attrs){}})),
            link: function($scope, element, attrs) {
                var startLabel = 'mapbox-start-label';
                var endLabel = 'mapbox-end-label';
                simpleSlider.prototype._update_active_el = function() {
                    $scope.$emit('setActivePoint', this.active._gBox)
                };

                $scope.slider = new simpleSlider( element[0], $scope )
                var points;

                $scope.showGameMap = function(){
                    $scope.slider.spreadNav()
                    $scope.$emit('setGameMap', true);
                }

                function init(){
                    var center = $scope.center;
                    $scope.slider.empty()
                    points = $scope.ppoints.map(function(gBox){
                        var el = '<div>' +
                                    '<h3>' + gBox.name + '</h3>' +
                                    '<img src="' + gBox.castle.img + '" >' +
                                 '</div>';
                        el._gBox = gBox;
                        $scope.slider.update( el, gBox )
                    });
                    updateCenter(center)
                }

                function updateCenter(gBox){
                    if( gBox.pos.compare($scope.slider.active._gBox) ) return
                    var item;
                    for (var i = $scope.slider.items.length - 1; i >= 0; i--) {
                        var _item = $scope.slider.items[i];
                        if( gBox.pos.compare(_item._gBox.pos) ) var item = _item;
                    };
                    if(!item) return
                    $scope.slider._setActive(item)
                }

                $scope.$watch('ppoints', function(val){if(val) init() });
                $scope.$watch('center', function(val){if(val&&$scope.slider.active) updateCenter(val) });
                $scope.$watch('isshow', function(val){if(val) $scope.$emit('setMapInCenter', true) });
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
                L.GM.prototype.setPPoints = function() {
                    $scope.$emit('setPPoints', map.gm.ppoints)
                };
                L.GM.prototype.moveCenter = function(point) {
                    $scope.$emit('setActivePoint', point._gBox)
                };
                var elem = element[0];
                var map;
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
                        $scope.points);
                }

                function _doPath(){
                    var pathLen = $scope.path.length;
                    for (var i = 0; i < pathLen; i++) {
                        var point =  map.gm.pathPoint(i, $scope.path);
                    };
                    _initClick();
                    map.gm.setView($scope.center.pos)
                    $scope.$emit('setPPoints', map.gm.ppoints)
                    $scope.$emit('setGameMap', false)
                }

                function _setCenter(){
                    var center = map.gm.gm2latlng($scope.center.pos); //latlng
                    map.setView(center);
                    map.gm.setView($scope.center.pos)
                    if(map.gm.ppoints.length){
                        map.gm.updatePpointsPos()
                    }
                    if($scope.path&&!map.gm.ppoints.length) _doPath()
                }

                $scope.$watch('points', function(val){if(val) _init(); });
                $scope.$watch('center', function(val){
                    if(!val || !map) return
                    var center = map.gm.latlng2gm( map.getCenter() );
                    var pos = val.pos;
                    if( (pos[0] != center[0] && pos[1] != center[1])  ) _setCenter()
                });

            }
        };
    }]);;