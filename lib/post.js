const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	require('./dataobject.js');

	lublu.Post = lublu.Post || class Post extends lublu.DataObject {
		constructor(db, data) {
			super('Post', db, data);
		}

		getTags() {
			return new Promise((resolve, reject) => {
				if(!this.tags) {
					const sql = util.format(`SELECT t.tag FROM %s tj
						LEFT JOIN %s t ON t.id = tj.tag_id
						WHERE tj.post_id = $1`, lublu.table('tag_join'), lublu.table('tag'));

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
						newTags.push(this.factory('Tag', {tag: tag}));
					}
				});

				let promises = [];

				for(let tag of newTags) {
					promises.push(tag.save());
				}

				Promise.all(promises).then(values => {
					resolve(values);
				}).catch(err => {
					reject(err);
				});


				/*
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
				});*/
			});
		}

		_addTagJoins(id, tags) {
			return new Promise((resolve, reject) => {
				let promises = [];
				let sql = util.format('INSERT INTO %s (post_id, tag_id) VALUES ' +
					'($1, (SELECT id FROM %s WHERE tag = $2 LIMIT 1))', lublu.table('tag_join'), lublu.table('tag'));

				tags.forEach((tag) => {
					let p = new Promise((resolve, reject) => {
						this.db.query(sql, [id, tag.get('tag')]).then((res) => {
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
										this.tags.push(tag.get('tag'));
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
								newTags.forEach((tag) => {
									this.tags.push(tag.get('tag'));
								});

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

		find(id, options) {
			options = options || {};

			lublu.log(this.type + ':find');

			if(options.tags) {
				const sql = util.format(`SELECT p.id, p.title, p.content, p.is_published, p.date_published, p.date_updated,
					array_remove(array_agg(t.tag), NULL) AS tags
					FROM %s p
					LEFT JOIN %s tj ON tj.post_id = p.id
					LEFT JOIN %s t ON t.id = tj.tag_id
					WHERE p.id = $1
					GROUP BY p.id`, this.table, lublu.table('tag_join'), lublu.table('tag'));

				return new Promise((resolve, reject) => {
					this.db.query(sql, [id]).then((res) => {
						if(res.length == 0) {
							lublu.log(this.type + ':find:not found');

							reject(new Error('not found'));
						} else {
							lublu.log(this.type + ':find:found');

							resolve(lublu.DataObject.factory(this.type, this.db, res[0]));
						}
					});
				});
			} else {
				return super.find(id);
			}
		}

		findAll(options) {
			options = options || {};


			if(options.tags) {
				let sql = util.format(`SELECT p.id, p.title, p.content, p.is_published, p.date_published, p.date_updated,
					array_remove(array_agg(t.tag), NULL) AS tags
					FROM %s p
					LEFT JOIN %s tj ON tj.post_id = p.id
					LEFT JOIN %s t ON t.id = tj.tag_id
					GROUP BY p.id`, this.table, lublu.table('tag_join'), lublu.table('tag'));

				let data = [];

				if(options.offset !== undefined && options.limit !== undefined) {
					lublu.log(this.type + ':find offset ' + options.offset + ' limit ' + options.limit);

					sql += ' LIMIT $1 OFFSET $2';
					
					data.push(options.limit);
					data.push(options.offset);
				} else {
					lublu.log(this.type + ':find');
				}

				return new Promise((resolve, reject) => {
					this.db.query(sql, data).then((res) => {
						let posts = [];
						for(let a of res) {
							posts.push(lublu.DataObject.factory(this.type, this.db, a));
						}

						resolve(posts);
					});
				});

			} else {
				return super.findAll(options);
			}
		}
	}
};