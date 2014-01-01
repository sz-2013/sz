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
