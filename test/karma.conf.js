/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

const os = require('os');

let browsers;
if (process.env.BROWSER) {
  if (process.env.BROWSER === 'MicrosoftEdge') {
    browsers = ['Edge'];
  } else if (process.env.BROWSER === 'safari') {
    browsers = ['Safari'];
  } else {
    browsers = [process.env.BROWSER];
  }
} else if (os.platform() === 'darwin') {
  browsers = ['chrome', 'firefox', 'Safari'];
} else if (os.platform() === 'win32') {
  browsers = ['chrome', 'firefox', 'Edge'];
} else {
  browsers = ['chrome', 'firefox'];
}

let chromeFlags = [
  '--use-fake-device-for-media-stream',
  '--use-fake-ui-for-media-stream',
  '--headless', '--disable-gpu', '--remote-debugging-port=9222'
];
if (process.env.CHROMEEXPERIMENT !== 'false') {
  chromeFlags.push('--enable-experimental-web-platform-features');
}

module.exports = function(config) {
  config.set({
    basePath: '..',
    frameworks: ['browserify', 'mocha', 'chai'],
    files: [
      'src/js/adapter_core.js',
      'test/getusermedia-mocha.js',
      'test/e2e/*.js',
    ],
    exclude: [],
    preprocessors: {
      'src/js/adapter_core.js': ['browserify']
    },
    reporters: ['mocha'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    customLaunchers: {
      chrome: {
        base: 'Chrome',
        flags: chromeFlags
      },
      firefox: {
        base: 'Firefox',
        prefs: {
          'media.navigator.streams.fake': true,
          'media.navigator.permission.disabled': true
        }
      }
    },
    singleRun: true,
    concurrency: Infinity,
    browsers,
    browserify: {
      debug: true,
      transform: ['brfs'],
      standalone: 'adapter',
    },
  });
};
