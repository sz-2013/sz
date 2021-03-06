angular.module('map-directive', [])
    .directive('mapPathPreview', [function(){
        return {
            scope: {
                ppoints: '=ppoints', //[gBox, gBox, ...]
                center: '=center', //[x, y]
            },
            restrict: 'E',
            template:
                '<div>' +
                    '<h5 class="page-header">Вы совершили перемещение <br> Длина пути: {{ppoints.length}} клеток</h5>' +
                    /*'<ul class="simpleSlider-container gamemap-item"></ul>' +*/
                    '<ul class="gamemap-pathpreview"></ul>'+
                '</div>',
            replace: true,
            transclude: true,
            link: function($scope, element, attrs) {
                var elem = element[0].querySelector('.gamemap-pathpreview');
                var activePos, nodeClass = 'gamemap-pathpreview-node';
                function setNodeActive( node ){
                    if(!node) return
                    node2array( elem.querySelectorAll('.' + nodeClass) ).map(
                        function(el){removeClass(el, 'active')}) ;
                    addClass(node, 'active');
                }

                function createNode( gBox ){
                    var node = document.createElement('span');
                    node.setAttribute('data-pos', gBox.pos);
                    addClass(node, gBox.owner);
                    addClass(node, nodeClass);
                    node.onclick = function(){
                        setNodeActive(this)
                        var pos = this.getAttribute('data-pos').toIntArray();
                        var thisGBox = $scope.ppoints.filter(function(p){return p.pos.compare(pos) });
                        $scope.$emit('setActivePoint', pos) //отцентровываем карту, чтобы когда мы на нее перейдем, активная точка была в центре)
                        $scope.$emit('setCurrentGBox', thisGBox[0]) //теперь можно посмотреть детальную инфу по данной точке.
                        //Они не совмещены, потому что верхнее вызывается только дл точек из паф, а эта функция - для все клеток.
                    }
                    if( gBox.pos.compare(activePos) ) setNodeActive(node)
                    return node
                }


                function createPathPreview(ppoints){
                    if(!ppoints) return
                    elem.innerHTML = '';
                    var elemStyle = document.defaultView.getComputedStyle(elem, null), padding = (parseInt(elemStyle['padding-left']) + parseInt(elemStyle['padding-left'])),
                        ppointsLen = ppoints.length, nodeWidth = 60, width = (element[0].offsetWidth - padding),
                        nodesInRow = Math.floor(width/nodeWidth), rowWidth = nodesInRow*nodeWidth + padding, rowValue = Math.ceil(ppointsLen/nodesInRow);
                    elem.style.width = rowWidth + 'px';
                    //console.log([width/nodeWidth, nodesInRow, rowWidth, width, element[0].offsetWidth, parseInt(elemStyle['padding-left'])])
                    //console.log([nodesInRow, rowValue])
                    for (var i = 0; i < rowValue; i++) {
                        var row = document.createElement( 'li' );
                        for (var j = 0; j < nodesInRow; j++) {
                            var num = ((i % 2) ? (nodesInRow-j-1) : j) + i*nodesInRow;
                            if (num < ppointsLen){
                                var node = createNode( ppoints[num] );
                                node.innerHTML = num + 1;
                                if( num == (ppointsLen-1) ){
                                    addClass(node, 'hideBefore')
                                    if(~i % 2) addClass(node, 'hideAfter')
                                }
                                row.appendChild( node )
                            }
                        };
                        elem.appendChild( row )
                    };
                }

                window.addEventListener("orientationchange", function() {
                    if( $scope.ppoints ) createPathPreview( $scope.ppoints )
                }, false);

                $scope.$watch( 'ppoints', createPathPreview );

                $scope.$watch( 'center', function( activePos ){
                    if(activePos && !elem.querySelector('.active')) setNodeActive(elem.querySelector('[data-pos="' + activePos.toString() + '"]'))
                });

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
            /*        for (var i = this.ppoints.length - 1; i >= 0; i--) {
                        var pos = this.ppoints[i]._gBox.pos
                        var tile = this.getTile(pos[0], pos[1]);
                    };*/
                    $scope.$emit('setPPoints', $scope.map.gm.ppoints)
                };
                L.GM.prototype.moveCenter = function( point ) {
                    $scope.$emit('setPPoints', $scope.map.gm.ppoints)
                    $scope.$emit('setActivePoint', point._gBox.pos)
                };
                L.GM.prototype.getGameBoxFromApi = function ( x, y ){
                    var gBox = this.findGbox([x, y]);
                    if(!gBox) $scope.$emit('getGBoxFromApi', x, y, 'setGBox')
                    //если смещается центр - то заново перезапрашиваются все точки
                    //если они уже есть в списке - то их просто нужно перерисовать
                    else $scope.map.gm.drawTile( false, gBox )
                };
                L.GM.prototype.createPath = function() {
                    var pathLen = this.pathPositions.length;
                    for (var i = 0; i < pathLen; i++) {
                        var point =  this.createPathPoint( i );
                    };
                    $scope.$emit('setPPoints', $scope.map.gm.ppoints);
                    $scope.$emit('setGameMap', false);
                    var tile = $scope.map.gm.getTile($scope.center[0], $scope.center[1]);
                    if(tile) $scope.map.setTileActive(tile);
                    $scope.$emit('setCurrentGBox', $scope.map.gm.ppoints[0] && $scope.map.gm.ppoints[0]._gBox)
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
                        var gBox = $scope.map.gm.findGbox([gPoint.x, gPoint.y]);
                        //добавляем новую точку если нужно
                        if( $scope.map.gm._newPoint ) return $scope.$apply( function(){$scope.map.gm.pushNewPPoint( gBox ) } )

                        addClass(tile, 'gmtile-inner-wavein');
                        tile.addEventListener( 'webkitTransitionEnd', function( e ) {
                            removeClass(tile, 'gmtile-inner-wavein');
                        }, false );
                        $scope.map.setTileActive(tile);
                        $scope.$emit('setCurrentGBox', gBox)
                    });
                }

                function _init(){
                    _initCont();
                    $scope.map = L.szMap( elem.getAttribute('id'), $scope.center );
                    _getGboxes4path();
                    _initClick();
                }

                function _getGboxes4path(){
                    //на случай, если точки пути выходят за пределы уже отрисованной карты
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


          /*      $scope.$watch('pathPositions', function(){
                    console.log('pathPositions')
                    _getGboxes4path()
                } );
*/
                $scope.$watch('center', function(pos){
                    if(!pos) return
                    if(!$scope.map) _init()
                    var center = $scope.map.gm.latlng2gm( $scope.map.getCenter() );
                    if( !pos.compare( center )  ) _setCenter()
                });

                $scope.$watch('pathPositions', function(val, oldval){
                    if(oldval && (!val || !val.length)) $scope.map.gm.removePath()
                });

            }
        };
    }])