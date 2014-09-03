/*Class - OOP funcion from leaflet*/

var Imagable = L.Class.extend({
    settings:{
        useMax: true,
    },
    initialize: function(body, isMobile){
        this.dragok = false;
        this.isMobile = isMobile;
        this.body = body;
        this.img = new Object
        this._createCanvas();

        this.sub_initialize(body, isMobile)
    },
    _getMouse: function(ev){
        if(ev.touches) return ev.touches[0]
        return ev
    },
    _setBodySize: function(){},
    _mouseup: function(el, fn) {
        var self = this;
        var fn = fn || function(ev){self._clearState()}
        var ev = this.isMobile ? 'touchend' : 'mouseup'
        el.addEventListener(ev, fn, false)
    },
    _mousedown: function(el, fn) {
        var ev = this.isMobile ? 'touchstart' : 'mousedown'
        el.addEventListener(ev, fn, false)
    },
    _mousemove: function(el, fn) {
        var ev = this.isMobile ? 'touchmove' : 'mousemove'
        el.addEventListener(ev, fn, false)
    },
    _createCanvas: function() {
        this.canvas = canvas = document.createElement('canvas')
        this.body.appendChild(canvas);
        this.context = canvas.getContext('2d');
        this.w = canvas.getAttribute('width');
        this.h = canvas.getAttribute('height');
    },
    _updateCanvasSize: function(w, h) {
        var c = this.canvas;
        if(c.getAttribute('width') != w){
            c.setAttribute('width', w);
            this.w = w;
        }
        if(c.getAttribute('height') != h){
            c.setAttribute('height', h);
            this.h = h;
        }
    },
    _clearCanvas: function() {
        this.context.clearRect(0, 0, this.w, this.h);
    },
    _clearState: function(){},
    _afterDrawImage: function(){},
    _drawImage: function() {
        var data = this.img.data
        var imageObj = new Image();
        var self = this;
        this._setBodySize()


        imageObj.onload = function() {
            var originalW = this.width;
            var originalH = this.height;
            var imageW = originalW;
            var imageH = originalH;
            self.imgSz = undefined;
            if(self.settings.useMax){
                if( originalW > self.body.offsetWidth ||
                    originalH > self.body.offsetHeight){
                        var k = self._getK(originalW,originalH)
                        var imageW = originalW/k;
                        var imageH = originalH/k;

                        self._setBodySize(
                            (self.body.offsetWidth - imageW)/2 + 'px',
                            imageW + 'px',
                            (self.body.offsetHeight - imageH)/2 + 'px',
                            imageH + 'px'
                        )

                        self.imgSz = {h: originalH, w: originalW, k: k}
                }
            }
            self._updateCanvasSize(imageW, imageH);
            self.context.drawImage(this, 0, 0, imageW, imageH);

            self._afterDrawImage()
        };
        imageObj.src = data;
    },
    _preDraw: function(){},
    draw: function(data, title){
        this._clearCanvas()
        this.img.data = data;
        this._preDraw()
        this._drawImage(data, title)
    },
});


var CropImage = Imagable.extend({
    settings:{
        croper: {
            border: 20,
            min: 100,
        },
        useMax: true //указывает использовать размеры родительского контейнера как максимально возможные
    },
    sub_initialize: function(body, isMobile){
        var self = this

        function move(ev){
            var ev = self._getMouse(ev)
            if(self.dragok){
                var newX = ev.clientX - self.body.offsetLeft - self.startX;
                var newY = ev.clientY - self.body.offsetTop - self.startY;
                if(newX > 0 &&
                   newX < (self.w - self.croper.offsetWidth) &&
                   newY > 0 &&
                   newY < (self.h - self.croper.offsetHeight)){
                    self.croper.style.left = newX + 'px';
                    self.croper.style.top = newY + 'px';
                }
            }
            if(self.resizeok){
                self._resizeCrope(ev)
            }
        }

        this._mousemove(body, move)
        this._mouseup(body)
    },
})


