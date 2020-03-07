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
  return db.runSql(/*sql*/`
    CREATE TABLE users(
      id uuid UNIQUE PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      token_subject bytea UNIQUE,
      username varchar(255) UNIQUE,
      meta jsonb
    );
    CREATE TABLE user_auth(
      id uuid UNIQUE PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id),
      auth_type varchar(255) NOT NULL,
      subject varchar(255),
      email varchar(255),
      meta jsonb
    );
  `);
};

exports.down = function(db) {
  return db.runSql(/*sql*/`
    DROP TABLE users;
    DROP TABLE user_auth;
  `);
};

exports._meta = {
  "version": 1
};
