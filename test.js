'use strict';

const chai = require("chai");

chai.use(require('chai-things'));
chai.use(require("chai-as-promised"));
chai.should();

const pg = require('pg');
	
const pool = new pg.Pool(require('./test-db.json'));
const lublu = require('./index.js')(pool);

describe('lublu', function() {
	let blog = null;
	let startId = 0;

	let user = null;

	before(done => {
		lublu.createBlog('test').then(() => {
			lublu.findBlog('test').then(b => {
				blog = b;
				
				user = blog.User({
					name: 'Pera'
				});

				blog.users.save(user).then(() => {
					done();
				});
			});
		}).catch(err => {
			console.log(err);
		});
	});

	beforeEach((done) => {
		let posts = blog.Post([
			{title: 'title1',
			content: 'content1',
			tags: ['test']},
			{title: 'title2',
			content: 'content2'},
			{title: 'title3',
			content: 'content3'},
			{title: 'title4',
			content: 'content4'},
			{title: 'title5',
			content: 'content5'},
			{title: 'title6',
			content: 'content6'},
		]);

		for(let p of posts) {
			p.set('user', user);
		}

		blog.posts.clear().then(() => {
			blog.posts.save(posts).then(() => {
				startId = posts[0].get('id');

				done();
			}).catch(err => {
				console.log(err);
			});
		});
	});

	describe('Post', function() {
		it('#find()', function() {
			return blog.posts.find(1).should.eventually.exist;
		});

		it('#find() with tags', function() {
			return blog.posts.find(startId, {tags: true})
				.should.eventually.have.deep.property('data.tags').deep.equal(['test']);
		});

		it('#findRandom()', function() {
			return blog.posts.findRandom().should.eventually.exist;
		});

		it('#save() new with tags', function() {
			let post = blog.Post({
				title: 'title',
				content: 'aaaaa',
				tags: ['stuff', 'asd'],
				user: user
			});

			return blog.posts.save(post).then(post => {
				return blog.posts.find(post.get('id'), {tags: true})
					.should.eventually.have.deep.property('data.tags').have.length(2);
			});
		});

		it('#save() old with tags', function() {
			let post = blog.Post({
				title: 'title',
				content: 'aaaaa',
				user: user
			});

			return blog.posts.save(post).then(post => {
				return blog.posts.find(post.get('id'), {tags: true}).then(post => {
					post.append('tags', ['aaa', 'bbb']);

					return blog.posts.save(post).then(post => {
						return blog.posts.find(post.get('id'), {tags: true})
							.should.eventually.have.deep.property('data.tags').have.length(2);
					});
				});
			});
		});

		it('#save() old with removed tags', function() {
			let post = blog.Post({
				title: 'title',
				content: 'bbb',
				tags: ['xxx', 'yyy'],
				user: user
			});

			return blog.posts.save(post).then(post => {
				return blog.posts.find(post.get('id'), {tags: true}).then(post => {
					post.remove('tags', ['xxx', 'zzz']);

					return blog.posts.save(post).then(post => {
						return blog.posts.find(post.get('id'), {tags: true})
							.should.eventually.have.deep.property('data.tags').have.length(1);
					});
				});
			});
		});

		it('#count()', function() {
			return blog.posts.count().should.eventually.be.equal(6);
		});

		it('#clear()', () => {
			return blog.posts.clear().then(() => {
				return blog.posts.count().should.eventually.be.equal(0);
			});
		});

		it('#findAll()', function() {
			return blog.posts.findAll().should.eventually.have.length(6);
		});

		it('#findAll() with limit and offset', function() {
			return blog.posts.findAll({offset: 5, limit: 2}).should.eventually.have.length(1);
		});

		it('#publish()', function() {
			return blog.posts.find(startId).then((post) => {
				return blog.posts.publish(post).then(() => {
					post.get('is_published').should.be.equal(true);
					chai.expect(post.get('date_published')).not.be.null;
				});
			});
		});

		it('#unpublish()', function() {
			return blog.posts.find(startId).then((post) => {
				return blog.posts.unpublish(post).then(() => {
					post.get('is_published').should.be.equal(false);
					chai.expect(post.get('date_published')).be.null;
				});
			});
		});

		it('#delete()', function() {
			return blog.posts.count().then(count => {
				return blog.posts.findRandom().then((post) => {
					return blog.posts.delete(post).then(() => {
						return blog.posts.count().should.eventually.be.equal(count - 1);
					});
				});
			});
		});

		it('#delete() multiple', function(done) {
			blog.posts.count().then(count => {
				let findPosts = (count) => {
					return new Promise((resolve, reject) => {
						const findRandom = (count, posts) => {
							blog.posts.findRandom().then((post) => {
								const found = posts.find((p) => {
									return p.get('id') == post.get('id')
								});

								if(!found) {
									posts.push(post);
									count--;
								}

								if(count > 0) {
									findRandom(count, posts);
								} else {
									resolve(posts);
								}
							});
						}

						findRandom(count, []);
					});
				}

				blog.posts.count().then(count => {
					findPosts(3).then(posts => {
						blog.posts.delete(posts).then(() => {
							blog.posts.count().then(count2 => {
								count2.should.be.equal(count - 3);

								done();
							});
						});
					});
				});
			});
		});
	});

	describe('Page', function() {
		it('#getPageCount()', function() {
			return blog.Page(blog.posts, {perPage: 4}).getPageCount().should.eventually.be.equal(2);
		});

		it('#getPage()', function() {
			return blog.Page(blog.posts, {perPage: 4}).getPage(1).should.eventually.have.length(2);
		});


		it('#getPage() outside bounds', function() {
			return blog.Page(blog.posts, {perPage: 4}).getPage(2).should.eventually.have.length(0);
		});
	});

	describe('Tag', function() {
		it('Only allow unique', function() {
			let tag1 = blog.Tag({tag: 'tag'});
			let tag2 = blog.Tag({tag: 'TAG'});

			return blog.tags.clear().then(() => {
				return blog.tags.save([tag1, tag2]).then(() => {
					return blog.tags.count().should.eventually.be.equal(1);
				});
			});
		});
	});
});



