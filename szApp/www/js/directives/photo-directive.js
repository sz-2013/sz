'use strict';

var Helpers = {
    failHandler: function(e){console.log(e.toString())},
    photoPreview: function(scope, fileModel, target){
        //@TODO: то, что хелпрезаранее знает класс элемента - это не правильно
        var photoCont = document.querySelector('.photo-container');
        var img = target || photoCont.querySelector('img');
        var setImgMaxH = function(){
            var min = 150;
            var photoH = $(window).height() - 190;
            var h = (photoH > min) ? photoH : min;
            img.style.maxHeight = h + 'px'
        }
        return {
            setImgMaxH: function(){
                setImgMaxH();
                window.onresize = setImgMaxH;
            },
            setImagePreviw: function(src, title, file){
                target.style.backgroundImage = 'url(' + src + ')'
                /*img.setAttribute('src', src)*/
                /*if(title) img.setAttribute('title', title);*/
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

angular.module("photo-directive", [])
    .directive('szFileModel', function($rootScope) {
        //show preview for uploaded photo
        //and show photo modal window
        return function(scope, element, attrs) {
            var target =  document.querySelector(attrs.szFileModelTarget);
            var helper = Helpers.photoPreview(scope, attrs.szFileModel, target);
            helper.setImgMaxH();

            if(navigator.camera!==undefined){
                scope.$emit('setphotoSuccessHandler',
                    function(imageData){
                        var src = "data:image/png;base64," + imageData;
                        var photo = Helpers.dataURItoBlob(src);
                        helper.setImagePreviw(src,  String(Math.random()).slice(2, 12) + '.png', photo)
                    }
                );
                scope.$emit('setphotoFailHandler', Helpers.failHandler);
                //изначально будет пытаться отрабатывать стандартная загрузка фото, если у устройства есть камера - отработает загрузка через фонегап
                scope.$emit('setshowStandartFileModel', false);
            } else{
                scope.$emit('setshowStandartFileModel', true);
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
        }
    })