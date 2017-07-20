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

describe('Edge shim', () => {
  const shim = require('../../src/js/edge/edge_shim');
  let window;

  const ua15025 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 ' +
      'Safari/537.36 Edge/15.15025';

  beforeEach(() => {
    window = {
      navigator: {
        userAgent: ua15025,
        mediaDevices: function() {}
      }
    };
    shim.shimPeerConnection(window);
  });

  it('creates window.RTCPeerConnection', () => {
    delete window.RTCPeerConnection;
    shim.shimPeerConnection(window);
    expect(window.RTCPeerConnection).not.to.equal(undefined);
  });

  it('overrides window.RTCPeerConnection if it exists', () => {
    window.RTCPeerConnection = true;
    shim.shimPeerConnection(window);
    expect(window.RTCPeerConnection).not.to.equal(true);
  });
});
