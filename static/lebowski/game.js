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

TOWERS = {
    list : [],
    deselect: function(){TOWERS.list.forEach(function(t){t.set_unactive()});},
    remove: function(){
        TOWERS.list.forEach(function(t){t.el.remove();})
        TOWERS.list = [];
    },
    created:function(){
        return TOWERS.list.filter(function(t){return t.is_create})
    },
    update:function(places_data){
        places_data.forEach(function(obj){
            var d = obj.place, p = TOWERS.list.filter(function(p){return p.location.lat==d.latitude&&p.location.lng==d.longitude})[0]
            if(p) p.update(d)
        });
    },
}
function newTower(name, location){    
    var tower = {
        name:name, 
        location:location, 
        users:[], 
        is_create: false,
        level:'-',
        cls: 'unknown',
    }
    var box = get_clear_boxes().filter(function(b){
        return (location.lat>=b.lat&&location.lat<=b.lat+BOX_STEP&&location.lng>=b.lng&&location.lng<=b.lng+BOX_STEP)
    });
    if(!box.length) return
    tower.box = box[0]
    tower.id = 'tower_' + (TOWERS.list.length + 1)
    if( $("#"+tower.id).length ) return 
    var el =  '<div id="' + tower.id  + '" class="map-obj place place-'+tower.cls+'">' + 
                '<div class="obj-circle"></div>' + 
                '<i class="fa fa-flag " ></i>' + 
              '</div>';
    $( "#map-towers" ).append(el)
    helpers.set_el(tower)
    tower.set_active = function(){
        if(PICK_PLACE){
            if(!tower.is_create){
                add_log_element('client', 'This Tower is not create in DB');
            }
            else{
                $("#selected-place").text(tower.name)
                $("#selected-place").attr('data-bd_id', tower.bd_id)                
            }
            TOWERS.list.forEach(function(t){
                t.el.css({cursor:'pointer'})
            });
            $( "#pick-place" ).removeClass('active')
            PICK_PLACE = false;
            return
        }        
        $( "#place-settings #place-header-name" ).text(tower.name)
        $( "#place-settings .settings-location p:first-child span" ).text(tower.location.lng)
        $( "#place-settings .settings-location p:last-child span" ).text(tower.location.lat)
        tower.push_users();
        helpers.set_active(tower);
        $( "#place-settings" ).show();
    }
    tower.set_unactive = function(){ helpers.set_unactive(tower) }
    tower.push_users = function(){
        $( "#place-userslist" ).empty();
        for (var i = tower.users.length - 1; i >= 0; i--) {$( "#place-userslist" ).append(get_user_li_elemets(userlist[i], true)) };
    }
    tower.update =function(data){
        tower.el.removeClass('place-'+tower.cls)
        if(tower.cls=='unknown'){
            tower.cls = 'nobody';
            tower.is_create = true;
            tower.bd_id = data.id;
        }
        tower.el.addClass('place-'+tower.cls)
    }
    return tower
}

var USERS = {
    list:[],
    is_live:true,    
    append: function(u){
        USERS.list.push(u)
        add_log_element('client', 'Create a new User "' + u.name +'" on map')   
        update_all_users_list();   
        if(USERS.is_live) USERS.live();
    },
    live:function(){
        USERS.is_live = true;
        USERS.list.forEach(function(u){u.live();})
    },
    wait:function(){
        USERS.is_live = false;
    },
    deselect: function(){USERS.list.forEach(function(u){u.set_unactive()});},
}

