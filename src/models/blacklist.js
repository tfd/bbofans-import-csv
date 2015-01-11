"use strict";

/*
 * Module dependencies.
 */

var mongoose = require('mongoose');
var validate = require('mongoose-validator');
var Schema = mongoose.Schema;
var mongooseTypes = require("nifty-mongoose-types");
mongooseTypes.loadTypes(mongoose);
var moment = require('moment');
require('moment-range');

/*
 * Member Schema
 */

var EntrySchema = new Schema({
  td    : {type: String, default: '', required: 'td cannot be blank', trim: true},
  from  : {type: Date},
  to    : {type: Date},
  reason: {type: String, default: '', required: 'reason cannot be blank', trim: true}
}, {
  id: false
});

var BlacklistSchema = new Schema({
  bboName  : {type: String, required: 'BBO name cannot be blank', unique: true, trim: true},
  entries  : [EntrySchema],
  createdAt: {type: Date, default: Date.now}
});

/*
 * Helper functions.
 */

function handleError(msg, cb) {
  if (typeof cb === 'function') {
    cb(new Error(msg), null);
  }
}

/*
 * Methods
 */

BlacklistSchema.methods = {
  isMember: function (cb) {
    var Member = mongoose.model('Member');
    Member.findOne({bboName: this.bboName}, function (err, member) {
      if (cb) {
        cb(err || (member === null) ? false : true);
      }
    });
  }
};

BlacklistSchema.statics = {
  addEntry: function (bboName, date, period, reason, cb) {
    var Blacklist = this;
    Blacklist.findOne({bboName: bboName}, function (err, blacklist) {
      if (err) {
        cb(err, blacklist);
        return;
      }

      if (blacklist === null) {
        blacklist = new Blacklist({bboName: bboName});
      }

      var fromDate = moment.utc(date);
      if (!fromDate.isValid) {
        cd({'from': 'Value "' + date + '" is an invalid date'}, blacklist);
        return;
      }
      var num = parseInt(period, 10);
      var type = period.slice(-1);
      var toDate = type === 'F' ? moment.utc('2050-12-31') : fromDate.clone().add(num, type);
      if (!toDate.isValid()) {
        cb({'for': 'Value "' + period + '" is an invalid duration'}, blacklist);
        return;
      }

      if (!blacklist.entries) {
        blacklist.entries = [];
      }
      blacklist.entries.push({
        'from': fromDate.toDate(),
        'to'  : toDate.toDate(),
        reason: reason
      });

      blacklist.save(function (err, blacklist) {
        if (err) {
          console.log("add", err);
          var error = err.err.toString();
          if (error.indexOf('E11000 duplicate key error') === 0) {
            var fieldName = error.match(/blacklists\.\$(.*)_\d/i)[1];
            var fieldValue = error.match(/dup\skey:\s\{\s:\s\"(.*)\"\s\}/)[1];
            var errors = {};
            errors[fieldName] = 'Value "' + fieldValue + '" already present in database';
            cb(errors, blacklist);
          }
          else {
            cb({bboName: error}, blacklist);
          }
        }
        else {
          // Update isBanned and isBlacklisted flags.
          var isBanned = (type === 'F');
          var isBlackListed = isBanned || moment().range(fromDate, toDate).contains(moment.utc());
          var Member = mongoose.model('Member');
          Member.update({bboName: bboName},
              {$set: {isBanned: isBanned, isBlackListed: isBlackListed}},
              cb);
        }
      });
    });
  },

  importEntry: function (bboName, from, to, reason, cb) {
    var Blacklist = this;
    Blacklist.findOne({bboName: bboName}, function (err, blacklist) {
      if (err) {
        cb(err, blacklist);
        return;
      }

      if (blacklist === null) {
        blacklist = new Blacklist({bboName: bboName});
      }

      var fromDate = moment.utc(from);
      if (!fromDate.isValid) {
        cb({'from': 'Value "' + from + '" is an invalid date'}, blacklist);
        return;
      }

      var toDate = moment.utc(to);
      if (!toDate.isValid) {
        cb({'to': 'Value "' + to + '" is an invalid date'}, blacklist);
        return;
      }

      if (!blacklist.entries) {
        blacklist.entries = [];
      }
      blacklist.entries.push({
        'td'  : 'pensando',
        'from': fromDate.toDate(),
        'to'  : toDate.toDate(),
        reason: reason
      });

      blacklist.save(function (err, blacklist) {
        if (err) {
          console.log("add", err);
          var error = err.err.toString();
          if (error.indexOf('E11000 duplicate key error') === 0) {
            var fieldName = error.match(/blacklists\.\$(.*)_\d/i)[1];
            var fieldValue = error.match(/dup\skey:\s\{\s:\s\"(.*)\"\s\}/)[1];
            var errors = {};
            errors[fieldName] = 'Value "' + fieldValue + '" already present in database';
            cb(errors, blacklist);
          }
          else {
            cb({bboName: error}, blacklist);
          }
        }
        else {
          // Update isBanned and isBlacklisted flags.
          var isBlackListed = moment().range(fromDate, toDate).contains(moment.utc());
          var Member = mongoose.model('Member');
          Member.update({bboName: bboName},
              {$set: {isBlackListed: isBlackListed}},
              cb);
        }
      });
    });
  }
};

module.exports = mongoose.model('Blacklist', BlacklistSchema);
