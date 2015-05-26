'use strict';

/* For jshint: */
/* globals module */

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      files: ['adapter.js']
    },
    jscs: {
      src: 'adapter.js',
      options: {
        config: '.jscsrc',
        'excludeFiles': [
        ]
      }
    },
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.registerTask('default', ['jshint', 'jscs']);
};