CropImage.prototype._resizeCrope = function(ev) {
    var croper = this.croper;
    var cr = {x: croper.offsetLeft, rx: croper.offsetLeft + croper.offsetWidth,
                     y: croper.offsetTop, by: croper.offsetTop + croper.offsetHeight}
    var zero = {x: croper.offsetWidth/2, y: croper.offsetHeight/2}

    var evInCanvas = {x: ev.clientX - this.body.offsetLeft, y: ev.clientY - this.body.offsetTop} //в этой точке - новая граница

    var difX = cr.x - evInCanvas.x;
    var difY = cr.y - evInCanvas.y;
    if(this.startX > zero.x) var difX = evInCanvas.x - cr.rx
    if(this.startY > zero.y) var difY = evInCanvas.y - cr.by
    var dif = Math.floor((difX + difY)/2);
    var newVal = croper.offsetWidth + dif*2
    var newX = cr.x - dif
    var newY = cr.y - dif
    if( dif && newVal > this.settings.croper.min &&
        newX > 0 && (newX + newVal) < this.w &&
        newY > 0 && (newY + newVal) < this.h){
        self.croper.style.left = newX + 'px';
        self.croper.style.top = newY + 'px';
        self.croper.style.width = newVal + 'px';
        self.croper.style.height = newVal + 'px';
    }

};

CropImage.prototype._clearState = function() {
    this.dragok = false;
    this.resizeok = false;
};


CropImage.prototype._createCroper = function() {
    var self = this, border = this.settings.croper.border;
    this.croper = croper = document.createElement('div')
    croper.className = 'croper'

    function down(ev){
        self._clearState(ev)
        var ev = self._getMouse(ev)
        if(ev == undefined) return
        self.startX = x = ev.pageX - self.croper.offsetLeft - self.body.offsetLeft
        self.startY = y = ev.pageY - self.croper.offsetTop - self.body.offsetTop
        if( x > border &&
            (x + border) < self.croper.offsetWidth &&
            y > border &&
            (y + border) < self.croper.offsetHeight){
                self.dragok = true
        } else{
            self.resizeok = true
        }
    }
    this._mouseup(croper)
    this._mousedown(croper, down)

    this.body.appendChild(croper)
    croper.style.left = (this.w - croper.offsetWidth)/2 + 'px'
    croper.style.top = (this.h - croper.offsetHeight)/2 + 'px'
};



CropImage.prototype._deleteCroper = function() {
    if(!this.croper) return
    this.body.removeChild(this.croper)
    this.croper = undefined
};


CropImage.prototype._setBodySize = function(l, w, t, h) {
    this.body.style.left = l || 0
    this.body.style.width = w || '100%'
    this.body.style.top = t || 0
    this.body.style.height = h || '100%'
};


CropImage.prototype._getK = function(w, h) {
    this._setBodySize()
    return Math.max(w/this.body.offsetWidth, h/this.body.offsetHeight)
};

CropImage.prototype._afterDrawImage = function() {
    this._createCroper();
};


CropImage.prototype._preDraw = function() {
    this._deleteCroper()
};

CropImage.prototype.updateImage = function(base64ImageData) {
    // переопределется в дерективе
};

CropImage.prototype.crop = function() {
    var imageObj = new Image();
    var self = this;
    var w = this.croper.offsetWidth, h = this.croper.offsetHeight,
        x = this.croper.offsetLeft, y = this.croper.offsetTop;

    var k = this.imgSz ? this.imgSz.k : 1;
    var n = this._getK(w, h)
    this._deleteCroper()

    imageObj.onload = function() {
        self._updateCanvasSize(w/n, h/n);
        self.context.drawImage(this,
                               x*k, y*k, w*k, h*k, //конфигурация нового куска изображения
                               0, 0, w/n, h/n //конфигурация позиции этого куска на канвасе
                               );
        var base64ImageData = self.canvas.toDataURL();
        self.updateImage(base64ImageData)
    }
    imageObj.src = this.img.data;
};


var UnfaceImage = Imagable.extend({
    sub_initialize: function(body, isMobile){},
    setActiveFace: function(activeFace){
        console.log(activeFace)
    }
})
