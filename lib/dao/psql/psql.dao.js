const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};
	
	lublu.PsqlDAO = lublu.PsqlDAO || class PsqlDAO {
		constructor(db, options) {
			this.db = db;
			this.options = options;
		}

		clear(table, options) {
			return new Promise((resolve, reject) => {
				this.db.clear(table, options).then(resolve).catch(reject);
			});
		}

		count(table) {
			return new Promise((resolve, reject) => {
				this.db.query(util.format('SELECT COUNT(*)::int as count FROM %s', table)).then(rows => {
					resolve(rows[0].count);
				}).catch(reject);
			});
		}

		delete(table, object) {
			return new Promise((resolve, reject) => {
				if(Array.isArray(object)) {
					let ids = [];

					for(let o of object) {
						ids.push(o.get('id'));
					}

					let sql = util.format('DELETE FROM %s WHERE id = ANY ($1)', table);

					this.db.query(sql, [ids]).then(resolve).catch(reject);
				} else {
					let sql = util.format('DELETE FROM %s WHERE id = $1', table);

					this.db.query(sql, [object.data.id]).then(resolve).catch(reject);
				}
			});
		}

		save(table, objects, fields, returning) {
			return new Promise((resolve, reject) => {
				let returnArray = true;

				if(!Array.isArray(objects)) {
					objects = [objects];
					returnArray = false;
				}

				let promises = [];

				for(let p of objects) {
					promises.push(this._save(table, p, fields, returning, this.options));
				}

				Promise.all(promises).then((objects) => {
					if(returnArray) {
						resolve(objects);
					} else {
						resolve(objects[0]);
					}
				}).catch(reject);
			});
		}

		_save(table, object, fields, returning, options) {
			return new Promise((resolve, reject) => {
				let data = {};

				if(fields) {
					for(let k in object.data) {
						if(fields.indexOf(k) != -1) {
							data[k] = object.data[k];
						}
					}
				} else {
					data = object.data;
				}

				if(object.data.id) {
					data.id = object.data.id;

					this.db.update(table, data, returning).then((ret) => {
						object.set(ret);

						resolve(object);
					}).catch(reject);
				} else {
					this.db.insert(table, data, returning, options).then((ret) => {
						object.set(ret);

						resolve(object);
					}).catch(reject);
				}
			});
		}

		find(table, type, id, args) {
			return new Promise((resolve, reject) => {
				const sql = util.format('SELECT * FROM %s WHERE id = $1 LIMIT 1', table);
				
				this.db.query(sql, [id]).then(rows => {
					if(rows.length == 0) {
						reject(new Error(util.format('%s not found (id: %i)', type, id)));
					} else {
						resolve(lublu.DataObject.factory(type, rows[0], args));
					}
				}).catch(reject);
			});
		}

		findBy(table, type, field, value, args) {
			const sql = util.format('SELECT * FROM %s WHERE %s = $1 LIMIT 1', table, field);

			const find = (value) => {
				return new Promise((resolve, reject) => {
					this.db.query(sql, [value]).then(rows => {
						if(rows.length == 0) {
							reject(new Error(util.format('%s not found (%s: %s)', type, field, value)));
						} else {
							resolve(lublu.DataObject.factory(type, rows[0], args));
						}
					}).catch(reject);
				});
			};

			if(Array.isArray(value)) {
				let promises = [];
				for(let val of value) {
					promises.push(find(val));
				}

				return Promise.all(promises);
			} else {
				return find(value);
			}
		}

		findRandom(table, type, options = {}) {
			let sql = util.format('SELECT * FROM %s', table);

			if(options && options.where) {
				sql += ' WHERE ' + options.where.join(' AND ');
			}

			sql += ' ORDER BY random() LIMIT 1';

			return new Promise((resolve, reject) => {
				this.db.query(sql, []).then(rows => {
					if(rows.length == 0) {
						reject(new Error(util.format('%s not found (random)', type)));
					} else {
						resolve(lublu.DataObject.factory(type, rows[0]));
					}
				});
			});
		}

		findAll(table, type, options) {
			options = options || {};

			let sql = 'SELECT * FROM %s';
			let data = [];

			if(options && options.where) {
				sql += ' WHERE ' + options.where.join(' AND ');
			}

			if(options.offset !== undefined && options.limit !== undefined) {
				sql += ' LIMIT $1 OFFSET $2';
				
				data.push(options.limit);
				data.push(options.offset);
			}

			return new Promise((resolve, reject) => {
				this.db.query(util.format(sql, table), data).then(rows => {
					let posts = [];
					for(let a of rows) {
						posts.push(lublu.DataObject.factory(type, a));
					}

					resolve(posts);
				});
			});
		}

		findAllCount(table, options) {
			options = options || {};

			let sql = 'SELECT COUNT(*)::int as count FROM %s';
			let data = [];

			if(options && options.where) {
				sql += ' WHERE ' + options.where.join(' AND ');
			}

			if(options.offset !== undefined && options.limit !== undefined) {
				sql += ' LIMIT $1 OFFSET $2';
				
				data.push(options.limit);
				data.push(options.offset);
			}

			return new Promise((resolve, reject) => {
				this.db.query(util.format(sql, table), data).then(rows => {
					resolve(rows[0].count);
				}).catch(reject);
			});
		}
	}
}