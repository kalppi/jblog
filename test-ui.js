'use strict';

const Lublu = require('./index.js');
const express = require('express');
const pg = require('pg');
const fs = require('fs');
const sass = require('node-sass');

const routes = require('./ui/private/routes');

const pool = new pg.Pool(require('./test-db.json'));
const lublu = new Lublu('psql', pool);

pool.connect();

const app = express();
const port = 1234;

const onlyFirst = ps => {
	return new Promise((resolve, reject) => {
		let p = ps.shift();

		if(!p) resolve(null);
		else p.call().then(f => resolve(f), () => resolve(onlyFirst(ps)));
	});
};

function renderCss() {
	return new Promise((resolve, reject) => {
		sass.render({
			file: 'ui/private/style.scss',
		}, function(err, result) {
			if(err) {
				reject(err);
			} else {
				fs.writeFile('ui/public/css/style.css', result.css, (err) => {
					if(err) {
						reject(err);
					} else {
						resolve();
					}
				});
			}
		});
	});
}


onlyFirst([
	lublu.users.findByName.bind(lublu.users, 'test-user'),
	lublu.users.create.bind(lublu.users, 'test-user')
]).then(user => {
	onlyFirst([ 	
		lublu.blogs.findByName.bind(lublu.blogs, 'test-blog'),
		lublu.blogs.create.bind(lublu.blogs, 'test-blog', user)
	]).then(blog => {
		app.listen(port);

		console.log("Listening on port", port);

		renderCss().then(() => {
			app.use('/css', express.static('ui/public/css'));
			app.use('/', routes(lublu));
		}, console.log);
	}, console.log);
}, console.log);


