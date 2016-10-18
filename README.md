# jBlog

Simple nodejs+postgresql blogging engine

## Install

```
npm install pg github:kalppi/jblog
```

Somehow run `create-db.sql`

## Usage

```
var pg = require('pg');
var jblog = require('jblog');

var pool = new pg.Pool({
	user: 'user',
	password: 'password',
	database: 'database',
	host: 'localhost',
	port: 5432,
	max: 10,
	idleTimeoutMillis: 30000
});

var blog = new jblog(pool);

blog.getInstance().then((blog) => {
	var post = blog.Post({
		title: 'title',
		content: 'content',
		published: true
	});

	post.addTags(['linux', 'test']);

	post.save().then((a) => {
		a.getTags().then((tags) => {
			console.log(tags);

			blog.release();
		}).catch((err) => {
			console.log(err);
		});
	});
}).catch((err) => {
	console.log(err);
});

```
