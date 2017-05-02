'use strict';

const Lublu = require('./index.js');
const express = require('express');
const pg = require('pg');

const pool = new pg.Pool(require('./test-db.json'));
const lublu = new Lublu('psql', pool);

pool.connect();

var app = express();

const invert  = p  => new Promise((res, rej) => p.then(rej, res));
const firstOf = ps => invert(Promise.all(ps.map(invert)));

firstOf([
	lublu.blogs.findByName('test-blog'),
	lublu.blogs.create('test-blog')
]).then(blog => {
	blog.ui(app);
});

let port = 1234;

app.listen(port);

console.log("Listening on port", port);