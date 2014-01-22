'use strict';

/* Directives */

angular.module('sz.client.directives', [])
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
            var min = 200, keybowrdWidth = 500, h = $(window).height()-keybowrdWidth;
            element.height( (h>min) ? h : min )

            function setImgMaxH(){
                var min = 150;
                var photoH = $(window).height() - 190;
                var h = (photoH > min) ? photoH : min;
                $img.css('maxHeight', h + 'px')
                return h + 'px'
            }

            var $photoCont = $('.photo-container');
            var $img = $photoCont.children('img');
            setImgMaxH();
            $(window).resize(function(){setImgMaxH();});            

            if(navigator.camera!==undefined){
                scope.showStandartFileModel = false;
            }

            function failHandler(e){console.log(e.toString())}

            scope.setImagePreviw = function(src, title, file){
                $img.attr('src', src);
                if(title) $img.attr('title', title);
                /*scope.$apply(function(){*/
                scope[attrs.szFileModel] = file;
                scope.showEditPhoto = !scope.showEditPhoto;
                /*});*/
            }

            scope.makePhoto = function(isLibrary){
                if(navigator.camera!==undefined)
                    camera.getPicture(
                        function(imageData){
                            var options = new FileUploadOptions();
                            options.fileKey="file";
                            options.fileName=imageData.substr(imageData.lastIndexOf('/')+1)+'.png';
                            options.mimeType="text/plain";
                            var params = new Object();

                            options.params = params;

                            scope.setImagePreviw("data:image/jpeg;base64," + imageData, options.fileName)
                        },
                        failHandler, isLibrary);                
            }
        }
    })
    .directive('szFileModel', function($rootScope) {
        //show preview for uploaded photo
        //and show photo modal window
        return function(scope, element, attrs) {
            scope.$watch(attrs.szFileModel, function() {
                angular.element(element[0]).bind('change', function(){                    
                    if (angular.isUndefined(element[0].files))
                    {throw new Error("This browser does not support HTML5 File API.");}
                    if (element[0].files.length == 1){
                        scope[attrs.szFileModel] = element[0].files[0]
                        var photo = element[0].files[0];
                        if (photo.type.match('image.*')) {
                            var reader = new FileReader();
                            reader.onload = (function(theFile) {
                                return function(e) {
                                    scope.setImagePreviw(e.target.result, escape(photo.name), element[0].files[0])
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
    /*.directive('szMessagePhotoLoad', function() {
        return function(scope, element, attrs) {
            scope.$watch('photoSrc', function(val){
            	if(val){
            		element.attr('src',val)
            		element.ready(function(){
            			scope.photoBox = {
            				width : element.width(),
            				height : element.height()
            			}       
            			if(scope.images && scope.images.photo)     		
            				scope.images.photo.src = val;
            			scope.canvas.height = element.parent().height()
            			element.hide()
            		})
            	}
            })
        };
    })*/
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
    .directive('szAchivment', function($timeout) {
        //directive for achivment or informational pop windows
        //hide this windows after sets time (attrs.timeout)
        return function(scope, element, attrs) {
            function hideAchive(){
                scope.showAchive = false
            } 
            scope.$watch(attrs.ngShow, function(val){
                if(val)$timeout(hideAchive, attrs.timeout);
            });
        };
    })
    /*.directive('szNewsFeedFilter', function () {
        return {
            restrict: 'EA',
            replace: true,
            template:'<div class="filter-box text-center">'+
                        '<div id="filterBody">'+
                            '<div class="form-group">'+
                                '<div class="btn-group" data-toggle="buttons" ng-init="btncls = myClasses.btn.radio">'+
                                    '<label class="btn btn-default" ng-click="radiusActive=250" ng-class="{\'active\':250==radiusActive}">'+
                                        '<input type="radio" name="options" id="option1">250m'+
                                    '</label>'+
                                    '<label class="btn btn-default" ng-click="radiusActive=1000" ng-class="{\'active\':1000==radiusActive}">'+
                                        '<input type="radio" name="options" id="option2">1km'+
                                    '</label>'+
                                    '<label class="btn btn-default" ng-click="radiusActive=3000" ng-class="{\'active\':3000==radiusActive}">'+
                                        '<input type="radio" name="options" id="option3">3km'+
                                    '</label>'+
                                    '<label class="btn btn-default" ng-click="radiusActive=0" ng-class="{\'active\':0==radiusActive}">'+
                                        '<input type="radio" name="options" id="option3">city'+
                                    '</label>'+
                                '</div>'+
                            '</div>'+
                            '<div class="form-group">'+
                                '<select class="form-control" ng-model="category" ng-options="c.alias for c in categories">'+
                                    '<option value="" >Любая категория</option>'+
                                '</select>'+
                            '</div>'+
                            '<div class="main-btn-group text-left">'+
                                '<button type="button" class="btn btn-link" ng-click="hideFilter()">'+
                                  '<i class="fa fa-times fa-2x"></i>'+
                                '</button>'+
                                '<button type="button" class="btn btn-link pull-right" ng-click="hideFilter(true)">'+
                                  '<i class="fa fa-check fa-2x"></i>'+
                                '</button>'+
                            '</div>'+
                        '</div>'+
                        '<div class="text-center">'+
                            '<button type="button" class="btn btn-link" ng-click="showFilter()" id="filterBtn">'+
                              '<i class="fa fa-filter fa-2x"></i>'+
                            '</button>'+
                        '</div>'+
                    '</div>',
            link: function ($scope, element, attrs) {
                $scope.showFilter = function(){
                    $(window).scrollTop(0)
                    $("#filterBody").animate({maxHeight:'145px'},100)
                    $("#filterBtn").hide()
                }
                $scope.hideFilter = function(update){
                    $("#filterBody").animate({maxHeight:0},100)
                    $("#filterBtn").show()   
                    if(update)$scope.changePath()
                }
            } 
        }      
    })
    .directive('szNewsFeedMessageBox', function () {
            return {
                restrict: 'EA',
                replace: true,
                template:
                        '<div class="big-bordered-box">'+
                            '<div class="big-bordered-box-inner">'+
                                '<a href=""><h4 class="text-right box-header">{{news.place.name}}</h4></a>'+
                                '<div class="box-item-controls">'+
                                    '<li class="controls-left btn btn-link" ng-click="moveContent(1)">'+
                                        '<i class="fa fa-arrow-circle-left fa-4x"></i>'+
                                    '</li>'+
                                    '<li class="controls-right btn btn-link" ng-click="moveContent(-1)">'+
                                        '<i class="fa fa-arrow-circle-right fa-4x"></i>'+
                                    '</li>'+
                                '</div>'+
                                '<div class="box-item-show">'+
                                    '<div class="box-item-wrap">'+
                                        '<div class="box-item" ng-repeat="message in news.messages.results">'+
                                            '<div class="box-content">'+
                                                '<div class="img-main">                      '+
                                                    '<img ng-src={{message.photo.reduced}} class="img-responsive" alt="box image">'+
                                                '</div>'+
                                                '<div class="box-content-bottom">'+
                                                    '<div class="cat-parent">'+
                                                        '<div class="catDiv cat-skirts"><i class="catDivI "></i><span></span></div>'+
                                                        '<div class="catDiv cat-head"><i class="catDivI"></i><span></span></div>'+
                                                        '<div class="catDiv cat-suits"><i class="catDivI "></i><span></span></div>'+
                                                        '<div class="catDiv cat-socks"><i class="catDivI "></i><span></span></div>'+
                                                        '<div class="catDiv cat-top1"><i class="catDivI "></i><span></span></div>'+
                                                        '<div class="catDiv cat-top2"><i class="catDivI "></i><span></span></div>'+
                                                        '<div class="catDiv cat-shoes"><i class="catDivI "></i><span></span></div>'+
                                                        '<div class="catDiv cat-trousers"><i class="catDivI "></i><span></span></div>'+
                                                        '<div class="catDiv cat-outer"><i class="catDivI "></i><span></span></div>'+
                                                        '<div class="catDiv cat-accessories"><i class="catDivI "></i><span></span></div>'+
                                                        '<div class="catDiv cat-bags"><i class="catDivI "></i><span></span></div>'+
                                                    '</div>'+
                                                    '<p class="box-text">{{ message.text }}</p>'+
                                                '</div>'+
                                            '</div>'+
                                        '</div>                    '+
                                    '</div>'+
                                '</div>'+
                            '</div>'+
                        '</div>',
                scope: {
                    news:"=news"
                },
                link: function ($scope, element, attrs) {
                    $.each($scope.news.messages.results, function(i, m){
                        if(m.photo.reduced===undefined) m.photo.reduced = 'img/photo/box-photo.jpg'
                    })   
                    function makeSlider(){
                        $(".box-item-wrap").css({marginLeft:'0px'})
                        var boxContentCount = $scope.news.messages.results.length+1;
                        var boxContentWidth = $(".box-item-show").width()
                        $(".box-item").width(boxContentWidth) 
                        var boxContentWrapWidth = (boxContentWidth*boxContentCount)*1.1;
                        $(".box-item-wrap").width(boxContentWrapWidth)       
                    }
                    $scope.moveContent = function(d){
                        var animateT = 700;
                        if(!$(".box-item-wrap .last-elem").length){
                            var lastElem = $(".box-item-wrap .box-item:first-child").clone();
                            $(lastElem).addClass('last-elem')                
                            $(".box-item-wrap").append(lastElem)            
                        }
                        var boxContentWidth = $(".box-item-show").width()
                        var boxContentCount = $scope.news.messages.results.length;
                        var margin = parseInt($(".box-item-wrap").css('margin-left'))
                        $(".box-item-wrap").stop()
                        $(".box-item-wrap").css({marginLeft:Math.ceil(margin/boxContentWidth*-1)*boxContentWidth*-1+'px'})
                        var margin = parseInt($(".box-item-wrap").css('margin-left'))
                        if(margin>=0&&d>0){
                            var newmargin = boxContentWidth*(boxContentCount-1)*-1
                            $(".box-item-wrap").animate({marginLeft:newmargin+'px'},animateT)
                        }
                        else{
                            var newmargin = margin+((boxContentWidth)*d);
                            if(newmargin<=(boxContentWidth*boxContentCount*-1)) {
                                $(".box-item-wrap").animate({marginLeft:0+'px'},animateT)
                            }
                            else $(".box-item-wrap").animate({marginLeft:newmargin+'px'},animateT)
                        }
                    }                    
                    
                    $(window).resize(function(){makeSlider()})                
                    $scope.$watch($(".box-item").length, function(){
                        if($(".box-item").length==3) makeSlider()
                    })
                }
            };
        })*/
	