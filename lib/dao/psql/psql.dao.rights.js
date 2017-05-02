const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	require('./psql.dao')(lublu);
	require('./sql')(lublu);

	const SQL = lublu.SQL;
	
	lublu.PsqlRightsDAO = lublu.PsqlRightsDAO || class PsqlRightsDAO {
		constructor(db) {
			this.db = db;
			this.type = 'Rights';
			this.table = lublu.table('rights_join');

			this.dao = new lublu.PsqlDAO(db);
		}

		get(blog, users) {
			let returnArray = false;

			if(Array.isArray(users)) {
				returnArray = true;
			} else {
				users = [users];
			}

			const get = (blog, user) => {
				return new Promise((resolve, reject) => {
					const sql = util.format(`
						WITH r AS (
							SELECT
								id, rights
							FROM %s
							WHERE blog_id = $1 AND user_id = $2
							LIMIT 1
						)

						SELECT
							id, rights
						FROM r

						UNION
						
						SELECT 0 AS id, 'none' AS rights
						WHERE NOT EXISTS (SELECT 1 FROM r);
					`, this.table);
					
					SQL.query(this.db, sql, [blog.get('id'), user.get('id')]).then(rows => {
						const data = {
							id: rows[0].id,
							user: user,
							blog: blog,
							rights: rows[0].rights
						};

						resolve(lublu.DataObject.factory(this.type, data));
					}).catch(reject);
				});
			};

			const promises = [];

			for(let u of users) {
				promises.push(get(blog, u));
			}

			return new Promise((resolve, reject) => {
				Promise.all(promises).then(rights => {
					if(returnArray) {
						resolve(rights);
					} else {
						resolve(rights[0]);
					}
				})
			});
		}

		save(rights) {
			if(!Array.isArray(rights)) {
				rights = [rights];
			}

			for(let o of rights) {
				o.set({
					blog_id: o.get('blog').get('id'),
					user_id: o.get('user').get('id')
				});
			}

			return this.dao.save(this.table, rights, ['blog_id', 'user_id', 'rights']);
		}
	}
}