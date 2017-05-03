'use strict';

module.exports = (lublu) => {
	return class Page {
		constructor(dao, options) {
			this.dao = dao;
			this.options = options;
		}

		getPageCount() {
			return new Promise((resolve, reject) => {
				this.dao.findAllCount(this.options).then(count => {
					resolve(Math.ceil(count / this.options.perPage));
				}).catch(reject);
			});
		}

		getPage(page) {
			return new Promise((resolve, reject) => {
				let options = Object.assign(
					{
						offset: page * this.options.perPage,
						limit: this.options.perPage
					},
					this.options
				);

				this.dao.findAll(options).then(resolve).catch(reject);
			});
		}
	}
}