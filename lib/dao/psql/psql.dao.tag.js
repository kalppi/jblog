const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	require('./psql.dao')(lublu);
	
	lublu.PsqlTagDAO = lublu.PsqlTagDAO || class PsqlTagDAO {
		constructor(db) {
			this.type = 'Tag';
			this.table = lublu.table('tag');

			this.options = {
				suppressConflict: true
			};

			this.dao = new lublu.PsqlDAO(db, this.options);
		}

		save(tags) {
			return this.dao.save(this.table, tags);
		}

		clear() {
			return this.dao.clear(this.table);
		}

		count() {
			return this.dao.count(this.table);
		}

		findAll() {
			return this.dao.findAll(this.table, this.type);
		}

		findByName(name) {
			return this.dao.findBy(this.table, this.type, 'tag', name);
		}

		delete(name) {
			return this.dao.delete(this.table, name);
		}
	}
}