const util = require('util');

module.exports = (lublu) => {
	lublu.DataObject = lublu.DataObject || class DataObject {
		constructor(type, db, data) {
			lublu.log(type + ':new');

			this.type = type;
			this.db = db;
			this.table = lublu.table(type.toLowerCase());
			this.data = data || {};
		}

		static factory(cl, db, data) {
			switch(cl) {
				case 'Post':
					return new lublu.Post(db, data);
			} 
		}

		set(data) {
			for(var k in data) {
				this.data[k] = data[k];
			}

			return this;
		}

		get(field) {
			if(this.data[field]) {
				return this.data[field];
			} else {
				return null;
			}
		}

		clear(options) {
			return new Promise((resolve, reject) => {
				this.db.clear(this.table, options).then(() => {
					resolve();
				}).catch(err => {
					reject(err);
				});
			});
		}

		count() {
			lublu.log(this.type + ':count');

			return new Promise((resolve, reject) => {
				this.db.query(util.format('SELECT COUNT(*)::int as count FROM %s', this.table)).then(rows => {
					resolve(rows[0].count);
				}).catch(err => {
					reject(err);
				});
			});
		}

		save(fields) {
			return new Promise((resolve, reject) => {
				if(this.data.id) {
					lublu.log(this.type + ':update');

					let data = {id: this.data.id};
					if(fields) {
						for(let k in this.data) {
							if(fields.indexOf(k) != -1) {
								data[k] = this.data[k];
							}
						}
					} else {
						data = this.data;
					}

					this.db.update(this.table, data).then(() => {
						resolve(this);
					}).catch((err) => {
						reject(err);
					});
				} else {
					lublu.log(this.type + ':insert');

					this.db.insert(this.table, this.data).then((id) => {
						this.set({id: id});

						this.addTags(this.tags || []).then(() => {
							resolve(this);
						});
					}).catch((err) => {
						reject(err);
					});
				}
			});
		}

		find(id) {
			lublu.log(this.type + ':find');

			return new Promise((resolve, reject) => {
				this.db.query(util.format('SELECT * FROM %s WHERE id = $1 LIMIT 1', this.table), [id]).then((res) => {
					if(res.length == 0) {
						lublu.log(this.type + ':find:not found');

						reject(new Error('not found'));
					} else {
						lublu.log(this.type + ':find:found');

						resolve(DataObject.factory(this.type, this.db, res[0]));
					}
				});
			});
		}

		findAll(options) {
			if(options && (options.offset !== undefined && options.limit !== undefined)) {
				lublu.log(this.type + ':find offset ' + options.offset + ' limit ' + options.limit);

				var sql = 'SELECT * FROM %s LIMIT $1 OFFSET $2';
				var data = [options.limit, options.offset];
			} else {
				lublu.log(this.type + ':find');

				var sql = 'SELECT * FROM %s';
				var data = [];
			}

			return new Promise((resolve, reject) => {
				this.db.query(util.format(sql, this.table), data).then((res) => {
					let posts = [];
					for(let a of res) {
						posts.push(DataObject.factory(this.type, this.db, a));
					}

					resolve(posts);
				});
			});
		}
	}
}