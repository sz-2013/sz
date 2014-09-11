
var UnfaceImage = Imagable.extend({
    settings: {
        useMax: true,
        tm: 1500,
        face: {
            min: 30,
            usual: 60,
            step: 20,
        }
    },
    sub_initialize: function(body, isMobile){
        this.is_enlarge = true //enlarge or reduce
        this.facesList = new Array;
        this._initfacesArea()
    },
    _initfacesArea: function(){
        var facesArea = this.facesArea = document.createElement('div')
        facesArea.className = 'facesArea';

        var self = this;
        this._mousedown(this.body, function(ev){
            if(!self.is_down){
                ev.preventDefault();
                self._clearState()
                var x = ev.pageX - self.body.left;
                var y = ev.pageY - self.body.top;
                var face = self._createFace(x, y)
            }
        })
        this._mouseup(facesArea)
        this._mousemove(this.body, function(ev){self._moveFace(ev)})
        this.body.appendChild(facesArea)
    },
    _preDraw: function(){
        this.clear();
        var bodyRect = this.body.getBoundingClientRect();
        this.body.top = bodyRect.top;
        this.body.left = bodyRect.left;
    },
    _moveFace: function(ev){
        if(this.movedFace){
            this._clearTimer()
            var face = this.movedFace;
            var w = face.offsetWidth;
            var x = ev.pageX - this.body.left - w/2;
            var y = ev.pageY - this.body.top - w/2;
            if(!this._canBeChanged(w, w, x, y)) return
            face.style.left = x + 'px';
            face.style.top = y + 'px';
        }
    },
    _canBeChanged: function(w, h, x, y){
        return w >= this.settings.face.min && h >= this.settings.face.min &&
               x > 0 && x + w < this.body.offsetLeft + this.body.offsetWidth &&
               y > 0 && y + h < this.body.offsetTop + this.body.offsetHeight
    },
    _createFace: function(x, y){
        if(!this.activeFace || !this.facesArea)return
        var face = document.createElement('img');
        face.setAttribute('src', this.activeFace.face);
        face.face = this.activeFace;
        face.className = 'face';
        var w = this.settings.face.usual, k = w/2;
        face.style.width = face.style.height = w + 'px';
        face.style.left = x - k + 'px';
        face.style.top = y - k + 'px';

        this.facesList.push(face);

        var self = this;
        this._mousedown(face, function(ev){
            ev.preventDefault();
            self.is_down = true
            self.movedFace = this;
            var k = self.settings.face.step * (self.is_enlarge ? 1 : -1), face = this;

            self.facetimer = setInterval(function(){
                var neww = face.offsetWidth + k, newx = face.offsetTop - k/2, newy = face.offsetLeft - k/2;
                if(!self._canBeChanged(neww, neww, newx, newy)) self._clearTimer()
                face.style.width = neww + 'px';
                face.style.height = neww + 'px';
                face.style.top = newx + 'px';
                face.style.left = newy + 'px';
            }, self.settings.tm);
        });
        this._mouseup(face);
        this.facesArea.appendChild(face);
        return face
    },
    _clearTimer: function(){
        if(this.facetimer){
            clearInterval(this.facetimer)
            this.facetimer = undefined;
        }
    },
    _clearState: function(){
        this._clearTimer()
        this.movedFace = undefined;
        this.is_down = undefined;
    },
    _clearFaces: function(){
        for (var i = this.facesList.length - 1; i >= 0; i--) {
            this.facesArea.removeChild(this.facesList[i]);
        };
        this.facesList = new Array;
    },
    _movedFacesToCanvas: function(){
        this.usedFaces = new Array;
        for (var i = this.facesList.length - 1; i >= 0; i--) {
            var f = this.facesList[i]
            if(!~this.usedFaces.indexOf(f.face)) this.usedFaces.push(f.face)
            this._drawImage(f.getAttribute('src'), {w: f.offsetWidth, h: f.offsetHeight}, f.offsetLeft, f.offsetTop)
            this.facesArea.removeChild(f)
        };
        this.facesArea = new Array;

    },
    setActiveFace: function(activeFace){
        this.activeFace = activeFace;
    },
    setBg: function(data){
        this.bg = data;
        this.draw(data);
    },
    setIsEnlarge: function(val){
        console.log(val)
        this.is_enlarge = val;
    },
    clear: function(){
        this._clearFaces();
        this._clearCanvas();
    },
    zip: function(){
        this._movedFacesToCanvas()
        var base64ImageData = this.canvas.toDataURL();
        this.updateImage(base64ImageData, this.usedFaces)
    },
})
