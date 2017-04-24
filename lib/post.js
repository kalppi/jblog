const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};
	
	lublu.Post = lublu.Post || class Post extends lublu.DataObject {
		constructor(db, data) {
			super('Post', db, data);
		}

		getTags() {
			return new Promise((resolve, reject) => {
				if(!this.tags) {
					let sql = util.format('SELECT t.tag FROM %s p ' +
						'INNER JOIN %s tj ON tj.post_id = p.id ' + 
						'INNER JOIN %s t ON t.id = tj.tag_id ' +
						'WHERE p.id = $1', this.table, lublu.table('tag_join'), lublu.table('tag'));

					this.db.query(sql, [this.data.id]).then((res) => {
						let tags = [];
						for(let t of res) {
							tags.push(t.tag);
						}

						this.tags = tags;

						resolve(this.tags);
					}).catch((err) => {
						reject(err);
					});
				} else {
					resolve(this.tags);
				}
			});
		}

		_addTags(tags) {
			return new Promise((resolve, reject) => {
				let newTags = [];

				tags.forEach((tag) => {
					if(this.tags.indexOf(tag) == -1) {
						newTags.push(tag);
					}
				});			

				let promises = [];
				let sql = util.format('INSERT INTO %s (tag) VALUES ($1) ON CONFLICT DO NOTHING', lublu.table('tag'));
				
				for(let tag of newTags) {
					let p = new Promise((resolve, reject) => {
						this.db.query(sql, [tag]).then((res) => {
							resolve();
						}).catch((err) => {
							reject(err);
						});
					});

					promises.push(p);
				}

				Promise.all(promises).then(() => {
					resolve(newTags);
				}).catch((err) => {
					reject(err);
				});
			});
		}

		_addTagJoins(id, tags) {
			return new Promise((resolve, reject) => {
				let promises = [];
				let sql = util.format('INSERT INTO %s (post_id, tag_id) VALUES ' +
					'($1, (SELECT id FROM %s WHERE tag = $2 LIMIT 1))', lublu.table('tag_join'), lublu.table('tag'));

				tags.forEach((tag) => {
					let p = new Promise((resolve, reject) => {
						this.db.query(sql, [id, tag]).then((res) => {
							resolve();
						}).catch((err) => {
							reject(err);
						});
					});

					promises.push(p);
				});

				Promise.all(promises).then(() => {
					resolve();
				}).catch((err) => {
					reject(err);
				});
			});
		}

		addTags(tags) {
			return new Promise((resolve, reject) => {
				if(this.data.id) {
					if(!this.tags) {
						this.getTags().then(() => {
							this._addTags(tags).then((newTags) => {
								this._addTagJoins(this.data.id, newTags).then(() => {
									newTags.forEach((tag) => {
										this.tags.push(tag);
									});

									resolve();
								}).catch((err) => {
									reject(err);
								});
							}).catch((err) => {
								reject(err);
							});
						});
					} else {
						this._addTags(tags).then((newTags) => {
							this._addTagJoins(this.data.id, newTags).then(() => {
								resolve();
							}).catch((err) => {
								reject(err);
							});
						}).catch((err) => {
							reject(err);
						});
					}
				} else {
					if(!this.tags) {
						this.tags = [];
					}

					for(let tag of tags) {
						if(this.tags.indexOf(tag) == -1) {
							this.tags.push(tag);
						}
					}

					resolve();
				}
			});
		}

		publish() {
			return new Promise((resolve, reject) => {
				this.data.is_published = true;

				if(this.data.id) {
					super.save(['is_published'], ['date_published']).then(() => {
						resolve(this);
					}).catch(err => {
						reject(err);
					});
				} else {
					resolve(this);
				}
			});
		}

		unpublish() {
			return new Promise((resolve, reject) => {
				this.data.is_published = false;
				this.data.date_published = null;

				if(this.data.id) {
					super.save(['is_published', 'date_published']).then(() => {
						resolve(this);
					}).catch(err => {
						reject(err);
					});
				} else {
					resolve(this);
				}
			});
		}

		save() {
			return new Promise((resolve, reject) => {
				super.save().then(() => {
					this.addTags(this.tags || []).then(() => {
						resolve(this);
					}).catch(err => {
						reject(err);
					});
				});
			}).catch(err => {
				reject();
			});
		}
	}
};