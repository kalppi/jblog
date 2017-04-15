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

	let client = null;

	before((done) => {
		blog.connect().then((c) => {
			client = c;

			done();
		});
	});

	describe('Post', function() {
		it('insert', function() {
			let post = client.Post({
				title: 'title',
				content: 'content',
				is_published: true
			});

			return post.save();
		});

		it('find', function() {
			return client.Post().find(1);
		});

		it('addTags', function() {
			return client.Post().find(1).then((post) => {
				return post.addTags(['linux', 'test']);
			});
		});

		it('getTags', function() {
			return client.Post().find(1).then((post) => {
				return post.getTags().should.eventually.to.have.members(['test','linux']);
			});
		});

		it('count', function() {
			return client.Post().count().then((val) => {
				val.should.be.equal(1);
			});
		});


		it('clear', () => {
			return client.Post().clear().then(() => {
				return client.Post().count().then((val) => {
					val.should.be.equal(0);
				});
			});
		});

		it('findAll', function() {
			let post1 = client.Post({
				title: 'title',
				content: 'content'
			});

			let post2 = client.Post({
				title: 'title',
				content: 'content'
			});

			return client.save([post1, post2]).then(() => {
				return client.Post().findAll(1).should.eventually.to.have.length(2);
			});
		});
	});
});



