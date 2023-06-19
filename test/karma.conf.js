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
const puppeteerBrowsers = require('@puppeteer/browsers');

async function determineFirefoxVersion(version) {
  const rawVersions = await fetch('https://product-details.mozilla.org/1.0/firefox_versions.json');
  const versions = await rawVersions.json();
  return versions.FIREFOX_NIGHTLY;
  // TODO: support stable, beta, nightly, esr.
  // This has issues with the assumptions browsers makes about download urls
  // (or Firefox about directory structure and where it includes the platform)
  // This base url coems close:
  // 'https://archive.mozilla.org/pub/firefox/releases/' + buildId + '/' + platform + '/en-US/';
}

async function download(browser, version, cacheDir, platform) {
  if (browser === 'firefox') {
    // TODO: see above, resolve stable, beta, nightly, esr
    const buildId = await determineFirefoxVersion(version);
    await puppeteerBrowsers.install({
      browser,
      buildId,
      cacheDir,
      platform,
    });
    return buildId;
  }
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

module.exports = async(config) => {
  const cacheDir = process.cwd() + '/browsers';
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

  let reporters = ['mocha'];
  if (process.env.CI) {
    // stability must be the last reporter as it munges the
    // exit code and always returns 0.
    reporters.push('stability');
  }

  // uses Safari Technology Preview.
  if (browsers.includes('Safari') && os.platform() === 'darwin' &&
      process.env.BVER === 'unstable' && !process.env.SAFARI_BIN) {
    process.env.SAFARI_BIN = '/Applications/Safari Technology Preview.app' +
        '/Contents/MacOS/Safari Technology Preview';
  }

  if (browsers.includes('firefox') && !process.env.FIREFOX_BIN) {
    const buildId = await download('firefox', process.env.BVER || 'stable',
      cacheDir, platform);
    process.env.FIREFOX_BIN = puppeteerBrowsers
      .computeExecutablePath({browser: 'firefox', buildId, cacheDir, platform});
  }
  if (browsers.includes('chrome') && !process.env.CHROME_BIN) {
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
