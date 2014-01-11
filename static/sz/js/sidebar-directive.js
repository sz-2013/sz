var raphaelDirective = angular.module("sidebar-directive", []);

raphaelDirective.directive('szSideBar', [ function ( ) {   
    return function(scope, element, attrs) {
        /**
         * sidebarEffects.js v1.0.0
         * http://www.codrops.com
         *
         * Licensed under the MIT license.
         * http://www.opensource.org/licenses/mit-license.php
         * 
         * Copyright 2013, Codrops
         * http://www.codrops.com
         */
       /* $("#"+attrs.szSlideBar +" .viewport").height( $("#"+attrs.szSlideBar).height() )
        $("#"+attrs.szSlideBar).tinyscrollbar(); */           
        /*element.slideBar( { effect: attrs.szSlideBarEffect } );*/
        var params = attrs.params || {},
            container_id = params.container_id || 'st-container',
            container_class = params.container_class || 'st-container',
            open_class = params.open_class || 'st-menu-open',
            menu_class = params.menu_class || 'st-menu',
            effect = attrs.stEffect || 'st-effect-8',
            $content = $('.'+attrs.stContent),
            contTime = 500;


        function init(){
            function hasParentClass( e, classname ) {
                if(e === document) return false;
                if( $(e).hasClass(classname) ) {
                    return true;
                }
                return e.parentNode && hasParentClass( e.parentNode, classname );
            }

            var eventtype = scope.is_mobile ? 'touchstart' : 'click',
                container = document.getElementById( container_id ),            
                resetMenu = function() {
                    $(container).removeClass(open_class)
                    //if($content.length) $content.animate({marginLeft: 'auto'}, contTime)
                    window.setTimeout( function() {
                        $("#wrap").css('zIndex','auto')
                        $(container).hide()
                    }, 500);
                },
                bodyClickFn = function(evt) {
                    // event type (if mobile use touch events)
                    if( !hasParentClass( evt.target, menu_class ) ) {
                        resetMenu();
                        document.removeEventListener( eventtype, bodyClickFn );
                    }
                };

            function bind_function(){                
                container.className = container_class; // clear
                $("#wrap").css('zIndex','1')
                $(container).show()
                $(container).addClass(effect);
                $( "." + menu_class ).scrollTop(0)
                setTimeout( function() {
                    $(container).addClass(open_class)
                    //if($content.length) $content.animate({marginLeft: $( "." + menu_class ).width() +'px'}, contTime)
                }, 25 );
                document.addEventListener( eventtype, bodyClickFn );
            }

            element.bind( eventtype, function( ev ) {
                ev.stopPropagation();
                ev.preventDefault();
                bind_function();
            });   

            

       /*     document.addEventListener('touchend', function(e) {
                var touch_end = parseInt(e.changedTouches[0].clientX);
                e.preventDefault();
                if( (touch_end - touch_start) > 0) bind_function();
            });         

            var touch_start;
            document.addEventListener('touchstart', function(e) {
                touch_start = parseInt(e.changedTouches[0].clientX);
                e.preventDefault()
            });*/
        }
        

        scope.$watch("is_mobile", function(){
            if(scope.is_mobile!=undefined) init();
        });

        
        
    };


}]);