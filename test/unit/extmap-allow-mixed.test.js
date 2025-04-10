/*
 *  Copyright (c) 2021 The adapter.js project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
describe('removal of extmap-allow-mixed', () => {
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

  const sdp = 'a=extmap-allow-mixed\r\n';

  describe('does nothing if', () => {
    it('RTCPeerConnection is not defined', () => {
      expect(() => shim.removeExtmapAllowMixed({}, {})).not.toThrow();
    });
  });

  describe('Chrome behaviour', () => {
    let browserDetails;
    // Override addIceCandidate to simulate legacy behaviour.
    beforeEach(() => {
      window.RTCPeerConnection.prototype.setRemoteDescription = function() {
        return origSetRemoteDescription.apply(this, arguments);
      };
      browserDetails = {browser: 'chrome', version: 88};
    });

    it('does not remove the extmap-allow-mixed line after Chrome 71', () => {
      browserDetails.version = 71;
      shim.removeExtmapAllowMixed(window, browserDetails);

      const pc = new window.RTCPeerConnection();
      pc.setRemoteDescription({sdp: '\n' + sdp});
      expect(origSetRemoteDescription.mock.calls.length).toBe(1);
      expect(origSetRemoteDescription.mock.calls[0][0].sdp)
        .toEqual('\n' + sdp);
    });

    it('does remove the extmap-allow-mixed line before Chrome 71', () => {
      browserDetails.version = 70;
      shim.removeExtmapAllowMixed(window, browserDetails);

      const pc = new window.RTCPeerConnection();
      pc.setRemoteDescription({sdp: '\n' + sdp});
      expect(origSetRemoteDescription.mock.calls.length).toBe(1);
      expect(origSetRemoteDescription.mock.calls[0][0].sdp)
        .toEqual('\n');
    });
  });

  describe('Safari behaviour', () => {
    let browserDetails;
    // Override addIceCandidate to simulate legacy behaviour.
    beforeEach(() => {
      window.RTCPeerConnection.prototype.setRemoteDescription = function() {
        return origSetRemoteDescription.apply(this, arguments);
      };
      browserDetails = {browser: 'safari', version: 605};
    });

    it('does not remove the extmap-allow-mixed line after 13.1', () => {
      browserDetails._safariVersion = 13.1;
      shim.removeExtmapAllowMixed(window, browserDetails);

      const pc = new window.RTCPeerConnection();
      pc.setRemoteDescription({sdp: '\n' + sdp});
      expect(origSetRemoteDescription.mock.calls.length).toBe(1);
      expect(origSetRemoteDescription.mock.calls[0][0].sdp)
        .toEqual('\n' + sdp);
    });

    it('does remove the extmap-allow-mixed line before 13.1', () => {
      browserDetails._safariVersion = 13.0;
      shim.removeExtmapAllowMixed(window, browserDetails);

      const pc = new window.RTCPeerConnection();
      pc.setRemoteDescription({sdp: '\n' + sdp});
      expect(origSetRemoteDescription.mock.calls.length).toBe(1);
      expect(origSetRemoteDescription.mock.calls[0][0].sdp)
        .toEqual('\n');
    });
  });
});
