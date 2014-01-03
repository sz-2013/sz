var raphaelDirective = angular.module("slidebar-directive", []);

raphaelDirective.directive('szSlideBar', [ function ( ) {   
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
        function init(){
            var params = attrs.params || {},
                container_id = params.container_id || 'st-container',
                container_class = params.container_class || 'st-container',
                open_class = params.open_class || 'st-menu-open',
                menu_class = params.menu_class || 'st-menu',
                effect = attrs.szSlideBarEffect || 'st-effect-8';


            function hasParentClass( e, classname ) {
                if(e === document) return false;
                if( $(e).hasClass(classname) ) {
                    return true;
                }
                return e.parentNode && hasParentClass( e.parentNode, classname );
            }

            var eventtype = scope.is_mobile ? 'touchstart' : 'click';
            var container = document.getElementById( container_id ),            
                resetMenu = function() {
                    $(container).removeClass(open_class)                
                },
                bodyClickFn = function(evt) {
                    // event type (if mobile use touch events)
                    if( !hasParentClass( evt.target, menu_class ) ) {
                        resetMenu();
                        document.removeEventListener( eventtype, bodyClickFn );
                    }
                };

            element.bind( eventtype, function( ev ) {
                ev.stopPropagation();
                ev.preventDefault();
                container.className = container_class; // clear
                $(container).addClass(effect);
                setTimeout( function() {    
                    $( "." + menu_class ).scrollTop(0)
                    $(container).addClass(open_class);
                }, 25 );
                document.addEventListener( eventtype, bodyClickFn );
            });            
        }
        scope.$watch("is_mobile", function(){
            if(scope.is_mobile!=undefined) init();
        })
    };


}]);