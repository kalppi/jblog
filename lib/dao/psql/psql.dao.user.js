const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	require('./psql.dao')(lublu);
	
	lublu.PsqlUserDAO = lublu.PsqlUserDAO || class PsqlUserDAO extends lublu.PsqlDAO {
		constructor(db) {
			super(db);

			this.type = 'User';
			this.table = lublu.table('user');
		}

		save(tags) {
			return super.save(this.table, tags);
		}

		clear() {
			return super.clear(this.table);
		}

		count() {
			return super.count(this.table);
		}
	}
}