var paperHelper = function($scope){
    $scope.$on('$routeChangeStart', function(event, routeData){if($scope.paper)$scope.paper.remove();});
    function _isSafeToApply() {
        var phase = $scope.$root.$$phase;
        return !(phase === '$apply' || phase === '$digest');
    }
    return {
        position:function(elem){
            //get absolute position elem in window
            //box - position relatively browser
            var box = elem.getBoundingClientRect(),
                body = document.body
                docElem = document.documentElement,
                scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop,
                scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft,
                clientTop = docElem.clientTop || body.clientTop || 0,
                clientLeft = docElem.clientLeft || body.clientLeft || 0,
                y = box.top +  scrollTop - clientTop,
                x = box.left + scrollLeft - clientLeft;
            return { y: Math.round(y), x: Math.round(x), width:box.width, height: box.height}
        },
        mouse:function(e){            
            var documentScroll = document.documentElement && document.documentElement.scrollTop;
            var top =  (documentScroll!==undefined) ? documentScroll : document.body.scrollTop;
            if($scope.ismobile) var e = e.touches.item(0);
            var position = this.position($scope.svg)
            var mouse = {
                x: e.clientX - position.x,
                y: e.clientY - position.y + top 
            }
            return mouse
        },
        safeApply: function(fn) {
            if (!_isSafeToApply()) {
                $scope.$eval(fn);
            } else {
                $scope.$apply(fn);
            }
        }
    }    
}



