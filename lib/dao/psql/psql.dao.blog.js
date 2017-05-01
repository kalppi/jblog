const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	require('./psql.dao')(lublu);
	
	lublu.PsqlBlogDAO = lublu.PsqlBlogDAO || class PsqlBlogDAO {
		constructor(db, daoFactory) {
			this.daoFactory = daoFactory;
			this.type = 'Blog';
			this.table = lublu.table('blog');

			this.dao = new lublu.PsqlDAO(db);
		}

		findByName(name) {
			return new Promise((resolve, reject) => {
				this.dao.findBy(this.table, this.type, 'name', name, [this.daoFactory]).then(resolve).catch(reject);
			});
		}

		save(blog) {
			return this.dao.save(this.table, blog);
		}

		delete(blog) {
			return this.dao.delete(this.table, blog);
		}
	}
}