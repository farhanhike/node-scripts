var app = angular.module('myApp', []);
app.controller('SearchController', function($scope, $http) {
	$scope.result = {
		count: 0,
		docs: []
	}

	$scope.search = function() {
		$http({
			url : "/search",
			method: "POST",
			data: {"text": $scope.searchText},
			headers : {'Content-Type': 'application/json'},
		})
		.then(function(response) {
			$scope.result = {
				count: response.data.total,
				docs: response.data.value
			}
			console.log($scope.result)
		},
		function(response) {
			console.log(response)
		});
	}
});