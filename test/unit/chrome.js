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
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

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

  it('translates iceTransportPolicy to iceTransports ' +
      'for webkitRTCPeerConnection', () => {
    shim.shimPeerConnection(window);
    sinon.spy(window, 'webkitRTCPeerConnection');
    new window.RTCPeerConnection({iceTransportPolicy: 'relay'});
    expect(window.webkitRTCPeerConnection).to.have.been.calledWith(sinon.match({
      iceTransports: 'relay'
    }));
  });
});
