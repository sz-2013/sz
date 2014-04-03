angular.module('map-directive', [])
    .directive('mapPathPreview', [function(){
        return {
            scope: {
                isshow: '=isshow',
                ppoints: '=ppoints', //[gBox, gBox]
                center: '=center', //[x, y]
            },
            restrict: 'E',
            template:
                '<div class="simpleSlider">' +
                    '<nav>' +
                        '<button class="btn circle-btn btn-default" ng-click="slider.spreadNav()">' +
                            '<i class="fa fa-times"></i>' +
                        '</button>' +
                        '<button class="btn circle-btn btn-default">' +
                            '<i class="fa fa-ellipsis-h"></i>' +
                        '</button>' +
                        '<button class="btn circle-btn btn-default" ng-click="showGameMap()">' +
                            '<i class="fa fa-cogs"></i>' +
                        '</button>' +
                    '</nav>' +
                    '<ul class="simpleSlider-container gamemap-item">' +
                    '</ul>' +
                '</div>',
            replace: true,
            transclude: true,
            link: function($scope, element, attrs) {
                var startLabel = 'mapbox-start-label';
                var endLabel = 'mapbox-end-label';
                simpleSlider.prototype._update_active_el = function() {
                    $scope.$emit('setActivePoint', this.active._gBox.pos)
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
                    updateCenter()
                }

                function updateCenter(){
                    var pos = $scope.center;
                    if( pos.compare( $scope.slider.active._gBox.pos ) ) return
                    var item;
                    for (var i = $scope.slider.items.length - 1; i >= 0; i--) {
                        var _item = $scope.slider.items[i];
                        if( pos.compare(_item._gBox.pos) ) var item = _item;
                    };
                    if(!item) return
                    $scope.slider._setActive(item)
                }

                $scope.$watch('ppoints', function(val){if(val) init() });
                $scope.$watch('center', function(pos){if(pos&&$scope.slider.active) updateCenter() });
                $scope.$watch('isshow', function(val){if(val) $scope.$emit('setMapInCenter', true) });
            }
        };
    }])
    .directive('gameMap', [function(){
        return {
            scope: {
                'center': '=center', //[x, y]
                'pathPositions': '=pathPositions', // [[x, y], ..]
            },
            restrict: 'E',
            template: '<div id="gameMapCont">' +
                        '<h1 ng-show="showPPvalue" class="animate-spread-center animate-quick">{{map.gm.ppoints.length}}/{{maxPP}}</h1>' +
                        '<div id="gamemap"></div>' +
                      '</div>',
            replace: true,
            link: function($scope, element, attrs) {
                L.GM.prototype.setPPoints = function() {
                    for (var i = this.ppoints.length - 1; i >= 0; i--) {
                        var pos = this.ppoints[i]._gBox.pos
                        var tile = this.getTile(pos[0], pos[1]);
                    };
                    $scope.$emit('setPPoints', $scope.map.gm.ppoints)
                };
                L.GM.prototype.moveCenter = function( point ) {
                    $scope.$emit('setPPoints', $scope.map.gm.ppoints)
                    $scope.$emit('setActivePoint', point._gBox.pos)
                };
                L.GM.prototype.getGameBoxFromApi = function ( x, y ){
                    var gBox = this.findGbox([x, y]);
                    if(!gBox) $scope.$emit('getGBoxFromApi', x, y, 'setGBox')
                    else $scope.map.gm.drawTile( false, gBox )
                };
                L.GM.prototype.gmReady = function() {
                    //console.log(1)
                };
                L.GM.prototype.createPath = function() {
                    var pathLen = this.pathPositions.length;
                    for (var i = 0; i < pathLen; i++) {
                        var point =  this.createPathPoint( i );
                    };
                    $scope.$emit('setPPoints', $scope.map.gm.ppoints);
                    $scope.$emit('setGameMap', false);
                };



                $scope.$on('setGBox', function( e, data ){ $scope.map.gm.drawTile( data ) });

                var elem = element[0].querySelector('#gamemap');
                $scope.maxPP = 25;
                $scope.showPPvalue = false;
                function _initCont(){
                    elem.style.display = 'block';
                    elem.style.height = document.getElementById('mainArea').style.height || '314px';
                }

                function _initClick(){
                    $scope.map.on('click', function(e){
                        if ( e.originalEvent.target.localName == 'circle' ) return
                        var gPoint = $scope.map.gm.latlng2gm(e.latlng);
                        var tile = $scope.map.gm.getTile(gPoint.x, gPoint.y);
                        if(!tile) return
                        var inner = tile.querySelector('.gamemap-item');
                        var gBox = $scope.map.gm.findGbox([gPoint.x, gPoint.y]);

                        //добавляем новую точку если нужно
                        if( $scope.map.gm._newPoint ) return $scope.$apply( function(){$scope.map.gm.pushNewPPoint( gBox ) } )

                        if( gBox.owner == 'nobody' ) return

                        addClass(inner, 'gmtile-inner-wavein');
                        inner.addEventListener( 'webkitTransitionEnd', function( e ) {
                            removeClass(inner, 'gmtile-inner-wavein');
                        }, false );
                    });
                }

                function _init(){
                    _initCont();
                    $scope.map = L.szMap( elem.getAttribute('id'), $scope.center );
                    _getGboxes4path();
                    _initClick();
                }

                function _getGboxes4path(){
                    if(!$scope.pathPositions || !$scope.map || $scope.map.gm.pathPositions) return
                    $scope.map.gm.pathPositions2ppoints($scope.pathPositions)
                }

                function _setCenter(){
                    if(!$scope.map.gm.ppoints || !$scope.map.gm.ppoints.length) return
                    var center = $scope.map.gm.gm2latlng( $scope.center ); //latlng
                    $scope.map.setView( center );
                    $scope.map.gm.setView( $scope.center )
                    if( $scope.map.gm.ppoints.length ) $scope.map.gm.updatePpointsPos()
                }

                function _clearPPControl(){
                    $scope.showPPvalue = false;
                    $scope.map.gm._inAction = undefined;
                    $scope.map.gm._newPoint = undefined;
                    $scope.map.gm.clearView()
                }

                $scope.$on('clearPPControl', function(e){_clearPPControl() })

                $scope.$on('ppcontrol_add', function(e, elem){
                    var val = $scope.map.gm._inAction;
                    _clearPPControl()
                    if(val === true) return
                    $scope.showPPvalue = true;
                    $scope.map.gm._inAction = true;
                });

                $scope.$on('ppcontrol_remove', function(e, elem){
                    var val = $scope.map.gm._inAction;
                    _clearPPControl()
                    if(val === false) return
                    $scope.map.gm._inAction = false;
                    $scope.map.gm.focusCanBeRemove();
                })


                $scope.$watch('pathPositions', _getGboxes4path );

                $scope.$watch('center', function(pos){
                    if(!pos) return
                    if(!$scope.map) _init()
                    var center = $scope.map.gm.latlng2gm( $scope.map.getCenter() );
                    if( !pos.compare( center )  ) _setCenter()
                });

            }
        };
    }])