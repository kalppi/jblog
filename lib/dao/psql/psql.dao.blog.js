const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	require('./psql.dao')(lublu);
	
	lublu.PsqlBlogDAO = lublu.PsqlBlogDAO || class PsqlBlogDAO extends lublu.PsqlDAO {
		constructor(db) {
			super(db);

			this.type = 'Blog';
			this.table = lublu.table('blog');
		}

		findByName(name, daoFactory) {
			return super.findBy(this.table, this.type, 'name', name, [daoFactory]);
		}

		save(blog) {
			return super.save(this.table, blog);
		}
	}
}