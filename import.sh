#!/bin/sh
mongo bbofans_dev --eval "db.members.drop()"
mongo bbofans_dev --eval "db.blacklists.drop()"
node import.js members.csv tds.csv 1> passwords.txt 2> errors.txt
