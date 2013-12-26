'use strict';

/* Directives */

angular.module('sz.client.directives', [])
	.directive('szFileModel', function() {
        return function(scope, element, attrs) {
            var $photoNameCont = $("#photoPrevName");
            var $photoCont = document.getElementById('photoPrev');
            var $photoBigCont = $('#photoBigCont')
            scope.$watch(attrs.szFileModel, function() {
                angular.element(element[0]).bind('change', function(){                	
                    if (angular.isUndefined(element[0].files))
                    {throw new Error("This browser does not support HTML5 File API.");}
                    if (element[0].files.length == 1){                    	
                        scope[attrs.szFileModel] = element[0].files[0]
                        var photo = element[0].files[0];
                        var photoName = photo.name;
                        $photoNameCont.text(photoName)
                        if (photo.type.match('image.*')) {
                            var reader = new FileReader();
                            reader.onload = (function(theFile) {
                                return function(e) {
                                    $photoCont.innerHTML = ['<img  src="', e.target.result,
                                                        '" title="', escape(photoName), '" style="width:100%"/>'].join('');
                                };                                
                            })(photo);      
                            reader.readAsDataURL(photo);
                            $photoBigCont.show()

                        }
                        else{photoNameCont.innerHTML = ['Недопустимый формат'].join('');}
                    }
                });            
            });

            scope.$watch('photo.name',function(){
                if(scope.photo.name){
                    $photoNameCont.text('')
                    $photoCont.innerHTML = [].join('');
                    scope.photo = {'name':''}
                    $photoBigCont.hide()
                }
            })
        }
    })
	.directive('szAutoResizeTextArea', function() {
        return function(scope, element, attrs) {
            $(element[0]).autoResize()
        };
    })	    
    .directive('szMessagePhotoLoad', function() {
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
    })
    .directive('szNewsFeedFilter', function () {
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
        })
	