#!/bin/sh
if [ "x$NODE_ENV" = "x" ]
then
  DB="bbofans_prod"
else
  DB="bbofans_$NODE_ENV"
fi
echo "Using $DB"
mongo $DB --eval "db.members.drop()"
mongo $DB --eval "db.blacklists.drop()"
node import.js members.csv tds.csv 1> passwords.txt 2> errors.txt
