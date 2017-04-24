"use strict";

const DEBUG = process.env.NODE_ENV !== 'production' && !process.env.TEST;

const lublu = {
	log: function(s) {
		if(DEBUG) {
			console.log(s);
		}
	},

	table: function (name) {
		return 'lublu_' + name.toLowerCase();
	}
};

require('./lib/dataobject.js')(lublu);
require('./lib/post.js')(lublu);
require('./lib/connection.js')(lublu);

module.exports = class {
	constructor(db) {
		this.db = new lublu.Connection(db);
	}

	Post(data) {
		return new lublu.Post(this.db, data);
	}

	clear() {
		return new Promise((resolve, reject) => {
			new Post(this.db).clear().then(() => {
				resolve();
			}).catch(err => {
				reject(err);
			});
		});
	}

	save(objects) {
		return new Promise((resolve, reject) => {
			let promises = [];

			for(let o of objects) {
				promises.push(o.save());
			}

			Promise.all(promises).then(values => {
				resolve(values);
			}).catch(err => {
				reject(err);
			});
		});
	}
}