function newUser(params){
    //race is Array, gender is Array, speed, activity
    var user = {
        is_live  : true,
        race     : params.race,
        gender   : params.gender,
        speed    : parseInt(params.speed),
        activity : parseInt(params.activity),
        name     : get_random_name(),
        email    : 'test' + String(Math.random()).slice(2, 12) + '@sz.com',
        radius   : 250,
    }; 
    //get a random free point on map
    user.box = get_random(get_clear_boxes());
    
    user.message =function(target, text){
        if(!TOWERS.created().length) return
        var target = target  || get_random( TOWERS.created() ), color = get_random( COLOR_LIST );
        var message = {
            email : user.email,
            place : target.bd_id,
            text  : text || get_random_text(),
            csrfmiddlewaretoken : CSRF
        };        
        function _message_animate(list){list.map(function(i){i.el.find('i').css({ borderColor: color })}) }
        function _message_unanimate(list){list.map(function(i){i.el.find('i').removeAttr('style')}) }
        _message_animate([target, user]);
        $.post(API.messages_previews, message, function(response){
            var prev_message = response.data;  
            var face = get_random( FACES_LIST.filter(function(f){ return user.race[1]==f[0] }) )[1]
            prev_message.latitude = user.lat;
            prev_message.longitude = user.lng;
            prev_message.csrfmiddlewaretoken = CSRF;
            prev_message.email = user.email;
            prev_message.face = face//id of used face - send a random with our race id
            $.post(API.messages_previews + '/'  + prev_message.id + '/publish', prev_message, function(response){
                add_log_element('client-sz', prev_message)
                json_to_log(response)
                _message_unanimate([target, user]);
            })
        });
    }    
    function _explore(){
        user.lat = user.box.lat + BOX_STEP*get_random_float();
        user.lng = user.box.lng + BOX_STEP*get_random_float();
        var params = {
            radius    : user.radius,
            latitude  : user.lat, 
            longitude : user.lng,
            email     : user.email
        }
        add_log_element('client-sz', params)
        $.getJSON(API.places.places_explore_in_venues, params, function(response){
            status = json_to_log(response)
            TOWERS.update(response.data.places)
            user.message();
        })        
    }
    function _activity(){
        var dev = 200;
        if((Date.now() - user.lastMessage) < ( get_random_num(1000+dev, 1000-dev)*360/user.activity ) ) return
        user.lastMessage = Date.now();
        if(!TOWERS.list.length) return
        _explore() //_message calls in _explore
    }
    user.live = function(){
        //move on one box with speed user.speed*1000/60
        if(!USERS.is_live) return
        if(user.is_live){
            var nearby_list = get_neirby_boxes(user.box);
            var next_box = get_random(nearby_list);
            user.box = next_box || user.box;        
            user.el.stop().animate({top:user.box.ry+'px', left:user.box.rx+'px'}, 360*100/user.speed, function(){            
                _activity();
                user.live();
            })            
        }
        else{
            window.setTimeout(function(){user.live();}, 360*100/user.speed)
        }
    }
    user.set_active = function(){
        $( "#user-settings #user-header-name" ).text(user.name)
        $( "#user-settings #user-header-zp" ).text('sz')
        $( "#user-settings #user-email span" ).text(user.email)
        $( "#user-settings .settings-location p:first-child span" ).text(user.lng || user.box.lng)
        $( "#user-settings .settings-location p:last-child span" ).text(user.lat || user.box.lat)
        $( "#user-settings #user-radius span" ).text(user.radius)
        helpers.set_active(user);        
        $( "#user-settings" ).show();
        user.is_live = false;
    }
    user.set_unactive = function(){
        user.is_live = true;
        helpers.set_unactive(user);
    }
    function _create_element(){
        user.id = 'user_' + (USERS.list.length + 1)
        var el =  '<div id="' + user.id  + '" class="map-obj user user-' + user.race[0] + '">' + 
                        '<div class="obj-circle"></div>' + 
                        '<i class="fa fa-' + ( user.gender[0]=='f' ? 'female' : user.gender[0]=='m' ? 'male' : 'smile-o') + '" ></i>' + 
                      '</div>';
        $( "#map-users" ).append(el);            
        helpers.set_el(user)
    }
    function _create_in_db(){
        var params = {
            email               : user.email,
            password1           : '12345',
            password2           : '12345',
            race                : user.race[1],
            gender              : user.gender[1],
            csrfmiddlewaretoken : CSRF
        }
        add_log_element('client-sz', params)
        $.post(API.user.users_registration, params, function( response ) { 
            status = json_to_log(response)            
            /*if(status!=200) return*/
            _create_element()            
            user.lastMessage = Date.now();
            USERS.append(user)
            is_create = true
        });
    }
    _create_in_db(); 
    return user
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