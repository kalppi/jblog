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

	ucFirst(text) {
    	return text.charAt(0).toUpperCase() + text.slice(1);
	}
};

require('./lib/dao/daofactory')(lublu);
require('./lib/blog')(lublu);
require('./lib/post')(lublu);
require('./lib/tag')(lublu);
require('./lib/page')(lublu);
require('./lib/user')(lublu);
require('./lib/rights')(lublu);


module.exports = class Lublu {
	constructor(type, ...args) {
		this.daoFactory = new lublu.DaoFactory(type, args);
		
		this.blogDAO = this.daoFactory.create('blog', this.daoFactory);
		this.userDAO = this.daoFactory.create('user');
		this.tagDAO = this.daoFactory.create('tag');
	}

	get blogs() {
		return this.blogDAO;
	}

	get tags() {
		return this.tagDAO;
	}

	get users() {
		return this.userDAO;
	}

	Blog(data) {
		return new lublu.Blog(data, this.daoFactory);
	}

	Post(data) {
		if(Array.isArray(data)) {
			let posts = [];
			for(let d of data) {
				posts.push(new lublu.Post(d));
			}
			return posts;
		} else {
			return new lublu.Post(data);
		}
	}

	User(data) {
		if(Array.isArray(data)) {
			let posts = [];
			for(let d of data) {
				posts.push(new lublu.User(d));
			}
			return posts;
		} else {
			return new lublu.User(data);
		}
	}

	Tag(data) {
		return new lublu.Tag(data);
	}

	Page(dao, options) {
		return new lublu.Page(dao, options);
	}
}