"use strict";

var util = require('util');
var StringDecoder = require('string_decoder').StringDecoder;
var Transform = require('stream').Transform;
var moment = require('moment');
var _ = require('underscore');
var CSV = require('../parsers/csv');

// Gets \n-delimited CSV string data, and emits the parsed objects
// Assumes the first line is the header with the names of the fields.
function CsvParseStream(options) {
  if (!(this instanceof CsvParseStream)) {
    return new CsvParseStream(options);
  }

  Transform.call(this, options);
  this._writableState.objectMode = false;
  this._readableState.objectMode = true;
  this._buffer = '';
  this._decoder = new StringDecoder('utf8');
  this._readHeader = true;
  this._names = [];
  this._csv = new CSV();
}

util.inherits(CsvParseStream, Transform);

CsvParseStream.prototype._transform = function (chunk, encoding, cb) {
  var self = this;

  this._buffer += this._decoder.write(chunk);

  // split on newlines
  var lines = this._buffer.split(/\r?\n/);

  // keep the last partial line buffered
  this._buffer = lines.pop();

  _.each(lines, function processLine(line) {
    var fields = self._csv.parse(line);
    if (self._readHeader) {
      self._names = [];
      _.each(fields, function (val) {
        self._names.push(val.value);
      });
      self._readHeader = false;
    }
    else {
      var obj = {};
      _.each(self._names, function (name, i) {
        if (i < fields.length && fields[i].value !== null) {
          obj[name] = fields[i].value;
        }
      });
      self.push(obj);
    }
  });
  cb();
};

CsvParseStream.prototype._flush = function (cb) {
  // Just handle any leftover
  var line = this._buffer.trim();
  if (line) {
    var fields = this._csv.parse(line);
    var obj = {};
    _.each(this._names, function (name, i) {
      if (i < fields.length && fields[i].value !== null) {
        obj[name] = fields[i].value;
      }
    });
    this.push(obj);
  }
  cb();
};

module.exports = CsvParseStream;
