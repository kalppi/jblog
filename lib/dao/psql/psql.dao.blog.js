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

		create(name, owner) {
			return new Promise((resolve, reject) => {
				const blog = new lublu.Blog({name: name}, this.daoFactory);

				this.save(blog).then(blog => {
					const rightsDAO = this.daoFactory.create('rights');

					const rights = new lublu.Rights({
						blog: blog,
						user: owner,
						rights: 'admin'
					});

					rightsDAO.save(rights).then(() => {
						resolve(blog);
					})
				})
			});
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