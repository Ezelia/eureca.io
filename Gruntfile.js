module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-typescript');

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        typescript: {
            client: {
                src: ['src/Client.class.ts'],
                dest: 'lib/EurecaClient.js',
                options: {
                    target: 'es5',
                    sourceMap: false,
                    declaration: false
                }
            },
            server: {
                src: ['src/Server.class.ts'],
                dest: 'lib/EurecaServer.js',
                options: {
                    target: 'es5',
                    sourceMap: false,
                    declaration: false
                }
            }
        }
    });


    // Default task(s).
    grunt.registerTask('default', ['typescript']);

};