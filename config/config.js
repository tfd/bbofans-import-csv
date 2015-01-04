"use strict";

// Determine the root path of our server.
var path = require('path');
var rootPath = path.normalize(__dirname + '/../..');

/**
 * Configurations for different environments. Acces your configuration in this way:
 *
 * <code>
 * var env = process.env.NODE_ENV || 'dev';
 * var config = require('<path to config')[env];
 * </code>
 *
 * Config has the following fields:
 *
 * <dl>
 *  <dt>db</dt>
 *  <dd>The MongoDB database to use</dd>
 *  <dt>root</dt>
 *  <dd>Absolute path to root of the server (without trailing /)</dd>
 *  <dt>app.name</dt>
 *  <dd>Name of the web site</dd>
 * </dl>
 */
module.exports = {
  dev: {
    db: 'mongodb://localhost/bbofans_dev',
    root: rootPath,
    app: {
      name: 'bbofans-import-csv'
    }
  },
  prod: {
    db: 'mongodb://localhost/bbofans_prod',
    root: rootPath,
    app: {
      name: 'bbofans-import-csv'
    }
  }
};
