"use strict";

var fs = require('fs');
var CsvParseStream = require('./src/streams/csv-parse-stream');
var MongoWriteStream = require('./src/streams/mongo-write-stream');

var args = process.argv.slice(2);

if (args.length < 2) {
  console.log('import.js - import csv into mongodb');
  console.log('Usage: node import.js members.csv tds.csv');
  process.exit(1);
}

var membersFileName = args[0];
var tdsFileName = args[1];

if (! fs.existsSync(membersFileName)) {
  console.log(membersFileName + ' not found!');
  process.exit(2);
}

if (! fs.existsSync(tdsFileName)) {
  console.log(tdsFileName + ' not found!');
  process.exit(2);
}

// if test env, load example file
var env = process.env.NODE_ENV || 'prod';
var config = require('./config/config')[env];

// connect to database
require('./config/mongoose')(config);

function processMembers(done) {
  var r = fs.createReadStream(membersFileName);
  var p = new CsvParseStream();
  var w = new MongoWriteStream('Member');
  r.pipe(p).pipe(w);

  w.on('finish', done);
}

function processTds(done) {
  var r = fs.createReadStream(tdsFileName);
  var p = new CsvParseStream();
  var w = new MongoWriteStream('Td');
  r.pipe(p).pipe(w);

  w.on('finish', done);
}

processMembers(function () {
  processTds(function () {
    console.log('done');
    process.exit(0);
  });
});
