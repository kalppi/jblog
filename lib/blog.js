const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	require('./dataobject.js')(lublu);
	
	lublu.Blog = lublu.Blog || class Blog extends lublu.DataObject {
		constructor(data, daoFactory) {
			super(data);

			this.postDAO = daoFactory.create('post', this);
		}

		get posts() {
			return this.postDAO;
		}

		ui(app) {
			return require('./ui/ui.js')(app);
		}
	}
}