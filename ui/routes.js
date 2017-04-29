'use strict';

const fs = require('fs');
const Handlebars = require('handlebars');
const express = require('express');
const router = express.Router();

let layout = null;

fs.readFile('ui/layout.hb', function(err, content) {
	layout = Handlebars.compile(content.toString());
});

function auth() {
	return function(req, res, next) {
		next();
	}
}

router.use(auth());

router.get('/', function(req, res) {
	res.end(layout({
		menu: [
			{text: 'New post'},
			{text: 'All posts'}
		]
	}));
});

module.exports = router;