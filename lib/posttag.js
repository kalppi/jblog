const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	require('./dataobject.js')(lublu);
	
	lublu.PostTag = lublu.PostTag || class PostTag extends lublu.DataObject {
		constructor(data) {
			super(data);
		}
	}
}