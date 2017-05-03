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

const DaoFactory = require('./lib/dao/daofactory')(lublu),
	DataObject = require('./lib/dataobject')(lublu),
	Page = require('./lib/page')(lublu);


module.exports = class Lublu {
	constructor(type, ...args) {
		this.daoFactory = new DaoFactory(type, args);
		
		this.blogDAO = this.daoFactory.create('blog');
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
		return new Blog(data, this.daoFactory);
	}

	Post(data) {
		if(Array.isArray(data)) {
			let posts = [];
			for(let d of data) {
				posts.push(DataObject.factory('post', d));
			}
			return posts;
		} else {
			return DataObject.factory('post', data);
		}
	}

	User(data) {
		if(Array.isArray(data)) {
			let posts = [];
			for(let d of data) {
				posts.push(DataObject.factory('user', d));
			}
			return posts;
		} else {
			return DataObject.factory('user', data);
		}
	}

	Tag(data) {
		return DataObject.factory('tag', data);
	}

	Page(dao, options) {
		return new Page(dao, options);
	}
}