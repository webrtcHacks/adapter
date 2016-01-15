/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

// Shimming starts here.
(function() {
  // Utils.
  var utils = require('./utils.js').utils;
  // Browser shims.
  var chromeShim = require('./chrome_shim.js');
  var edgeShim = require('./edge_shim.js');
  var firefoxShim = require('./firefox_shim.js');

  var browser = utils.detectBrowser().browser;
  var version = utils.detectBrowser().version;
  var minVersion  = utils.detectBrowser().minVersion

  // Bail if version is not supported regardless of browser.
  if (version < minVersion) {
    utils.log('Browser: ' + browser + ' Version: ' + version + ' <' +
        ' minimum supported version: ' + minVersion + '\n aborting!');
    return;
  }

  // Shim browser if found.
  switch(browser) {
    case 'chrome':
      utils.log('shimming chrome!');
      // Export to the adapter global object visible in the browser.
      module.exports.browserShim = chromeShim;

      chromeShim.shimSourceObject();
      chromeShim.shimPeerConnection();
      chromeShim.shimGetUserMedia();
      break;
    case 'edge':
      utils.log('shimming edge!');
      // Export to the adapter global object visible in the browser.
      module.exports.browserShim = edgeShim;

      edgeShim.shimSourceObject();
      edgeShim.shimPeerConnection();
      break;
    case 'firefox':
      utils.log('shimming firefox!');
      // Export to the adapter global object visible in the browser.
      module.exports.browserShim = firefoxShim;

      firefoxShim.shimSourceObject();
      firefoxShim.shimPeerConnection();
      firefoxShim.shimGetUserMedia();
      break;
    default:
      utils.log('Unsupported browser!');
  }
}());
