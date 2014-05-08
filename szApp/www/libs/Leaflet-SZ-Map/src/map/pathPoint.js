L.GM.prototype.ppoints = new Array;


L.GM.prototype.pushNewPPoint = function(gBox) {
    //если нет _newPoint или данные о нем не полные - прерываем
    if( !this._newPoint || !this._newPoint.to || !this._newPoint.from ) return
    //проверяем, что в выбранной клетке может стоять point
    if( !this._canBeIn_gBox( [this._newPoint.to, this._newPoint.from], gBox ) ) return
    var index = this._newPoint.i;
    var point = this._pathPoint( { gp: gBox, pre: this.ppoints[index] } );
    //update ppoints list
    this.ppoints.splice(index + 1, 0, point)
    this._updatePConnections()
    this.clearView();
    this._newPoint = undefined;
    //@TODO: здесь нужно делать пост на сервер и сообщать о новом положении кружочка
    //если в ответ придет false - откатываться
    this.setPPoints()
    return true
};


L.GM.prototype.removePPoint = function(point) {
    if( !point._canRemove ) return
    this.ppoints.splice( this._getPointIndex( point ), 1 )
    point.remove()
    //@TODO: здесь нужно делать пост на сервер и сообщать о новом положении кружочка
    //если в ответ придет false - откатываться
    this._updatePConnections()
    this.focusCanBeRemove()
    this.setPPoints()
};



