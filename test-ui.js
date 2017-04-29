'use strict';

const lublu = require('./index.js');
const express = require('express');
const pg = require('pg');

const pool = new pg.Pool(require('./test-db.json'));
const blog = new lublu(pool);

pool.connect();

var app = express();

blog.ui(app);

let port = 1234;

app.listen(port);

console.log("Listening on port", port);