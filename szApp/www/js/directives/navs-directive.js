var navsDirective = angular.module("navs-directive", []);

navsDirective
    .directive('szSideBar', [ function ( ) {   
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
            var params = attrs.params || {},
                container_id = params.container_id || 'mainPage',
                container_class = params.container_class || 'st-container',
                open_class = params.open_class || 'st-menu-open',
                menu_class = params.menu_class || 'st-menu',
                effect = attrs.stEffect || 'st-effect-8',
                eventstart = scope.is_mobile ? 'touchstart' : 'click';
            
            function hasParentClass( e, classname ) {
                if(e === document) return false;
                if( $(e).hasClass(classname) ) {
                    return true;
                }
                return e.parentNode && hasParentClass( e.parentNode, classname );
            }

            var container = document.getElementById( container_id ),            
                resetMenu = function() {
                    $(container).removeClass(open_class)
                    document.removeEventListener("backbutton", resetMenu, false);
                },
                bodyClickFn = function(evt) {
                    // event type (if mobile use touch events)
                    if( !hasParentClass( evt.target, menu_class ) ) {
                        resetMenu();
                        document.removeEventListener( eventstart, bodyClickFn );
                    }
                };

            function main_function(){                
                container.className = container_class; // clear
                $(container).addClass(effect);
                $( "." + menu_class ).scrollTop(0)
                setTimeout( function() {
                    $(container).addClass(open_class)
                }, 25 );
                document.addEventListener("backbutton", resetMenu, false);
                document.addEventListener( eventstart, bodyClickFn );
            }
            element.bind( eventstart, function( ev ) {
                ev.stopPropagation();
                ev.preventDefault();
                main_function();
            });              
            
        };

    }])
    .directive('szSubPage', [ function ( ) {   
        return function(scope, element, attrs) {

        };
    }])
    .directive('szModal', [ function ( ) {   
        return function(scope, element, attrs) {

        };
    }])