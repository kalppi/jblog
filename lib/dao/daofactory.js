module.exports = (lublu) => {
	lublu = lublu || {};

	require('./psql/psql.dao.blog')(lublu);
	require('./psql/psql.dao.post')(lublu);
	require('./psql/psql.dao.tag')(lublu);
	require('./psql/psql.dao.user')(lublu);

	lublu.DaoFactory = lublu.DaoFactory || class DaoFactory {
		constructor(method, ...args) {
			this.method = method.toLowerCase();
			this.args = args;
		}

		create(type) {
			let name = lublu.ucFirst(this.method) + lublu.ucFirst(type) + 'DAO';

			if(!lublu[name]) {
				throw new Error('Unknown dao: ' + name);
			}

			return new (Function.prototype.bind.apply(lublu[name], [null].concat(this.args)));
		}
	}
}