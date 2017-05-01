const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	lublu.DaoFactory = lublu.DaoFactory || class DaoFactory {
		constructor(method, ...args) {
			this.method = method.toLowerCase();
			this.args = args;
		}

		create(type, ...args) {
			const name = lublu.ucFirst(this.method) + lublu.ucFirst(type) + 'DAO';
			const file = util.format('./%s/%s.dao.%s', this.method, this.method, type);

			require(file)(lublu);

			if(!lublu[name]) {
				throw new Error('Unknown dao: ' + name);
			}

			return new (Function.prototype.bind.apply(lublu[name], [null].concat(this.args).concat(args)));
		}
	}
}