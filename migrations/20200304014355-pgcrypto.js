'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.runSql(/*sql*/`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
};

exports.down = function(db) {
  return db.runSql(/*sql*/`DROP EXTENSION pgcrypto;`);;
};

exports._meta = {
  "version": 1
};
