var raphaelDirective = angular.module("raphael-directive", []);

raphaelDirective.directive('raphael', [
    '$http', '$log', '$parse', '$rootScope', function ($http, $log, $parse, $rootScope) {
    var defaults = { 
    	images:{
    		src: 'img/photo.jpg',
            x:0,
            y:0,
            width:10,
            height:10,
            t:300
    	},
    	faces:{
    		src:'img/face.png',
    		x:0,
            y:0,
            width:50,
            height:50,
            minh:50,
            minw:50,
            step:15
    	},
    	circles:{
    		x:0,
            y:0,
            opacity: 1,
            fill:'#f00',
            stroke:'#fff',
            width:10,
            height:10,
    	},
        canvas: {
            x: 0,
            y: 0,
            width: 1,
            height:1,
            center:true
        }
    };

    
    var str_inspect_hint = 'Add testing="testing" to <raphael> tag to inspect this object';
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
        	var Helpers = {
		    	position:function(elem){    		
		    		//box - position relatively browser
		    		var box = elem[0].getBoundingClientRect(),
				    	body = document.body
				    	docElem = document.documentElement,
				    	scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop,
				    	scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft,
				    	clientTop = docElem.clientTop || body.clientTop || 0,
				    	clientLeft = docElem.clientLeft || body.clientLeft || 0,
				    	y = box.top +  scrollTop - clientTop,
				    	x = box.left + scrollLeft - clientLeft;
				    return { y: Math.round(y), x: Math.round(x)}
		    	},
		    	mouse:function(e){
		    		var bodyScroll = document.body.scrollTop;
					var top =  (bodyScroll) ? bodyScroll : document.documentElement.scrollTop;					
		        	var mouse = {
		        		x: e.clientX - $scope.paper.x,
		        		y: e.clientY - $scope.paper.y + top
		        	}
		        	return mouse
		    	}
		    }
        	//функция удаления канваса при смене адреса страницы
        	$scope.$on('$routeChangeStart', function(event, routeData){if($scope.paper)$scope.paper.remove();});
        	var elwidthStart = attrs.width || defaults.canvas.width,
        		elheightStart = attrs.height || defaults.canvas.height,        		
        		parent = element.parent();

            function setPapper(){
            	if(!$scope.paper)$scope.paper = Raphael(0, 0, 0, 0);
            	var parent_width = parent.width(),
            		parent_height = parent.height(),
            		positionStart = Helpers.position(element);
        		/*Если параметры в процентах и нет канвас параметров - пересчитываем от родительсокой*/
        		if(!$scope.canvas.width && !$scope.canvas.height){
        			if(elwidthStart.toString().indexOf('%')>=0){
        			var elwidth = Math.round(parent_width*parseInt(elwidthStart,10)/100)		
	        		}
	        		if(elheightStart.toString().indexOf('%')>=0){
		        		var elheight = Math.round(parent_height*parseInt(elheightStart,10)/100)
		    		}	
        		}
        		else if($scope.canvas.width===1 || $scope.canvas.height===1){
        			$scope.paper.remove();
        			element.hide()
        			return false
        		}
        		/*Иначе - считаем, что канвас параметры как параметры paper*/
        		else{
        			/*Проверяем, что canvas.width не больше родительской ширины*/
        			if($scope.canvas.width<parent_width){
        				var elwidth = $scope.canvas.width
        				var elheight = $scope.canvas.height
        			}
        			else{
        				/*Иначе уменьшаем изображение пропорционально*/
        				var elwidth = parent_width
        				var elheight = Math.round($scope.canvas.height*parent_width/$scope.canvas.width)
        			}
        		}
        		element.width(elwidth)
            	element.height(elheight)
            	$scope.paper.setSize(elwidth,elheight)
            	
    			var ely = positionStart.y;    			
        		/*Если не указано другого - устанавливаем элемент в центр*/
        		if(!$scope.canvas || ($scope.canvas && $scope.canvas.center===undefined) ||
        			($scope.canvas && $scope.canvas.center==true)){
        			var margin = Math.round((parent_width - elwidth)/2)
    				var elx = positionStart.x + margin;
        		}
        		/*Иначе оставляем где есть*/
    			else{
    				var elx = positionStart.x;
    			}
        		$("svg").css({top:ely+'px',left:elx+'px'})
        		$scope.paper.x = elx
        		$scope.paper.y = ely     
            }                     
            setPapper()
            $(window).resize(function () {setPapper()}); 
           	$scope.$watch("canvas", function(canvas, old_canvas) {
				if(old_canvas!=canvas){setPapper()}
			}, true)

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
            /*Функция изменения источника картинки на всех лицах, ранееотмеченных пользователем*/
            $scope.$watch('userface', function(val){
            	if(val && $scope.faces){
            		for(var n in $scope.faces){
            			if ($scope.faces.hasOwnProperty(n)){
            				$scope.faces[n].attr('src', val.face)
            				$scope.faces[n].face = val.id
            			}
            		}
            	}
            }, true)

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