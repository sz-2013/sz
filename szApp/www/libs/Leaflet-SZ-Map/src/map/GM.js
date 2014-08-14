function drawTile(gBox){
    var img = gBox.ms && gBox.ms.img.thumbnail || '';
    var sp = gBox.sp ? gBox.sp[0]*100/gBox.sp[1] : 0
    var tile = '<h3>' + gBox.name + '</h3>'/* + '<img src="' + img + '" class="gBox-img">'*/;
    if(gBox.ms && gBox.ms.img){
        var tile = tile + '<div class="gBox-detail" >' + [
            /*'<span >' + 'The Sieve of Eratosthenes' + ' ' + gBox.lvl + '/' + 3 + '</span>'*/
            /*, + '</span>' + '<span class="gBox-detail"><i class="fa fa-tachometer"></i>'*/
            /*,gBox.buildings[0] + '/' + gBox.buildings[1] + '</span>' + '<span class="gBox-detail"><i class="fa fa-building-o"></i>'*/
            ,'<span class="gBox-detail-spec gBox-detail-profit">' + gBox.profit + '</span>'
            ,'<span class="gBox-detail-spec gBox-detail-negative">' + gBox.negative + '</span>'
        ].join('') + '</div><div class="gBox-sp-value" style="width:' + sp + '%;">'
    }
    return {tile: tile, img: img || ''}
}

