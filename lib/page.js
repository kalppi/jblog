const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	lublu.Page = lublu.Page || class Page {
		constructor(db, postsInPage, options) {
			this.postsInPage = postsInPage;
			this.options = options;
			this.posts = new lublu.Post(db);
		}

		getPageCount() {
			return new Promise((resolve, reject) => {
				this.posts.findAllCount(this.options).then(count => {
					resolve(Math.ceil(count / this.postsInPage));
				}).catch(reject);
			});
		}

		getPage(page) {
			return new Promise((resolve, reject) => {
				let options = Object.assign(
					{
						offset: page * this.postsInPage,
						limit: this.postsInPage
					},
					this.options
				);

				this.posts.findAll(options).then(resolve).catch(reject);
			});
		}
	}
}