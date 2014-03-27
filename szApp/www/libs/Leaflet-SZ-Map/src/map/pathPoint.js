L.GM.prototype.ppoints = new Array;
L.GM.prototype.pushPPoint = function(x, y, i, shift) { //x in gamemap, y in gamemap, num, bln
    var newi = shift ? i : i + 1
    var point = this._pathPoint({
        gp: [x, y],
        is_end: false,
        is_start: false,
        thisI: newi,
        pre: this.ppoints[i]
    });
    this.ppoints.forEach(function(p){
        if(p.i>i || (p.i==i && shift)){
            p.i = p.i + 1
        }
    }) //update all indexes
    this.ppoints.splice(newi, 0, point)
    this._updatePConnections()
    this._markBox()
    return point
};
L.GM.prototype._getGP = function(ppoint){
    return ppoint ? this.container2gm( ppoint.attr('cx'), ppoint.attr('cy') ) : null
}
L.GM.prototype._pathPoint = function(params){// pos, is_end, is_start, thisI, pre
    var gm = this;
    var paper = this._map.paper;
    var gBox = params.gp;
    var GP = gBox.pos, is_end = params.is_end, is_start = params.is_start, thisI = params.thisI, pre = params.pre;
    var pos = gm.gm2layer(GP[0], GP[1]);
    var options = {
        'stroke'       : '#f39c12',
        'stroke-width' : 3,
        'fill'         : '#f1c40f',
        'fill-opacity' : .8,
        'r'            : gm._getTileSize()/4,
    }
    if(is_start){
        options.stroke = 'rgba(0, 102, 255, 1)';
        options.fill = 'rgba(0, 80, 255, 1)';
    }
    if(is_end){
        options.stroke = 'rgba(163, 78, 36, 1)';
        options.fill = 'rgba(198, 54, 5, 1)';
    }
    options['alert-stroke'] = '#8B0000'

    function _showhideConn(show, attr){
        //if(point.connections === undefined)
        var t = show ? 150 : 300;
        var easing = show ? '<' : '>'
        var attr = attr || {opacity: show ? 1 : 0};
        point.connections.forEach(function(c){
            c.line.animate(attr, t, easing)
            c.bg && c.bg.animate(attr, t, easing);
        })
    }

    function _create_el(){
        function _dragger(x, y, e){
            this.ox = this.attr("cx");
            this.oy = this.attr("cy");
            this.fo = this.attr("fill-opacity");
            var self = this;
            this.connections = gm.pconnections.filter(function(c){return  self == c.to || self == c.from })
            if(_canMove(self)){
                this.animate({"fill-opacity": .2}, 500);
                _showhideConn()
            } else{
                _showhideConn(true, {stroke: options['alert-stroke']})
            }
            gm._inDrag()
        }

        function _canMove(pnt){
            function _can(pos){
                var nextDiff = gp[pos] - nextgp[pos];
                if( pregp[pos] == gp[pos] && Math.abs(nextDiff) == 1) return nextDiff
                var prevDiff = gp[pos] - pregp[pos];
                if( nextgp[pos] == gp[pos] && Math.abs(prevDiff) == 1) return prevDiff;
                return 0
            }
          /*  var gp = gm._getGP(pnt);
            var pregp = gm._getGP(gm.ppoints[pnt.i-1]);
            var nextgp = gm._getGP(gm.ppoints[pnt.i+1]);
            var canmove = {
                x: _can('x'), // 1/-1/0
                y: _can('y')  // 1/-1/0
            };*/
            return true
        }

        function _move(dx, dy){
            if(_canMove(this)){
                this.attr({cx: this.ox + dx, cy: this.oy + dy});
                gm._fixPConnections()
            }
        }

        function _up(e){
            var self = this;
            if( _canMove(self) ){
                var gp = gm._getGP(this);
                var inGP = gm.ppoints.filter(function(p){return p.GP.x == gp.x && p.GP.y == gp.y});
                if( inGP.length ) gp = this.GP;
                else this.GP = gp;
                var center = gm.gm2layer( gp.x, gp.y );
                this.animate({"fill-opacity": this.fo}, 500);
                this.animate({cx: center.x, cy: center.y}, 300, 'bounce', function(){
                    gm._fixPConnections();
                    _showhideConn(true);
                });
            } else{
                _showhideConn(true, {stroke: options.stroke})
            }
            gm._outDrag()
        }


        var point  = gm._map.paper.circle(pos.x, pos.y);
        point.attr(options);
        point._gBox = gBox;
        point.setView = function(){
            point.nsw = point.attr('stroke-width');
            point.nfo = point.attr('fill-opacity');
            this.animate({'stroke-width': this.nsw*2, 'fill-opacity': 1}, 500, 'bounce');
        }
        point.clearView = function(){
            if(!this.nsw) return
            this.animate({'stroke-width': this.nsw, 'fill-opacity': this.nfo}, 500, 'bounce');
        }
        if(!is_start&&!is_end) point.drag(_move, _dragger, _up);
        return point
    }

    var point = _create_el();
    point.i = thisI;
    point.GP = {x: GP[0], y: GP[1]};

    return point;

}
L.GM.prototype.pathPoint = function(i, path){
    var pre = this.ppoints[i-1];
    var point = this._pathPoint({
        gp: path[i],
        is_end: i === path.length - 1,
        is_start: i === 0,
        thisI: i,
        pre: pre
    });
    this.ppoints[i] = point;
    if(pre) this.setConnection(pre, point)
    //this._markBox()
    return point
}

L.GM.prototype._markBox = function(){
    for (var i = this.ppoints.length - 1; i >= 0; i--) {
        var p = this.ppoints[i];
        var gp = this._getGP(p); //{x, y}
        var tile = this.getTile(gp.x, gp.y);
        if(tile) tile.innerHTML = '<h1>' + p.i + '</h1>'
    };
}


/*function _canMove(pnt){
    function _comparePos(a, b){
        return Math.abs(a-b) > 1
    }
    var gp = gm._getGP(pnt);
    if(pnt._gp === undefined) pnt._gp = gp
    if(pnt._gp.x == gp.x && pnt._gp.y == gp.y) return true
    pnt._gp = gp;
    var pregp = gm._getGP(gm.ppoints[pnt.i-1]);
    var nextgp = gm._getGP(gm.ppoints[pnt.i+1]);
    var x = gp.x, y = gp.y;
    if( _comparePos(pregp.x, gp.x) ){
        if(pregp.x > gp.x) var x = gp.x + 1
        else var x = gp.x - 1
    } else {
        if( _comparePos(nextgp.x, gp.x) ){
            if(nextgp.x > gp.x) var x = gp.x + 1;
            else var x = gp.x - 1
        }
    }
    if( _comparePos(pregp.y, gp.y) ){
        console.log(1)
        if( pregp.y > gp.y ) var y = gp.y + 1;
        else var y = gp.y - 1;
        var x = pregp.x;
    } else {
        if( _comparePos(nextgp.y, gp.y) ){
            console.log(2)
            var y = gp.y + 1;
            var x = nextgp.x;
        }
    }

    if(x!=gp.x || y!=gp.y){
        var shift = true;
        var newi = pnt.i
        if(pregp.x == gp.x || (pregp.x > gp.x && x < gp.x)) var shift = false;
        if(y!=gp.y&&pregp.y>nextgp.y) var shift = true;
        if(y!=gp.y&&pregp.y<nextgp.y&&gp.y<pregp.y) var shift = false;
        if(y!=gp.y&&pregp.y<nextgp.y&&gp.y>pregp.y) var shift = true;
        gm.pushPPoint(x, y, newi, shift)
    }
    return true
}*/