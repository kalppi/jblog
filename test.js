'use strict';

const chai = require("chai");

chai.use(require('chai-things'));
chai.use(require("chai-as-promised"));
chai.should();

const pg = require('pg');
const pool = new pg.Pool(require('./test-db.json'));
const Lublu = require('./index.js');
const lublu = new Lublu('psql', pool);

describe('lublu', function() {
	let blog = null;
	let user = null;
	let user2 = null;
	let startId = 0;

	const clean = () => {
		return new Promise((resolve, reject) => {
			const p1 = new Promise((resolve, reject) => {
				lublu.blogs.findByName('test-blog').then(blog => {
					lublu.blogs.delete(blog).then(resolve);
				}, resolve);
			});

			const p2 = new Promise((resolve, reject) => {
				lublu.tags.findByName(['test-tag1', 'test-tag2']).then(tags => {
					lublu.tags.delete(tags).then(resolve);
				}, resolve);
			});

			const p3 = new Promise((resolve, reject) => {
				lublu.users.findByName(['test-user1', 'test-user2']).then(user => {
					lublu.users.delete(user).then(resolve);
				}, resolve);
			});

			Promise.all([p1, p2, p3]).then(resolve);
		});
	};

	before(done => {
		clean().then(() => {
			user = lublu.User({
				name: 'test-user1'
			});

			user2 = lublu.User({
				name: 'test-user2'
			});

			lublu.users.save([user, user2]).then(() => {
				lublu.blogs.create('test-blog', user).then(b => {
					blog = b;

					done();
				});
			});
		});
	});

	after(done => {
		clean().then(() => {
			done();
		});
	});

	beforeEach((done) => {
		let posts = lublu.Post([
			{title: 'title1',
			content: 'content1',
			tags: ['test-tag1']},
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
			return blog.posts.find(startId).should.eventually.exist;
		});

		it('#find() with tags', function() {
			return blog.posts.find(startId, {tags: true})
				.should.eventually.have.deep.property('data.tags').deep.equal(['test-tag1']);
		});

		it('#findRandom()', function() {
			return blog.posts.findRandom().should.eventually.exist;
		});

		it('#save() new with tags', function() {
			let post = lublu.Post({
				title: 'title',
				content: 'aaaaa',
				tags: ['test-tag1', 'test-tag2'],
				user: user
			});

			return blog.posts.save(post).then(post => {
				return blog.posts.find(post.get('id'), {tags: true})
					.should.eventually.have.deep.property('data.tags').have.length(2);
			});
		});

		it('#save() old with tags', function() {
			let post = lublu.Post({
				title: 'title',
				content: 'aaaaa',
				user: user
			});

			return blog.posts.save(post).then(post => {
				return blog.posts.find(post.get('id'), {tags: true}).then(post => {
					post.append('tags', ['test-tag1', 'test-tag2']);

					return blog.posts.save(post).then(post => {
						return blog.posts.find(post.get('id'), {tags: true})
							.should.eventually.have.deep.property('data.tags').have.length(2);
					});
				});
			});
		});

		it('#save() old with removed tags', function() {
			let post = lublu.Post({
				title: 'title',
				content: 'bbb',
				tags: ['test-tag1', 'test-tag2'],
				user: user
			});

			return blog.posts.save(post).then(post => {
				return blog.posts.find(post.get('id'), {tags: true}).then(post => {
					post.remove('tags', ['test-tag1', 'test-tag3']);

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
			return lublu.Page(blog.posts, {perPage: 4}).getPageCount().should.eventually.be.equal(2);
		});

		it('#getPage()', function() {
			return lublu.Page(blog.posts, {perPage: 4}).getPage(1).should.eventually.have.length(2);
		});


		it('#getPage() outside bounds', function() {
			return lublu.Page(blog.posts, {perPage: 4}).getPage(2).should.eventually.have.length(0);
		});
	});

	describe('Tag', function() {
		it('Only allow unique', function() {
			let tag = lublu.Tag({tag: 'TEST-TAG1'});

			return lublu.tags.save(tag).then(() => {
				return lublu.tags.count().should.eventually.be.equal(2);
			});
		});
	});
});



