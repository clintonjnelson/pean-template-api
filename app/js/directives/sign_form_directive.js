'use strict';

module.exports = function(app) {
  app.directive('signFormDirective', function() {

    return {
      restrict:     'AE',
      replace:      true,
      templateUrl:  'templates/directives/sign_form.html',
      scope: {
        sign:           '=',  // allow access to parent sign
        defaults:       '=',  // pass parent defaults
        options:        '=',  // pass parent options
        types:          '=',  // pass parent types
        formType:       '@',  // pass form type (heading)
        submitAction:   '&',  // use action name passed
        buttonName:     '@',  // use name passed
        activeColor:    '&',  // pass action name
        toggleEditing:  '&',
      },
    };
  });
};
