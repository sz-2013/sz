
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
        this.facesList = new Array;
        this._initfacesArea()
    },
    _initfacesArea: function(){
        var facesArea = this.facesArea = document.createElement('div')
        facesArea.className = 'facesArea';

        var self = this;
        this._mousedown(facesArea, function(ev){
            ev.preventDefault();
            self._clearState()
            var x = ev.pageX - self.body.left;
            var y = ev.pageY - self.body.top;
            var face = self._createFace(x, y)
        })
        this._mouseup(facesArea)
        this._mousemove(facesArea, function(ev){self._moveFace(ev)})
        this.body.appendChild(facesArea)
    },
    _preDraw: function(){
        this.clear();
        var bodyRect = this.body.getBoundingClientRect();
        this.body.top = bodyRect.top;
        this.body.left = bodyRect.left;
    },
    _moveFace: function(ev, s){
        if(this.movedFace){
            this._clearTimer()
            var x = ev.pageX - this.body.left;
            var y = ev.pageY - this.body.top;
            var face = this.movedFace;
            var w = face.offsetWidth;
            face.style.left = x - w/2 + 'px';
            face.style.top = y - w/2 + 'px';
        }
    },
    _createFace: function(x, y){
        if(!this.activeFace)return
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
            self.movedFace = this;
            var k = self.settings.face.step, face = this;

            self.facetimer = setInterval(function(){
                var neww = face.offsetWidth + k + 'px';
                face.style.width = neww;
                face.style.height = neww;
                face.style.top = face.offsetTop - k/2 + 'px';
                face.style.left = face.offsetLeft - k/2 + 'px';
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
        this.dragok = false;
        this.movedFace = undefined;
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
    clear: function(){
        this._clearFaces();
        this._clearCanvas();
    },
    zip: function(){
        this._movedFacesToCanvas()
        var base64ImageData = this.canvas.toDataURL();
        this.updateImage(base64ImageData)
    },
})
