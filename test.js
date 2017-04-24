'use strict';

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
 
chai.use(chaiAsPromised);
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
		it('#insert()', function() {
			let post = client.Post({
				title: 'title',
				content: 'content'
			});

			return post.save();
		});

		it('#find()', function() {
			return client.Post().find(1);
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
			return client.Post().count().then((val) => {
				val.should.be.equal(2);
			});
		});


		it('#clear()', () => {
			return client.Post().clear().then(() => {
				return client.Post().count().then((val) => {
					val.should.be.equal(0);
				});
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
						return client.Post().count().then(count2 => {
							count2.should.be.equal(count - 1);
						})
					});
				});
			});
		});
	});
});