angular.module('sz.raphael.directives', [])
    .directive('szRaphaelModal', function(){
        return function(scope, element, attrs){
            var helper = paperHelper(scope)
            function setModal(val){
                helper.safeApply(function(){
                    scope[attrs.szRaphaelModal] = val;
                });
            }
            element
                .on('shown.bs.modal', function (e) {setModal(true); })
                .on('hidden.bs.modal', function (e) {setModal(false); })
        }
    })
    .directive('raphaelAddFace', function($interval){
        // Runs during compile
        return {
            // name: '',
            // priority: 1,
            // terminal: true,
            scope: {
                action:'=action',
                ismobile:'=ismobile',
                issend:'=issend',
                parent:'=parent',
                start:'=start',
                src:'=src',
                target:'=target',
            }, // {} = isolate, true = child, false/undefined = no change
            // controller: function($scope, $element, $attrs, $transclude) {},
            // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
            restrict: "E", // E = Element, A = Attribute, C = Class, M = Comment
            /*template: '<div class="angular-raphael-canvas"></div>',*/
            // templateUrl: '',
            replace: true,
            transclude: true,
            // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
            link: function($scope, element, attrs, controller) {
                var helper = paperHelper($scope);
                var facesList = new Array;
                var parent = document.getElementById($scope.parent)
                var targetElement = document.getElementById($scope.target);                  
                $scope.paper = Raphael(parent, $(parent).width(), $(parent).height());
                $("svg").attr("id","raphaelAddFace-Svg").css({position:'absolute'});
                $scope.svg = document.getElementById('raphaelAddFace-Svg')
                var eventstart = $scope.ismobile ? 'touchstart' : 'mousedown';
                $scope.svg.addEventListener(eventstart, function(e){
                    var mouse = helper.mouse(e);
                    /*if(mouse.x===NaN||mouse.y===NaN) return*/
                    /*setPaper()  */
                    var elements = $scope.paper.getElementsByPoint(mouse.x, mouse.y);
                    if(elements.length) return
                    var f = photoFace(mouse.x, mouse.y, $scope.src)
                    facesList.push(f)                        
                    /*f.doAction()*/
                  /*  e.stopPropagation();                        
                    e.preventDefault();*/
                });                      

                function setPaper(){                    
                    var box = helper.position(targetElement)
                    if(box.y<0)return
                    $scope.paper.setSize(box.width, box.height)
                    var targetPos = $(targetElement).position()
                    $($scope.svg).css({left: targetPos.left + 'px', top: targetPos.top + 'px'})                    
                }
                $(window).resize(function(){setPaper();})

                /*box.addEventListener( 'webkitTransitionEnd', 
                    function( event ) { alert( targetElement.getBoundingClientRect().top ); }, false );*/


                function clearPaper(){
                    facesList.forEach(function(f){f.remove()});
                    facesList.length = 0;
                }

                $scope.$watch('start', function(val){
                    if(val===true) setPaper();
                    if(val===false) clearPaper();
                })

                $scope.$watch('src', function(val){//change all face.src
                    if(val!=undefined&&facesList.length)
                        facesList.forEach(function(f){f.attr('src', val)})                
                }, true);

                $scope.$watch('issend', function(newval, oldval){
                    if(oldval!==undefined&&newval===undefined){
                        var box = helper.position(targetElement);
                        var faces_list = facesList.map(function(f){return f.getBBox()});
                        $scope.$emit('setPhotoPreviewBox', {
                            photo_width: box.width,
                            photo_height: box.height,
                            faces_list: faces_list
                        });
                    }
                });

                function photoFace(x, y, src){
                    var width = 70, height  = 70, x = x - width/2, y = y - height/2;
                    var minw = 50, minh = 50;
                    var step = width/5, time = 700;
                    var face = $scope.paper.image(src, x, y, width, height)
                    face.t = time;
                    face.step = step;

                    function changeVal(dir){
                        var dir = dir || 1;
                        var step = face.step*dir,
                            oldX = face.attr('x'), oldY = face.attr('y'),
                            newW = face.attr('width') + step, newH = face.attr('height') + step,
                            newX = oldX - step/2, newY = oldY - step/2;
                        face.animate({width:newW, height:newH, x:newX, y:newY}, face.t, "backIn");
                    };  

                    function canEnlarge(){
                        var left = face.attr('x'), right = face.attr('x') + face.attr('width'),
                            top = face.attr('y'), bottom = face.attr('y') + face.attr('height');
                        return left>0 && right<$scope.paper.width && top>0 && bottom<$scope.paper.height;
                    }

                    function canReduce(){return face.attr('height')>minh && face.attr('width')>minw}

                    function removeFace(){
                        for (var i = facesList.length - 1; i >= 0; i--) {
                            if(facesList[i]==face){
                                facesList.slice(i, 1)
                                break
                            }
                        };                                                
                        face.remove()
                    }

                    function moveFace(dx, dy, e){
                        if(dx===0||dy===0)return
                        face.stopAction()
                        var mouse = helper.mouse(e),
                            newX = mouse.x - face.attr('width')/2,
                            newY = mouse.y - face.attr('height')/2;
                        face.animate({x:newX, y:newY});
                    }

                    face.stopAction = function(e){                        
                        //e.stopPropagation()
                        if (face.action!==undefined) {
                            $interval.cancel(face.action);
                            face.action = undefined;
                        }
                    }

                    face.doAction = function(e){
                        //e.stopPropagation()
                        if($scope.action===1){
                            var can = canEnlarge;
                            var dir = 1;
                        }
                        else if($scope.action===0){
                            var can = canReduce;
                            var dir = -1;
                        }
                        else{return}

                        face.action = $interval(function() {
                            if(can()) changeVal(dir);
                            else{
                                face.stopAction()
                                if(dir===-1) removeFace();
                            }
                        }, face.t)
                    }

                    face.drag(function(dx,dy,x,y,e){moveFace(dx, dy, e)});
                    

                    if($scope.ismobile){
                        face.touchstart(function(e){face.doAction(e)});
                        face.touchend(function(e){face.stopAction(e)});
                    }
                    else{                        
                        face.mousedown(function(e){face.doAction(e)});
                        face.mouseup(function(e){face.stopAction(e)});
                    }                    
                    return face
                }

                
            }
        };
    })


    .directive('raphael', [
    '$http', '$log', '$parse', '$rootScope', function ($http, $log, $parse, $rootScope) {
    return {
        restrict: "E",
        replace: true,
        transclude: true,
        scope: {      
        	canvas:  '=canvas',   
            images: '=images',
            /*faces: '=faces',*/
            action:'=action',
            userface : '=userface',
            customControls: '=customControls', //?
            leafletMap: '=leafletmap',			//?
            eventBroadcast: '=eventBroadcast'	//?
        },
        template: '<div class="angular-raphael-canvas"></div>',
        link: function ($scope, element, attrs /*, ctrl */) {

			$scope.$on('raphaelDirectiveCanvas.getBBox', function(e){
				var box = {
					width: $scope.paper.width,
					height: $scope.paper.height
				}

				safeApply(function(scope){scope.$emit('raphaelDirectiveCanvas.pushBBox', box) });
			})

            $scope.faces = []
            var images = setupImages()
            var faces = setupFaces()

            function _isSafeToApply() {
                var phase = $scope.$root.$$phase;
                return !(phase === '$apply' || phase === '$digest');
            }

            function safeApply(fn) {
                if (!_isSafeToApply()) {
                    $scope.$eval(fn);
                } else {
                    $scope.$apply(fn);
                }
            }
            function setupImages(){
            	var images = setupElems($scope.images,'images')            	
            	return images
            }

            function setupFaces(){
            	var faces = setupElems($scope.faces,'faces')            	
            	return faces
            }

            function setupElems(scope_elements, elements_name) {            	
                var elements = {};
                if (!scope_elements) {
                    return;
                }            
                for (var name in scope_elements) {
                    var newEl = createElem(name, scope_elements[name], elements_name);
                    if (newEl !== null) {
                        elements[name] = newEl;
                    }
                } 
                var elements_on_name = "raphaelDirective" + elements_name.charAt(0).toUpperCase() + elements_name.substr(1);
                var getBBoxes = $scope.$on(elements_on_name + '.getBBox', function(e){
            		var elems_all = $scope[elements_name]
                	var bboxes = []
                	for(var n in elems_all){
                		var e = elems_all[n]
                		var box = e.getBBox()
                		if(e.face) box.face = e.face;
                		bboxes.push(box)
                	}
                	safeApply(function(scope){scope.$emit(elements_on_name + '.pushBBox', bboxes) });                   
                })

                
                $scope.$watch(elements_name,function(newElements){
                	if(newElements){
	                    // Delete elem from the array and from the canvas
	                    for (var name in elements) {
	                        if (newElements[name] === undefined) {      
	                            elements[name].remove()                            
	                            delete elements[name];
	                        }
	                    }
	                    // add new elem
	                    for (var new_name in newElements) {
	                        if (elements[new_name] === undefined) {
	                            var newEl = createElem(new_name, newElements[new_name], elements_name);
	                            if (newEl !== null) {
	                                elements[new_name] = newEl;
	                            }
	                        }
	                    }
                    }
                }, true);
                return elements                
            }

            function createImg(img_data){
            	var src = img_data.src || defaults.images.src,
            		x = parseInt(img_data.x,10) || defaults.images.x,
            		y = parseInt(img_data.y,10) || defaults.images.y,
            		width = (img_data.width) ? img_data.width : (!x && !y) ? $scope.paper.width : parseInt(defaults.images.width,10),
            		height = (img_data.height) ? img_data.height : (!x && !y) ? $scope.paper.height : parseInt(defaults.images.height,10);        		
 				var newImg = $scope.paper.image(src, x, y, width, height)
 				if(img_data.events){
 					if(img_data.events.mousedown=='drawnewface'){
 						newImg.mousedown(function(e){
 							if($scope.action==1){
 								var mouse = Helpers.mouse(e),
 									t = defaults.images.t,
									newface = createFace(mouse.x,mouse.y),
									intervalID = setInterval(function(){newface.enlarge()},t);
								newface.i = intervalID
								newface.t = t
								var facesLen = 1;
							    for(n in $scope.faces) {{if ($scope.faces.hasOwnProperty(n)) {facesLen+=1}}}
								$scope.faces['face' + facesLen] = newface
							}
		 				})
 					} 					
 				} 				
        		return newImg
            }
            function createFace(x, y){
            	var src = ($scope.userface) ? $scope.userface.face : defaults.faces.src,
            		width = defaults.faces.width,
            		height = defaults.faces.height
            		x = x - width/2
            		y = y - height/2
        		var face = $scope.paper.image(src, x, y, width, height)
        		if($scope.userface){
        			face.face = $scope.userface.id
        		}
        		function changeVal(obj,step){
					var oldX = obj.attr('x'), oldY = obj.attr('y'),
						newW = obj.attr('width') + step, newH = obj.attr('height') + step,
						newX = oldX - step/2, newY = oldY - step/2;
					obj.animate({width:newW, height:newH, x:newX, y:newY}, obj.t, "backIn"
					);
				};	
				function canEnlarge(obj){
					var left = obj.attr('x'),
						right = obj.attr('x') + obj.attr('width'),
						top = obj.attr('y'),
						bottom = obj.attr('y') + obj.attr('height');
					return left>0 && right<$scope.paper.width && top>0 && bottom<$scope.paper.height;
				}
				function canReduce(obj,step){
					return obj.attr('height')>defaults.faces.minh && obj.attr('width')>defaults.faces.minw 
				}
				face.enlarge = function(){if(canEnlarge(this)){changeVal(this,defaults.faces.step)} }
				face.reduce = function(){
					if(canReduce(this,defaults.faces.step)){changeVal(this, defaults.faces.step*-1)}
					else{
						for(var n in $scope.faces){
							if ($scope.faces.hasOwnProperty(n)){
								if($scope.faces[n]==face){
									delete $scope.faces[n]}
							}
						}
						face.remove()
					}
				}	
				function stop_action(obj){
					if(obj.i){
						clearInterval(obj.i);
						obj.i = false;
					}
					var intervalID = $(obj).data('intervalID');
					clearInterval(intervalID)
				}
				face.mousedown(function(e){
					var intervalID = setInterval(function(){
							if($scope.action==1){face.enlarge()}
							else{face.reduce()}
						},face.t);
					$(this).data('intervalID', intervalID)})
				face.mouseup(function(e){
					stop_action(this)
				});
				face.drag(function(dx,dy,x,y,e){
					stop_action(this)
					var mouse = Helpers.mouse(e),
						newX = mouse.x - this.attr('width')/2,
						newY = mouse.y - this.attr('height')/2;
					this.animate({x:newX, y:newY});
				});				
        		return face
            }

            function createElem(name, elem_data, elements_name) {
            	var scope_elem_name = elements_name +'.'+ name
            	//@TODO: make it for all  types
            	if(elements_name=='images') {
            		var elem = createImg(elem_data);}
        		else if(elements_name=="faces"){
        			var elem = createFace(elem_data)
        		}
                else{$log.warn("[AngularJS - Raphael] unsupported elements type: "+elements_name);}

                if(elem.attr('width')==$scope.paper.width && elem.attr('height')==$scope.paper.height){
                	var autoupElemBoxH = $scope.$watch('paper.height', function(){
						elem.attr('height', $scope.paper.height)
					}, true)
					var autoupElemBoxW = $scope.$watch('paper.width', function(){
						elem.attr('width', $scope.paper.width) 
					}, true)
                }
                var updateElem = $scope.$watch(scope_elem_name, function(data, old_data){
                	if(data!=old_data){
                		for(var attr in data){
                			if(data[attr]!==undefined){
                				elem.attr(attr,data[attr])
                			}
                			else{
                				$log.warn("[AngularJS - Raphael] bad value for attr: "+attr+':'+data[attr]+'. Attr was not changed');
                			}
                		}                		
                	}
                }, true)

                function genDispatchEventCB(eventName, logic, el) {                	                	                	
                    return function(e) {                      	
                		var mouse = Helpers.mouse(e)
                        var broadcastName = "raphaelDirective" + elements_name.charAt(0).toUpperCase() + elements_name.substr(1) + '.' + eventName;
                        /*//Mb better do elemName as 'images.photo' ?
                        var elemName = scope_elem_name.replace(elements_name, '');*/
                        // Broadcast old elem click name for backwards compatibility
                        if (eventName === "click") {
                            safeApply(function() {
                                $rootScope.$broadcast('raphaelDirectiveElementsClick', scope_elem_name, mouse);
                            });
                        } 
                        var data = {
                            elemName: scope_elem_name,
                            raphaelEvent: e,
                            mouse : mouse,
                            elem: el
                        }
                        safeApply(function(scope){
                            if (logic === "emit") {
                                scope.$emit(broadcastName, data);
                            } else {
                                $rootScope.$broadcast(broadcastName, data);
                            }
                        });
                    };
                }

                // Set up object event broadcasting
                var availableElemEvents = [
                    'click',
                    'dblclick',
                    'drag',
                    'hover',
                    'mousedown',
                    'mousemove',
                    'mouseout',
                    'mouseover',
                    'mouseup',
                    'onDragOver',
                    'touchcancel',
                    'touchend',
                    'touchmove',
                    'touchstart',
                    'remove',
                ];

                var elemEvents = [];
                var i;
                var eventName;
                var logic = "broadcast";

                if ($scope.eventBroadcast === undefined || $scope.eventBroadcast === null) {
                    // Backward compatibility, if no event-broadcast attribute, all events are broadcasted
                    elemEvents = availableElemEvents;
                } else if (typeof $scope.eventBroadcast !== 'object') {
                    // Not a valid object
                    $log.warn("[AngularJS - Raphael] event-broadcast must be an object check your model.");
                } else {
                    // We have a possible valid object
                    if ($scope.eventBroadcast.elem === undefined || $scope.eventBroadcast.elem === null) {
                        // We do not have events enable/disable do we do nothing (all enabled by default)
                        elemEvents = availableElemEvents;
                    } else if (typeof $scope.eventBroadcast.elem !== 'object') {
                        // Not a valid object
                        $log.warn("[AngularJS - Raphael] event-broadcast.elem must be an object check your model.");
                    } else {
                        // We have a possible valid map object
                        // Event propadation logic
                        if ($scope.eventBroadcast.elem.logic !== undefined && $scope.eventBroadcast.elem.logic !== null) {
                            // We take care of possible propagation logic
                            if ($scope.eventBroadcast.elem.logic !== "emit" && $scope.eventBroadcast.elem.logic !== "broadcast") {
                                // This is an error
                                $log.warn("[AngularJS - Raphael] Available event propagation logic are: 'emit' or 'broadcast'.");
                            } else if ($scope.eventBroadcast.elem.logic === "emit") {
                                logic = "emit";
                            }
                        }
                        // Enable / Disable
                        var elemEventsEnable = false, elemEventsDisable = false;
                        if ($scope.eventBroadcast.elem.enable !== undefined && $scope.eventBroadcast.elem.enable !== null) {
                            if (typeof $scope.eventBroadcast.elem.enable === 'object') {
                                elemEventsEnable = true;
                            }
                        }
                        if ($scope.eventBroadcast.elem.disable !== undefined && $scope.eventBroadcast.elem.disable !== null) {
                            if (typeof $scope.eventBroadcast.elem.disable === 'object') {
                                elemEventsDisable = true;
                            }
                        }
                        if (elemEventsEnable && elemEventsDisable) {
                            // Both are active, this is an error
                            $log.warn("[AngularJS - Raphael] can not enable and disable events at the same time");
                        } else if (!elemEventsEnable && !elemEventsDisable) {
                            // Both are inactive, this is an error
                            $log.warn("[AngularJS - Raphael] must enable or disable events");
                        } else {
                            // At this point the elem object is OK, lets enable or disable events
                            if (elemEventsEnable) {
                                // Enable events
                                for (i = 0; i < $scope.eventBroadcast.elem.enable.length; i++) {
                                    eventName = $scope.eventBroadcast.elem.enable[i];
                                    // Do we have already the event enabled?
                                    if (elemEvents.indexOf(eventName) !== -1) {
                                        // Repeated event, this is an error
                                        $log.warn("[AngularJS - Raphael] This event " + eventName + " is already enabled");
                                    } else {
                                        // Does the event exists?
                                        if (availableElemEvents.indexOf(eventName) === -1) {
                                            // The event does not exists, this is an error
                                            $log.warn("[AngularJS - Raphael] This event " + eventName + " does not exist");
                                        } else {
                                            // All ok enable the event
                                            elemEvents.push(eventName);
                                        }
                                    }
                                }
                            } else {
                                // Disable events
                                elemEvents = availableElemEvents;
                                for (i = 0; i < $scope.eventBroadcast.elem.disable.length; i++) {
                                    eventName = $scope.eventBroadcast.elem.disable[i];
                                    var index = elemEvents.indexOf(eventName);
                                    if (index === -1) {
                                        // The event does not exist
                                        $log.warn("[AngularJS - Raphael] This event " + eventName + " does not exist or has been already disabled");
                                    } else {
                                        elemEvents.splice(index, 1);
                                    }
                                }
                            }
                        }
                    }
                }            
                var event_data = {
                	eventName: eventName,
                    scope_elem_name: scope_elem_name
                }
            	elem.click(genDispatchEventCB('click', logic, elem), event_data)  	
                elem.mousedown(genDispatchEventCB('mousedown', logic, elem), event_data)
                elem.mouseup(genDispatchEventCB('mouseup', logic, elem), event_data)    
                elem.drag(genDispatchEventCB('drag', logic, elem), event_data)    
                return elem;
            }

        }
    }


}]);