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
var env = process.env.NODE_ENV || 'dev';
var config = require('./config/config')[env];

// connect to database
require('./config/mongoose')(config);

var r = fs.createReadStream(membersFileName);
var c = new CsvParseStream();
var m = new MongoWriteStream('Member');
r.pipe(c).pipe(m);

m.on('finish', function () {
  console.log('done');
  process.exit(0);
});

