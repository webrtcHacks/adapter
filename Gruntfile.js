'use strict';

/* For jshint: */
/* globals module, require */

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      files: ['adapter.js', 'test/*.js']
    },
    jscs: {
      src: ['adapter.js', 'test/*.js'],
      options: {
        config: '.jscsrc',
        'excludeFiles': [
        ]
      }
    },
    testling: {
      files: 'test/test.js'
    },
    copy: {
      build: {
        cwd: '.',
        files: [
          {src: [
            // Make sure to add files that should be included for the NPM
            // package here.
            'adapter.js',
            'bower.json',
            'package.json',
            'CONTRIBUTING.md',
            'LICENSE.md',
            'README.md',
            'README-w3c-tests.md',
            'test/**'
            ],
            dest: 'out',
            nonull: true,
            expand: true
          }
        ]
      }
    },
    clean: {
      build: {
        src: ['out/*']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.registerTask('verify-require', 'Verifies the script can be required in a node context', function () {
      require('./adapter');
  });
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.registerTask('default', ['jshint', 'jscs', 'verify-require']);
  grunt.registerTask('build', ['clean', 'copy']);
};
