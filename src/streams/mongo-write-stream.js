"use strict";

var util = require('util');
var Writable = require('stream').Writable;
var mongoose = require('mongoose');
var moment = require('moment');
var _ = require('underscore');

/*
 * Member fields
 mID: -105985642,
 mBBOLoginName: '0     weia',
 mValid: 1,
 mValidateDate: Wed Nov 09 2011 16:47:25 GMT+0100 (CET),
 mDisable: 1,
 mRegisterDate: Tue Nov 08 2011 11:35:23 GMT+0100 (CET),
 mCheckRegistration: 1,
 mCheckRegistrationDate: Wed Nov 09 2011 09:59:59 GMT+0100 (CET),
 mBlackList: 0,
 mName: 'Peter',
 mSurname: 'Lilie',
 mCountry: 'Switzerland',
 mEMail: 'swamileela@hotmail.com',
 mSkillLevel: 4,
 mQuestion1: false,
 mQuestion2: false,
 mQuestion3: false,
 mQuestion4: true,
 mTournaments1: true,
 mTournaments2: true,
 mTournaments3: true,
 mTournaments4: false,
 mTournaments5: false,
 mTournaments6: false,
 mTournaments7: false,
 m3AM: 0,
 m7AM: 0,
 m11AM: 1,
 m3PM: 0,
 m7PM: 1,
 m11PM: 0,
 mAverageScore: 0,
 mNumberOfTournaments: 0,
 mRank: 0,
 mNumberOfRankedTournaments: 0,
 mRankAverage: 0,
 mTopPlayers: 0,
 mStarPlayers: 0,
 mTPAverageScore: 0,
 mTPNumberOfTournaments: 0,
 mTPRank: 0,
 mTPNumberOfRankedTournaments: 0,
 mTPRankAverage: 0
 */
function MongoWriteStream(model, options) {
  Writable.call(this, options);
  this._writableState.objectMode = true;

  this._Members = mongoose.model('Member');
  this._Blacklist = mongoose.model('Blacklist');
}

util.inherits(MongoWriteStream, Writable);

MongoWriteStream.prototype._write = function (chunk, encoding, done) {

  done();
};

module.exports = MongoWriteStream;
