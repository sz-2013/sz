
var simpleSlider = function( elem ){
    this._init(elem)
}


simpleSlider.prototype._init = function( elem ) {
    this.longPressTm = 1000;
    this.elem = elem;
    this.elemUl = elem.getElementsByClassName('simpleSlider-container')[0]
    this.div = 5;
    this.nav = elem.getElementsByTagName('nav')[0]
    this._isShowNav= false;
    this._initItems()
    this._initDrag();
};


simpleSlider.prototype.empty = function() {
    if(!this.items||!this.items.length) return
    this.elemUl.innerHTML = ''
    this.items = []
    this.thumbElem.innerHTML = ''
    this.thumbItems = []
};


simpleSlider.prototype._update_active_el = function() {
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
        var rotate = 'rotateZ(' + start_angle + step*(index+1) + 'deg)';
        li.style['-webkit-transform'] = rotate;
        li.style['transform'] = rotate;
        li.addEventListener( 'click', function(e){self._setActive( sameitem ) });
        self.thumbElem.appendChild( li );
    }
    var self = this;
    var start_angle = 0, itemslen = self.items.length, step = 360 / (itemslen+1);
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
    var self = this, names = ['active', '_prev', '_next'];

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
        if( (dx < self.div*-1 || dx > self.div)&&self.pressTimer ) clearTimeout(self.pressTimer)
    }

    function fnUp( e ){
        if( self.cx == undefined ) return
        console.log(e)
        var dx = getMouse(e).x - self.cx;
        console.log(dx)
        console.log(self.div)
        self._inDrag = false;
        self.elem.style.cursor = 'default';
        names.forEach( function( name ){delete self[name].cx } )
        delete self.cx
        self._clearPosition()
        if( dx < self.div*-1 ) self.next()
        else if( dx > self.div ) self.prev()
        if(self.pressTimer) clearTimeout(self.pressTimer)
    }

    self.elem.addEventListener( 'mousedown', fnDrag )
    self.elem.addEventListener( 'touchstart', fnDrag )
    self.elem.addEventListener( 'mousemove', fnMove )
    self.elem.addEventListener( 'touchmove', fnMove )
    self.elem.addEventListener( 'mouseup', fnUp )
    self.elem.addEventListener( 'touchend', fnUp )
    self.elem.addEventListener( 'mouseleave', fnUp )
    self.elem.addEventListener( 'touchcancel', fnUp )

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
    this._update_active_el()
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