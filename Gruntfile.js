'use strict';

/* For jshint: */
/* globals module, require */

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      adapterGlobalObject: {
        src: ['./src/js/adapter_core.js'],
        dest: './out/adapter.js',
        options: {
          browserifyOptions: {
            // Exposes shim methods in a global object to the browser.
            // The tests require this.
            // TODO: Replace adapter with <%= pkg.name %>' which uses the name
            // from package.json once we have a better NPM name.
            standalone: 'adapter'
          }
        }
      },
      // Use this if you do not want adapter to expose anything to the global
      // scope.
      adapterAndNoGlobalObject: {
        src: ['./src/js/adapter_core.js'],
        dest: './out/adapter_no_global.js'
      },
      // Use this if you do not want MS edge shim to be included.
      adapterNoEdge: {
        src: ['./src/js/adapter_core.js'],
        dest: './out/adapter_no_edge.js',
        options: {
          // These files will be skipped.
          ignore: [
            './src/js/edge/edge_shim.js',
            './src/js/edge/edge_sdp.js'
          ],
          browserifyOptions: {
            // Exposes the shim in a global object to the browser.
            // The tests require this.
            // TODO: Replace adapter with <%= pkg.name %>' which uses the name
            // from package.json once we have a better NPM name.
            standalone: 'adapter'
          }
        }
      },
      // Use this if you do not want MS edge shim to be included and do not
      // want adapter to expose anything to the global scope.
      adapterNoEdgeAndNoGlobalObject: {
        src: ['./src/js/adapter_core.js'],
        dest: './out/adapter_no_edge_no_global.js',
        options: {
          ignore: [
            './src/js/edge/edge_shim.js',
            './src/js/edge/edge_sdp.js'
          ]
        }
      },
      // The following entries duplicate the entries above but use babelify
      // to create versions safe for old browsers.
      adapterGlobalObjectES5: {
        src: ['./src/js/adapter_core.js'],
        dest: './out/adapter_es5.js',
        options: {
          browserifyOptions: {
            // Exposes shim methods in a global object to the browser.
            // The tests require this.
            // TODO: Replace adapter with <%= pkg.name %>' which uses the name
            // from package.json once we have a better NPM name.
            standalone: 'adapter',
            transform: 'babelify'
          }
        }
      },
      // Use this if you do not want adapter to expose anything to the global
      // scope.
      adapterAndNoGlobalObjectES5: {
        src: ['./src/js/adapter_core.js'],
        dest: './out/adapter_no_global_es5.js',
        options: {
          browserifyOptions: {
            transform: 'babelify'
          }
        }
      },
      // Use this if you do not want MS edge shim to be included.
      adapterNoEdgeES5: {
        src: ['./src/js/adapter_core.js'],
        dest: './out/adapter_no_edge_es5.js',
        options: {
          // These files will be skipped.
          ignore: [
            './src/js/edge/edge_shim.js',
            './src/js/edge/edge_sdp.js'
          ],
          browserifyOptions: {
            // Exposes the shim in a global object to the browser.
            // The tests require this.
            // TODO: Replace adapter with <%= pkg.name %>' which uses the name
            // from package.json once we have a better NPM name.
            standalone: 'adapter',
            transform: 'babelify'
          }
        }
      },
      // Use this if you do not want MS edge shim to be included and do not
      // want adapter to expose anything to the global scope.
      adapterNoEdgeAndNoGlobalObjectES5: {
        src: ['./src/js/adapter_core.js'],
        dest: './out/adapter_no_edge_no_global_es5.js',
        options: {
          ignore: [
            './src/js/edge/edge_shim.js',
            './src/js/edge/edge_sdp.js'
          ],
          browserifyOptions: {
            transform: 'babelify'
          }
        }
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
      target: ['src/**/*.js', 'test/*.js']
    },
  });

  grunt.loadNpmTasks('grunt-githooks');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('default', ['eslint', 'browserify']);
  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('build', ['browserify']);
};
