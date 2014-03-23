var paperHelper = function($scope){
    if($scope) $scope.$on('$routeChangeStart', function(event, routeData){if($scope.paper)$scope.paper.remove();});
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
                face: '=face',
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
                    var f = photoFace(mouse.x, mouse.y)
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

                function clearPaper(){
                    facesList.forEach(function(f){f.remove()});
                    facesList.length = 0;
                }

                $scope.$watch('start', function(val){
                    if(val===true) setPaper();
                    if(val===false) clearPaper();
                });

                $scope.$watch('issend', function(newval, oldval){
                    if(oldval!==undefined&&newval===undefined){
                        var box = helper.position(targetElement);
                        var faces_list = facesList.map(function(f){
                            var box=f.getBBox();
                            box.face_id = f.face_id;
                            return box
                        });
                        $scope.$emit('setPhotoPreviewBox', {
                            photo_width: box.width,
                            photo_height: box.height,
                            faces_list: faces_list
                        });
                    }
                });

                function photoFace(x, y){
                    var width = 70, height  = 70, x = x - width/2, y = y - height/2;
                    var minw = 50, minh = 50;
                    var step = width/5, time = 700;
                    var face = $scope.paper.image($scope.face.face, x, y, width, height)
                    face.t = time;
                    face.step = step;
                    face.face_id = $scope.face.id

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
