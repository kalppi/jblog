const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	require('./dataobject.js')(lublu);
	
	lublu.User = lublu.User || class User extends lublu.DataObject {
		constructor(data) {
			super(data);
		}
	}
}