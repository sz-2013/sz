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
        console.log('_setTransition')
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
        console.log(styleCSS)
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

Raphael.fn.connection = function (obj1, obj2, line, bg, dest_from, dest_to) {
    if (obj1.line && obj1.from && obj1.to) {
        dest_from = obj2;
        dest_to = line;
        line = obj1;
        obj1 = line.from;
        obj2 = line.to;
    }    
    var bb1 = obj1.getBBox(),
        bb2 = obj2.getBBox();
    if(dest_from!==undefined){
        bb1.x = dest_from.x
        bb1.y = dest_from.y
    }
    if(dest_to!==undefined){
        bb2.x = dest_to.x
        bb2.y = dest_to.y
    }
    var p = [{x: bb1.x + bb1.width / 2, y: bb1.y - 1},
        {x: bb1.x + bb1.width / 2, y: bb1.y + bb1.height + 1},
        {x: bb1.x - 1, y: bb1.y + bb1.height / 2},
        {x: bb1.x + bb1.width + 1, y: bb1.y + bb1.height / 2},
        {x: bb2.x + bb2.width / 2, y: bb2.y - 1},
        {x: bb2.x + bb2.width / 2, y: bb2.y + bb2.height + 1},
        {x: bb2.x - 1, y: bb2.y + bb2.height / 2},
        {x: bb2.x + bb2.width + 1, y: bb2.y + bb2.height / 2}],
        d = {}, dis = [];
    for (var i = 0; i < 4; i++) {
        for (var j = 4; j < 8; j++) {
            var dx = Math.abs(p[i].x - p[j].x),
                dy = Math.abs(p[i].y - p[j].y);
            if ((i == j - 4) || (((i != 3 && j != 6) || p[i].x < p[j].x) && ((i != 2 && j != 7) || p[i].x > p[j].x) && ((i != 0 && j != 5) || p[i].y > p[j].y) && ((i != 1 && j != 4) || p[i].y < p[j].y))) {
                dis.push(dx + dy);
                d[dis[dis.length - 1]] = [i, j];
            }
        }
    }
    if (dis.length == 0) {
        var res = [0, 4];
    } else {
        res = d[Math.min.apply(Math, dis)];
    }
    var x1 = p[res[0]].x,
        y1 = p[res[0]].y,
        x4 = p[res[1]].x,
        y4 = p[res[1]].y;
    dx = Math.max(Math.abs(x1 - x4) / 2, 10);
    dy = Math.max(Math.abs(y1 - y4) / 2, 10);
    var x2 = [x1, x1, x1 - dx, x1 + dx][res[0]].toFixed(3),
        y2 = [y1 - dy, y1 + dy, y1, y1][res[0]].toFixed(3),
        x3 = [0, 0, 0, 0, x4, x4, x4 - dx, x4 + dx][res[1]].toFixed(3),
        y3 = [0, 0, 0, 0, y1 + dy, y1 - dy, y4, y4][res[1]].toFixed(3);
    var path = ["M", x1.toFixed(3), y1.toFixed(3), "C", x2, y2, x3, y3, x4.toFixed(3), y4.toFixed(3)].join(",");
    
    if (line && line.line) {
        line.bg && line.bg.attr({path: path});
        line.line.attr({path: path});
    } else {
        var color = typeof line == "string" ? line : "#000";
        return {
            bg: bg && bg.split && this.path(path).attr({stroke: bg.split("|")[0], fill: "none", "stroke-width": bg.split("|")[1] || 3}),
            line: this.path(path).attr({stroke: color, fill: "none"}),
            from: obj1,
            to: obj2
        };
    }
};


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

GameMapBox = function( place ){
    this._init( place )
    this._initEvents()
}

