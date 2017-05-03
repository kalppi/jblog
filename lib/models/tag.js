'use strict';

module.exports = (lublu) => {
	const DataObject = require('../dataobject.js')(lublu);
	
	return class Tag extends DataObject {
		constructor(data) {
			super(data);
		}
	}
}