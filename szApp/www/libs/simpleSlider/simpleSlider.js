
var simpleSlider = function( elem ){
    this._init(elem)
}


simpleSlider.prototype._init = function( elem ) {
    this.longPressTm = 1000;
    this.elem = elem;
    this.elemUl = elem.getElementsByClassName('simpleSlider-container')[0]
    this.div = elem.offsetWidth * 0.2;
    this.nav = elem.getElementsByTagName('nav')[0]
    this._isShowNav= false;
    this._initItems()
    this._initDrag();
};


simpleSlider.prototype.spreadNav = function() {
    //spread/shrink nav
    //@BUG: chrome - когда применяется ротэйт такое ощущение что overflow:hidden у контейнера пропадает, в остальных браузерах ок.
    if(!this.nav) return
    var items = this.nav.getElementsByTagName('button');
    var start_angle = 0, val = items.length, step = 23;
    for (var i = 0; i < val; i++) {
        var item = items[i];
        var angle = !this._isShowNav ? start_angle + step*i: 0;
        var rotate = 'rotateZ(' + angle + 'deg)';
        item.style['-webkit-transform'] = rotate;
        item.style['transform'] = rotate;
    };
    (!this._isShowNav ? addClass : removeClass)(this.elem, 'spreadNav')
    this._isShowNav = !this._isShowNav;
};


simpleSlider.prototype._initItems = function() {
    this.items = this.elemUl.getElementsByTagName( 'li' );
    if(!this.items.length) return
    this._setActive( this.active || this.items[0] )
    this._initThumb();
}


simpleSlider.prototype._initThumb = function() {
    function _createThumb(index){
        var li = document.createElement( 'li' );
        var sameitem = self.items[index];
        addClass(li, sameitem._gBox.owner)
        var rotate = 'rotateZ(' + start_angle + step*index + 'deg)';
        li.style['-webkit-transform'] = rotate;
        li.style['transform'] = rotate;
        li.addEventListener( 'click', function(e){self._setActive( sameitem ) });
        self.thumbElem.appendChild( li );
    }
    var self = this;
    var start_angle = 0, itemslen = self.items.length, step = 360 / itemslen;
    if(!this.thumbElem){
        this.thumbElem = document.createElement( 'ul' );
        this.thumbElem.className = 'simpleSlider-thumb';
    } else{
        this.thumbElem.innerHTML = ''
    }
    for (var index = 0; index < itemslen; index++) {_createThumb(index)};
    this.elem.insertBefore(this.thumbElem, this.elemUl);
    this.thumbItems = this.thumbElem.getElementsByTagName( 'li' );
    this._setThumb( this.thumbItems[0] )
};


simpleSlider.prototype._initDrag = function() {
    function getMouse (e) {
        if(e.changedTouches) var e = e.changedTouches[0];
        return {x: e.clientX, y: e.clientY}
    }

    var self = this, names = ['active', '_prev', '_next'];
    var cont = this.elemUl.getBoundingClientRect();
    var circle = {x: cont.width/2 + cont.left, y: cont.height/2 + cont.top, r: cont.width/2 };

    console.log(this.elemUl)
    console.log(cont)
    console.log(circle)

    function inCont( mouse, p ){
        //@BUG: elemUl перекрывает elemThumb по углам (своим), и поэтому эти места определяются как _in
        var a = mouse.x - circle.x;
        var b = mouse.y - circle.y;
        var c = Math.sqrt( Math.pow(a, 2) + Math.pow(b, 2) );
        var _in = (c < circle.r)
        if(_in){
            console.log(a+';'+b+';'+c+';'+ circle.r)
            console.log(circle.r - Math.floor(c))
        }
        var _in = (mouse.x > cont.left && mouse.x < cont.right) && (mouse.y > cont.top && mouse.y < cont.bottom)
        return _in
    }

    function fnDrag( e ){
        self.elem.style.cursor = 'move';
        self._inDrag = true;
        self.cx = getMouse( e ).x
        names.forEach( function( name ){self[name].cx = self[name].offsetLeft })
        self.pressTimer = window.setTimeout(function(){self.longPressFn()}, self.longPressTm)
    }

    function fnMove( e ){
        if( !self._inDrag ) return
        var dx = getMouse( e ).x - self.cx;
        names.forEach( function( name ){self[name].style.left = self[name].cx + dx + 'px'} )
    }

    function fnUp( e ){
        if( self.cx == undefined ) return
        var dx = getMouse(e).x - self.cx;
        self._inDrag = false;
        self.elem.style.cursor = 'default';
        names.forEach( function( name ){delete self[name].cx } )
        delete self.cx
        self._clearPosition()
        if( dx < self.div*-1 ) self.next()
        else if( dx > self.div ) self.prev()
        clearTimeout(self.pressTimer)
    }

    self.elem.addEventListener( 'mousedown', fnDrag )
    self.elem.addEventListener( 'mousemove', fnMove )
    self.elem.addEventListener( 'mouseup', fnUp )
    self.elem.addEventListener( 'mouseleave', fnUp )

    function touchHandler(event) {
        var mouse = getMouse( event );
        var _inn = inCont( mouse, event.type == 'touchstart' );
        console.log(_inn)
        if(!_inn) return
        var touch = event.changedTouches[0];

        var simulatedEvent = document.createEvent("MouseEvent");
            simulatedEvent.initMouseEvent({
            touchstart: "mousedown",
            touchmove: "mousemove",
            touchend: "mouseup"
        }[event.type], true, true, window, 1,
            touch.screenX, touch.screenY,
            touch.clientX, touch.clientY, false,
            false, false, false, 0, null);

        touch.target.dispatchEvent(simulatedEvent);
        event.preventDefault();
    }

    this.elem.addEventListener("touchstart", touchHandler, true);
    this.elem.addEventListener("touchmove", touchHandler, true);
    this.elem.addEventListener("touchend", touchHandler, true);
    this.elem.addEventListener("touchcancel", touchHandler, true);
};


