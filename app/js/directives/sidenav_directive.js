'use strict';


module.exports = function(app) {
  app.directive('sidenavDirective', function() {
    return {
      restrict:    'AE',
      replace:     true,
      templateUrl: '/templates/directives/sidenav.html',
      // scope:
      controller:  ['$scope', '$mdSidenav', 'sessions', function($scope, $mdSidenav, sessions) {

        $scope.iconColor = '#ffffff';     // TODO: break out to directive later
        $scope.showLogin = false;
        $scope.isSignedIn  = sessions.isSignedIn();
        $scope.isSignedOut = !$scope.isSignedIn;


        $scope.openLeftMenu = function() {
          $mdSidenav('left').toggle();
        };
        $scope.openRightMenu = function() {
          $mdSidenav('right').toggle();
        };
        $scope.loginToggle = function() {
          $scope.showLogin = !$scope.showLogin;
        };
        $scope.searchUsers = function() {
          console.log("SEARCHING CLICKED!");
          sessions.redirect('/users');
        };


        // Set Props to Watch for Changes in Session Values
        $scope.$watch(
          function() {return sessions.isSignedIn();},
          function(newVal) {
            $scope.isSignedIn = newVal;
            $scope.isSignedOut = !newVal;
          }
        );
      }],
    };
  });
};
