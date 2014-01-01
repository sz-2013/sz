function json_to_log(response){  
    if(response.data.bl){
        var bl = response.data.bl, sz_to_bl = bl.data.tranceive;
        bl.data = bl.data.receive;    
        delete response.data.bl
        add_log_element('sz-bl', sz_to_bl)    
        add_log_element('bl', bl)
    }
    add_log_element('sz-client', response)
    return (bl==undefined) ? response.meta.code : bl.status
}

var helpers = {
    set_el: function(obj){
        obj.el = $("#"+obj.id)
        obj.el
            .css({top:obj.box.ry+'px', left:obj.box.rx+'px', fontSize:Math.ceil(BOX_HEIGHT*0.6)+'px'})
            .width(BOX_WIDTH).height(BOX_HEIGHT)
            .click(function(){obj.set_active()});    
    },
    set_active: function(obj){
        if(PICK_PLACE) return
        TOWERS.deselect();
        USERS.deselect();
        obj.el.children('.obj-circle').animate({opacity:1,width:'100%',height:'100%',marginTop:0,marginLeft:0},200);
        $( "#main-settings" ).hide();
        $( "#user-settings" ).hide();
        $( "#place-settings" ).hide();
        var m = $( "#settings" ).data("margin");
        if( m===undefined || parseInt($( "#settings" ).css(m.d))!=0) $( "#settings .unwrap-menu i" ).click();        
    },
    set_unactive: function(obj){
        obj.el.children('.obj-circle').css({opacity:0,width:0,height:0,marginTop:'50%',marginLeft:'50%'})
    }
}


function get_clear_boxes(){
    return MAP.filter(function(b){return  !TOWERS.list.filter(function(t){return t.box.id==b.id}).length})
}
function get_neirby_boxes(box){
    //find 8 nearby boxes
    return MAP.filter(function(b){
            if( (box.rx - BOX_WIDTH) == b.rx && (box.ry - BOX_HEIGHT) == b.ry) return true  //left top box
            if( box.rx == b.rx && (box.ry - BOX_HEIGHT) == b.ry) return true                //top box
            if( (box.rx + BOX_WIDTH) == b.rx && (box.ry - BOX_HEIGHT) == b.ry) return true  //right top box                
            if( (box.rx - BOX_WIDTH) == b.rx && box.ry == b.ry) return true                 //left box
            if( (box.rx + BOX_WIDTH) == b.rx && box.ry == b.ry) return true                 //right box
            if( (box.rx - BOX_WIDTH) == b.rx && (box.ry + BOX_HEIGHT) == b.ry) return true  //left bottom box
            if( box.rx == b.rx && (box.ry + BOX_HEIGHT) == b.ry) return true                //bottom box
            if( (box.rx + BOX_WIDTH) == b.rx && (box.ry + BOX_HEIGHT) == b.ry) return true  //right bottom box
            return false
        })
}

function create_new_users(preUsers){
    preUsers.forEach(function(params){newUser(params);});
}

var MAP;
function newBox(x,y){
    var box = {
        id:"box_" + (MAP.length + 1),
        lng:x*BOX_STEP,
        lat:y*BOX_STEP,
        rx:Math.floor(x*BOX_WIDTH),
        ry:Math.floor(y*BOX_HEIGHT)
    }
    $( "#map-boxes" ).append('<div class="box" id="'+ box.id +'"></div>');
    box.el = $( "#" + box.id );
    box.el.css({ top:box.ry+'px', left:box.rx +'px' }).width(BOX_WIDTH).height(BOX_HEIGHT);
    return box
}



function build_map(){
    $("#screen-overflow h1").text('Set map');
    $("#screen-overflow").show();
    get_box_step();
    get_box_size();
    MAP = new Array;
    for (var x=0; x <= BOX_VALUE-1; x++) {
        for (var y=0; y <= BOX_VALUE-1; y++) {MAP.push(newBox(x, y)); }
    };
    $("#screen-overflow").hide();
}


function get_places_from_api(){
    $("#screen-overflow h1").text('Load places');
    $("#screen-overflow").show();
    var count = parseInt($("#place-value").val()) || 100;
    $.getJSON(API.test_mode.generate_places,{count:count}, function(response){
        response.data.venues.forEach(function(p){PLACES_LIST.push(p)});
        TOWERS.list = new Array;
        PLACES_LIST.forEach(function(p){
            var t = newTower(p.name, p.location)
            if(t) TOWERS.list.push( t )
        })
        add_log_element('client', 'Create new ' + TOWERS.list.length +' towers on map')
        update_all_places_list();

        document.getElementById('box-value-set').setAttribute('disabled')        
        $("#screen-overflow").hide();
    });
}