'use strict';

module.exports = (lublu) => {
	const DataObject = require('../dataobject.js')(lublu);
	
	return class Post extends DataObject {
		constructor(data) {
			super(data);
		}
	}
}