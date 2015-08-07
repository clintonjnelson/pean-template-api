'use strict';
// Routes for OAUTH2 Login
// TODO: Break out each Oauth into separate modules to require in

var bodyparser     = require('body-parser'      );
// var loadSendCookie = require('../lib/routes_middleware/load_send_cookie.js');
// var User           = require('../models/User.js');


module.exports = function(app, passport) {
  app.use(bodyparser.json());

  // Require routes by provider
  require('../oauth_routes/facebook.js')(app, passport);

};






