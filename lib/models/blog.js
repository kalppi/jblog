'use strict';

const util = require('util'),
	UI = require('../../ui/ui.js');

module.exports = (lublu) => {
	const DataObject = require('../dataobject.js')(lublu);
	
	return class Blog extends DataObject {
		constructor(data, daoFactory) {
			super(data);

			this.postDAO = daoFactory.create('post', this);
			this.rightsDAO = daoFactory.create('rights');
		}

		get posts() {
			return this.postDAO;
		}

		grantRights(granter, user, right) {
			if(right == 'owner') {
				return Promise.reject(new Error('can\'t allow granting owner'));
			}

			return new Promise((resolve, reject) => {
				this.rightsDAO.get(this, [granter, user]).then(rights => {
					const granterRights = rights[0];
					const userRights = rights[1];

					userRights.set('rights', right);

					if(!granterRights.canGrant(right)) {
						reject(new Error('user can\'t grant specified rights'));
					} else {
						this.rightsDAO.save(userRights).then(() => {
							resolve();
						})
					}
				});
			});
		}

		denyRights(denyer, user) {
			return new Promise((resolve, reject) => {
				this.rightsDAO.get(this, [denyer, user]).then(rights => {
					const denyerRights = rights[0];
					const userRights = rights[1];

					if(userRights.isOwner()) {
						reject(new Error('can\'t deny owner rights'));
					} else if(!denyerRights.canGrant()) {
						reject(new Error('user can\'t deny specified rights'));
					} else {
						this.rightsDAO.delete(userRights).then(() => {
							resolve();
						})
					}
				});
			});
		}
	}
}