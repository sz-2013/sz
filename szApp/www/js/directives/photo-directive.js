'use strict';

var Helpers = {
    failHandler: function(e){console.log(e.toString())},
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
    },
    readURL: function(photo, drawFn){
        if (photo.type.match('image.*')) {
            var reader = new FileReader();
            reader.onload = (function(theFile) {
                return function(e) {
                    drawFn(e.target.result, escape(theFile.name))
                };
            })(photo);
            reader.readAsDataURL(photo);
        }
        else{alert('Недопустимый формат')}
    },
}

angular.module("photo-directive", [])
    .directive('szFileModelSrc', function() {
        return function($scope, element, attrs) {
                $scope.message_setFileModelSrc(element[0])
            }
    })
    .directive("fileread", [function () {
        return {
            scope: {
                fileread: "="
            },
            link: function ($scope, element, attr) {
                element.bind("change", function (changeEvent) {
                    $scope.$apply(function () {
                        $scope.fileread(changeEvent.target.files[0]);
                    });
                });
            }
        }
    }])
    .directive('szPhotoCrop', function() {
        //show preview for uploaded photo
        //and show photo modal window
        return {
            scope: {
                src: '=src', //file
            },
            restrict: 'E',
            template: '<div class="imgCroper"></div>',
            replace: true,
            transclude: true,
            link: function($scope, element, attrs) {
                CropImage.prototype.updateImage = function(base64ImageData) {
                    $scope.$emit('setPhoto', base64ImageData);
                };
                var croper = new CropImage(element[0]);

                function drawFn(src, title, file){
                    croper.draw(src, title)
                }


                $scope.$emit('setCropPreview', function(){
                    $scope.$emit('setShowPhotoPreview', false);
                    croper.crop()
                });

                if(navigator.camera!==undefined){
                    $scope.$emit('setphotoSuccessHandler',
                        function(imageData){
                            var src = "data:image/png;base64," + imageData;
                            var photo = Helpers.dataURItoBlob(src);
                            drawFn(src,  String(Math.random()).slice(2, 12) + '.png')
                        }
                    );
                    $scope.$emit('setphotoFailHandler', function(err){console.log(err)});
                    //изначально будет пытаться отрабатывать стандартная загрузка фото, если у устройства есть камера - отработает загрузка через фонегап
                    $scope.$emit('setshowStandartFileModel', false);
                } else{
                    $scope.$emit('setshowStandartFileModel', true);
                    $scope.$watch('src', function(file) {
                        if(file){
                            Helpers.readURL(file, drawFn)
                            $scope.$emit('setShowPhotoPreview', true);
                        }
                    });
                }
            }
        }
    })