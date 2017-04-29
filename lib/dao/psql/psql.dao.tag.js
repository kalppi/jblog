const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	require('./psql.dao')(lublu);
	
	lublu.PsqlTagDAO = lublu.PsqlTagDAO || class PsqlTagDAO extends lublu.PsqlDAO {
		constructor(db) {
			super(db);

			this.type = 'Tag';
			this.table = lublu.table('tag');

			this.options = {
				suppressConflict: true
			};
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