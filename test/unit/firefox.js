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
  const shim = require('../../src/js/firefox/firefox_shim');
  beforeEach(() => {
    global.window = global;
    global.mozRTCPeerConnection = function() {};
    global.mozRTCSessionDescription = function() {};
    global.mozRTCIceCandidate = function() {};
    delete global.RTCPeerConnection;
  });
  describe('shimPeerConnection', () => {
    it('creates window.RTCPeerConnection', () => {
      global.window = global;
      shim.shimPeerConnection();
      expect(window.RTCPeerConnection).not.to.equal(undefined);
    });

    it('does not override window.RTCPeerConnection if it exists', () => {
      const pc = function() {};
      global.window.RTCPeerConnection = pc;
      shim.shimPeerConnection();
      expect(window.RTCPeerConnection).to.equal(pc);
    });
  });
});
