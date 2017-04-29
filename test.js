'use strict';

const chai = require("chai");

chai.use(require('chai-things'));
chai.use(require("chai-as-promised"));
chai.should();

const pg = require('pg');
const lublu = require('./index.js');
	
const pool = new pg.Pool(require('./test-db.json'));

describe('lublu', function() {
	const blog = new lublu(pool);

	let startId = 0;

	beforeEach((done) => {
		let post1 = blog.Post({
			title: 'title1',
			content: 'content1',
			tags: ['test']
		});

		let post2 = blog.Post({
			title: 'title2',
			content: 'content2'
		});

		let post3 = blog.Post({
			title: 'title3',
			content: 'content3'
		});

		let post4 = blog.Post({
			title: 'title4',
			content: 'content4'
		});

		let post5 = blog.Post({
			title: 'title5',
			content: 'content5'
		});

		let post6 = blog.Post({
			title: 'title6',
			content: 'content6'
		});

		blog.posts.clear().then(() => {
			blog.posts.save([post1, post2, post3, post4, post5, post6]).then(() => {
				startId = post1.get('id');

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
				tags: ['stuff', 'asd']
			});

			return blog.posts.save(post).then(post => {
				return blog.posts.find(post.get('id'), {tags: true})
					.should.eventually.have.deep.property('data.tags').have.length(2);
			});
		});

		it('#save() old with tags', function() {
			let post = blog.Post({
				title: 'title',
				content: 'aaaaa'
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
				tags: ['xxx', 'yyy']
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
				let findPosts = new Promise((resolve, reject) => {
					const findRandom = (count, posts, ids) => {
						blog.posts.findRandom().then((post) => {
							if(ids.indexOf(post.get('id')) == -1) {
								ids.push(post.get('id'));
								posts.push(post);
								count--;
							}

							if(count > 0) {
								findRandom(count, posts, ids);
							} else {
								resolve(posts);
							}
						});
					}

					findRandom(3, [], []);
				});

				blog.posts.count().then(count => {
					findPosts.then(posts => {
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



