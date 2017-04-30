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

require('./lib/connection')(lublu);
require('./lib/blog')(lublu);
require('./lib/post')(lublu);
require('./lib/tag')(lublu);
require('./lib/page')(lublu);
require('./lib/user')(lublu);

module.exports = (db) => {
	const daoFactory = new lublu.DaoFactory('psql', new lublu.Connection(db));

	return {
		createBlog: (name) => {
			return new Promise((resolve, reject) => {
				const blogDao = daoFactory.create('blog');
				const blog = new lublu.Blog({name: name}, daoFactory);

				blogDao.save(blog).then(resolve).catch(reject);
			});
		},

		findBlog: (name) => {
			return new Promise((resolve, reject) => {
				const blogDAO = daoFactory.create('blog');

				blogDAO.findByName(name, daoFactory).then(resolve).catch(reject);
			});
		}
	}
};