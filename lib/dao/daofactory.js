'use strict';

const util = require('util');

module.exports = (lublu) => {
	return class DaoFactory {
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
			const cargs = [null].concat(this).concat(this.args).concat(args);

			try {
				const dao = require(file)(lublu);
				const obj = new (Function.prototype.bind.apply(dao, cargs));

				return obj;
			} catch (e) {
				console.log(e);
			}
			const proxy = new Proxy(dao, this.proxyObj);
		}
	}
}