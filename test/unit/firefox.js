/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
import shim from '../../src/js/firefox/firefox_shim';
import {expect} from 'chai';

describe('Firefox shim', () => {
  let window;

  beforeEach(() => {
    window = {
      mozRTCPeerConnection: function() {},
      mozRTCSessionDescription: function() {},
      mozRTCIceCandidate: function() {}
    };
  });

  describe('shimPeerConnection', () => {
    it('creates window.RTCPeerConnection', () => {
      shim.shimPeerConnection(window);
      expect(window.RTCPeerConnection).not.to.equal(undefined);
    });

    it('does not override window.RTCPeerConnection if it exists', () => {
      const pc = function() {};
      window.RTCPeerConnection = pc;
      shim.shimPeerConnection(window);
      expect(window.RTCPeerConnection).to.equal(pc);
    });
  });
});
