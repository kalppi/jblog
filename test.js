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

	before((done) => {
		done();
	});

	describe('Post', function() {
		it('#insert()', function(done) {
			let post = client.Post({
				title: 'title',
				content: 'content'
			});

			post.save().then(() => {
				done();
			});
		});

		it('#find()', function() {
			return client.Post().find(1).should.eventually.to.exist;
		});

		it('#find() with tags', function() {
			return client.Post().find(1, {tags: true}).should.to.eventually.have.deep.property('data.tags');
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
			return client.Post().find(2).then((post) => {
				return post.addTags(['linux', 'test']);
			});
		});

		it('#getTags()', function() {
			return client.Post().find(2).then((post) => {
				return post.getTags().should.eventually.to.have.members(['test','linux']);
			});
		});

		it('#count()', function() {
			return client.Post().count().should.eventually.to.be.equal(2);
		});


		it('#clear()', () => {
			return client.Post().clear().then(() => {
				return client.Post().count().should.eventually.to.be.equal(0);
			});
		});

		it('#findAll()', function() {
			let post1 = client.Post({
				title: 'title',
				content: 'content'
			});

			let post2 = client.Post({
				title: 'title',
				content: 'content'
			});

			let post3 = client.Post({
				title: 'title',
				content: 'content'
			});

			return client.save([post1, post2, post3]).then(() => {
				return client.Post().findAll().should.eventually.to.have.length(3);
			});
		});

		it('#findAll() with limit and offset', function() {
			return client.Post().findAll({offset: 2, limit: 2}).should.eventually.to.have.length(1);
		});

		it('#findAll() with tags', function() {
			return client.Post().findAll({tags: true})
				.should.eventually.to.have.length(3)
				.and.should.eventually.to.all.have.deep.property('data.tags');
		});

		it('#findAll() with tags, limit and offset', function() {
			return client.Post().findAll({tags: true, offset: 2, limit: 2})
				.should.eventually.to.have.length(1)
				.and.should.eventually.to.all.have.deep.property('data.tags');
		});

		it('#publish()', function() {
			return client.Post().find(4).then((post) => {
				return post.publish().then(() => {
					post.get('is_published').should.be.equal(true);
					chai.expect(post.get('date_published')).to.not.be.null;
				});
			});
		});

		it('#unpublish()', function() {
			return client.Post().find(4).then((post) => {
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



