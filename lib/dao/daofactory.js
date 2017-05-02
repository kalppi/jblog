const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	lublu.DaoFactory = lublu.DaoFactory || class DaoFactory {
		constructor(baseType, args = []) {
			if(typeof baseType !== 'string') {
				throw new Error('invalid base type');
			}

			this.baseType = baseType.toLowerCase();
			this.args = args;

			this.proxyObj = {
				get: (target, prop, receiver) => {
					if(target[prop]) {
						return target[prop];
					} else {
						return () => {
							throw new Error(util.format('%s::%s is not implemented', target.constructor.name, prop));
						}
					}
				}
			};
		}

		create(type, ...args) {
			const name = lublu.ucFirst(this.baseType) + lublu.ucFirst(type) + 'DAO';
			const file = util.format('./%s/%s.dao.%s', this.baseType, this.baseType, type);

			try {
				require(file)(lublu);
			} catch (e) {

			}
			
			if(!lublu[name]) {
				throw new Error('Unknown dao: ' + name);
			}

			const dao = new (Function.prototype.bind.apply(lublu[name], [null].concat(this.args).concat(args)));
			const proxy = new Proxy(dao, this.proxyObj);

			return dao;
		}
	}
}