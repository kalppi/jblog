'use strict';

const util = require('util');

module.exports = (lublu) => {
	const DataObject = require('../../dataobject')(lublu),
		SQL = require('./sql')(lublu);

	return class PsqlBlogDAO {
		constructor(daoFactory, db) {
			this.db = db;
			this.daoFactory = daoFactory;
			this.type = 'Blog';
			this.table = lublu.table('blog');

			this.dao = daoFactory.create('generic');
			this.userDAO = daoFactory.create('user');
		}

		create(name, owner) {
			return new Promise((resolve, reject) => {
				const blog = DataObject.factory('blog', {name: name}, this.daoFactory);

				this.save(blog).then(blog => {
					const rightsDAO = this.daoFactory.create('rights');

					const rights = DataObject.factory('rights', {
						blog: blog,
						user: owner,
						rights: 'owner'
					});

					rightsDAO.save(rights).then(() => {
						resolve(blog);
					}, reject)
				}, reject)
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

		getOwner(blog) {
			const sql = util.format(`
				SELECT user_id
				FROM %s
				WHERE blog_id = $1
				AND rights = 'owner'
				LIMIT 1
			`, lublu.table('rights_join'));

			return new Promise((resolve, reject) => {
				SQL.query(this.db, sql, [blog.get('id')]).then(rows => {
					if(rows.length == 0) {
						reject();
					} else {
						this.userDAO.find(rows[0].user_id).then(resolve, reject);
					}
				}).catch(reject);
			});
		}

		changeOwner(blog, user) {
			return new Promise((resolve, reject) => {
				const sql = util.format(`
					UPDATE %s
					SET user_id = $1
					WHERE blog_id = $2
					AND rights = 'owner'
				`, lublu.table('rights_join'));

				SQL.query(this.db, sql, [user.get('id'), blog.get('id')]).then(rows => {
					resolve();
				}).catch(reject);
			});
		}
	}
}