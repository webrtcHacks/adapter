/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */

'use strict';

import {
  log as logging,
  browserDetails,
  extractVersion,
  disableLog,
  shimCreateObjectURL
} from './utils';

import * as chromeShim from './chrome/chrome_shim';

import * as edgeShim from './edge/edge_shim';

import * as firefoxShim from './firefox/firefox_shim';

import * as safariShim from './safari/safari_shim';

// Export to the adapter global object visible in the browser.
export {
  browserDetails,
  extractVersion,
  disableLog
};

var browserShim;

// Shimming starts here.

// Uncomment the line below if you want logging to occur, including logging
// for the switch statement below. Can also be turned on in the browser via
// adapter.disableLog(false), but then logging from the switch statement below
// will not appear.
// require('./utils').disableLog(false);

// Shim browser if found.
switch (browserDetails.browser) {
  case 'chrome':
    if (!chromeShim || !chromeShim.shimPeerConnection) {
      logging('Chrome shim is not included in this adapter release.');
      break;
    }
    logging('adapter.js shimming chrome.');
    // Export to the adapter global object visible in the browser.
    browserShim = chromeShim;

    chromeShim.shimGetUserMedia();
    chromeShim.shimMediaStream();
    shimCreateObjectURL();
    chromeShim.shimSourceObject();
    chromeShim.shimPeerConnection();
    chromeShim.shimOnTrack();
    chromeShim.shimGetSendersWithDtmf();
    break;
  case 'firefox':
    if (!firefoxShim || !firefoxShim.shimPeerConnection) {
      logging('Firefox shim is not included in this adapter release.');
      break;
    }
    logging('adapter.js shimming firefox.');
    // Export to the adapter global object visible in the browser.
    browserShim = firefoxShim;

    firefoxShim.shimGetUserMedia();
    shimCreateObjectURL();
    firefoxShim.shimSourceObject();
    firefoxShim.shimPeerConnection();
    firefoxShim.shimOnTrack();
    break;
  case 'edge':
    if (!edgeShim || !edgeShim.shimPeerConnection) {
      logging('MS edge shim is not included in this adapter release.');
      break;
    }
    logging('adapter.js shimming edge.');
    // Export to the adapter global object visible in the browser.
    browserShim = edgeShim;

    edgeShim.shimGetUserMedia();
    shimCreateObjectURL();
    edgeShim.shimPeerConnection();
    edgeShim.shimReplaceTrack();
    break;
  case 'safari':
    if (!safariShim) {
      logging('Safari shim is not included in this adapter release.');
      break;
    }
    logging('adapter.js shimming safari.');
    // Export to the adapter global object visible in the browser.
    browserShim = safariShim;

    safariShim.shimOnAddStream();
    safariShim.shimGetUserMedia();
    break;
  default:
    logging('Unsupported browser!');
}

export {
  browserShim
};
