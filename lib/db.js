module.exports = (lublu) => {
	const Connection = require('./connection.js')(lublu);

	return class DB {
		constructor(pool) {
			lublu.log('DB:connect');

			this.pool = pool;

			this.pool.on('error', function (err, client) {
				console.error('client error', err.message, err.stack)
			});
		}

		getConnection() {
			return new Promise((resolve, reject) => {
				this.pool.connect((err, client, done) => {
					if(err) {
						console.error('error fetching client from pool', err);
						reject(err);
					} else {
						resolve(new Connection(client, done));
					}
				});
			});
		}
	}
}