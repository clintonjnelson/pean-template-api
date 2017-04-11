'use strict';

var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto')

module.exports = {
  generateGenericToken:         generateGenericToken,
  hashTokenForSaving:           hashTokenForSaving,
  generateUrlSafeTokenAndHash:  generateUrlSafeTokenAndHash,
  checkUrlSafeTokenAgainstHash: checkUrlSafeTokenAgainstHash,
  generateInvalidTimestamp:     generateInvalidTimestamp,
  expirationDateHoursFromNow:   expirationDateHoursFromNow,
  isTimestampStillValid:        isTimestampStillValid,
}


// returns random 24-char hex token
function generateGenericToken() {
  return crypto.randomBytes(24).toString('hex').toString();
}

// Takes token & cb, returns token & hash to cb
// TODO: RENAME THIS AND THE TOKEN NAME
function hashTokenForSaving(urlSafeToken, callback) {
  bcrypt.genSalt(8, function(err, salt) {
    bcrypt.hash(urlSafeToken, salt, null, function saveHashedPassword(err, hash) {
      if (err) {
        console.log('Error generating . Error: ', err);
        return callback(err, null, null);
      }
      console.log("TOKEN GENERATED, GOING TO CALLBACK IN ROUTE...")
      callback(null, urlSafeToken, hash);
    });
  });
}

// Takes cb, returns (error, token, hash) to cb
function generateUrlSafeTokenAndHash(callback) {
  var token        = generateGenericToken();
  console.log("BASE TOKEN BEFORE URI_ENCODING IS: ", token);

  var urlSafeToken = encodeURIComponent(token);
  console.log("URI_ENCODED TOKEN AFTER ENCODING IS: ", urlSafeToken);

  hashTokenForSaving(urlSafeToken, callback);
}

// Return true/false to cb for success/failure of check
function checkUrlSafeTokenAgainstHash(token, hash, callback) {
  // console.log("URI_ENCODED TOKEN BEFORE DECODING IS: ", token);
  // var decodedToken = decodeURIComponent(token);
  console.log("TOKEN IS: ", token);

  bcrypt.compare(token, hash, function validatePassword(err, result) {
    if (err) {
      console.log('Error checking password. Error: ', err);
      return callback(err, null);
    }
    callback(null, result);  // if failure, result=false. if success, result=true
  });
}

// Generates timestamp -X- hours from now
function expirationDateHoursFromNow(hours) {
  var expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + hours);

  return expirationDate;
}

// Takes a Date and returns true if has not expired (ie: in past)
function isTimestampStillValid(timestamp) {
  var now           = new Date();
  var timestampDate = new Date(timestamp);

  console.log("TIMESTAMP IS: ", timestampDate, ". CURRENT DATE IS: ", now);
  console.log("VERIFY NOT EXPIRED IS: ", timestampDate > now);
  return timestampDate > now;
}

// Generates a timestamp in the PAST (invalid)
function generateInvalidTimestamp() {
  var expiredTimestamp = new Date();
  expiredTimestamp.setHours(expiredTimestamp.getHours() - 6);

  return expiredTimestamp;
}