L.GM.prototype._pathPoint = function(params){// pos, is_end, is_start, pre
    var gm = this;
    var paper = this._map.paper;
    var gBox = params.gp;
    var GP = gBox.pos, is_end = params.is_end, is_start = params.is_start, pre = params.pre;
    var pos = gm.gm2layer( GP[0], GP[1] );
    var options = {
        'stroke'       : '#f39c12',
        'stroke-width' : 3,
        'fill'         : '#f1c40f',
        'fill-opacity' : .8,
        'r'            : gm._getTileSize()/5,
    };
    if( is_start ){
        options.stroke = 'rgba(0, 102, 255, 1)';
        options.fill = 'rgba(0, 80, 255, 1)';
    }
    if( is_end ){
        options.stroke = 'rgba(163, 78, 36, 1)';
        options.fill = 'rgba(198, 54, 5, 1)';
    }
    options['alert-stroke'] = '#8B0000'
    var blurOpt = {
        'stroke'       : '#7f8c8d',
        'stroke-width' : 3,
        'fill'         : '#7f8c8d',
        'fill-opacity' : .3,
        'r'            : options.r,
    };
    var viewOpt = {
        'stroke'       : options.stroke,
        'stroke-width' : options['stroke-width'],
        'fill'         : options.fill,
        'fill-opacity' : 1,
        'r'            : options.r,
    };

    function _showhideConn(self, show, attr){
        //if(point.connections === undefined)
        var t = show ? 150 : 300;
        var easing = show ? '<' : '>'
        var attr = attr || {opacity: show ? 1 : 0};
        self.connections.forEach(function(c){
            c.line.animate(attr, t, easing)
            c.bg && c.bg.animate(attr, t, easing);
        })
    }

    function _stopMove(self, isAlert){
        self.animate({"fill-opacity": this.fo}, 500);
        _showhideConn(self, true)
        gm._outDrag()
    }

    function _can_move(self){
        //узнаем позицию gamebox, в которой мы сейчас находимся
        var gp = gm.layer2gm( self.attr('cx'), self.attr('cy') ); //позиция {x, y} gamebox на карте, в которой теперь находится кружочек
        //если позиция не поменялась - возвращаем none
        if(gp.x == self._gBox.pos[0] && gp.y == self._gBox.pos[1]) return
        var newGbox = gm.findGbox([gp.x, gp.y]); //сам объект gameBox
        return gm._canBeIn_gBox(self, newGbox) ? newGbox : false
    }

    function _dragger(x, y, e){
        if(gm._inAction !== undefined) return
        this.ox = this.attr("cx");
        this.oy = this.attr("cy");
        this.fo = this.attr("fill-opacity");
        this.connections = gm._get_connections(this);
        gm._inDrag();
        //if( !_can_move(this) ) return _stopMove(this, true)
        this.animate({"fill-opacity": .2}, 500);
        _showhideConn(this);
    }

    function _move(dx, dy){
        if(gm._inAction !== undefined) return
        this._gBox = _can_move(this) || this._gBox //если получено новое значение gameBox, в которой находится кружочек, то устанавливаем его
        //@TODO: здесь нужно делать пост на сервер и сообщать о новом положении кружочка
        //если в ответ придет false - откатываться
        this.attr({cx: this.ox + dx, cy: this.oy + dy});
        gm._fixPConnections()
    }

    function _up(e){
        if(gm._inAction !== undefined) return
        var center = gm.gm2layer( this._gBox.pos[0], this._gBox.pos[1] );
        var self = this;
        this.animate({cx: center.x, cy: center.y}, 300, 'bounce', function(){
            gm._fixPConnections();
            _stopMove(self);
            if(self.is_center) gm.moveCenter(this)
        });
    }

    function _add(self){
        if(gm._newPoint == undefined){
            gm.blurAll()
            gm._newPoint = {from: self}
            self.neighbors = gm._get_neigthbors(self);
            for (var i = self.neighbors.length - 1; i >= 0; i--) {
                self.neighbors[i].focus();
            };
        } else{
            var _in;
            for (var i = gm._newPoint.from.neighbors.length - 1; i >= 0; i--) {
                if( gm._newPoint.from.neighbors[i]._gBox.pos.compare( self._gBox.pos ) ){
                    var _in = true;
                    break
                }
            };
            if( !_in ){
                gm._newPoint = undefined
                gm.clearView()
            } else {
                gm.blurAll()
                gm._newPoint.to = self;
                gm._newPoint.from.focus()
                gm._newPoint.to.focus()
                gm._newPoint.i = Math.min( gm._getPointIndex( gm._newPoint.from ), gm._getPointIndex( gm._newPoint.to ) );
                gm._newPoint.shift = false;
            }
        }
    }

    function _create_el(){
        function _animate(opt, fn){
            point.animate(opt, 'bounce', 500, fn);
        }
        var point  = gm._map.paper.circle(0, 0);
        point.attr(options);
        point._gBox = gBox;

        point.setView = function(){ this.focus(); this.is_center = true; }
        point.blur = function(){ _animate( blurOpt ) }
        point.focus = function(){ _animate(viewOpt), function(){gm.repaintConnByPoint( this );};  }
        point.clearView = function(){ _animate( options ) }
        point.canBeRemove = function(){
            this._canRemove = false
            var pos = this._gBox.pos;
            if( !is_start && !is_end ){
                //берем  два соседних элемента
                var neighbors = gm._get_neigthbors( this );
                //если они могут быть соседями напрямую, без учкастия этого элемента - этот элемент может быть удален
                var n = neighbors.pop()
                if( gm._canBeNeightbors( n._gBox.pos, neighbors ) ) this._canRemove = true;
            }
            return this._canRemove
        }

        function clickPoint(){
            //Поведение при клике определается с помощью параметра gm._inAction
            //undefined - move
            //true - add
            //false - remove
            if(gm._inAction === true) _add(this)
            if(gm._inAction === false) gm.removePPoint(this)
        }

        point.click(clickPoint);
        point.touchstart(clickPoint)

        if( !is_start && !is_end ) point.drag(_move, _dragger, _up);

        return point
    }

    var point = _create_el();
    point.updatePos = function(){
        var GP = this._gBox.pos;
        var pos = gm.gm2layer(GP[0], GP[1]);
        this.attr({cx: pos.x, cy: pos.y});
    }
    point.updatePos()

    return point;

}


L.GM.prototype.createPathPoint = function( i ){
    var pre = this.ppoints[i-1];
    var gBox = this.findGbox( this.pathPositions[i] );
    var point = this._pathPoint({
        gp: gBox, //gBox
        is_end: i === this.path.length - 1,
        is_start: i === 0,
        pre: pre
    });
    this.ppoints[i] = point;
    if(pre) this.setConnection(pre, point)
    //this._markBox()
    return point
}
