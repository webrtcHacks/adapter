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
const path = require('path');
const http = require('http');
const {spawn} = require('child_process');
const puppeteerBrowsers = require('@puppeteer/browsers');

const SAFARIDRIVER_BIN = process.env.SAFARIDRIVER_BIN ||
    '/usr/bin/safaridriver';

async function download(browser, version, cacheDir, platform) {
  const buildId = await puppeteerBrowsers
    .resolveBuildId(browser, platform, version);
  await puppeteerBrowsers.install({
    browser,
    buildId,
    cacheDir,
    platform
  });
  return buildId;
}

function isListening(port) {
  return new Promise((resolve) => {
    const request = http.get({host: '127.0.0.1', port, path: '/status'},
      (response) => {
        response.resume();
        resolve(response.statusCode === 200);
      });
    request.on('error', () => resolve(false));
  });
}

// Starts safaridriver, Safari's WebDriver server. Safari replaces the actual
// capture devices with mock devices when it is driven by WebDriver and does
// not show a permission prompt which is what makes it testable on machines
// without a camera such as CI runners.
// Note that safaridriver needs to be enabled once per machine by running
//   sudo safaridriver --enable
async function startSafariDriver(port) {
  const child = spawn(SAFARIDRIVER_BIN, ['-p', port], {stdio: 'inherit'});
  child.on('error', (error) => {
    console.error('Failed to start safaridriver: ' + error.message);
  });
  process.on('exit', () => child.kill());

  for (let i = 0; i < 40; i++) {
    if (await isListening(port)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('safaridriver is not listening on port ' + port);
}

module.exports = async(config) => {
  const cacheDir = path.join(process.cwd(), 'browsers');
  const platform = puppeteerBrowsers.detectBrowserPlatform();

  let browsers;
  if (process.env.BROWSER) {
    if (process.env.BROWSER === 'safari') {
      browsers = ['Safari'];
    } else if (process.env.BROWSER === 'Electron') {
      browsers = ['electron'];
    } else {
      browsers = [process.env.BROWSER];
    }
  } else if (os.platform() === 'darwin') {
    browsers = ['chrome', 'firefox', 'Safari'];
  } else if (os.platform() === 'win32') {
    browsers = ['chrome', 'firefox'];
  } else {
    browsers = ['chrome', 'firefox'];
  }

  const safariDriverPort = parseInt(process.env.SAFARIDRIVER_PORT || 4444, 10);
  if (browsers.includes('Safari')) {
    await startSafariDriver(safariDriverPort);
  }

  if (browsers.includes('firefox')) {
    const buildId = await download('firefox', process.env.BVER || 'stable',
      cacheDir, platform);
    process.env.FIREFOX_BIN = puppeteerBrowsers
      .computeExecutablePath({browser: 'firefox', buildId, cacheDir, platform});
  }
  if (browsers.includes('chrome')) {
    const buildId = await download('chrome', process.env.BVER || 'stable',
      cacheDir, platform);
    process.env.CHROME_BIN = puppeteerBrowsers
      .computeExecutablePath({browser: 'chrome', buildId, cacheDir, platform});
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
      electron: {
        base: 'Electron',
        flags: ['--use-fake-device-for-media-stream']
      },
      Safari: {
        base: 'WebDriver',
        // safaridriver serves the WebDriver API at / while wd defaults
        // to the /wd/hub path used by the selenium standalone server.
        config: {hostname: '127.0.0.1', port: safariDriverPort, path: '/'},
        browserName: 'safari',
        // safaridriver only speaks the W3C protocol and does not accept
        // the legacy capabilities wd sends by default.
        forceW3C: true,
        'wd-no-defaults': true
      },
      firefox: {
        base: 'Firefox',
        prefs: {
          'media.navigator.streams.fake': true,
          'media.navigator.permission.disabled': true,
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
  });
};
