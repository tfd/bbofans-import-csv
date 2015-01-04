"use strict";

var moment = require('moment');
var _ = require('underscore');

function CSV(options) {
  if (!(this instanceof CSV)) {
    return new CSV(options);
  }

  this.options = options || {};
  _.defaults(this.options, {
    fieldDelimiter: ',',
    stringDelimiter: '"',
    decimalSeparator: '.'
  });
}

CSV.prototype.parse = function (line) {
  var i = 0;

  this.state = this._firstChar;
  this.fields = [];
  this.value = null;

  for (i = 0; i < line.length; ++i) {
    this._parseChar(line.charAt(i));
  }

  // Terminate current parsing
  this.state(null);

  return this.fields;
};

CSV.prototype._parseChar = function (c) {
  this.state(c);
};

CSV.prototype._firstChar = function (c) {
  if (c === this.options.stringDelimiter) {
    this.state = this._inString;
    this.value = '';
    return;
  }

  if (c === this.options.fieldDelimiter || c === null) {
    this.fields.push({ type: 'unknown', value: null });
    this.state = this._firstChar;
    return;
  }

  // skip leading white space.
  if ('\t '.indexOf(c) >= 0) {
    return;
  }

  this.value = c;
  this.state = this._inValue;
};

CSV.prototype._inString = function (c) {
  if (c === null) {
    this.pushString(this.value);
    return;
  }

  if (c === this.options.stringDelimiter) {
    this.state = this._endOfString;
    return;
  }

  this.value += c;
};

CSV.prototype._endOfString = function (c) {
  if (c === this.options.stringDelimiter) {
    this.value += c;
    this.state = this._inString;
    return;
  }

  this.pushString(this.value);

  this.value = null;
  if (c === this.options.fieldDelimiter || c === null) {
    this.state = this._firstChar;
  }
  else {
    this.state = this._skipToNextField;
  }
};

CSV.prototype.pushString = function (val) {
  // check for a valid date
  if (moment(val).isValid()) {
    // nice: a date
    this.fields.push({type: 'date', value: moment(val).toDate()});
  }
  // Check for boolean
  else if (['true', 'y', 'yes'].indexOf(val.toLowerCase()) >= 0) {
    this.fields.push({type: 'boolean', value: true});
  }
  else if (['false', 'n', 'no'].indexOf(val.toLowerCase()) >= 0) {
    this.fields.push({type: 'boolean', value: false});
  }
  else {
    this.fields.push({type: 'string', value: val});
  }
};

CSV.prototype._skipToNextField = function (c) {
  if (c === this.options.fieldDelimiter) {
    this.state = this._firstChar;
  }
};

CSV.prototype._inValue = function (c) {
  if (c === this.options.fieldDelimiter || c === null) {
    this.fields.push(this._parseValue(this.value));
    this.state = this._firstChar;
    this.value = null;
    return;
  }

  this.value += c;
};

CSV.prototype._parseValue = function (val) {
  // Check for empty field.
  if (val === null || val.length === 0) {
    return {type: 'unknown', value: null};
  }

  // Check for number
  var sep = val.replace(this.options.decimalSeparator, '.');
  if ((sep - parseFloat(sep) + 1) >= 0) {
    return {type: 'number', value: parseFloat(sep)};
  }

  // Check for date
  if (moment(val).isValid()) {
    // nice: a date
    return {type: 'date', value: moment(val).toDate()};
  }

  // Check for boolean
  if (['true', 'y', 'yes'].indexOf(val.toLowerCase()) >= 0) {
    return {type: 'boolean', value: true};
  }

  if (['false', 'n', 'no'].indexOf(val.toLowerCase()) >= 0) {
    return {type: 'boolean', value: false};
  }

  // Ok, it must be a string.
  return {type: 'string', value: val};
};

module.exports = CSV;
