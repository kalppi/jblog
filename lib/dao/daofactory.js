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
			this.daoCache = {};
		}

		create(type, ...args) {
			if(args.length == 0 && this.daoCache[type]) {
				return this.daoCache[type];
			}

			const name = lublu.ucFirst(this.baseType) + lublu.ucFirst(type) + 'DAO',
				file = util.format('./%s/%s.dao.%s', this.baseType, this.baseType, type),
				cargs = [null].concat(this).concat(this.args).concat(args);

			const dao = require(file)(lublu);
			const obj = new (Function.prototype.bind.apply(dao, cargs));

			if(args.length == 0) {
				this.daoCache[type] = obj;	
			}

			return obj;
		}
	}
}