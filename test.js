'use strict';

const chai = require("chai");

chai.use(require('chai-things'));
chai.use(require("chai-as-promised"));
chai.should();

const pg = require('pg');
const lublu = require('./index.js');

const pool = new pg.Pool({
	user: 'jarno',
	database: 'lublu',
	host: 'localhost',
	port: 5432,
	max: 10,
	idleTimeoutMillis: 30000
});

describe('lublu', function() {
	const blog = new lublu(pool);

	let client = blog;
	let startId = 0;

	beforeEach((done) => {
		let post1 = client.Post({
			title: 'title1',
			content: 'content1'
		});

		let post2 = client.Post({
			title: 'title2',
			content: 'content2'
		});

		let post3 = client.Post({
			title: 'title3',
			content: 'content3'
		});

		let post4 = client.Post({
			title: 'title4',
			content: 'content4'
		});

		let post5 = client.Post({
			title: 'title5',
			content: 'content5'
		});

		let post6 = client.Post({
			title: 'title6',
			content: 'content6'
		});

		client.Post().clear().then(() => {
			client.save([post1, post2, post3, post4, post5, post6]).then(() => {
				startId = post1.get('id');

				done();
			}).catch(err => {
				console.log(err);
			});
		});
	});

	describe('Post', function() {
		it('#find()', function() {
			return client.Post().find(1).should.eventually.to.exist;
		});

		it('#find() with tags', function() {
			return client.Post().find(startId, {tags: true}).should.to.eventually.have.deep.property('data.tags');
		});

		it('#addTags() new post', function() {
			let post = client.Post({
				title: 'title',
				content: 'content'
			});

			return post.addTags(['stuff']).then(() => {
				return post.save();
			});
		});

		it('#addTags() existing post', function() {
			return client.Post().find(startId).then((post) => {
				return post.addTags(['linux', 'test']);
			});
		});

		it('#getTags()', function() {
			return client.Post().find(startId).then((post) => {
				return post.addTags(['linux', 'test']).then(() => {
					return client.Post().find(startId).then((post) => {
						return post.getTags().should.eventually.to.have.members(['test','linux']);
					});
				});
			});
		});

		it('#count()', function() {
			return client.Post().count().should.eventually.to.be.equal(6);
		});

		it('#clear()', () => {
			return client.Post().clear().then(() => {
				return client.Post().count().should.eventually.to.be.equal(0);
			});
		});

		it('#findAll()', function() {
			return client.Post().findAll().should.eventually.to.have.length(6);
		});

		it('#findAll() with limit and offset', function() {
			return client.Post().findAll({offset: 5, limit: 2}).should.eventually.to.have.length(1);
		});

		it('#findAll() with tags', function() {
			return client.Post().findAll({tags: true})
				.should.eventually.to.have.length(6)
				.and.should.eventually.to.all.have.deep.property('data.tags');
		});

		it('#findAll() with tags, limit and offset', function() {
			return client.Post().findAll({tags: true, offset: 5, limit: 2})
				.should.eventually.to.have.length(1)
				.and.should.eventually.to.all.have.deep.property('data.tags');
		});

		it('#publish()', function() {
			return client.Post().find(startId).then((post) => {
				return post.publish().then(() => {
					post.get('is_published').should.be.equal(true);
					chai.expect(post.get('date_published')).to.not.be.null;
				});
			});
		});

		it('#unpublish()', function() {
			return client.Post().find(startId).then((post) => {
				return post.unpublish().then(() => {
					post.get('is_published').should.be.equal(false);
					chai.expect(post.get('date_published')).to.be.null;
				});
			});
		});

		it('#delete()', function() {
			return client.Post().count().then(count => {
				return client.Post().findRandom().then((post) => {
					return post.delete().then(() => {
						return client.Post().count().should.eventually.to.be.equal(count - 1);
					});
				});
			});
		});
	});

	describe('Page', function() {
		it('#getPageCount()', function() {
			return client.Page(4).getPageCount().should.eventually.to.be.equal(2);
		});

		it('#getPage()', function() {
			return client.Page(4).getPage(1).should.eventually.to.have.length(2);
		});


		it('#getPage() outside bounds', function() {
			return client.Page(4).getPage(2).should.eventually.to.have.length(0);
		});
	});

	describe('Tag', function() {
		it('Only allow unique', function() {
			let tag1 = client.Tag('tag');
			let tag2 = client.Tag('TAG');

			return client.Tag().clear().then(() => {
				return client.save([tag1, tag2]).then(() => {
					return client.Tag().count().should.eventually.be.equal(1);
				});
			});
		});
	});
});



