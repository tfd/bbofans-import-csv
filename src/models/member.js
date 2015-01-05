/* jshint -W097 */
"use strict";

/*
 * Module dependencies.
 */

var mongoose = require('mongoose');
var validate = require('mongoose-validator');
var crypto = require('crypto');
var Schema = mongoose.Schema;
var mongooseTypes = require("nifty-mongoose-types");
mongooseTypes.loadTypes(mongoose);
var Email = mongoose.SchemaTypes.Email;

/*
 * Member Schema
 */

var emailValidator = [validate({
  validator: 'isEmail',
  message  : 'Email isn\'t a valid address'
}),
                      validate({
                        validator: 'isLength',
                        arguments: 1,
                        message  : 'Email cannot be blank'
                      })
];

var MemberSchema = new Schema({
  bboName        : {type: String, required: 'BBO name cannot be blank', unique: true, trim: true},
  name           : {type: String, required: 'Name cannot be blank', trim: true},
  nation         : {type: String, required: 'Nation cannot be blank', trim: true},
  emails         : [{type     : Email,
                      required: 'Email cannot be blank',
                      unique  : true,
                      trim    : true,
                      validate: emailValidator
                    }],
  telephones     : [{type: String, trim: true}],
  level          : {type: String, default: 'Beginner', trim: true},
  hashed_password: {type: String, required: 'Password cannot be blank', trim: true},
  salt           : {type: String},
  role           : {type: String, default: 'member', required: 'Role cannot be blank', trim: true},
  isStarPlayer   : {type: Boolean, default: false},
  isRbdPlayer    : {type: Boolean, default: false},
  isEnabled      : {type: Boolean, default: false},
  isBlackListed  : {type: Boolean, default: false},
  isBanned       : {type: Boolean, default: false},
  notes          : {type: String, default: '', trim: true},
  skill          : {type: String, default: 'Tournament TD', trim: true},
  h3am           : {type: Boolean, default: false},
  h7am           : {type: Boolean, default: false},
  h11am          : {type: Boolean, default: false},
  h3pm           : {type: Boolean, default: false},
  h7pm           : {type: Boolean, default: false},
  h11pm          : {type: Boolean, default: false},
  info           : {type: String, default: '', trim: true},
  rock           : {
    lastPlayedAt       : {type: Date},
    playedInTournaments: [{type: Schema.Types.ObjectId, ref: 'Tournament'}],
    totalScores        : {
      numTournaments: {type: Number, default: 0},
      averageScore  : {type: Number, default: 0},
      awards        : {type: Number, default: 0}
    },
    monthlyScores      : [{
                            _id           : false,
                            month         : {type: Number},
                            year          : {type: Number},
                            numTournaments: {type: Number, default: 0},
                            averageScore  : {type: Number, default: 0},
                            awards        : {type: Number, default: 0}
                          }]
  },
  rbd            : {
    lastPlayedAt       : {type: Date},
    playedInTournaments: [{type: Schema.Types.ObjectId, ref: 'Tournament'}],
    totalScores        : {
      numTournaments: {type: Number, default: 0},
      averageScore  : {type: Number, default: 0},
      awards        : {type: Number, default: 0}
    },
    monthlyScores      : [{
                            _id           : false,
                            month         : {type: Number},
                            year          : {type: Number},
                            numTournaments: {type: Number, default: 0},
                            averageScore  : {type: Number, default: 0},
                            awards        : {type: Number, default: 0}
                          }]
  },
  registeredAt   : {type: Date},
  validatedAt    : {type: Date},
  createdAt      : {type: Date, default: Date.now}
});

/*
 * Helper functions.
 */

function updateScores(scores, result) {
  var numTournaments = scores.numTournaments || 0;
  var sumOfScores = (scores.averageScore || 0) * numTournaments + (result.score || 0);
  numTournaments += 1;

  scores.numTournaments = numTournaments;
  scores.averageScore = sumOfScores / numTournaments;
  scores.awards += result.awards || 0;
}

