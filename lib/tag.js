const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	require('./dataobject.js');

	lublu.Tag = lublu.Tag || class Tag extends lublu.DataObject {
		constructor(db, data) {
			super('Tag', db, data);

			this.options = {
				suppressConflict: true
			};
		}
	}
};