'use strict';

/* Directives */
var Helpers = {
    failHandler: function(e){console.log(e.toString())},
    photoPreview: function(scope, fileModel){
        var $photoCont = $('.photo-container');
        var $img = $photoCont.children('img');
        var setImgMaxH = function(){
            var min = 150;
            var photoH = $(window).height() - 190;
            var h = (photoH > min) ? photoH : min;
            $img.css('maxHeight', h + 'px')
            $(window).resize(function(){setImgMaxH();});
        }
        return {
            setImgMaxH: setImgMaxH,
            setImagePreviw: function(src, title, file){
                $img.attr('src', src);
                if(title) $img.attr('title', title);
                /*scope.$apply(function(){*/
                scope[fileModel] = file;
                scope.showEditPhoto = !scope.showEditPhoto;
            },
        }
    },
    dataURItoBlob: function(dataURI) {
        //http://stackoverflow.com/a/15754051/3235213
        var byteString = atob(dataURI.split(',')[1]);
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    }
}


angular.module('sz.client.directives', [])
    .directive('szInCenter', function(){
        return function(scope, element, attrs) {
            function inCenter(){
                var incenter = element[0];
                incenter.style.marginTop = (window.innerHeight - incenter.offsetHeight)/2 + 'px';
            }
            scope.$watch(attrs.szInCenter, function(val){
                if(val) inCenter()
            });
            window.addEventListener("orientationchange", function() {
                inCenter()
            }, false);
        }
    })
    .directive('szSetWindow', function(){
        return function(scope, element, attrs) {
            function setWindow(){
                var margin = 8;
                element[0].style.height = window.innerHeight - margin*2 + 'px';
                
                var loaderI = document.getElementById('loader').getElementsByTagName('i')[0]
                if ( loaderI ) loaderI.style.top = (window.innerHeight - $('#loader i').height())/2 + 'px'
            }            
            scope.$watch('session', function(val){
                if(val!==undefined) setWindow()
            })
            window.addEventListener("orientationchange", function() {
                setWindow()
            }, false);
        }
    })
 /*   .directive('forcedLandscape', function(){
        return function(scope, element, attrs) {
            scope.$watch(attrs.forcedLandscape, function(val){
                if(val) {
                    //var h = el.height(), w = el.width(), t = 300;
                    element
                    //.animate({width: h + 'px', height: w + 'px', marginTop: 0 + 'px'}, t)
                    .addClass('landscape');
                }
            })
        };
    })*/
    .directive('mobileCheck', function() {
        return function(scope, element, attrs) {
            // http://coveroverflow.com/a/11381730/989439
            function mobilecheck() {
                var check = false;
                (function(a){if(/(android|ipad|playbook|silk|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
                return check;
            }
            scope.is_mobile = mobilecheck();
        };
    })
    .directive('szScrollDetect', function($window) {
        //Show bottom shadow to header when check scroll in window
        return function(scope, element, attrs) {
            var cl = "header-shadow", header = $("header") 
            angular.element(element).bind("scroll", function() {
                if(element.scrollTop()) header.addClass(cl)
                else header.removeClass(cl)
            })
        }
    })
    .directive('szAutoResizeTextArea', function() {
        //enable autoresize for textarea
        return function(scope, element, attrs) {
            element.autoResize();
        };
    })
    .directive('szModal', function($interval) {
        //enable autoresize for textarea
        return function(scope, element, attrs) {
            var darkNavTop = 100;

            function resetMenu(){
                element.click()
                document.removeEventListener("backbutton", resetMenu, false);
                $("textarea").focus()
            }

            function setMenu(){
                $("textarea").blur()
                element.find('.dark-nav').find('ul').css('maxHeight', $(window).height()-darkNavTop)
                element.modal({show: true});                 
                document.addEventListener("backbutton", resetMenu, false);                    
            }

            scope.$watch(attrs.szModal, function(val){
                if(val!==undefined) setMenu();
                else resetMenu();
            })
        };
    })
    .directive('szMessageAddBox', function(camera) {
        //Set optimal  heigth for message box and set 
        //focus to textarea when place was selected
        return function(scope, element, attrs) {
            var min = 250, keybowrdWidth = 500, h = $(window).height()-keybowrdWidth;
            element.height( (h>min) ? h : min );

            if(navigator.camera!==undefined) scope.showStandartFileModel = false;

            var helper = Helpers.photoPreview(scope, 'photoPreview');
            helper.setImgMaxH();

            scope.makePhoto = function(isLibrary){
                if(navigator.camera!==undefined)
                    camera.getPicture(
                        function(imageData){
                            var src = "data:image/png;base64," + imageData;
                            var photo = Helpers.dataURItoBlob(src);
                            helper.setImagePreviw(src,  String(Math.random()).slice(2, 12) + '.png', photo)
                        },
                        Helpers.failHandler, isLibrary);                
            }
        }
    })
    .directive('szFileModel', function($rootScope) {
        //show preview for uploaded photo
        //and show photo modal window
        return function(scope, element, attrs) {
            var helper = Helpers.photoPreview(scope, attrs.szFileModel);
            helper.setImgMaxH();

            scope.$watch(attrs.szFileModel, function() {
                var el = element[0];
                angular.element(el).bind('change', function(){                    
                    if (angular.isUndefined(el.files))
                    {throw new Error("This browser does not support HTML5 File API.");}
                    if (el.files.length == 1){
                        var photo = el.files[0];
                        if (photo.type.match('image.*')) {
                            var reader = new FileReader();
                            reader.onload = (function(theFile) {
                                return function(e) {
                                    scope.$apply(function(){
                                        helper.setImagePreviw(e.target.result, escape(photo.name), photo)
                                    }); 
                                    
                                };
                            })(photo);
                            reader.readAsDataURL(photo);
                        }
                        else{alert('Недопустимый формат')}
                    }
                });
            });
        }
    })
    .directive('szSelectPlace', function() {
        //the directive for a selected place modal window
        return function(scope, element, attrs) {
            scope.showDetail = function(id){
                var li = element.find("[data-placeitem="+id+"]"), w = li.width()/2;
                li.animate({marginLeft: -1*w + 'px'}, w*2)
            }
            scope.hideDetail = function(id){
                var li = element.find("[data-placeitem="+id+"]"), w = li.width()/2;
                li.animate({marginLeft: 0}, w*2)
            }
        };
    })
    .directive('szBadges', function($timeout) {
        return function(scope, element, attrs) {
            function addBadge(){
                scope.showBadgeArea = true
            }

            scope.$watch('badges.current', function(val){
                if(val!==undefined) addBadge()
                else scope.showBadgeArea = false;
            })
            /*function hideAchive(){
                scope.showAchive = false
            } 
            scope.$watch(attrs.ngShow, function(val){
                if(val)$timeout(hideAchive, attrs.timeout);
            });*/
        };
    })
    