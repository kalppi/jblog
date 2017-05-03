'use strict';

const util = require('util');

module.exports = (lublu) => {
	const DataObject = require('../../dataobject')(lublu),
		SQL = require('./sql')(lublu);
	
	return class PsqlPostDAO {
		constructor(daoFactory, db, blog) {
			this.db = db;
			this.blog = blog;

			this.type = 'Post';
			this.table = lublu.table('post');
			this.fields = ['title', 'content', 'is_published', 'blog_id', 'user_id'];

			this.dao = daoFactory.create('generic');
			this.tagDAO = daoFactory.create('tag');
			this.rightsDAO = daoFactory.create('rights');
		}

		clear(options) {
			return this.dao.clear(this.table, Object.assign({where: ['blog_id = ' + this.blog.get('id')]}, options));
		}

		save(objects) {
			let returnArray = Array.isArray(objects);

			if(!Array.isArray(objects)) {
				objects = [objects];
			}

			/*
				Iterate through every post object, and check that its user has the necessary rights
				to write to the blog. Caches the rights to an object, so it needs to only fetch
				the info once for every user.
			*/

			let userRights = {};

			const handleObjects = (it) => {
				const next = it.next();

				if(next.done) {
					return Promise.resolve();
				}

				const o = next.value;
				const user = o.get('user');
				let promise = null;

				if(!userRights[user.get('id')]) {
					promise = this.rightsDAO.get(this.blog, o.get('user'));
				} else {
					promise = Promise.resolve(userRights[user.get('id')]);
				}

				return promise.then(rights => {
					userRights[rights.get('user').get('id')] = rights;

					if(!rights.canWrite()) {
						return Promise.reject(new Error('invalid access rights'));
					} else {
						o.set({
							blog_id: this.blog.get('id'),
							user_id: o.get('user').get('id')
						});

						return handleObjects(it);
					}
				}, console.log);
			};

			return new Promise((resolve, reject) => {
				const it = objects[Symbol.iterator]();

				return handleObjects(it).then(() => {
					this.dao.save(this.table, objects, this.fields).then(objects => {
						this._saveTags(objects).then(() => {
							if(returnArray) {
								resolve(objects);
							} else {
								resolve(objects[0]);
							}
						}).catch(reject);
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
							uniqueTags.push(DataObject.factory('tag', {tag: t}));
						}
					}
				}

				this.tagDAO.save(uniqueTags).then(() => {
					for(let o of objects) {
						let tags = o.get('tags') || [];

						for(let t of tags) {
							let p = new Promise((resolve, reject) => {
								SQL.query(this.db, insertSql, [o.get('id'), t]).then(resolve).catch(reject);
							});

							promises.push(p);
						}

						for(let t of o.get('tags', true) || []) {
							if(tags.indexOf(t) === -1) {
								let p = new Promise((resolve, reject) => {
									SQL.query(this.db, removeSql, [o.get('id'), t]).then(resolve).catch(reject);
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
				SQL.query(this.db, sql, [id]).then(rows => {
					if(rows.length == 0) {
						reject(new Error('not found'));
					} else {
						let user = DataObject.factory('User', {
							id:		rows[0].u_id,
							name:	rows[0].u_name
						});

						let post = DataObject.factory(this.type, {
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

		findRandom(options) {
			return this.dao.findRandom(this.table, this.type, Object.assign({where: ['blog_id = ' + this.blog.get('id')]}, options));
		}

		findAll(options) {
			options = options || {};

			if(options.tags) {
				let sql = util.format(`SELECT p.id, p.title, p.content, p.is_published, p.date_published, p.date_updated,
					array_remove(array_agg(t.tag), NULL)::text[] AS tags
					FROM %s p
					LEFT JOIN %s tj ON tj.post_id = p.id
					LEFT JOIN %s t ON t.id = tj.tag_id
					WHERE blog_id = $1
					GROUP BY p.id`, this.table, lublu.table('tag_join'), lublu.table('tag'));

				let data = [this.blog.get('id')];

				if(options.offset !== undefined && options.limit !== undefined) {
					sql += ' LIMIT $2 OFFSET $3';
					
					data.push(options.limit);
					data.push(options.offset);
				}

				return new Promise((resolve, reject) => {
					SQL.query(this.db, sql, data).then(rows => {
						if(rows.length == 0) {
							reject(new Error('not found'));
						} else {
							let posts = [];
							for(let row of rows) {
								posts.push(DataObject.factory(this.type, row));
							}

							resolve(posts);
						}
					});
				});
			} else {
				return this.dao.findAll(this.table, this.type, Object.assign({where: ['blog_id = ' + this.blog.get('id')]}, options));
			}
		}

		findAllCount(options) {
			return this.dao.findAllCount(this.table, options);
		}

		count() {
			return new Promise((resolve, reject) => {
				const sql = util.format('SELECT COUNT(*)::int as count FROM %s WHERE blog_id = $1', this.table);

				SQL.query(this.db, sql, [this.blog.get('id')]).then(rows => {
					resolve(rows[0].count);
				}).catch(reject);
			});
		}

		publish(post) {
			return new Promise((resolve, reject) => {
				post.set('is_published', true);

				if(post.get('id')) {
					this.dao.save(this.table, post, ['is_published'], ['date_published']).then(resolve).catch(reject);
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
					this.dao.save(this.table, post, ['is_published', 'date_published']).then(resolve).catch(reject);
				} else {
					resolve();
				}
			});
		}

		delete(post) {
			return this.dao.delete(this.table, post);
		}
	}
}