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

    function _dragger(x, y, e){
        this.ox = this.attr("cx");
        this.oy = this.attr("cy");
        this.fo = this.attr("fill-opacity");
        var self = this;
        this.connections = gm.pconnections.filter(function(c){return  self == c.to || self == c.from })
        this.animate({"fill-opacity": .2}, 500);
        _showhideConn()
        gm._inDrag()
    }

    function _move(dx, dy){
        this.attr({cx: this.ox + dx, cy: this.oy + dy});
        gm._fixPConnections()
    }

    function _up(e){
        var gp = gm.layer2gm( this.attr('cx'), this.attr('cy') ); //позиция {x, y} gamebox на карте, в которой теперь находится кружочек
        var inGP = gm.getGameBoxbyPos(gp.x, gp.y);
        var center = gm.gm2layer( inGP.pos[0], inGP.pos[1] );
        this.animate({"fill-opacity": this.fo}, 500);
        this.animate({cx: center.x, cy: center.y}, 300, 'bounce', function(){
            gm._fixPConnections();
            _showhideConn(true);
        });
        this._gBox = inGP
        console.log(this._gBox)
        gm.setPPoints()
        gm._outDrag()
        if(this.is_center) gm.moveCenter(this)
    }

    function _create_el(){
        var point  = gm._map.paper.circle(0, 0);
        point.attr(options);
        point._gBox = gBox;
        point.setView = function(){
            point.nsw = point.attr('stroke-width');
            point.nfo = point.attr('fill-opacity');
            this.animate({'stroke-width': this.nsw*2, 'fill-opacity': 1}, 500, 'bounce');
            this.is_center = true;
        }
        point.clearView = function(){
            if(!this.nsw) return
            this.animate({'stroke-width': this.nsw, 'fill-opacity': this.nfo}, 500, 'bounce');
        }
        if(!is_start&&!is_end) point.drag(_move, _dragger, _up);
        return point
    }

    var point = _create_el();
    point.updatePos = function(){
        var GP = this._gBox.pos;
        var pos = gm.gm2layer(GP[0], GP[1]);
        this.attr({cx: pos.x, cy: pos.y});
    }
    point.updatePos()
    point.i = thisI;

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
