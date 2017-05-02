const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	require('./dataobject.js')(lublu);
	
	lublu.Blog = lublu.Blog || class Blog extends lublu.DataObject {
		constructor(data, daoFactory) {
			super(data);

			this.postDAO = daoFactory.create('post', this);
			this.rightsDAO = daoFactory.create('rights');
		}

		get posts() {
			return this.postDAO;
		}

		grantRights(granter, user, right) {
			return new Promise((resolve, reject) => {
				this.rightsDAO.get(this, [granter, user]).then(rights => {
					const granterRights = rights[0];
					const userRights = rights[1];

					const newRights = new lublu.Rights({
						blog: this,
						user: user,
						rights: right
					});

					if(!granterRights.canGrant()) {
						reject(new Error('user can\'t grant specified rights'));
					} else if(userRights.greaterOrEqual(newRights)) {
						resolve();
					} else {
						this.rightsDAO.save(newRights).then(() => {
							resolve();
						})
					}
				});
			});
		}

		ui(app) {
			return require('../ui/ui.js')(app, lublu, this);
		}
	}
}