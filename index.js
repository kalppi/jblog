'use strict';

const DEBUG = process.env.NODE_ENV !== 'production' && !process.env.TEST;

const lublu = {
	log: function(s) {
		if(DEBUG) {
			console.log(s);
		}
	},

	table: function (name) {
		return 'lublu_' + name.toLowerCase();
	},

	parseSqlArray(data) {
		return data.substring(1, data.length - 1).split(',');
	}
};

require('./lib/dao/psql/psql.dao.post')(lublu);
require('./lib/dao/psql/psql.dao.tag')(lublu);

require('./lib/connection')(lublu);
require('./lib/post')(lublu);
require('./lib/tag')(lublu);
require('./lib/posttag')(lublu);
require('./lib/page')(lublu);

module.exports = class {
	constructor(db) {
		this.db = new lublu.Connection(db);

		this.postDAO = new lublu.PsqlPostDAO(this.db);
		this.tagDAO = new lublu.PsqlTagDAO(this.db);
	}

	get posts() {
		return this.postDAO;
	}

	get tags() {
		return this.tagDAO;
	}

	Post(data) {
		return new lublu.Post(data);
	}

	Tag(data) {
		return new lublu.Tag(data);
	}

	Page(dao, options) {
		return new lublu.Page(dao, options);
	}

	ui(app) {
		return require('./ui/ui.js')(app);
	}
}