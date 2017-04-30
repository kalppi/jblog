const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	require('./psql.dao')(lublu);
	require('./psql.dao.tag')(lublu);
	
	lublu.PsqlPostDAO = lublu.PsqlPostDAO || class PsqlPostDAO extends lublu.PsqlDAO {
		constructor(db) {
			super(db);

			this.type = 'Post';
			this.table = lublu.table('post');
			this.fields = ['title', 'content', 'is_published', 'user_id'];

			this.tagDAO = new lublu.PsqlTagDAO(this.db);
		}

		clear(options) {
			return super.clear(this.table, options);
		}

		save(objects, user) {
			let returnArray = Array.isArray(objects);

			if(!Array.isArray(objects)) {
				objects = [objects];
			}

			for(let o of objects) {
				o.set('user_id', o.get('user').get('id'));
			}

			return new Promise((resolve, reject) => {
				super.save(this.table, objects, this.fields).then(objects => {
					this._saveTags(objects).then(() => {
						if(returnArray) {
							resolve(objects);
						} else {
							resolve(objects[0]);
						}
					}).catch(reject);
				}).catch(reject);
			});
		}

		_saveTags(objects) {
			return new Promise((resolve, reject) => {
				let uniqueTags = [];
				let promises = [];

				let insertSql = util.format(`
					INSERT INTO %s (post_id, tag_id)
						VALUES
							($1, (SELECT id
								FROM %s
								WHERE tag = $2))
					ON CONFLICT DO NOTHING`, lublu.table('tag_join'), lublu.table('tag'));

				let removeSql = util.format(`
					DELETE FROM %s
					WHERE post_id = $1
					AND tag_id = (SELECT id FROM %s WHERE tag = $2)`, lublu.table('tag_join'), lublu.table('tag'));

				for(let o of objects) {
					for(let t of o.get('tags') || []) {
						if(uniqueTags.indexOf(t) === -1) {
							uniqueTags.push(new lublu.Tag({tag: t}));
						}
					}
				}

				this.tagDAO.save(uniqueTags).then(() => {
					for(let o of objects) {
						let tags = o.get('tags') || [];

						for(let t of tags) {
							let p = new Promise((resolve, reject) => {
								this.db.query(insertSql, [o.get('id'), t]).then(resolve).catch(reject);
							});

							promises.push(p);
						}

						for(let t of o.get('tags', true) || []) {
							if(tags.indexOf(t) === -1) {
								let p = new Promise((resolve, reject) => {
									this.db.query(removeSql, [o.get('id'), t]).then(resolve).catch(reject);
								});

								promises.push(p);
							}
						}
					}

					Promise.all(promises).then(resolve).catch(reject);
				}).catch(reject);
			});	
		}

		find(id, options) {
			options = options || {};

			if(options.tags) {
				var sql = util.format(`
					SELECT p.id, p.title, p.content, p.is_published, p.date_published, p.date_updated,
					array_remove(array_agg(t.tag), NULL)::text[] AS tags,
					u.id AS u_id, u.name AS u_name
					FROM %s p
					LEFT JOIN %s tj ON tj.post_id = p.id
					LEFT JOIN %s t ON t.id = tj.tag_id
					LEFT JOIN %s u ON u.id = p.user_id
					WHERE p.id = $1
					GROUP BY p.id, u.id`,
					this.table, lublu.table('tag_join'), lublu.table('tag'), lublu.table('user'));
			} else {
				var sql = util.format(`
					SELECT p.id, p.title, p.content, p.is_published, p.date_published, p.date_updated,
					u.id AS u_id, u.name AS u_name
					FROM %s p
					LEFT JOIN %s u ON u.id = p.user_id
					WHERE p.id = $1
					GROUP BY p.id, u.id`,
					this.table, lublu.table('user'));
			}

			return new Promise((resolve, reject) => {
				this.db.query(sql, [id]).then(rows => {
					if(rows.length == 0) {
						reject(new Error('not found'));
					} else {
						let user = lublu.DataObject.factory('User', {
							id:		rows[0].u_id,
							name:	rows[0].u_name
						});

						let post = lublu.DataObject.factory(this.type, {
							id:				rows[0].id,
							title:			rows[0].title,
							content:		rows[0].content,
							is_published:	rows[0].is_published,
							date_published:	rows[0].date_published,
							date_updated:	rows[0].date_updated,
							user:			user
						});

						if(options.tags) {
							post.set('tags', rows[0].tags, true);
						}

						resolve(post);
					}
				});
			});
		}

		findRandom() {
			return super.findRandom(this.table, this.type);
		}

		findAll(options) {
			options = options || {};

			if(options.tags) {
				let sql = util.format(`SELECT p.id, p.title, p.content, p.is_published, p.date_published, p.date_updated,
					array_remove(array_agg(t.tag), NULL)::text[] AS tags
					FROM %s p
					LEFT JOIN %s tj ON tj.post_id = p.id
					LEFT JOIN %s t ON t.id = tj.tag_id
					GROUP BY p.id`, this.table, lublu.table('tag_join'), lublu.table('tag'));

				let data = [];

				if(options.offset !== undefined && options.limit !== undefined) {
					sql += ' LIMIT $1 OFFSET $2';
					
					data.push(options.limit);
					data.push(options.offset);
				}

				return new Promise((resolve, reject) => {
					this.db.query(sql, data).then(rows => {
						if(rows.length == 0) {
							reject(new Error('not found'));
						} else {
							let posts = [];
							for(let row of rows) {
								posts.push(lublu.DataObject.factory(this.type, row));
							}

							resolve(posts);
						}
					});
				});
			} else {
				return super.findAll(this.table, this.type, options);
			}
		}

		findAllCount(options) {
			return super.findAllCount(this.table, options);
		}

		count() {
			return super.count(this.table);
		}

		clear() {
			return super.clear(this.table);
		}

		publish(post) {
			return new Promise((resolve, reject) => {
				post.set('is_published', true);

				if(post.get('id')) {
					super.save(this.table, post, ['is_published'], ['date_published']).then(resolve).catch(reject);
				} else {
					resolve();
				}
			});
		}

		unpublish(post) {
			return new Promise((resolve, reject) => {
				post.set({
					is_published: false,
					date_published: null
				});

				if(post.get('id')) {
					super.save(this.table, post, ['is_published', 'date_published']).then(resolve).catch(reject);
				} else {
					resolve();
				}
			});
		}

		delete(post) {
			return super.delete(this.table, post);
		}
	}
}