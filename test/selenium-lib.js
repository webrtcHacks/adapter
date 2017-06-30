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
var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var firefox = require('selenium-webdriver/firefox');
var edge = require('selenium-webdriver/edge');
var safari = require('selenium-webdriver/safari');
var fs = require('fs');
var os = require('os');

var sharedDriver = null;

function getBrowserVersion() {
  var browser = process.env.BROWSER;
  var browserChannel = process.env.BVER;

  // Browser reg expressions and position to look for the milestone version.
  var chromeExp = /\/chrome\/(\d+)\./;
  var firefoxExp = /\/firefox\/(\d+)\./;

  var browserVersion = function(expr) {
    var symlink = './browsers/bin/' + browser + '-' + browserChannel;
    var pathToBrowser = fs.readlinkSync(symlink);
    var match = pathToBrowser.match(expr);
    return match && match.length >= 1 && parseInt(match[1], 10);
  };

  switch (browser) {
    case 'chrome':
      return browserVersion(chromeExp);
    case 'firefox':
      return browserVersion(firefoxExp);
    case 'safari':
      return browserChannel;
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
  var profile = new firefox.Profile();
  profile.setPreference('media.navigator.streams.fake', true);
  // This enables device labels for enumerateDevices when using fake devices.
  profile.setPreference('media.navigator.permission.disabled', true);
  // Currently the FF webdriver extension is not signed and FF 41 no longer
  // allows unsigned extensions by default.
  // TODO: Remove this once FF no longer allow turning this off and the
  // selenium team starts making a signed FF webdriver extension.
  // https://github.com/SeleniumHQ/selenium/issues/901.
  profile.setPreference('xpinstall.signatures.required', false);

  var firefoxOptions = new firefox.Options()
      .setProfile(profile);
  if (os.platform() === 'linux') {
    firefoxOptions.setBinary('node_modules/.bin/start-firefox');
  }

  // Chrome options.
  // http://selenium.googlecode.com/git/docs/api/javascript/module_selenium-webdriver_chrome_class_Options.html#addArguments
  var chromeOptions = new chrome.Options()
      .addArguments('allow-file-access-from-files')
      .addArguments('use-fake-device-for-media-stream')
      .addArguments('use-fake-ui-for-media-stream');
  if (os.platform() === 'linux') {
    chromeOptions.setChromeBinaryPath('node_modules/.bin/start-chrome');
  }

  if (process.env.BROWSER === 'chrome') {
    let browserVersion = getBrowserVersion();
    if (browserVersion >= 49 && process.env.CHROMEEXPERIMENT !== 'false') {
      chromeOptions.addArguments('--enable-experimental-web-platform-features');
    }
    if (browserVersion >= 59) {
      chromeOptions.addArguments('headless');
      chromeOptions.addArguments('disable-gpu');
    }
  }

  var edgeOptions = new edge.Options();

  var safariOptions = new safari.Options();
  safariOptions.setTechnologyPreview(
      process.env.BVER === 'TechnologyPreview' ||
      process.env.BVER === 'unstable');

  sharedDriver = new webdriver.Builder()
      .forBrowser(process.env.BROWSER)
      .setFirefoxOptions(firefoxOptions)
      .setChromeOptions(chromeOptions)
      .setSafariOptions(safariOptions)
      .setEdgeOptions(edgeOptions);

  if (process.env.BROWSER === 'MicrosoftEdge') {
    if (process.env.SELENIUM_SERVER) {
      sharedDriver.usingServer(process.env.SELENIUM_SERVER);
    } else if (os.platform() !== 'win32') {
      throw new Error('MicrosoftEdge is only supported on Windows or via ' +
          'a selenium server');
    }
  } else if (process.env.BROWSER === 'firefox') {
    let browserVersion = getBrowserVersion();
    if (browserVersion >= 47) {
      sharedDriver.getCapabilities().set('marionette', true);
    }
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
  getStats
};