simpleSlider.prototype._clearPosition = function() { //clear left style of element after dragging
    for (var i = this.items.length - 1; i >= 0; i--) {
        this.items[i].style.removeProperty('left')
    };
};


simpleSlider.prototype._getNext = function( array, node ) {
    var array = array || this.items, node = node || this.active;
    return node.nextElementSibling || array[0]
};


simpleSlider.prototype._getPrev = function( array, node ) {
    var array = array || this.items, node = node || this.active;
    return node.previousElementSibling || array[ array.length - 1 ]
};


simpleSlider.prototype._getIndex = function( array, node ) {
    for (var i = array.length - 1; i >= 0; i--) {
        if( sameNode(node, array[i]) ) return i
    };
};


simpleSlider.prototype._setThumb = function(item) {
    var item = item || this._getThumb();
    if( item == undefined ) return
    if( this.thumbActive ) removeClass( this.thumbActive, 'active' )
    this.thumbActive = item;
    addClass( item, 'active' )
};


simpleSlider.prototype._getThumb = function() {
    var index = this._getIndex( this.items, this.active );
    if( index == undefined || this.thumbItems == undefined) return
    return this.thumbItems[index];
};


simpleSlider.prototype._setActive = function(item) {
    addClass( item, 'active' );
    for (var i = this.items.length - 1; i >= 0; i--) {
        removeClass( this.items[i], 'prev' );
        removeClass( this.items[i], 'next' );
    };
    if( this.active && !sameNode(this.active, item) ){
        removeClass( this.active, 'active' );
        removeClass( this.elemUl, this.active._gBox.owner );
    }
    this.active = item;
    addClass( this.elemUl, item._gBox.owner );
    this._next = this._getNext();
    this._prev = this._getPrev();
    addClass( this._next, 'next' )
    addClass( this._prev, 'prev' )
    this._setThumb()
};


simpleSlider.prototype.prev = function() {
    var prev = this._getPrev();
    addClass( prev, 'next' )
    this._setActive( prev )
};


simpleSlider.prototype.next = function() {
    var next = this._getNext();
    addClass( this.active, 'prev' )
    this._setActive( next )
};

simpleSlider.prototype.update = function(elems, _gBox) { //elems - some  array or nodelist or node or string, which will be wrap into li and added to slider
    var self = this;

    function _append(el){
        var li = document.createElement( 'li' );
        li._gBox = _gBox;
        if( typeof(el) == 'object' ) li.appendChild( el );
        else li.innerHTML = el;
        self.elemUl.appendChild( li );
    }

    if( elems instanceof Array || elems instanceof NodeList ){
        for (var i = elems.length - 1; i >= 0; i--) {
            _append(elems[i])
        };
    } else {_append(elems) }
    this._initItems();
}


simpleSlider.prototype.longPressFn = function() {
    addClass(this.elem, 'trem')
    this.elem.addEventListener('webkitTransitionEnd', function( event ) {
        removeClass(this, 'trem')
    }, false );
    this.spreadNav()
};