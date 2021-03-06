'use strict';

var Helpers = {
    failHandler: function(e){console.log(e.toString())},
    dataURItoBlob: function(dataURI) {
        // convert base64/URLEncoded data component to raw binary data held in a string
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0)
            byteString = atob(dataURI.split(',')[1]);
        else
            byteString = unescape(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ia], {type:mimeString});
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
                ismobile: '=ismobile',
            },
            restrict: 'E',
            template: '<div class="imgCroper"></div>',
            replace: true,
            transclude: true,
            link: function($scope, element, attrs) {
                CropImage.prototype.updateImage = function(base64ImageData) {
                    $scope.$emit('setPhoto', base64ImageData);
                };

                function init(){
                    var croper = new CropImage(element[0], $scope.ismobile);

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

                $scope.$watch('ismobile', function(val){
                    if(val!==undefined) init()
                })
            }
        }
    })
    .directive('szPhotoUnface', function() {
        //unface uploaded photo
        return {
            scope: {
                src: '=', //file
                ismobile: '=',
                activeface: '=',
                isReducePhoto: '=reduce',
            },
            restrict: 'E',
            template: '<div class="imgUnface"></div>',
            replace: true,
            transclude: true,
            link: function($scope, element, attrs) {
                UnfaceImage.prototype.updateImage = function(base64ImageData, usedFaces) {
                    $scope.$emit('messageSend', Helpers.dataURItoBlob(base64ImageData), usedFaces);
                };

                var el = element[0];
                el.style.height = el.offsetWidth + 'px';
                function init(){
                    $scope.unface = new UnfaceImage(el, $scope.ismobile)
                    $scope.$watch('src', function(photo, oldphoto){
                        //if(oldphoto) unface.clear()
                        if(photo) $scope.unface.setBg(photo)
                    });

                    $scope.$watch('activeface', function(face){
                        if(face) $scope.unface.setActiveFace(face)
                    });

                    $scope.$watch('isReducePhoto', function(val){
                        $scope.unface.setIsEnlarge(!val)
                    });
                }

                $scope.$watch('ismobile', function(val){
                    if(val!==undefined) init()
                });

                $scope.$on('photoZip', function(e){
                    if($scope.unface) $scope.unface.zip()
                });
            }
        }
    })