'use strict';

const fs = require('fs');
const express = require('express');
const exphbs  = require('express-handlebars');
const sass = require('node-sass');

const routes = require('./routes');

sass.render({
	file: 'ui/style.scss',
}, function(err, result) {
	fs.writeFile('ui/public/css/style.css', result.css, (err) => {
		if(err) {
			console.log(err);
		}
	});
});

module.exports = function(app, lublu, blog) {
	app.use('/css', express.static('ui/public/css'));
	app.use('/admin', routes);
}