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
    _drawImage: function(data, imgSz, x, y) {
        var data = data || this.img.data
        var imageObj = new Image();
        var self = this;

        imageObj.onload = function() {
            var originalW = this.width;
            var originalH = this.height;
            var imageW = originalW;
            var imageH = originalH;
            self.imgSz = undefined;
            if(imgSz){
                var imageW = imgSz.w;
                var imageH = imgSz.h;
            } else{
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
            }
            if(!imgSz) self._updateCanvasSize(imageW, imageH);
            self.context.drawImage(this, x || 0, y || 0, imageW, imageH);

            self._afterDrawImage()
        };
        imageObj.src = data;
    },
    _preDraw: function(){},
    draw: function(data){
        this._clearCanvas()
        this.img.data = data;
        this._preDraw()
        this._drawImage(data)
    },
    updateImage: function(base64ImageData) {
        // переопределется в дерективе
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
                var xMargin = newX - self.canvas.offsetLeft
                var yMargin = newY - self.canvas.offsetTop
                if(xMargin > 0 &&
                   xMargin < (self.w - self.croper.offsetWidth) &&
                   yMargin > 0 &&
                   yMargin < (self.h - self.croper.offsetHeight)
                ){
                    self.croper.style.left = newX + 'px';
                    self.croper.style.top = newY + 'px';

                    self._updateClearImagePos()
                }
            }
            if(self.resizeok){
                self._resizeCrope(ev)
            }
        }

        this._mousedown(body, function(ev){
            if(self.croper) return
            self._createCroper(ev)
        })
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
    var xMargin = newX - this.canvas.offsetLeft
    var yMargin = newY - this.canvas.offsetTop
    console.log([newVal, difX, this.startX > zero.x])
    if( dif && newVal > this.settings.croper.min &&
        xMargin > 0 && (xMargin + newVal) < this.w &&
        yMargin > 0 && (yMargin + newVal) < this.h){
        this.croper.style.left = newX + 'px';
        this.croper.style.top = newY + 'px';
        this.croper.style.width = newVal + 'px';
        this.croper.style.height = newVal + 'px';

        this._updateClearImagePos()
    }

};

CropImage.prototype._clearState = function() {
    this.dragok = false;
    this.resizeok = false;
};

CropImage.prototype._updateClearImagePos = function() {
    var clearImage = this.clearImage;
    clearImage.style.left = -1*(this.croper.offsetLeft - this.canvas.offsetLeft) + 'px'
    clearImage.style.top = -1*(this.croper.offsetTop - this.canvas.offsetTop) + 'px'
};

CropImage.prototype._createCroper = function(ev) {
    var ev = this._getMouse(ev)
    var x = ev.x
    var y = ev.y

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
    croper.style.left = x - croper.offsetWidth/2 + 'px'
    croper.style.top = y - croper.offsetHeight/2 + 'px'
    /*croper.style.left = (this.w )/2 + 'px'
    croper.style.top = (this.h - croper.offsetHeight)/2 + 'px'*/

    this.clearImage = clearImage = document.createElement('img')
    clearImage.setAttribute('src', this.img.data)
    this._updateClearImagePos()
    croper.appendChild(clearImage)
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
    var overlay = this.overlay = document.createElement('div')
    overlay.className = 'cropOverlay'
    overlay.style.width = this.w + 'px'
    overlay.style.height = this.h + 'px'
    overlay.style.left = this.canvas.offsetLeft + 'px'
    overlay.style.top = this.canvas.offsetTop + 'px'
    overlay.style.backgroundImage = 'url('+ this.img.data + ')'
    this.body.appendChild(overlay)
    this.canvas.style.visibility = 'hidden'
    //this._createCroper();
};


CropImage.prototype._preDraw = function() {
    this._setBodySize()
    this._deleteCroper()
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

