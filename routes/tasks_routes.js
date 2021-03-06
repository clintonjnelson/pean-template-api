'use strict';

var adminAuth  = require('../lib/routes_middleware/admin_auth.js');
var bodyparser = require('body-parser');
var eatAuth    = require('../lib/routes_middleware/eat_auth.js'  )(process.env.AUTH_SECRET);
var eatOnReq   = require('../lib/routes_middleware/eat_on_req.js');
var updateSitemap = require('../lib/tasks/updateSitemap.js');

module.exports = function(router) {
  router.use(bodyparser.json());

  // This creates the sitemap and this must be done each time the site is launched
  // because the file is deleted each time (container teardown/rebuild). Google
  // NEEDS to be able to find this sitemap to update its records.
  router.put('/tasks/sitemap', eatOnReq, eatAuth, adminAuth, function(req, res) {

    if(req.body.trigger === true) {
      // Update Sitemap
      updateSitemap(req, function(error) {
        if(error) { return res.status(500).json({success: false, error: true}); }

        return res.status(200).json({success: true, error: false});
      });
    }
    else {
      return res.status(500).json({success: false, error: true});
    }
  });
}

