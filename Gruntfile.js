'use strict';
var commonjs = require('rollup-plugin-commonjs');
var ignore = require('rollup-plugin-ignore');
var nodeResolve = require('rollup-plugin-node-resolve');

var ignoreEdge = [ignore('./edge/edge_shim.js')];

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    rollup: {
      options: {
        format: 'umd',
        moduleName: 'adapter',
        indent: false,
        plugins: [
          nodeResolve(),
          commonjs({ include: 'node_modules/sdp/**/*.js' })
        ]
      },
      adapterGlobalObject: {
        src: './src/js/adapter_core.js',
        dest: './out/adapter.js'
      },
      // Use this if you do not want adapter to expose anything to the global
      // scope.
      adapterAndNoGlobalObject: {
        options: {
          format: 'iife',
          exports: 'none',
        },
        src: './src/js/adapter_private.js',
        dest: './out/adapter_no_global.js'
      },
      // Use this if you do not want Microsoft Edge shim to be included.
      adapterNoEdge: {
        options: {
          plugins: ignoreEdge
        },
        src: './src/js/adapter_core.js',
        dest: './out/adapter_no_edge.js'
      },
      // Use this if you do not want Microsoft Edge shim to be included and
      // do not want adapter to expose anything to the global scope.
      adapterNoEdgeAndNoGlobalObject: {
        options: {
          format: 'iife',
          exports: 'none',
          plugins: ignoreEdge
        },
        src: './src/js/adapter_private.js',
        dest: './out/adapter_no_edge_no_global.js'
      }
    },
    githooks: {
      all: {
        'pre-commit': 'lint'
      }
    },
    eslint: {
      options: {
        configFile: '.eslintrc'
      },
      target: ['src/**/*.js', 'test/*.js', 'test/unit/*.js']
    },
    copy: {
      build: {
        dest: 'release/',
        cwd: 'out',
        src: '**',
        nonull: true,
        expand: true
      }
    },
  });

  grunt.loadNpmTasks('grunt-githooks');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-rollup');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', ['eslint', 'rollup']);
  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('build', ['rollup']);
  grunt.registerTask('copyForPublish', ['copy']);
};
