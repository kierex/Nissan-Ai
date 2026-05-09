"use strict";

var utils = require("../utils");
var log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
  return function getThreadListDeprecated(start, end, type, callback) {
    var resolveFunc = function () {};
    var rejectFunc = function () {};
    var returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (utils.getType(type) === "Function") {
      callback = type;
      type = "inbox";
    }
    if (!callback) {
      callback = function (err, data) {
        if (err) return rejectFunc(err);
        resolveFunc(data);
      };
    }

    var limit = (end || 20) - (start || 0);
    if (limit <= 0) limit = 20;

    // Delegate to the newer getThreadList
    api.getThreadList(limit, null, ["INBOX"], callback);

    return returnPromise;
  };
};
