const util = require('util');

module.exports = (lublu) => {
	lublu.Connection = lublu.Connection || class Connection {
		constructor(con, done) {
			lublu.log('Connection:new');

			this.con = con;
			this.done = done;
		}

		release() {
			lublu.log('Connection:release');

			this.done();
		}

		execute(sql, values) {
			lublu.log('Connection:execute(' + sql + ')');

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

				lublu.log('>> ' + sql);
				if(values) lublu.log(values);

				this.con.query(sql, values, function(err, res) {
					if(err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		}

		clear(table, options) {
			return new Promise((resolve, reject) => {
				if(process.env.NODE_ENV === 'production' && (!options || options.force !== true)) {
					reject(new Error('clear table not allowed'));
				} else {
					lublu.log('clear: ' + table);

					this.con.query(util.format('DELETE FROM %s', table), [], function(err, res) {
						if(err) {
							reject(err);
						} else {
							resolve();
						}
					});
				}
			});
		}

		insert(table, data) {
			return new Promise((resolve, reject) => {
				let keys = Object.keys(data);
				let values = [];
				let p = [];

				for(let i = 0; i < keys.length; i++) {
					p.push('$' + (i + 1));
					values.push(data[keys[i]]);
				}

				let sql = util.format('INSERT INTO %s (%s) VALUES (%s) RETURNING id', table, keys.join(', '), p.join(', '));

				lublu.log('>> ' + sql);
				if(values) lublu.log(values);

				this.con.query(sql, values, function(err, res) {
					if(err) {
						reject(err);
					} else {
						let id = res.rows[0].id;

						lublu.log('insert id = ' + id);
						resolve(id);
					}
				});
			});
		}

		query(sql, values) {
			return new Promise((resolve, reject) => {
				lublu.log('>> ' + sql);
				if(values) lublu.log(values);

				this.con.query(sql, values || [], (err, res) => {
					if(err) {
						reject(err);
					} else {
						resolve(res.rows);
					}
				});
			});
		}
	}
}