

/*function getGameBox(pos, points){ //[x, y], [{place_serializer.data}, {}]
    var f = points.filter(function(p){
        return p.place_gamemap_position[0] == pos[0] && p.place_gamemap_position[1] == pos[1]});
    var options = f.length ? f[0] : new Object;
    options.pos = pos;
    var box = new gameBox( options );
    return box
}*/