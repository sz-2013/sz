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
    deselect: function(){ USERS.list.forEach(function(u){u.set_unactive()}); },
    get_active: function(){ 
        return USERS.list.filter( function(u){return u.email==$( "#user-settings #user-email span" ).text()} )[0] 
    }
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
    
    function _activity(){
        var dev = 200;
        if((Date.now() - user.lastMessage) < ( get_random_num(1000+dev, 1000-dev)*360/user.activity ) ) return
        user.lastMessage = Date.now();
        if(!TOWERS.list.length) return
        _explore() //_message calls in _explore
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
    function _move_animate(func){
        user.el.animate({top:user.box.ry+'px', left:user.box.rx+'px'}, 360*100/user.speed, func)
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
    user.live = function(){
        //move on one box with speed user.speed*1000/60
        if(!USERS.is_live) return
        if(user.is_live){
            var nearby_list = get_neirby_boxes(user.box);
            var next_box = get_random(nearby_list);
            user.box = next_box || user.box;   
            user.el.stop();
            var func = function(){            
                _activity();
                user.live();
            };
            _move_animate( func );
        }
        else{
            window.setTimeout(function(){user.live();}, 360*100/user.speed)
        }
    }
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
    user.move_to = function(d){
        //dir: up, down, left, right
        var params = { up: ['ry', -1], down: ['ry', 1], left: ['rx', -1], right: ['rx', 1] };
        if(!d || !params.hasOwnProperty(d)) return
        var dir = params[d], 
            i = ( dir[0] == 'rx' ) ? 'ry' : 'rx',
            h = ( dir[0] == 'rx' ) ? BOX_WIDTH : BOX_HEIGHT, 
            box = user.box;
        var next = MAP.filter( function(b){ 
            return ( b[i] == box[i] ) &&  b[dir[0]] == (box[dir[0]]+dir[1]*h ) } );
        if(!next.length) return
        user.box = next[0];
        _move_animate();
    }
    _create_in_db(); 
    return user
}
