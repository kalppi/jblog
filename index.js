"use strict";

var util = require('util');

var Promise = require('promise');

const DEBUG = true;

function log(s) {
	if(DEBUG) {
		console.log(s);
	}
}

class Connection {
	constructor(con, done) {
		log('Connection:new');

		this.con = con;
		this.done = done;
	}

	release() {
		log('Connection:release');

		this.done();
	}

	execute(sql, values) {
		log('Connection:execute(' + sql + ')');

		values = values || [];

		return new Promise((resolve, reject) => {
			var query = this.con.query({
					text: sql,
					values: values
				}, (err, result) => {
					if(err) {
						reject(err);
					} else {
						resolve();
					}
				});

			resolve();
		});
	}

	update(table, data) {
		return new Promise((resolve, reject) => {
			var p = [];
			var values = [];
			var i = 1;
			for(var k in data) {
				if(k == 'id') continue;

				p.push(k + '=$' + i);
				values.push(data[k]);

				i++;
			}

			var sql = util.format('UPDATE %s SET %s WHERE id = %s', table, p.join(', '), data.id);

			log('>> ' + sql);
			if(values) log(values);

			this.con.query(sql, values, function(err, res) {
				if(err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	insert(table, data) {
		return new Promise((resolve, reject) => {
			var keys = Object.keys(data);
			var values = [];
			var p = [];
			for(var i = 0; i < keys.length; i++) {
				p.push('$' + (i + 1));
				values.push(data[keys[i]]);
			}

			var sql = util.format('INSERT INTO %s (%s) VALUES (%s) RETURNING id', table, keys.join(', '), p.join(', '));

			log('>> ' + sql);
			if(values) log(values);

			this.con.query(sql, values, function(err, res) {
				if(err) {
					reject(err);
				} else {
					var id = res.rows[0].id;

					log('insert id = ' + id);
					resolve(id);
				}
			});
		});
	}

	query(sql, values) {
		return new Promise((resolve, reject) => {
			log('>> ' + sql);
			if(values) log(values);

			this.con.query(sql, values, (err, res) => {
				if(err) {
					reject(err);
				} else {
					resolve(res.rows);
				}
			});
		});
	}
}

class DB {
	constructor(pool) {
		log('DB:connect');

		this.pool = pool;

		this.pool.on('error', function (err, client) {
			console.error('idle client error', err.message, err.stack)
		});
	}

	getConnection() {
		return new Promise((resolve, reject) => {
			this.pool.connect((err, client, done) => {
				if(err) {
					console.error('error fetching client from pool', err);
					reject(err);
				} else {
					resolve(new Connection(client, done));
				}
			});
		});
	}
}


class DataObject {
	constructor(type, db, con, data) {
		log(type + ':new');

		this.type = type;
		this.db = db;
		this.con = con;
		this.table = 'jblog_' + type.toLowerCase();
		this.data = data || {};
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
}

class Post extends DataObject {
	constructor(db, con, data) {
		super('Post', db, con, data);
	}

	getTags() {
		return new Promise((resolve, reject) => {
			if(!this.tags) {
				var sql = 'SELECT t.tag FROM %s p ' +
					'INNER JOIN jblog_tag_join tj ON tj.post_id = p.id ' + 
					'INNER JOIN jblog_tag t ON t.id = tj.tag_id ' +
					'WHERE p.id = $1';

				this.con.query(util.format(sql, this.table), [this.data.id]).then((res) => {
					var tags = [];
					for(var t of res) {
						tags.push(t.tag);
					}

					this.tags = tags;

					resolve(this.tags);
				}).catch((err) => {
					reject(err);
				});
			} else {
				resolve(this.tags);
			}
		});
	}

	_addTags(tags) {
		return new Promise((resolve, reject) => {
			var newTags = [];

			tags.forEach((tag) => {
				if(this.tags.indexOf(tag) == -1) {
					newTags.push(tag);
				}
			});			

			var promises = [];
			var sql = util.format('INSERT INTO %s (tag) ' + 
				'SELECT $1 WHERE NOT EXISTS (SELECT tag FROM jblog_tag WHERE tag = $2)', 'jblog_tag');
			
			for(var tag of newTags) {
				var p = new Promise((resolve, reject) => {
					this.con.query(sql, [tag, tag]).then((res) => {
						resolve();
					}).catch((err) => {
						reject(err);
					});
				});

				promises.push(p);
			}

			Promise.all(promises).then(() => {
				resolve(newTags);
			}).catch((err) => {
				reject(err);
			});
		});
	}

	_addTagJoins(id, tags) {
		return new Promise((resolve, reject) => {
			var promises = [];
			var sql = util.format('INSERT INTO %s (post_id, tag_id) VALUES ' +
				'($1, (SELECT id FROM jblog_tag WHERE tag = $2 LIMIT 1))', 'jblog_tag_join');

			tags.forEach((tag) => {
				var p = new Promise((resolve, reject) => {
					this.con.query(sql, [id, tag]).then((res) => {
						resolve();
					}).catch((err) => {
						reject(err);
					});
				});

				promises.push(p);
			});

			Promise.all(promises).then(() => {
				resolve();
			}).catch((err) => {
				reject(err);
			});
		});
	}

	addTags(tags) {
		return new Promise((resolve, reject) => {
			if(this.data.id) {
				if(!this.tags) {
					this.getTags().then(() => {
						this._addTags(tags).then((newTags) => {
							this._addTagJoins(this.data.id, newTags).then(() => {
								newTags.forEach((tag) => {
									this.tags.push(tag);
								});

								resolve();
							}).catch((err) => {
								reject(err);
							});
						}).catch((err) => {
							reject(err);
						});
					});
				} else {
					this._addTags(tags).then((newTags) => {
						this._addTagJoins(this.data.id, newTags).then(() => {
							resolve();
						}).catch((err) => {
							reject(err);
						});
					}).catch((err) => {
						reject(err);
					});
				}
			} else {
				if(!this.tags) {
					this.tags = [];
				}

				for(var tag of tags) {
					if(this.tags.indexOf(tag) == -1) {
						this.tags.push(tag);
					}
				}
			}
		});
	}

	publish() {
		if(!this.data.published) {
			this.data.published = true;
			this.data.date_published = new Date();
		}

		if(this.data.id) {
			this.save(['published', 'date_published']);
		}
	}

	unpublish() {
		this.data.published = false;

		if(this.data.id) {
			this.save(['published']);
		}
	}

	save(fields) {
		return new Promise((resolve, reject) => {
			if(this.data.id) {
				log(this.type + ':update');

				var data = {id: this.data.id};
				if(fields) {
					for(var k in this.data) {
						if(fields.indexOf(k) != -1) {
							data[k] = this.data[k];
						}
					}
				} else {
					data = this.data;
				}

				this.con.update(this.table, data).then(() => {
					resolve(this);
				}).catch((err) => {
					reject(err);
				});
			} else {
				log(this.type + ':insert');

				this.con.insert(this.table, this.data).then((id) => {
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
		log(this.type + ':find');

		return new Promise((resolve, reject) => {
			this.con.query(util.format('SELECT * FROM %s WHERE id = $1 LIMIT 1', this.table), [id]).then((res) => {
				if(res.length == 0) {
					log(this.type + ':find:not found');

					resolve(null);
				} else {
					log(this.type + ':find:found');

					resolve(new Post(this.db, this.con, res[0]));
				}
			});
		});
	}

	findAll(offset, limit) {
		if(offset && limit) {
			log(this.type + ':find offset ' + offset + ' limit ' + limit);

			var sql = 'SELECT * FROM %s LIMIT $1 OFFSET $2';
			var data = [limit, offset];
		} else {
			log(this.type + ':find');

			var sql = 'SELECT * FROM %s';
			var data = [];
		}

		return new Promise((resolve, reject) => {
			this.con.query(util.format(sql, this.table), data).then((res) => {
				var posts = [];
				for(var a of res) {
					posts.push(new Post(this.db, this.con, a));
				}

				resolve(posts);
			});
		});
	}

	count() {
		log(this.type + ':count');

		return new Promise((resolve, reject) => {
			this.con.query(util.format('SELECT COUNT(*) AS count FROM %s', this.table)).then((res) => {
				resolve(res[0].count);
			});
		});
	}
}

var db = null;
class Instance {
	constructor(db) {
		this.db = db;
	}

	_connect() {
		return new Promise((resolve, reject) => {
			db.getConnection().then((con) => {
				this.con = con;
				this.dummyPost = new Post(db, this.con);

				resolve();
			}).catch((err) => {
				reject();
			});
		});
	}

	Post(data) {
		if(!data) return this.dummyPost;

		return new Post(db, this.con, data);
	}

	release() {
		this.con.release();
	}
}

class jBlog {
	constructor(pool) {
		db = new DB(pool);
	}

	disconnect() {
		for(var i in connections) {
			connections[i].release();
		}
	}


	getInstance() {
		var ins = new Instance(db);

		return new Promise((resolve, reject) => {
			ins._connect().then(() => {
				resolve(ins);
			}).catch((err) => {
				reject();
			});
		});
	}
}

module.exports = jBlog;