L.GM = L.Class.extend({
    options: {
        zero: {x: 20971, y: 20971}
    },

    initialize: function (options) {
        options = L.setOptions(this, options);
        this.zero = this.options.zero
        this.gboxes = new Array;
        this.path = new Array;
        this.ppoints = new Array;
        this.pathPosLen = 0;
        /*this.points = options.points
        var points_positions = this.points_positions = this.points.map(function(el){ return  el.place_gamemap_position});
        function _getMax(num){
            var list = points_positions.map( function(pos){return pos[num]} );
            return Math.max.apply(null, list)
        }
        this.posMax = this.gm2project(_getMax(0), _getMax(1))*/
    },

    /*canBeBox: function (point){ //(Point)
        if(point.x < this.zero.x || point.y > this.zero.y) return false
        if(point.x > this.posMax.x || point.y < this.posMax.y) return false
        return true
    },*/

    getColor: function (isOpacity){
        function _rand(){return Math.floor(Math.random() * 256)}
        var r = _rand(), g = _rand(), b = _rand(), max = Math.max.apply( Math, [r, g, b] );
        return 'rgba(' + r + ',' + g + ',' + b + ',' + (isOpacity ? Math.floor(7 + Math.random() * 3)/10 : 1) + ')'
    },

    getGameBox: function (point){
        var pos = this.project2gm(point);
        return this.getGameBoxFromApi(pos.x, pos.y)
    },

    findGbox: function (pos){ //[x, y]
        return this.gboxes.filter(function(gBox){return gBox.pos.compare( pos )})[0]
    },

    getTile: function (x, y){ //game x, y; -> tile
        var tiles = this._map.tileLayer._tiles;
        var proj = this.gm2project( x, y )
        for(key in tiles){
            if(tiles.hasOwnProperty(key)){
                var coords = tiles[key]._coords;
                if(proj.x == coords.x && proj.y == coords.y) return tiles[key]
            }
        }
    },

    drawTile: function(place_data, gBox){
        //функция вызывается после получения данных от апи
        //или из getGameBox
        if(!gBox){
            place_data.pos = place_data.place_gamemap_position;
            //проверяем, что gBox еще не создан
            if( this.findGbox(place_data.pos) ) return
            var gBox = new this.gameBox( place_data );
            this.gboxes.push(gBox)
        }
        var tile = this.getTile( gBox.pos[0], gBox.pos[1] )
        //рисуем внутрености у tile
        if( tile ){
            var inner = drawTile(gBox)
            tile.innerHTML = ['<div class="gamemap-item hideitem ', gBox.owner,'"', inner.img ? ' style="background-image:url(' + inner.img + ')"' : '' , '>' ,
                               inner.tile, '</div>'].join('')
            setTimeout(function(){L.DomUtil.removeClass(tile.querySelector('.gamemap-item'), 'hideitem')}, 100);
            this._map.tileLayer.markReady(tile, this.gmReady)
        }
        //если tile еще нет - ничего страшного,это значит, что запрос инициировался для точки из pathPoints, находящейся за пределами карты
        if( this.pathPositions &&
            this.pathPositions.filter( function(p){return p.compare( gBox.pos )} ).length && //если есть  такой элемент в pathPosition
            !this.path.filter( function(b){return b.pos.compare( gBox.pos )} ).length){ //и еще не добавлен в path
            //добавляем gBox в path
            this.path.push( gBox )
            //если path полностью наполнился - те его длина сравнялась с pathPositions
            //начинаем отрисовывать path
            if( this.path.length === this.pathPositions.length ) this.createPath()
        }
    },

    pathPositions2ppoints: function( pathPositions ){
        this.pathPositions = pathPositions;
        var self = this
        //все те gbox, которые уже получены с апи и есть в pathPositions - добавляем в this.path
        for (var i = this.gboxes.length - 1; i >= 0; i--) {
            var gBox = this.gboxes[i];
            if(pathPositions.filter( function(p){return p.compare( gBox.pos )} ).length) this.path.push( gBox );
        };
        //если путь игрока длиннее, чем загруженная карта - останутся не полученные с апи точки
        for (var i = pathPositions.length - 1; i >= 0; i--) {
            var pos = pathPositions[i];
            if( !this.findGbox(pos) ) this.getGameBoxFromApi( pos[0], pos[1] )
        };
        //если path полностью наполнился - те его длина сравнялась с pathPositions
        //начинаем отрисовывать path
        if( this.path.length === this.pathPositions.length ) this.createPath()
    },

    _getTileSize: function(){
        return this._map.tileLayer._getTileSize()
    },

 /*   getRandomGP: function (){
        return this.points_positions[Math.floor(Math.random() * this.points_positions.length)]
    },*/

    generatePath: function(start){
        var start = start || this.getRandomGP(), end = this.getRandomGP();
        //var start = start, end = [start[0] + 8, start[1]];
        //var start = start, end = [start[0] - 8, start[1]];
        function _getPath(_path){
            function _compare(a, b){return a > b ? -1 : a < b ? 1 : 0}
            var _path = _path || [start],
                last = _path[_path.length-1],
                next_x = _compare(last[0], end[0]) + last[0],
                next_y = start[1];
            if(next_x == end[0]) var next_y = _compare(last[1], end[1]) + last[1];
            _path.push([next_x, next_y]);
            return (next_x == end[0] && next_y == end[1]) ? _path : _getPath(_path)
        }
        var path = _getPath();
        //var path = [[8, 8], [8, 7], [9, 7], [10, 7], [10, 8], [11, 8], ];
        //var path = [[8, 9], [9, 8], [9, 7]];
        return path
    },

    //convert methods
    project2gm: function (point){ //(Point)  to gamemap x, y
        if(point.x > this.zero.x*this._getTileSize()) var point = this._minimalPoint(point)
        return {x: point.x - this.zero.x, y: this.zero.y - point.y}
    },

    gm2project: function (x, y){ //game x, y to LeafletProject x, y
        return {x: this.zero.x + x, y: this.zero.y - y}
    },

    gm2latlng: function (pos, tileSize){ //[x, y] in gameMap, -> center of needed box in LngLat
        var tileSize = tileSize || this._getTileSize();
        var posProj = this.gm2project( pos[0], pos[1] ); //Point()
        var posProjFull = {
            x: posProj.x*tileSize  + tileSize/2,
            y: posProj.y*tileSize + tileSize/2
        };
        var posPoint = new L.Point( posProjFull.x, posProjFull.y );
        return this._map.unproject( posPoint );
    },

    latlng2gm: function (latlng){
        var point = this._map.project(latlng);
        return this.project2gm(point)
    },

    gm2layer: function (x, y){ //-> x, y in layer
        var latlng = this.gm2latlng([x, y]);
        return this._map.latLngToLayerPoint(latlng)
    },

    layer2gm: function (x, y){ //-> [x, y]
        var svgTransform = this._map.paper.canvas.style.webkitTransform;
        var normalX = svgTransform ? parseInt(/\((-?\d+)/.exec(svgTransform)[1], 10) : 0;
        var normalY = svgTransform ? parseInt(/, (-?\d+)/.exec(svgTransform)[1], 10) : 0;
        var point = new L.Point( x - normalX, y - normalY );
        var latlng = this._map.containerPointToLatLng( point );
        var proj = this._map.project( latlng );
        return this.project2gm( this._minimalPoint(proj) )
    },

    _minimalPoint: function (point){
        return new L.Point( this._minimalVal(point.x), this._minimalVal(point.y) )
    },

    _minimalVal: function (val){
        var tileSize = this._getTileSize();
        return Math.floor( val/tileSize )
    },

    _inDrag: function (){
        this._map.dragging._draggable.other_in_drag = true;
    },

    _outDrag: function (){
        this._map.dragging._draggable.other_in_drag = false;
    }

});


L.GM.prototype.gameBox = function(options){
    //Options:
    //name - str
    //owner - str (['neutral', 'negative', 'positive', 'nobody', 'own'])
    //profit - str ('+10HP, +1Int, +2Agl')
    //negative - str ('-10HP, -1Int, -2Agl')
    //lvl - array, [currLvl, maxLvl]
    //buildings - array, [currVal, maxVal]
    var empty_name = 'Empty box';
    this.name = options.name || options.place_name || empty_name,
    this.pos = options.pos;
    this.owner = options.place_owner;
    this.profit = options.place_profit;
    this.negative = options.place_negative;
    this.ms = ''
    this.sp = options.place_sp
    if(options.place_ms && options.place_ms.img){this.ms = options.place_ms}
    this.lvl = options.place_lvl;
    this.buildings = options.place_buildings;
}


L.GM.prototype.gameBox.prototype.toString = function() {
    //return this.name
    return [this.name, 'x: ', this.pos[0], ';',
            'y: ', this.pos[1], this.owner].join('')
};


L.GM.prototype.pconnections = new Array;
L.GM.prototype.pathConnection = function(obj1, obj2, line, bg) {
    var paper = this._map.paper;
    if (obj1.line && obj1.from && obj1.to) {
        line = obj1;
        obj1 = line.from;
        obj2 = line.to;
    }
    var bb1 = obj1.getBBox(),
        bb2 = obj2.getBBox();

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
        //var color = typeof line == "string" ? line : "#000";
        return {
            bg: paper.path(path),
            line: paper.path(path),
            from: obj1,
            to: obj2
        };
    }
};


