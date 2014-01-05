var raphaelDirective = angular.module("gamemap-directive", []);

raphaelDirective.directive('gamemap', [ '$rootScope', function ( $rootScope ) {   
    return {
        restrict: "E",
        replace: true,
        transclude: true,
        scope: {      
            width:  '=width',   
            radius: '=radius',
            height:  '=height',   
            boxes: '=boxes',
            currentbox:'=currentbox',
            oldbox : '=oldbox',
            eventBroadcast: '=eventBroadcast'   //?
        },
        template: '<table class="table table-bordered"><tbody></tbody></table>',
        link: function ($scope, element, attrs) {
            function init(){
                for (var y = $scope.height; y > 0; y--) {
                    element.children('tbody').append('<tr></tr>')
                    var tr = $(element.children('tbody').children()[$scope.height - y]);
                    for (var x = $scope.width; x > 0; x--) {
                        tr.append('<td></td>')
                        var td = $(tr.children()[$scope.width - x]);
                        var box = $scope.boxes.filter(function(box){
                            var pos = box.position;
                            return pos[0]==x && pos[1]==y
                        });
                        td.text( box.map(function(b){
                            if(b.distance<=250) td.addClass('bg-belizehole');
                            if(b.distance>250 && b.distance<=500) td.addClass('bg-emerald');
                            if(b.distance>500 && b.distance<=1000) td.addClass('bg-sunflower');
                            if(b.distance>1000 && b.distance<=3000) td.addClass('bg-wisteria');
                            if(b.distance>3000) td.addClass('bg-alizarin');
                            return b.id+' : '+b.distance
                        }).join(',') )
                        var pos = $scope.currentbox.position;
                        if( pos[0]==x && pos[1]==y ) td.removeClass().addClass('bg-silver')
                    };
                };
                /*$scope.$boxes.forEach(function(box){
                })*/
            }

            $scope.$watch('boxes', function(){
                if($scope.boxes) init()
            })
        }
    }
}]);