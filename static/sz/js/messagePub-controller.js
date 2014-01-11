
/*function MessagePublisherController($scope, messagePreviewService,staticValueService, $routeParams, $location){
    $.each($scope.mainNav, function(n, val){
        $scope.mainNav[n] = ''
    })
    $scope.mainNav.post = 'active';
    $scope.tmlText = {
        header:{
            main:'New post'
        },
        hint:{
            emotion: 'Choose your emotion from this place and close all faces on the photo',
        },
        btn:{
            submit:'Send'
        },
    }
    

    $scope.faceId = $scope.faces[0].id
    
    $scope.emt='indifferent' 
    $scope.$on('updateFace', function(event, face){
        $scope.face = face
    })
    $scope.action = 1;
    $scope.canvas = {}
    $scope.images = {photo:{events:{mousedown:'drawnewface'} } }
    
    if (angular.isDefined($routeParams.previewId))
    var preview = messagePreviewService.get({previewId: $routeParams.previewId}, function(){
        $scope.preview = preview;
        $scope.preview.photo.faces = {}
        $scope.placeHeader = preview.place;
        $scope.add_categories = []
        if (preview.photo.reduced){
            $scope.photo = preview.photo.reduced
            $scope.canvas.width = $scope.photo.width
            $scope.canvas.height = $scope.photo.height
            $scope.images.photo.src = $scope.photo.url            
        }
        else{
            $scope.photo = ''
            $scope.canvas.height = 1
            $scope.canvas.width = 1
        }
        $.each($scope.categories, function(index,cat){$scope.add_categories.push(cat)});
        $.each($scope.preview.categories, function(index,catID){
            $.each($scope.categories,function(index,cat){
                if(catID == cat.id){
                    $scope.new_message_categories.push(cat)
                }
            });
        });            
        for (i in $scope.add_categories){
            var cat = $scope.add_categories[i];
            for (j in $scope.preview.categories){
                var catID = $scope.preview.categories[j]
                if(catID==cat.id){$scope.add_categories.splice(i,1)}
            }
        }                
        
    });    
    
    $scope.addCat = function(){
        if($scope.add_message_category){
            $scope.new_message_categories.push($scope.add_message_category);
            for (i in $scope.add_categories){
                var cat = $scope.add_categories[i];
                if(cat.id==$scope.add_message_category.id){
                    $scope.add_categories.splice(i,1)
                }
            }
            $scope.add_message_category = ''
        }
    }
    
    $scope.$on('raphaelDirectiveFaces.pushBBox', function(e, data){
        $scope.preview.photo.list = data
    }) 
    $scope.$on('raphaelDirectiveCanvas.pushBBox', function(e, data){
        $scope.preview.photo.box = data
    }) 
    $scope.removeCat = function(messageCat,index){
        $scope.new_message_categories.splice(index, 1);
        $scope.add_categories.push(messageCat)
    }
    
    function send(){
        $scope.preview.latitude = $scope.coordinates.latitude
        $scope.preview.longitude = $scope.coordinates.longitude
        $scope.$broadcast('raphaelDirectiveFaces.getBBox')
        $scope.$broadcast('raphaelDirectiveCanvas.getBBox')
        $scope.face = $scope.face.id
        $scope.preview.$publish(
            {},
            function(response){
                $scope.response = response
                var path = '/'
                $location.path(path);
            },
            function(error){
                $scope.inProgress = false;
                throw "can't publish";
            }
        )
    }
}
*/