function handleError(msg, cb) {
  if (typeof cb === 'function') {
    cb(new Error(msg), null);
  }
}

/**
 * Make salt
 *
 * @return {String}
 * @api public
 */
function makeSalt() {
  return Math.round((new Date().valueOf() * Math.random())).toString();
}

/**
 * Encrypt password
 *
 * @param {String} password
 * @return {String}
 * @api public
 */
function encryptPassword(password, salt) {
  if (!password) {
    return '';
  }

  try {
    return crypto.createHmac('sha1', salt)
        .update(password)
        .digest('hex');
  }
  catch (err) {
    return '';
  }
}

/*
 * Virtual properties
 */

MemberSchema.virtual('password')
    .set(function (password) {
      this._password = password;
      this.salt = makeSalt();
      this.hashed_password = encryptPassword(password, this.salt);
    })
    .get(function () { return this._password; });

/*
 * Methods
 */

MemberSchema.methods = {

  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText password to check
   * @return {Boolean}
   * @api public
   */
  authenticate: function (plainText) {
    return encryptPassword(plainText, this.salt) === this.hashed_password;
  },

  /**
   * Get authorization role for this user.
   *
   * Will create a JSON with username and authorization fields and return it to the callback.
   *
   * @param cb {Function} Callback that gets called as cb(err, user)
   */
  getRole: function (cb) {
    var member = this;
    var Role = mongoose.model('Role');
    Role.findOne({name: member.role}, function (err, role) {
      if (err) { return cb(err, null); }
      if (role === null) { return cb({error: 'Invalid role'}); }
      var user = {
        _id               : member._id,
        username          : member.bboName,
        isMemberManager   : role.isMemberManager,
        isBlacklistManager: role.isBlacklistManager,
        isTdManager       : role.isTdManager,
        isTd              : role.isTd
      };
      cb(null, user);
    });
  },

  /**
   * Did player play in specified tournament?
   *
   * @param {Object} tournament
   * @return true if the player played in the tournament, false otherwise.
   */
  playedInTournament: function (league, tournament) {
    var arr = league.populated('playedInTournaments') || league.playedInTournaments;
    return arr.indexOf(tournament.id) >= 0;
  },


  /**
   * Add tournament result. This will update the total and monthly scores.
   * The resulting scores are NOT saved to the database!
   *
   * @param {Object} tournament
   */
  addTournament: function (tournament) {
    var score = null;
    var newMonth = true;
    var newMonthlyScore = {
      month         : tournament.date.getMonth(),
      year          : tournament.date.getFullYear(),
      numTournaments: 0,
      awards        : 0
    };
    var league = tournament.isRbd ? this.rbd : this.rock;
    if (tournament.isRbd) {
      newMonthlyScore.averageScore = 0;
    }
    else {
      newMonthlyScore.averageMatchPoints = 0;
    }

    if (tournament.isRbd && !this.isRbdPlayer) {
      throw new Error('Member ' + this.bboName + ' is not enabled to play in RBD Tournaments');
    }

    // Check if scores of this tournament have already been added.
    if (this.playedInTournament(league, tournament)) {
      throw new Error('Tournament ' + tournament.name + ' scores are already added for player ' + this.bboName);
    }

    // Check if the player actually played in the tournament.
    score = tournament.findPlayerScores(this.bboName);
    if (score === null) {
      throw new Error('Member ' + this.bboName + ' did\'t play in tournament ' + tournament.name);
    }

    // Update total scores
    updateScores(league.totalScores, score);

    // Update monthly scores
    league.monthlyScores.every(function (monthlyScore) {
      if (monthlyScore.year === tournament.date.getFullYear() &&
          monthlyScore.month === tournament.date.getMonth()) {
        updateScores(monthlyScore, score);
        newMonth = false;
        return false;
      }
      return true;
    });

    if (newMonth) {
      // First tournament in this month
      updateScores(newMonthlyScore, score);
      league.monthlyScores.push(newMonthlyScore);
    }

    league.playedInTournaments.push(tournament);
  }
};

module.exports = mongoose.model('Member', MemberSchema);
