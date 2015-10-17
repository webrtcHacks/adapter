'use strict';

/* For jshint: */
/* globals module, require */

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      js: {
        src: ['adapter-core.js'],
        dest: 'adapter.js'
      }
    },
    githooks: {
      all: {
        'pre-commit': 'jshint jscs'
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      files: ['adapter-core.js', 'test/*.js']
    },
    jscs: {
      src: ['adapter-core.js', 'test/*.js'],
      options: {
        config: '.jscsrc',
        'excludeFiles': [
        ]
      }
    },
    testling: {
      files: 'test/test.js'
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-githooks');
  grunt.loadNpmTasks('grunt-browserify');;
  grunt.registerTask('verify-require', 'Verifies the script can be required in a node context', function () {
      require('./adapter');
  });
  grunt.registerTask('default', ['jshint', 'jscs', 'browserify', 'verify-require']);
};