L.GM.prototype.paintConn = function(conn) {
    //@TODO: ставить произвольны таймаут здесь не кажется мне хорошим решением, нужно что-то другое придумать. Однако если сразу применять - не успевают атрибуты смениться
    setTimeout(function(){
        conn.bg.attr({stroke: conn.to.attr('stroke'), fill: "none", "stroke-width": conn.to.attr('stroke-width') || 3, opacity:1})
        conn.line.attr({stroke: conn.to.attr('stroke'), fill: "none"})
    }, 100)
};

L.GM.prototype.setConnection = function (pre, point) {
    var conn = this.pathConnection(pre, point)
    this.pconnections.push( conn );
    this.paintConn( conn )
}

L.GM.prototype.removeConnection = function (conn) {
    var i = this.pconnections.indexOf(conn);
    if( conn.line ) conn.line.remove()
    if( conn.bg ) conn.bg.remove()
    if( ~i ) this.pconnections.splice(i, 1);
}

L.GM.prototype.updateConnection = function (conn, from, to) {
    conn.from = from
    conn.to = to
    this.pathConnection(conn)
}

L.GM.prototype._fixPConnections = function() {
    var gm = this;
    for (var i = gm.pconnections.length - 1; i >= 0; i--) {
        gm.pathConnection(gm.pconnections[i])
    };
    this._map.paper.safari();
};


L.GM.prototype._updatePConnections = function(){
    //сначала удаляем лишние connection, т.е те,к оторые растут из пустоты (from было удалено)
    //или уходят в пустоту (to было удалено)
    var self = this;
    var toRemoveConn = this.pconnections.filter( function( conn ){
        return !~self._getPointIndex( conn.from ) || !~self._getPointIndex( conn.to )
    } )
    for (var i = toRemoveConn.length - 1; i >= 0; i--) {
        this.removeConnection( toRemoveConn[i] )
    };
    var pathLen = this.ppoints.length;
    //начинаем со второй, чтобы не трогать
    for (var i = 1; i < pathLen; i++) {
        //для каждой точки и ее предыдущего соседа
        var point = this.ppoints[i];
        var pre = this.ppoints[i-1];
        //находим connection, который идет до точки
        var conn_to = this.pconnections.filter(function(c){return c.to == point})[0]
        //если есть connection и второй конец не соответствует pre,
        //те была перед текущей вставлена новая точка
        //делаем апдейт
        if(conn_to&&pre!=conn_to.from) this.updateConnection(conn_to, pre, point)
        //если нет connection до этой точки, те эта точка - новая -
        //создаем connection
        if(!conn_to) this.setConnection(pre, point)
    }
    this.repaintConnections()
}


