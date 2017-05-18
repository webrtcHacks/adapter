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

describe('Chrome shim', () => {
  const shim = require('../../src/js/chrome/chrome_shim');
  let window;

  beforeEach(() => {
    window = {
      webkitRTCPeerConnection: function() {}
    };
  });

  describe('shimPeerConnection', () => {
    it('creates window.RTCPeerConnection', () => {
      shim.shimPeerConnection(window);
      expect(window.RTCPeerConnection).not.to.equal(undefined);
    });
  });
});
