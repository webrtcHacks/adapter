/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

// https://code.google.com/p/selenium/wiki/WebDriverJs
let webdriver = require('selenium-webdriver');
let chrome = require('selenium-webdriver/chrome');
let firefox = require('selenium-webdriver/firefox');
let edge = require('selenium-webdriver/edge');
let fs = require('fs');
let os = require('os');

let sharedDriver = null;

function getBrowserVersion() {
  let browser = process.env.BROWSER;
  let browserChannel = process.env.BVER;
  let symlink = './browsers/bin/' + browser + '-' + browserChannel;
  let path = fs.readlinkSync(symlink);

  // Browser reg expressions and position to look for the milestone version.
  let chromeExp = /\/chrome\/(\d+)\./;
  let firefoxExp = /\/firefox\/(\d+)\./;

  let browserVersion = function(pathToBrowser, expr) {
    let match = pathToBrowser.match(expr);
    return match && match.length >= 1 && parseInt(match[1], 10);
  };

  switch (browser) {
    case 'chrome':
      return browserVersion(path, chromeExp);
    case 'firefox':
      return browserVersion(path, firefoxExp);
    default:
      return 'non supported browser.';
  }
}

function buildDriver() {
  if (sharedDriver) {
    return sharedDriver;
  }
  // Firefox options.
  // http://selenium.googlecode.com/git/docs/api/javascript/module_selenium-webdriver_firefox.html
  let profile = new firefox.Profile();
  profile.setPreference('media.navigator.streams.fake', true);
  // This enables device labels for enumerateDevices when using fake devices.
  profile.setPreference('media.navigator.permission.disabled', true);
  // Currently the FF webdriver extension is not signed and FF 41 no longer
  // allows unsigned extensions by default.
  // TODO: Remove this once FF no longer allow turning this off and the
  // selenium team starts making a signed FF webdriver extension.
  // https://github.com/SeleniumHQ/selenium/issues/901.
  profile.setPreference('xpinstall.signatures.required', false);

  let firefoxOptions = new firefox.Options()
      .setProfile(profile);
  if (os.platform() === 'linux') {
    firefoxOptions.setBinary('node_modules/.bin/start-firefox');
  }

  // Chrome options.
  // http://selenium.googlecode.com/git/docs/api/javascript/module_selenium-webdriver_chrome_class_Options.html#addArguments
  let chromeOptions = new chrome.Options()
      .addArguments('allow-file-access-from-files')
      .addArguments('use-fake-device-for-media-stream')
      .addArguments('use-fake-ui-for-media-stream');
  if (os.platform() === 'linux') {
    chromeOptions.setChromeBinaryPath('node_modules/.bin/start-chrome');
  }

  const browserVersion = getBrowserVersion();
  // Only enable this for Chrome >= 49.
  if (process.env.BROWSER === 'chrome' && browserVersion >= 49) {
    chromeOptions.addArguments('--enable-experimental-web-platform-features');
  }

  if (process.env.BROWSER === 'chrome' && browserVersion >= 59) {
    chromeOptions.addArguments('headless');
    chromeOptions.addArguments('disable-gpu');
  }

  let edgeOptions = new edge.Options();

  sharedDriver = new webdriver.Builder()
      .forBrowser(process.env.BROWSER)
      .setFirefoxOptions(firefoxOptions)
      .setChromeOptions(chromeOptions)
      .setEdgeOptions(edgeOptions);

  if (process.env.BROWSER === 'MicrosoftEdge') {
    if (process.env.SELENIUM_SERVER) {
      sharedDriver.usingServer(process.env.SELENIUM_SERVER);
    } else if (os.platform() !== 'win32') {
      throw new Error('MicrosoftEdge is only supported on Windows or via ' +
          'a selenium server');
    }
  } else if (process.env.BROWSER === 'firefox' && browserVersion >= 47) {
    sharedDriver.getCapabilities().set('marionette', true);
  }

  sharedDriver = sharedDriver.build();

  // Set global executeAsyncScript() timeout (default is 0) to allow async
  // callbacks to be caught in tests.
  sharedDriver.manage().timeouts().setScriptTimeout(10 * 1000);

  return sharedDriver;
}

// loads the dummy page that includes adapter.js.
// In Microsoft Edge (via selenium) this directly injects adapter.js.
function loadTestPage(driver) {
  if (process.env.BROWSER === 'MicrosoftEdge') {
    return driver.get('about:blank').then(function() {
      return driver.executeScript(fs.readFileSync('out/adapter.js').toString());
    });
  }
  return driver.get('file://' + process.cwd() + '/test/testpage.html');
}

// A helper function to query stats from a PeerConnection.
function getStats(driver, peerConnection) {
  // Execute getStats on peerconnection named `peerConnection`.
  return driver.executeAsyncScript(
      'var callback = arguments[arguments.length - 1];' +
      peerConnection + '.getStats(null).then(function(report) {' +
      '  callback(report);' +
      '});');
}

module.exports = {
  buildDriver,
  loadTestPage,
  getBrowserVersion,
  getStats,
};
