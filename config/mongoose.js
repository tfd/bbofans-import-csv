"use strict";

var mongoose = require('mongoose');
var fs = require('fs');

module.exports = function (config) {
  // Bootstrap db connection
  // Connect to mongodb
  var connect = function () {
    var options = {server: {socketOptions: {keepAlive: 1}}};
    mongoose.connect(config.db, options);
  };

  // Error handler
  mongoose.connection.on('error', function (err) {
    console.log(err);
  });

  // Reconnect when closed
  mongoose.connection.on('disconnected', function () {
    connect();
  });
  connect();

  // Bootstrap models
  var models_path = __dirname + '/../src/models';
  fs.readdirSync(models_path).forEach(function (file) {
    if (~file.indexOf('.js')) { require(models_path + '/' + file); }
  });
};

