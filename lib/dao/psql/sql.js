const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	lublu.SQL = lublu.SQL || class SQL {
		static execute(db, sql, values = []) {
			return new Promise((resolve, reject) => {
				var query = db.query({
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

		static update(db, table, data, returning) {
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

				if(returning) {
					sql += ' RETURNING ' + returning.join(', ');
				}

				lublu.log('>> ' + sql);
				if(values) lublu.log(values);

				db.query(sql, values, function(err, res) {
					if(err) {
						reject(err);
					} else {
						resolve(res.rows[0]);
					}
				});
			});
		}

		static clear(db, table, options = {}) {
			return new Promise((resolve, reject) => {
				if(process.env.NODE_ENV === 'production' && (!options || options.force !== true)) {
					reject(new Error('clear table not allowed'));
				} else {
					lublu.log('clear: ' + table);

					let sql = util.format('DELETE FROM %s', table);

					if(options && options.where) {
						sql += ' WHERE ' + options.where.join(' AND ');
					}

					db.query(sql, [], function(err, res) {
						if(err) {
							reject(err);
						} else {
							resolve();
						}
					});
				}
			});
		}

		static insert(db, table, data, returning, options) {
			returning = returning || [];
			options = options || {};

			returning.push('id');

			return new Promise((resolve, reject) => {
				let keys = Object.keys(data);
				let values = [];
				let p = [];

				for(let i = 0; i < keys.length; i++) {
					p.push('$' + (i + 1));
					values.push(data[keys[i]]);
				}

				let sql = util.format(
					'INSERT INTO %s (%s) VALUES (%s)',
					table,
					keys.join(', '),
					p.join(', ')
				);

				if(options.suppressConflict) {
					sql += ' ON CONFLICT DO NOTHING';
				}

				sql += util.format(' RETURNING %s', returning.join(', '));

				lublu.log('>> ' + sql);
				if(values) lublu.log(values);

				db.query(sql, values, function(err, res) {
					if(err) {
						reject(err);
					} else {
						lublu.log(returning);
						lublu.log(res.rows[0]);

						resolve(res.rows[0]);
					}
				});
			});
		}

		static query(db, sql, values) {
			return new Promise((resolve, reject) => {
				lublu.log('>> ' + sql);
				if(values) lublu.log(values);

				db.query(sql, values || [], (err, res) => {
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