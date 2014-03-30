var gameBox = function(options){
    this.name = options.name || options.place_name || 'Empty box',
    this.pos = options.pos;

    var ownerArr = ['neutral', 'negative', 'positive', 'nobody']
    this.owner = ownerArr[Math.floor(Math.random()*ownerArr.length)]
    if( Math.floor(Math.random()*10) == 1) this.owner = 'own'
    this.castle = {
        img: this.owner !== 'nobody' ? 'img/' + Math.floor(Math.random()*10 + 1) + '.png' : ''
    }
}

gameBox.prototype.toString = function() {
    //return this.name
    return [this.name, '<br>',
            'x: ', this.pos[0], ';',
            'y: ', this.pos[1]].join('')
};

function getGameBox(pos, points){ //[x, y], [{place_serializer.data}, {}]
    var f = points.filter(function(p){
        return p.place_gamemap_position[0] == pos[0] && p.place_gamemap_position[1] == pos[1]});
    var options = f.length ? f[0] : new Object;
    options.pos = pos;
    var box = new gameBox( options );
    return box
}