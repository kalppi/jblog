const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	require('./dataobject.js')(lublu);
	
	lublu.Blog = lublu.Blog || class Blog extends lublu.DataObject {
		constructor(data, daoFactory) {
			super(data);

			this.postDAO = daoFactory.create('post');
			this.userDAO = daoFactory.create('user');
			this.tagDAO = daoFactory.create('tag');
		}

		get posts() {
			return this.postDAO;
		}

		get tags() {
			return this.tagDAO;
		}

		get users() {
			return this.userDAO;
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
}