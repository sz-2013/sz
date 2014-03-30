L.GM = L.Class.extend({
    options: {
        zero: {x: 20971, y: 20971}
    },

    initialize: function (options) {
        options = L.setOptions(this, options);
        this.zero = this.options.zero
        this.points = options.points
        var points_positions = this.points_positions = this.points.map(function(el){ return  el.place_gamemap_position});
        function _getMax(num){
            var list = points_positions.map( function(pos){return pos[num]} );
            return Math.max.apply(null, list)
        }
        this.posMax = this.gm2project(_getMax(0), _getMax(1))
    },

    canBeBox: function (point){ //(Point)
        if(point.x < this.zero.x || point.y > this.zero.y) return false
        if(point.x > this.posMax.x || point.y < this.posMax.y) return false
        return true
    },

    getColor: function (isOpacity){
        function _rand(){return Math.floor(Math.random() * 256)}
        var r = _rand(), g = _rand(), b = _rand(), max = Math.max.apply( Math, [r, g, b] );
        return 'rgba(' + r + ',' + g + ',' + b + ',' + (isOpacity ? Math.floor(7 + Math.random() * 3)/10 : 1) + ')'
    },

    getGameBox: function (point){
        var pos = this.project2gm(point);
        return this.getGameBoxbyPos(pos.x, pos.y)
    },

    getGameBoxbyPos: function (x, y){
        return getGameBox([x, y], this.points) //gameBox.js function
    },

    getTile: function (x, y){ //game x, y; -> tile
        var tiles = this._map.tileLayer._tiles;
        for(key in tiles){
            if(tiles.hasOwnProperty(key)){
                var pos = tiles[key]._gBox.pos;
                if(pos[0] == x && pos[1] == y) return tiles[key]
            }
        }
    },

    _getTileSize: function(){
        return this._map.tileLayer._getTileSize()
    },

    getRandomGP: function (){
        return this.points_positions[Math.floor(Math.random() * this.points_positions.length)]
    },

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
        var color = typeof line == "string" ? line : "#000";
        return {
            bg: bg && bg.split && paper.path(path).attr({stroke: bg.split("|")[0], fill: "none", "stroke-width": bg.split("|")[1] || 3, opacity:1}),
            line: paper.path(path).attr({stroke: color, fill: "none"}),
            from: obj1,
            to: obj2
        };
    }
};

L.GM.prototype.setConnection = function (pre, point) {
    var stroke = /*options.stroke*/point.attr('stroke') + '|' + point.attr('stroke-width');
    this.pconnections.push( this.pathConnection(pre, point, point.attr('stroke'), stroke) );
}

L.GM.prototype.removeConnection = function (conn) {
    var i = this.pconnections.indexOf(conn);
    if(~i) this.pconnections.splice(i, 1);
    conn.remove()
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
    var pathLen = this.ppoints.length;
    for (var i = 0; i < pathLen; i++) {
        var point = this.ppoints[i];
        var pre = this.ppoints[i-1];
        var conn_from = this.pconnections.filter(function(c){return c.to == point})
        var conn = conn_from.length ? conn_from[0] : null;
        if(pre){
            if(conn&&pre!=conn.from) this.updateConnection(conn, pre, point)
            if(!conn) this.setConnection(pre, point)
        } else if(conn) this.removeConnection(conn)
    }
}


L.GM.prototype.setView = function(pos) { //[x, y]
    this.clearView();
    var points = this.ppoints.filter(function(p){
        var _pos = p._gBox.pos;
        return pos[0] == _pos[0] && pos[1] == _pos[1]
    });
    points.forEach(function(p){p.setView()});
};


L.GM.prototype.clearView = function() {
    for (var i = this.ppoints.length - 1; i >= 0; i--) {
        this.ppoints[i].clearView()
        this.ppoints[i].is_center = false;
    };
};


L.GM.prototype.updatePpointsPos = function() {
    for (var i = this.ppoints.length - 1; i >= 0; i--) {
        var point = this.ppoints[i];
        point.updatePos()
    };
    this._fixPConnections()
};



L.GM.prototype.setPPoints = function() {
    // empty method
};


L.GM.prototype.moveCenter = function() {
    // empty method
};


L.gm = function (options) {
    return new L.GM(options);
};

