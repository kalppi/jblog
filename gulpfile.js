const gulp = require('gulp');
const spawn = require('child_process').spawn;

var server = null;
function spawnServer() {
	if(server) {
		console.log('Killing old server');
		server.kill();
	}

	console.log('Spawning new server...');
    server = spawn('node', ['test-ui.js']);

    server.stderr.on('data', (data) => {
		console.log("> " + data);
	});

	server.stdout.on('data', (data) => {
		console.log("> " + data);
	});

	gulp.watch(['test-ui.js', 'ui/private/**/*.*'], function() {
		console.log('Server change detected, spawning new');

		spawnServer();
	});
}

gulp.task('watch', gulp.series(function watch() {
    spawnServer();
}));