L.GM.prototype.setView = function(pos) { //[x, y]
    this.clearView();
    var center_points = this.ppoints.filter(function(p){
        return  p._gBox.pos.compare(pos)
    });
    center_points.forEach(function(p){p.setView()});
    var center_tile = this.getTile(pos[0], pos[1]);
    this._map.setTileActive(center_tile)
};


L.GM.prototype.updatePpointsPos = function() {
    this._map_pp( function(point){ point.updatePos() } )
    this._fixPConnections()
};


L.GM.prototype._get_connections = function( point ) {
    return this.pconnections.filter( function(c){return  point == c.to || point == c.from } )
};


L.GM.prototype._get_neigthbors = function( point ) {
    var neightbors = new Array, i = this._getPointIndex( point );
    if( this.ppoints[i+1] ) neightbors.push( this.ppoints[i+1] )
    if( this.ppoints[i-1] ) neightbors.push( this.ppoints[i-1] )
    return neightbors
    /*point.connections = this._get_connections(point);
    return  point.connections.map(function(c){return c.to == point ? c.from : c.to});*/
};


L.GM.prototype._compare_pos = function( a, b ){
    return Math.abs( a - b ) < 2
}


L.GM.prototype._canBeIn_gBox = function(point, gBox) { //point || neightbors, gBox
    //проверяем, может ли point находится в данном gBox
    var pos = gBox.pos;
    //во-первых, он должен быть свободен от других кружочков
    if( this.ppoints.filter( function(p){ return pos.compare( p._gBox.pos ) } ).length ) return
    //теперь проверяем, что по x и y мы не отошли от соседей больше чем на две клетки
    var neighbors = Object.prototype.toString.call( point ) === '[object Array]' ? point : this._get_neigthbors(point);
    if( !this._canBeNeightbors( pos, neighbors ) ) return
    return true
};


L.GM.prototype._canBeNeightbors = function(pos, neightbors) {
    //для каждого из соседей (объекты ppoint) проверяем, что мы не отошли от него по х или y больше, чем на 2 клетки
    for (var i = neightbors.length - 1; i >= 0; i--) {
        var nPos = neightbors[i]._gBox.pos;
        if( !this._compare_pos( pos[0], nPos[0] ) || !this._compare_pos( pos[1], nPos[1] ) ) return false
    };
    return true
};


L.GM.prototype._map_pp = function(fn) {
    for (var i = this.ppoints.length - 1; i >= 0; i--) { fn( this.ppoints[i], this ); }
};


L.GM.prototype.blurAll = function() {
    this._map_pp( function(point){ point.blur() } )
    this.repaintConnections()
};


L.GM.prototype.focusCanBeRemove = function(first_argument) {
    this.blurAll()
    this._map_pp(function( point ){
        if( point.canBeRemove() ) point.focus()
    })
    this.repaintConnections()
};


L.GM.prototype.clearView = function() {
    this._map_pp( function(point){
        point.clearView();
        point.is_center = false;
    } )
    this.repaintConnections()
};


L.GM.prototype.repaintConnections = function() {
    for (var i = this.pconnections.length - 1; i >= 0; i--) {
        this.paintConn( this.pconnections[i] )
    };
};


L.GM.prototype.repaintConnByPoint = function(point) {
    point.connections = point.connections || this._get_connections( point );
    for (var i = point.connections.length - 1; i >= 0; i--) {
        this.paintConn( point.connections[i] )
    };
};


L.GM.prototype._getPointIndex = function(point) {
    return this.ppoints.indexOf(point)
};


L.GM.prototype.setPPoints = function() {
    // empty method, will rewriting in map-directive
};


L.GM.prototype.moveCenter = function() {
    // empty method, will rewriting in map-directive
};


L.GM.prototype.getGameBoxFromApi = function (x, y){
    // empty method, will rewriting in map-directive
},


L.GM.prototype.gmReady = function() {
    //функция вызывается при отрисовке какого-то конретного tile
    // empty method, will rewriting in map-directive
};


L.GM.prototype.createPath = function() {
    // empty method, will rewriting in map-directive
};


L.gm = function () {
    return new L.GM();
};

