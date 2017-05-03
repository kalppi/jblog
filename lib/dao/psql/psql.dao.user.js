'use strict';

const util = require('util');

module.exports = (lublu) => {
	const DataObject = require('../../dataobject')(lublu);

	return class PsqlUserDAO {
		constructor(daoFactory, db) {
			this.type = 'User';
			this.table = lublu.table('user');

			this.dao = daoFactory.create('generic');
		}

		create(name) {
			const user = DataObject.factory('user', {name: name});
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

		find(id) {
			return this.dao.find(this.table, this.type, id);
		}

		findByName(name) {
			return this.dao.findBy(this.table, this.type, 'name', name);
		}
	}
}