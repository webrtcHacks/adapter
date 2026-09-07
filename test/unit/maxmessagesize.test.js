/*
 *  Copyright (c) 2026 The adapter.js project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
describe('maxMessageSize', () => {
  const shim = require('../../dist/common_shim');
  let window;
  let origSetRemoteDescription;
  beforeEach(() => {
    window = {
      RTCPeerConnection: jest.fn(),
    };
    origSetRemoteDescription = jest.fn();
    window.RTCPeerConnection.prototype.setRemoteDescription =
      origSetRemoteDescription;
  });

  // Simulates a native RTCSctpTransport being exposed as pc.sctp.
  function shimNativeSctp() {
    Object.defineProperty(window.RTCPeerConnection.prototype, 'sctp', {
      get() {
        return null;
      },
      configurable: true,
    });
  }

  describe('does nothing if', () => {
    it('RTCPeerConnection is not defined', () => {
      expect(() => shim.shimMaxMessageSize({}, {})).not.toThrow();
    });
  });

  describe('Safari behaviour', () => {
    const browserDetails = {browser: 'safari', version: 605};

    it('does not wrap setRemoteDescription when sctp is supported', () => {
      shimNativeSctp();
      shim.shimMaxMessageSize(window, browserDetails);

      expect(window.RTCPeerConnection.prototype.setRemoteDescription)
        .toBe(origSetRemoteDescription);
    });

    it('wraps setRemoteDescription when sctp is not supported', () => {
      shim.shimMaxMessageSize(window, browserDetails);

      expect(window.RTCPeerConnection.prototype.setRemoteDescription)
        .not.toBe(origSetRemoteDescription);
      expect(window.RTCPeerConnection.prototype).toHaveProperty('sctp');
    });
  });
});
