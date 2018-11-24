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
  } else if (process.env.BROWSER === 'Electron') {
    browsers = ['electron'];
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

let reporters = ['mocha'];
if (process.env.CI) {
  // stability must be the last reporter as it munges the
  // exit code and always returns 0.
  reporters.push('stability');
}

// uses Safari Technology Preview.
if (os.platform() === 'darwin' && process.env.BVER === 'unstable' &&
    !process.env.SAFARI_BIN) {
  process.env.SAFARI_BIN = '/Applications/Safari Technology Preview.app' +
      '/Contents/MacOS/Safari Technology Preview';
}

if (!process.env.FIREFOX_BIN) {
  process.env.FIREFOX_BIN = process.cwd() + '/browsers/bin/firefox-'
      + (process.env.BVER || 'stable');
}
if (!process.env.CHROME_BIN) {
  process.env.CHROME_BIN = process.cwd() + '/browsers/bin/chrome-'
      + (process.env.BVER || 'stable');
}

let chromeFlags = [
  '--use-fake-device-for-media-stream',
  '--use-fake-ui-for-media-stream',
  '--no-sandbox',
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
      'dist/adapter_core5.js',
      'test/getusermedia-mocha.js',
      'test/e2e/*.js',
    ],
    exclude: [],
    preprocessors: {
      'dist/adapter_core5.js': ['browserify']
    },
    reporters,
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    customLaunchers: {
      chrome: {
        base: 'Chrome',
        flags: chromeFlags
      },
      electron: {
        base: 'Electron',
        flags: ['--use-fake-device-for-media-stream']
      },
      firefox: {
        base: 'Firefox',
        prefs: {
          'media.navigator.streams.fake': true,
          'media.navigator.permission.disabled': true
        },
        flags: ['-headless']
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
    stabilityReporter: {
      path: 'test/e2e/expectations/' +
          process.env.BROWSER +
          (process.env.BVER ? '-' + process.env.BVER : '') +
          (process.env.CHROMEEXPERIMENT === 'false' ? '-no-experimental' : ''),
      update: process.env.UPDATE_STABILITYREPORTER || false,
    }
  });
};
