"use strict";

var util = require('util');
var Writable = require('stream').Writable;
var mongoose = require('mongoose');
var moment = require('moment');
var _ = require('underscore');

function sanitizeEmail(email) {
  if (! email) {
    // No email, generate one.
    return 'auto.generated.' + _.uniqueId() + '@dummy.com';
  }

  if (email.toLowerCase() === 'dummy@dummy.com') {
    // Dummy email, generate new unique one.
    return 'auto.generated.' + _.uniqueId() + '@dummy.com';
  }

  // Remove all chars that aren't allowed
  var p = email.trim().split('@');

  // Fix local part
  var localPart = p[0].replace(/[^a-zA-Z0-9\-_~!$&'*+=\."\(\),:;<>@\[\\\]]/g, '');
  if (/["\(\),:;<>@\[\\\]]/g.test(localPart) && localPart.charAt(0) !== '"') {
    // String contains special chars, it MUST be quoted with ".
    localPart = '"' + localPart.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }

  var domain;
  if (p.length > 1) {
    // Fix domain
    // Allow only ASCII and account for typos _ instead of - and , instead of .
    domain = p[1].replace(/_/g, '-').replace(',', '.').replace(/[^a-zA-Z0-9\-\.]/g, '');
    if (domain.indexOf('.') < 0) {
      // Missing top level domain, assume .com
      domain += '.com';
    }
    if (domain.charAt(domain.length - 1) === '.') {
      // No top level domain after dot, assume .com
      domain += 'com';
    }
  }
  else {
    // No domain, add a dummy one
    domain = 'dummy.com';
  }

  return localPart + '@' + domain;
}

function sanitizeBoolean(bool) {
  return bool ? true : false;
}

function sanitizeText(text) {
  return (text ? text.replace(/\\n/g, '\n').replace(/~~~/g, '\n') : '');
}

function skillToString(skill) {
  switch (skill) {
    case 1:
      return "Beginner";

    case 2:
      return "Intermediate";
    
    case 3:
      return "Advanced";

    case 4:
      return "Expert";

    case 5:
      return "Champion";

    case 6:
      return "World Class";

    default:
      return "Beginner";
  }
}

function tdToString(td) {
  switch (td) {
    case 1:
      return "Head TD";

    case 2:
      return "Tournament TD";

    case 3:
      return "Co TD";

    case 4:
      return "BBO TD";

    default:
      return "";
  }
}

function getName(name, surname) {
  if (! name) {
    if (! surname) {
      return '';
    }
    return surname.trim();
  }
  if (! surname) {
    return name.trim();
  }

  if (name.trim() === surname.trim()) {
     return name.trim();
  }

  return name.trim() + ' ' + surname.trim();
}

function MongoWriteStream(model, options) {
  Writable.call(this, options);
  this._writableState.objectMode = true;

  this._Members = mongoose.model('Member');
  this._Blacklist = mongoose.model('Blacklist');
  this._writer = this['_writerFor' + model];
}

util.inherits(MongoWriteStream, Writable);
MongoWriteStream.prototype._write = function (csv, encoding, done) {
  this._writer(csv, done);
};


/**
 * Write csv member object to mongodb.
 *
 * @param {Object} csv - member
 * @param {Number} csv.mID - -105985642,
 * @param {String} csv.mBBOLoginName - '0     weia',
 * @param {Boolean} csv.mValid - 1,
 * @param {Date} csv.mValidateDate - Wed Nov 09 2011 16:47:25 GMT+0100 (CET),
 * @param {Boolean} csv.mDisable - 1,
 * @param {Date} csv.mRegisterDate - Tue Nov 08 2011 11:35:23 GMT+0100 (CET),
 * @param {Boolean} csv.mCheckRegistration - 1,
 * @param {Date} csv.mCheckRegistrationDate - Wed Nov 09 2011 09:59:59 GMT+0100 (CET),
 * @param {Boolean} csv.mBlackList - 0,
 * @param {Date} csv.mBLExpiredDate - Wed Nov 09 2011 09:59:59 GMT+0100 (CET),
 * @param {Date} csv.mBLDate - Wed Nov 09 2011 09:59:59 GMT+0100 (CET),
 * @param {String} csv.mName - 'Peter',
 * @param {String} csv.mSurname - 'Lilie',
 * @param {String} csv.mCountry - 'Switzerland',
 * @param {String} csv.mEMail - 'swamileela@hotmail.com',
 * @param {Number} csv.mSkillLevel - 4,
 * @param {String} csv.mTelephone,
 * @param {Boolean} csv.mQuestion1 - false,
 * @param {Boolean} csv.mQuestion2 - false,
 * @param {Boolean} csv.mQuestion3 - false,
 * @param {Boolean} csv.mQuestion4 - true,
 * @param {Boolean} csv.mTournaments1 - true,
 * @param {Boolean} csv.mTournaments2 - true,
 * @param {Boolean} csv.mTournaments3 - true,
 * @param {Boolean} csv.mTournaments4 - false,
 * @param {Boolean} csv.mTournaments5 - false,
 * @param {Boolean} csv.mTournaments6 - false,
 * @param {Boolean} csv.mTournaments7 - false,
 * @param {String} csv.mSuggestions - 'nothing to declare',
 * @param {Boolean} csv.m3AM - 0,
 * @param {Boolean} csv.m7AM - 0,
 * @param {Boolean} csv.m11AM - 1,
 * @param {Boolean} csv.m3PM - 0,
 * @param {Boolean} csv.m7PM - 1,
 * @param {Boolean} csv.m11PM - 0,
 * @param {String} csv.mNote - 'blacklisted for some reason',
 * @param {Number} csv.mAverageScore - 0,
 * @param {Number} csv.mNumberOfTournaments - 0,
 * @param {Number} csv.mRank - 0,
 * @param {Number} csv.mNumberOfRankedTournaments - 0,
 * @param {Number} csv.mRankAverage - 0,
 * @param {Date} csv.mLastGameDate - Wed Nov 09 2011 09:59:59 GMT+0100 (CET),
 * @param {Boolean} csv.mTopPlayers - 0,
 * @param {Boolean} csv.mStarPlayers - 0,
 * @param {String} csv.mTPIssuedBy - 'Thinking',
 * @param {Number} csv.mTPAverageScore - 0,
 * @param {Number} csv.mTPNumberOfTournaments - 0,
 * @param {Number} csv.mTPRank - 0,
 * @param {Number} csv.mTPNumberOfRankedTournaments - 0,
 * @param {Number} csv.mTPRankAverage - 0,
 * @param {Date} csv.mTPLastGameDate - Wed Nov 09 2011 09:59:59 GMT+0100 (CET)
 * @param {function} done - called when the member has been written to mongodb
 * @private
 */
MongoWriteStream.prototype._writerForMember = function (csv, done) {
  var self = this;
  var member = {};
  var email = sanitizeEmail(csv.mEMail);
  if (email !== csv.mEMail.trim()) {
    console.error('Modified email for ' + csv.mBBOLoginName + ' from ' + csv.mEMail + ' in ' + email);
  }

  member.bboName = csv.mBBOLoginName;
  member.password = (member.bboName === 'pensando' ? 'moneymoney' : member.bboName);
  member.name = getName(csv.mName, csv.mSurname);
  member.nation = csv.mCountry.trim();
  member.emails = [email];
  if (csv.mTelephone) {
    member.telephones = [csv.mTelephone.trim()];
  }
  member.level = skillToString(csv.mSkillLevel);
  member.registeredAt = csv.mRegisterDate;
  if (csv.mValid) {
    member.validatedAt = csv.mValidateDate;
  }
  member.isEnabled = (csv.mDisable === 0);
  member.role = (member.bboName === 'pensando' ? 'admin' : 'member');
  member.isStarPlayer = sanitizeBoolean(csv.mStarPlayer);
  member.isRbdPlayer = sanitizeBoolean(csv.mTopPlayers);
  member.isBlackListed = sanitizeBoolean(csv.mBlackList);
  member.notes = sanitizeText(csv.mNote);
  member.rock = {};
  member.rock.lastPlayedAt = csv.mLastGameDate;
  member.rock.totalScores = {};
  member.rock.totalScores.averageScore = csv.mAverageScore;
  member.rock.totalScores.numTournaments = csv.mNumberOfRankedTournaments;
  member.rock.totalScores.awards = csv.mRank;
  member.rbd = {};
  member.rbd.lastPlayedAt = csv.mTPLastGameDate;
  member.rbd.totalScores = {};
  member.rbd.totalScores.averageScore = csv.mTPRankAverage;
  member.rbd.totalScores.numTournaments = csv.mTPNumberOfRankedTournaments;
  member.rbd.totalScores.awards = csv.mTPRank;

  var newMember = new this._Members(member);
  newMember.save(function (err) {
    if (err) {
      console.error('_writeMember: Error saving ' + newMember.bboName, err);
      done();
      return;
    }

    if (csv.mBlackList) {
      self._Blacklist.importEntry(csv.mBBOLoginName, csv.mBLDate, csv.mBLExpiredDate, (csv.mNote ? csv.mNote.replace(/\\n/g, '\n') : 'Blacklisted'), function (err) {
        if (err) {
          console.error('_writeMember: Error saving blacklist for ' + newMember.bboName, err);
        }
        done();
      });
    }
    else {
      done();
    }
  });
};

/**
 * Write csv member object to mongodb.
 *
 * @param {Object} csv - td member
 * @param {Number} csv.tID
 * @param {String} csv.tBBOName
 * @param {String} csv.tName
 * @param {String} csv.tSurname
 * @param {String} csv.tTDSkill
 * @param {String} csv.tTelephone
 * @param {String} csv.tEmail
 * @param {Boolean} csv.t3AM
 * @param {Boolean} csv.t7AM
 * @param {Boolean} csv.t11AM
 * @param {Boolean} csv.t3PM
 * @param {Boolean} csv.t7PM
 * @param {Boolean} csv.t11PM
 * @param {String} csv.tInfo
 * @param {function} done - called when the member has been written to mongodb
 * @private
 */
MongoWriteStream.prototype._writerForTd = function (csv, done) {
  var self = this;
  var td = {};

  td.bboName = csv.tBBOName;
  td.name = getName(csv.tName, csv.tSurname);
  td.role = (csv.tBBOName === 'pensando' ? 'admin' : 'td');
  td.skill = tdToString(csv.tTDSkill);
  td.h3am = sanitizeBoolean(csv.t3AM);
  td.h7am = sanitizeBoolean(csv.t7AM);
  td.h11am = sanitizeBoolean(csv.t11AM);
  td.h3pm = sanitizeBoolean(csv.t3PM);
  td.h7pm = sanitizeBoolean(csv.t7PM);
  td.h11pm = sanitizeBoolean(csv.t11PM);
  td.info = sanitizeText(csv.tInfo);

  var regexp = new RegExp( '^' + csv.tBBOName.trim() + '$', 'i');
  this._Members.findOne({bboName: regexp}, function (err, member) {
    if (err) {
      console.error('_writeTd: Error finding td ' + csv.tBBOName, err);
      done();
      return;
    }

    if (! member) {
      console.error('_writeTd: No member with name ' + csv.tBBOName, err);
      done();
      return;
    }

    var email = sanitizeEmail(csv.tEmail);
    td.emails = member.emails;
    if (! _.isEmpty(email)) {
      if (td.emails.indexOf(email) < 0) {
        td.emails.push(email);
      }
    }

    var tel = (csv.tTelephone ? csv.tTelephone.trim() : null);
    td.telephones = member.telephones;
    if (! _.isEmpty(tel)) {
      if (! td.telephones) { td.telephones = []; }
      if (td.telephones.indexOf(tel) <= 0) {
        td.telephones.push(tel);
      }
    }

    self._Members.findOneAndUpdate({bboName: regexp}, {$set: td}, function (err, updated) {
      if (err) {
        console.error('_writeTd: Error updating td ' + csv.tBBOName, err);
      }
      else if (! updated) {
        console.error('_writeTd: Unable to update td with name ' + csv.tBBOName, err);
      }

      done();
    });
  });
};

module.exports = MongoWriteStream;
