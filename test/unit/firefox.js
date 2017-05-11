/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
const chai = require('chai');
const expect = chai.expect;

describe('Firefox shim', () => {
  const shimFactory = require('../../src/js/firefox/firefox_shim');
  let utils;
  let shim;

  beforeEach(() => {
    global.window = global;
    global.mozRTCPeerConnection = function() {};
    global.mozRTCSessionDescription = function() {};
    global.mozRTCIceCandidate = function() {};
    delete global.RTCPeerConnection;

    utils = require('../../src/js/utils')({window});
  });
  describe('shimPeerConnection', () => {
    it('creates window.RTCPeerConnection', () => {
      global.window = global;
      shim = shimFactory({window, utils});
      shim.shimPeerConnection();
      expect(window.RTCPeerConnection).not.to.equal(undefined);
    });

    it('does not override window.RTCPeerConnection if it exists', () => {
      const pc = function() {};
      global.window.RTCPeerConnection = pc;
      shim = shimFactory({window, utils});
      shim.shimPeerConnection();
      expect(window.RTCPeerConnection).to.equal(pc);
    });
  });
});