GameMapBox.prototype = {
    _init: function( box ){
        this.place = box;
        this.isAnimating = false;
        self.isForward = false;
        this.options = {
            speed: 500,
            easing : 'ease-out',
            origin : { x : 40, y : 50 },
            zTop: 1000,
            maxH: 300,
            maxW: 300,
            /*normalH: 124,
            normalW: 124,*/
        };        
        this.supportTransitions = Modernizr.csstransitions;
        this.transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ];

        this.GameMapHelper = new GameMapHelper(this);
        this._create_el()    
    },
    _create_el: function(){        
        var self = this;
        var position = this.place.place_gamemap_position;
        var data_pos = 'data-pos="' + position[0] + ',' + position[1] + '"';        
        var el = createCard( 'div', this.place, data_pos );
        var $clmn = $( "[data-column=" + position[0] + "]" );
        $clmn.append( el );
        this.$el = $('[' + data_pos + ']'); 
        /*this.$el.css({bottom: self.options.normalH * (position[1] - 1) + 'px'})*/
        /*this.options.normalH = this.$el.height();
        this.options.normalW = this.$el.width();*/        
    },
    _initEvents: function(){
        var self = this;
        this.$el.find('.map-mapPathCard-bottom').click(function(e){
            if(!self.place.place_owner_race) return
            if(self.isAnimating) return
            if(!self.isForward) self._move2forward()
            else self._move2back()
        });
        this.$el.click(function(e){
            if(self.isForward) self._move2back()
        })
    },
    _move2forward: function(){
        console.log('_move2forward')
        this.isAnimating = true;
        var self = this;
        this.GameMapHelper._resetTransition( self.$el );
        this.GameMapHelper._setOrigin( self.$el, 50, 50 );

        this._setCenter()
        
        var winCenter = {x: window.innerWidth/2, y: window.innerHeight/2};
        var x = winCenter.x - self.center.x;
        var y = winCenter.y - self.center.y;
        var scale = 2;
        var translate = 'translate(' + x + 'px, ' + y + 'px' + ') scale(' + scale + ')';
        self.$el.css({zIndex: self.options.zTop})
        self.GameMapHelper._setTransition( self.$el, 'all', self.options.speed, self.options.easing );
        self.GameMapHelper._applyTransition( self.$el, { transform : translate }, function() {
            self.$el.off( self.transEndEventName );
            self.isAnimating = false;
            self.isForward = true;
        } );
    },
    _move2back: function(){
        var self = this;
        self.isAnimating = true;
        self.$el.css({zIndex: 'initial', position: 'relative'})
        self.GameMapHelper._resetTransition( self.$el );

        self.GameMapHelper._setTransition( self.$el, 'all', self.options.speed, self.options.easing );
        self.GameMapHelper._applyTransition( self.$el, { transform : 'none', width: self.options.normalW + 'px', height: self.options.normalH + 'px'}, function() {
            self.$el.off( self.transEndEventName );
            self.isAnimating = false;
            self.isForward = false;
        } );
    },
    _setCenter: function(){
        this.bbox = this.$el[0].getBoundingClientRect(); //left, top, width, height
        this.center = {x: this.bbox.left + this.bbox.width/2, y: this.bbox.top + this.bbox.height/2}
    }
}



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
                    console.log('showGameMap')
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
                'columns': '=columns',
                'width': '=width',
                'height': '=height',
                'path': '=path',
                'ismobile': '=ismobile'
            }, // {} = isolate, true = child, false/undefined = no change
            // controller: function($scope, $element, $attrs, $transclude) {},
            // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
            restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
            template: '<ul id="gamemap"></ul>',
            // templateUrl: '',
            replace: true,
            // transclude: true,
            // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, element, attrs){}})),
            link: function($scope, element, attrs) {
                var startLabel = 'mapbox-start-label';
                var endLabel = 'mapbox-end-label';
                var helper = paperHelper($scope);
                var exampleB;
                var boxes = new Array;
                var points = new Array;
                var connections = new Array;                

                function findBox(ox, oy){
                    var x = Math.ceil(ox/exampleB.width);
                    var cx = (x - 1)*exampleB.width + 0.5*exampleB.width
                    //var clmn = document.querySelector('[data-column=' + x + ']');
                    var y = $scope.height - Math.ceil(oy/exampleB.height) + 1;
                    var box = document.querySelector('[data-pos="' + x + ',' + y + '"]');
                    var cy = ($scope.height - y)*exampleB.height + 0.5*exampleB.height
                    return {el: box, cx: cx, cy: cy, $clmn: $clmn}
                }

                function init(){
                    for (var i = $scope.width; i > 0; i--) {
                        var c = $scope.columns[i]
                        var clmn = '<li data-column=' + i + ' class="gamemap-column">' + '</li>';
                        element.prepend(clmn)
                        $clmn = $("[data-column=" + i + "]");
                        for (var j = $scope.height; j > 0; j--) {
                            var places = c.filter(function(b){
                                return b.place_gamemap_position[1]==j});
                            /*console.log(places)*/
                            var place = places.length ? places[0] : {place_gamemap_position: [i, j], place_name: 'Empty box'}
                            var $gamemapbox =  new GameMapBox( place );
                            boxes.push($gamemapbox);
                        };
                    };
                    initPapper();
                }

                $scope.$watch('columns', function(val){if(val) init(); });

                function initPapper(){
                    exampleB = boxes[0].$el[0].getBoundingClientRect();
                    var offset = element.children('li:first-child').offset();
                    $scope.paper = Raphael('gamemap', exampleB.width * $scope.width, exampleB.height * $scope.height);
                    $scope.svg = document.getElementsByTagName('svg')[0];
                    $scope.svg.setAttribute("id","raphaelGameMap-Svg");
                    $scope.svg.style.position = 'absolute';
                    $scope.svg.style.top = offset.top + 'px';
                    $scope.svg.style.left = offset.left + 'px'
                    var pathLength = $scope.path.length - 1
                    for (var i = 0; i <= pathLength; i++) {                        
                        var point = new PathPoint(i);
                        points.push(point)                        
                    };
                    $('#main').scrollTop( $scope.paper.height )
                    /*$scope.svg.addEventListener('click', function(e){});*/
                    /*$scope.svg.onclick = function(e) {
                        var mouse = helper.mouse(e);
                        var box = findBox(mouse.x, mouse.y).box;
                        box.onclick.apply(box);
                    }*/
                }
                
                var PathPoint = function(i){
                    var is_end = i === $scope.path.length - 1;
                    var is_start = i === 0;
                    var options = {
                        'stroke'       : '#FFD700',
                        'stroke-width' : 3,
                        'fill'         : '#FFFF00',
                        'fill-opacity' : .7,
                        'r'            : 20,
                    }         
                    if(is_start){
                        options.stroke = '#228B22';
                        options.fill = '#32CD32';
                    }
                    if(is_end){
                        options.stroke = '#8B0000';
                        options.fill = '#FF0000';
                    }

                    function _setConnection(pre){
                        var stroke = options.stroke + '|' + options['stroke-width'];
                        connections.push($scope.paper.connection(pre, point, options.stroke, stroke));
                    }

                    function _fixConnection(){
                        for (var i = connections.length - 1; i >= 0; i--) {
                            $scope.paper.connection(connections[i])
                        };
                        $scope.paper.safari();
                    }

                    function _create_el(){                        
                        function _dragger(){
                            this.ox = this.type == "rect" ? this.attr("x") : this.attr("cx");
                            this.oy = this.type == "rect" ? this.attr("y") : this.attr("cy");
                            this.data('fo', this.attr('fill-opacity'));
                            this.animate({"fill-opacity": .2}, 500);
                        }

                        function _move(dx, dy){
                            var attrs = this.type == "rect" ? {x: this.ox + dx, y: this.oy + dy} : {cx: this.ox + dx, cy: this.oy + dy};
                            this.attr(attrs);
                            _fixConnection()
                        }

                        function _up(){
                            var ox = this.type == "rect" ? (this.attr('x') + this.attr('width')/2) : this.attr('cx');                       
                            var oy = this.type == "rect" ? (this.attr('y') + this.attr('width')/2) : this.attr('cy');
                            var box = findBox(ox, oy)
                            var attrs = {"fill-opacity": this.data('fo')}
                            var dest = {x: box.cx - this.attr('width')/2, y: box.cy - this.attr('height')/2}
                            if(this.type == "rect"){
                                attrs.x = dest.x;
                                attrs.y = dest.y;
                            }
                            else{
                                attrs.cx = box.cx;
                                attrs.cy = box.cy;
                            }
                            var self = this;
                            var conn_to = connections.filter(function(c){return  self == c.to })
                            var this_conn_to = conn_to.length ? conn_to[0] : null;
                            $scope.paper.connection(this_conn_to, undefined, dest)
                            var conn_from = connections.filter(function(c){return self == c.from })
                            var this_conn_from = conn_from.length ? conn_from[0] : null;
                            $scope.paper.connection(this_conn_to, dest)
                            this.animate(attrs, 300)
                        }        
                        var pos = $scope.path[i].place_gamemap_position;
                        var $gamemapbox = boxes.filter(function(b){
                            var bpos = b.place.place_gamemap_position
                            return bpos[0] == pos[0] && bpos[1] == pos[1]
                        })[0];
                        $gamemapbox._setCenter();
                        var x = $gamemapbox.bbox.left;
                        var y = $gamemapbox.bbox.top + 6 + $gamemapbox.bbox.height/2 - options.r;
                        var point  = $scope.paper.circle(x, y, 1);
                        point.attr(options);
                        if(!is_start&&!is_end) point.drag(_move, _dragger, _up);
                        return point
                    }

                    var point = _create_el();
                    var pre = points[i-1];
                    if(pre) _setConnection(pre)                    

                    return point;
                }
                
            }
        };
    }]);;