const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	require('./psql.dao')(lublu);
	
	lublu.PsqlUserDAO = lublu.PsqlUserDAO || class PsqlUserDAO {
		constructor(db) {
			this.type = 'User';
			this.table = lublu.table('user');

			this.dao = new lublu.PsqlDAO(db);
		}

		create(name) {
			const user = new lublu.User({name: name});
			return this.save(user);
		}

		save(user) {
			return this.dao.save(this.table, user);
		}

		clear() {
			return this.dao.clear(this.table);
		}

		count() {
			return this.dao.count(this.table);
		}

		delete(user) {
			return this.dao.delete(this.table, user);
		}

		findByName(name) {
			return this.dao.findBy(this.table, this.type, 'name', name);
		}
	}
}