'use strict';

var bodyparser  = require('body-parser'      );
var contains    = require('lodash'           ).contains;
var eatOnReq    = require('../lib/routes_middleware/eat_on_req.js');
var eatAuth     = require('../lib/routes_middleware/eat_auth.js'  )(process.env.AUTH_SECRET);
var ownerAuth   = require('../lib/routes_middleware/owner_auth.js');
var adminAuth   = require('../lib/routes_middleware/admin_auth.js');
var mongoose    = require('mongoose');
var User        = require('../models/User.js');
var EMAIL_REGEX = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

module.exports = function(router) {
  router.use(bodyparser.json());

  // Get user by ID (_id)
  // TODO: BRING BACK OWNER AUTH!!!!!
  router.get('/users/:usernameOrId', eatOnReq, eatAuth, ownerAuth('usernameOrId'), function(req, res) {
    var usernameOrId = req.params.usernameOrId;
    var userQuery = mongoose.Types.ObjectId.isValid(usernameOrId) ?
      {_id:      usernameOrId} :    // Matches as an ID type
      {username: usernameOrId};      // Default as a username type
    User.find(userQuery, function(err, user) {
      if(err) {
        console.log('Database error getting user by username or id:');
        return res.status(500).json({error: true, msg: 'database error'});
      }
      if(!user || user.length === 0) {
        console.log('Tried to get user. User could not be found by: ', userQuery, '. User is: ', user);
        return res.status(204).json({error: false, msg: 'no user found', user: {} });
      }

      console.log("USER FOUND: ", user);
      res.json({
        username:  user[0].username,
        email:     user[0].email,
        userid:    user[0]._id,
        status:    user[0].status,
        role:      user[0].role,
        confirmed: user[0].confirmed
      });
    });
  });

  // Get users (requires login & Admin authorization role)
  router.get('/users', eatOnReq, eatAuth, adminAuth, function(req, res) {
    User.find({}, function(err, users) {
      if (err) {
        console.log('Error finding user. Error: ', err);
        return res.status(500).json({ error: 'user not found' });
      }
      res.json({users: users});
    });
  });

  // Create new user
  router.post('/users', function(req, res) {
    var newEmail = req.body.email;
    var newUser = new User({  // Explicitly populate to avoid exploit
      // username: req.body.username,
      email: newEmail
    });

    if(!newEmail || !EMAIL_REGEX.test(newEmail)) {
      return res.status(400).json({error: 'email'});
    }

    newUser.generateHash(req.body.password, function(err, hash) {
      if (err) { return res.status(500).json({ error: true }); }
      newUser.auth.basic.password = hash;

      newUser.save(function(err, user) {
        if (err) { console.log('Error creating user. Error: ', err); }
        switch(true) {
          case !!(err && contains(err.errmsg, 'E11000')):
            return res.status(400).json({ error: 'username'  });
          case !!(err && contains(err.errmsg, '.email')):
            return res.status(400).json({ error: 'email'     });
          case !!(err):
            return res.status(400).json({ error: true        });
        }

        user.generateToken(process.env.AUTH_SECRET, function(err, eat) {
          if(err) {
            console.log(err);
            return res.status(500).json({ error: 'login' });
          }
          console.log("EAT FOUND IS: ", eat);
          res.json({
            eat:      eat,  // encrypted version (user.eat is raw)
            username: user.username,
            role:     user.role,
            email:    user.email,
            userid:   user._id });
        });
      });
    });
  });

  // Update user
  router.patch('/users/:_id', eatOnReq, eatAuth, ownerAuth('_id'), function(req, res) {
    var updUserData = req.body;

    if(!updUserData.email || !EMAIL_REGEX.test(updUserData.email)) {
      return res.status(400).json({error: 'email'});
    }

    // We don't want it to try to update these values, so delete them off.
    delete updUserData._id;   // Unnecessary
    delete updUserData.eat;   // Cannot manually change this
    delete updUserData.role;  // Prevent Role Hacking

    if(updUserData.password) {
      console.log("ABOUT TO UPDATE USER & PASS... Current user is: ", updUserData);

      req.user.generateHash(updUserData.password, function(err, hash) {
        if(err) { return res.status(500).json({error: true}); }
        updUserData.auth.basic.password = hash;

        updateUser(updUserData);
      });
    } else {
      console.log("ABOUT TO UPDATE USER... Current user is: ", updUserData);
      updateUser(updUserData);
    }

    function updateUser(userData) {
      console.log("ID TO UPDATE IS: ", req.user._id);
      User.findByIdAndUpdate(
        req.user._id,                      // id to find
        {$set: userData},                  // values to update
        {runValidators: true, new: true},  // mongoose options
        function(err, user) {              // callback
          if (err) { console.log('Error updating user. Error: ', err); }
          switch(true) {
            case !!(err && err.code === 11000):  // unique validation
              return res.status(400).json({ error: 'username already exists' });
            case !!(err && err.username): // required error
              return res.status(400).json({ error: err.username.message.replace('Path', '') });
            case !!(err):
              return res.status(500).json({ error: true });
          }
          console.log("Updated user is: ", user);
          res.json({ success: true,
                     user: {username:  user.username,
                            email:     user.email,
                            userid:    user._id,
                            status:    user.status,
                            role:      user.role,
                            confirmed: user.confirmed}
                   });
        }
      );
    }
  });

  // Destroy User (soft destroy)
  router.delete('/users/:_id', eatOnReq, eatAuth, ownerAuth('_id'), function(req, res) {
    var delUser;

    delUser = req.user;
    delUser.deleted = Date.now();
    delUser.save(function(err) {
      if (err) {
        console.log("Error saving deletion of user. Error: ", err);
        return res.status(500).json({ error: true, msg: 'error deleting user' });
      }
      res.json({ success: true });
    });
  });
};

















