keywords = raw_wods.split(' ')
separate_words = raw_text.split(' ')
separate_words_length = separate_words.length

function get_user_li_elemets(user, showScore){
    var el = '<li class="place-userslist-user" data-userid="'+user.id+'">'+
                '<a href="#">' + 
                    ( showScore ? '<span class="place-userslist-user-score badge pull-right">'+ user.score +'</span>' : '') + 
                    '<span class="place-userslist-user-race pull-left ' +user.race[0] + '"">' + 
                        '<span class="label ">'+ user.race[0][0].toUpperCase() + '</span></span>' +
                    '<span class="place-userslist-user-name">' + user.name + '</span>' +
                '</a>'+
             '</li>';
    return el
}
function add_log_element(cls, msg){
    var l = AUTORS_LIST.filter(function(a){return a.cls==cls}),author = l.length ? l[0] : undefined, text_class = '';
    var truncated = '...(remaining elements truncated)...'
    if(author===undefined)return
    if(cls=='sz-bl' && typeof(msg) == 'string') var msg = JSON.parse( msg );
    if(msg instanceof Object) {
        if(msg.status==400) var text_class = 'text-danger';
        if(msg.text!==undefined) msg.text = truncated;
        if(msg.message_text!=undefined) msg.message_text = truncated;
        var msg = JSON.stringify(msg).replace(/:{/g,': {').replace(/,"/g,', "').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    }
    var el = '<p class="'+author.cls+'-say"><span>'+author.name+' say to '+author.to+':</span><span class="'+text_class+'">' + msg + '</span></p>';
    $("#console .overview").append(el);
    $("#console").tinyscrollbar_update( 'bottom' );
    return true
}

function update_all_places_list(){
    $( "#all-places-list .overview" ).empty();
    TOWERS.list.forEach(function(t){
        var el = '<li class="placeslist-place" data-placeid="'+t.id+'">'+
                    '<a href="#">' + 
                        '<span class="badge pull-right">'+ t.level +'</span>' + 
                        '<span class="">' + t.name + '</span>' +
                    '</a>'+
                 '</li>';
        $("#all-places-list .overview").append(el)
        /*if(t.is_create) {
            var option = '<option value="'+ t.bd_id +'">'+t.name+'</option>'
            $("#user-new-message select").append(option);            
        }*/
            
    });
    $(".placeslist-place").click(function(){
        var el = this;
        var tower = TOWERS.list.filter(function(t){return t.id==el.getAttribute('data-placeid')})[0]
        if(tower) tower.set_active();
    });
    $("#all-places-list").tinyscrollbar_update();
    window.setTimeout(function(){update_all_places_list()},10*1000)
}

function update_all_users_list(){
    $("#all-users-list .overview").empty();
    USERS.list.forEach(function(u){
        $("#all-users-list .overview").append(get_user_li_elemets(u));        
    });
    $("#all-users-list").tinyscrollbar_update();
    $(".place-userslist-user").click(function(){
        var el = this;
        var user = USERS.list.filter(function(u){return u.id==el.getAttribute('data-userid')})[0]
        if(user) user.set_active();
    });
}

function form_to_users(){
    var all_value = /*get_clear_boxes().length*/MAP.length;
    if(all_value===0){
        add_log_element('client', 'All boxes are used');
        return
    }
    function get_or_random(name, list){
        var val = $( "#newUsersForm" ).find('[name='+name+']').filter(function(n,i){return $(i).parent().hasClass('active')}).val();
        if(val) var val = list.filter(function(v){return v[0]==val})
        return val.length ? val[0] : get_random(list)
    }
    var preUsers = [];
    var value = $( "#newUsersForm" ).find('[name=value]').val();
    for (var i = 1; i <= ( (value < all_value) ? value : all_value ); i++) {
        preUsers.push({
            speed: $( "#newUsersForm" ).find('[name=speed]').val(),
            activity: $( "#newUsersForm" ).find('[name=activity]').val(),
            race: get_or_random('race', RACES_LIST),
            gender: get_or_random('gender', GENDERS_LIST),
        });

    };
    create_new_users(preUsers)
}




function set_size(){
    get_box_step();
    var consoleW = $("#console").width()-60;
    if($("#map").width()==0) var ww = ($(window).height()<($(window).width()-consoleW)) ? $(window).height() : ($(window).height()-consoleW);
    else var ww = $("#map").width()
    var mapBox = Math.round( ww/BOX_VALUE )*BOX_VALUE;    
    $("#map").width(mapBox).height(mapBox);
    $("#console").css({marginLeft:mapBox+50})
    
    var listsHeight = ($(window).height()-410)/2
    $("#all-users-list .viewport, #all-places-list .viewport").height( (listsHeight>50) ? listsHeight : 50 )
    $("#console .viewport").height(mapBox);
    $("#console").tinyscrollbar_update( );

    build_map();
}

function set_api(){
    $("#screen-overflow").show();
    CSRF = $('[name=csrfmiddlewaretoken]').val();
    $.getJSON(window.location.origin + '/api/', function(response){ 
        API = response.data; 
        $.getJSON(API.static.static_races, function(response){
            response.data.data.forEach(function(r){RACES_LIST.push([r.name, r.id])});
        });
        $.getJSON(API.static.static_faces, function(response){
            response.data.data.forEach(function(f){FACES_LIST.push([f.race, f.id, f.emotion])});
        });
        $.getJSON(API.static.static_genders, function(response){
            response.data.data.forEach(function(g){GENDERS_LIST.push([g.name, g.id])});
        });
        $("#screen-overflow").hide();
    });
    
}

$( document ).ready(function() { 
    $.each($("[data-role=scrollbar]"),function(n,s){
        if(!$(s).children('.viewport').length){
            $(s).append('<div class="scrollbar" ><div class="track" ><div class="thumb"><div class="end"></div></div></div></div>');
            $(s).append('<div class="viewport"> <div class="overview" ></div></div>');
        }
        $(s).tinyscrollbar();
    });
    set_api();
    
    $("#box-value-set-btn").click(function(){        
        if(MAP) MAP.forEach(function(box){box.el.remove();})
        var val = $("#box-value-set input").val() || 15;
        if(val%2===0) var val = val - 1;
        BOX_VALUE = val;        
        set_size();
    });
    $("#box-value-set-btn").click();

    $( window ).scrollTop(0)
    
    $( "#newUsersCreateBtn" ).click(function(){form_to_users();});

    $( ".unwrap-menu i" ).click(function(){
        function wrapMenu(icon){
            var parent = $( icon ).parent().parent(), params = {}, margin = $( parent ).data( "margin" );
            if(margin===undefined){
                function get_margin(directions){
                    var directions = (directions instanceof Array) ? directions : ['top','bottom','left','right'];
                    var dir = 'margin-'+directions.pop();
                    if($( parent ).css(dir)!='0px')return {d:dir}
                    else if(directions.length) return get_margin(directions)
                    else return {d:dir}
                }
                margin = get_margin();
                if(margin.d===undefined)return
                margin.v = parseInt($( parent ).css(margin.d));   
                $( parent ).data( "margin", margin )
            }
            params[margin.d] = (parseInt($( parent ).css(margin.d)) == margin.v ) ? '0px' : (margin.v+'px');
            $( parent ).animate(params , Math.abs($( parent ).data( "margin" ).v)*2 );
            var up='fa-arrow-circle-o-up',down='fa-arrow-circle-o-down',right='fa-arrow-circle-o-right',left='fa-arrow-circle-o-left';
            if( $( icon ).hasClass(up) ||  $( icon ).hasClass(down)) var cl = {n:up,o:down};
            else var cl = {n:left,o:right};
            $( icon ).toggleClass(cl.n).toggleClass(cl.o);
        }
        var icon = this;
        $( ".unwrap-menu i" ).filter(function(n, ico){
            if(ico==icon) return false
            var p = $( ico ).parent().parent(), m = $( p ).data( "margin" );
            return (m===undefined) ? false : !parseInt($( p ).css(m.d))
        }).map(function(n, ico){wrapMenu(ico);});
        wrapMenu(icon);
    });
    $( "#settings .unwrap-menu i" ).click()
    

    $( ".close-settings button" ).click(function(){
        TOWERS.deselect();
        USERS.deselect();
        $( "#place-settings" ).hide();
        $( "#user-settings" ).hide();
        $( "#main-settings" ).show();
    });

    $( "#start-game" ).click(function(){
        var play = $( this ).find('.fa').hasClass('fa-pause')
        $( this ).find('.fa').toggleClass('fa-pause', 'fa-start');
        if(PLACES_LIST.length===0){get_places_from_api()}
        else{
            if(play){USERS.wait()}
            else{USERS.live()}
        }
    })

    $( "#pick-place" ).click(function(){
        PICK_PLACE = true; 
        TOWERS.list.forEach(function(t){t.el.css({cursor:'crosshair'}) });
    })

    $( "#user-send-message" ).click(function(){
        var bd_id = $("#selected-place").attr('data-bd_id');
        $("#selected-place").attr('data-bd_id','').text('')
        if(!bd_id){
            add_log_element('client', 'Selected place for message is not set.');
            return
        }
        var user = USERS.list.filter( function(u){return u.email==$( "#user-settings #user-email span" ).text()} )[0]
        var target = TOWERS.created().filter( function(t){return t.bd_id==bd_id} )[0]
        var text = $("#user-new-message textarea").val()
        $("#user-new-message textarea").val('')
        user.message(target, text)
    })

});