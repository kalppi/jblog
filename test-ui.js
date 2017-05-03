'use strict';

const Lublu = require('./index.js');
const express = require('express');
const pg = require('pg');

const pool = new pg.Pool(require('./test-db.json'));
const lublu = new Lublu('psql', pool);

pool.connect();

const app = express();

const invert  = p  => new Promise((res, rej) => p.then(rej, res));
const firstOf = ps => invert(Promise.all(ps.map(invert)));

firstOf([
	lublu.users.findByName('test-user'),
	lublu.users.create('test-user')
]).then(user => {
	firstOf([
		lublu.blogs.findByName('test-blog'),
		lublu.blogs.create('test-blog', user)
	]).then(blog => {
		blog.ui(app);
	}, console.log);
}, console.log);


let port = 1234;

app.listen(port);

console.log("Listening on port", port);