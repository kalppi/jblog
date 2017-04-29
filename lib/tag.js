const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	require('./dataobject.js')(lublu);
	
	lublu.Tag = lublu.Tag || class Tag extends lublu.DataObject {
		constructor(data) {
			super(data);
		}
	}
}