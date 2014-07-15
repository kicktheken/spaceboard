module.exports = function(grunt) {
	grunt.initConfig({
		requirejs: {
			compile: {
				options: {
					baseUrl: "client",
					mainConfigFile: "client/main.js",
					include: "main",
					insertRequire: ['main'],
					name: "lib/almond",
					out: "ios/app/index.js",
					wrap: true
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-requirejs');

	grunt.registerTask('default', ['requirejs']);
};
