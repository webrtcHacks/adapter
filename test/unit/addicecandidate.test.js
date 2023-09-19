/*
 *  Copyright (c) 2021 The adapter.js project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

describe('addIceCandidate with null or empty candidate', () => {
  const shim = require('../../dist/common_shim');
  let window;
  let origAddIceCandidate;
  beforeEach(() => {
    window = {
      RTCPeerConnection: jest.fn(),
    };
    origAddIceCandidate = jest.fn();
    window.RTCPeerConnection.prototype.addIceCandidate = origAddIceCandidate;
  });

  describe('does nothing if', () => {
    it('RTCPeerConnection is not defined', () => {
      expect(() => shim.shimAddIceCandidateNullOrEmpty({}, {})).not.toThrow();
    });
    it('RTCPeerConnection.prototype.addIceCandidate is undefined', () => {
      window.RTCPeerConnection.prototype.addIceCandidate = null;
      expect(() => shim.shimAddIceCandidateNullOrEmpty({}, {})).not.toThrow();
    });
    it('the candidate argument is optional', () => {
      expect(window.RTCPeerConnection.prototype.addIceCandidate.length)
        .toBe(0);
      shim.shimAddIceCandidateNullOrEmpty({}, {});
      expect(window.RTCPeerConnection.prototype.addIceCandidate)
        .toBe(origAddIceCandidate);
    });
  });

  it('changes the number of arguments', () => {
    window.RTCPeerConnection.prototype.addIceCandidate =
      (candidate) => origAddIceCandidate(candidate);
    shim.shimAddIceCandidateNullOrEmpty(window, {});
    expect(window.RTCPeerConnection.prototype.addIceCandidate.length)
      .toBe(0);
  });

  it('ignores addIceCandidate(null)', () => {
    window.RTCPeerConnection.prototype.addIceCandidate =
      (candidate) => origAddIceCandidate(candidate);
    shim.shimAddIceCandidateNullOrEmpty(window, {});
    const pc = new window.RTCPeerConnection();
    pc.addIceCandidate({candidate: '', sdpMLineIndex: 0});
    expect(origAddIceCandidate.mock.calls.length).toBe(1);
  });

  describe('Chrome behaviour', () => {
    let browserDetails;
    // Override addIceCandidate to simulate legacy behaviour.
    beforeEach(() => {
      window.RTCPeerConnection.prototype.addIceCandidate =
        (candidate) => origAddIceCandidate(candidate);
      browserDetails = {browser: 'chrome', version: '88'};
    });

    it('ignores {candidate: ""} before Chrome 78', () => {
      browserDetails.version = 77;
      shim.shimAddIceCandidateNullOrEmpty(window, browserDetails);

      const pc = new window.RTCPeerConnection();
      pc.addIceCandidate({candidate: '', sdpMLineIndex: 0});
      expect(origAddIceCandidate.mock.calls.length).toBe(0);
    });

    it('passes {candidate: ""} after Chrome 78', () => {
      browserDetails.version = 78;
      shim.shimAddIceCandidateNullOrEmpty(window, browserDetails);

      const pc = new window.RTCPeerConnection();
      pc.addIceCandidate({candidate: '', sdpMLineIndex: 0});
      expect(origAddIceCandidate.mock.calls.length).toBe(1);
    });
  });

  describe('Firefox behaviour', () => {
    let browserDetails;
    // Override addIceCandidate to simulate legacy behaviour.
    beforeEach(() => {
      window.RTCPeerConnection.prototype.addIceCandidate =
        (candidate) => origAddIceCandidate(candidate);
      browserDetails = {browser: 'firefox', version: '69'};
    });

    it('ignores {candidate: ""} before Firefox 68', () => {
      browserDetails.version = 67;
      shim.shimAddIceCandidateNullOrEmpty(window, browserDetails);

      const pc = new window.RTCPeerConnection();
      pc.addIceCandidate({candidate: '', sdpMLineIndex: 0});
      expect(origAddIceCandidate.mock.calls.length).toBe(0);
    });

    it('passes {candidate: ""} after Firefox 68', () => {
      browserDetails.version = 68;
      shim.shimAddIceCandidateNullOrEmpty(window, browserDetails);

      const pc = new window.RTCPeerConnection();
      pc.addIceCandidate({candidate: '', sdpMLineIndex: 0});
      expect(origAddIceCandidate.mock.calls.length).toBe(1);
    });
  });

  describe('Safari behaviour', () => {
    let browserDetails;
    // Override addIceCandidate to simulate legacy behaviour.
    beforeEach(() => {
      window.RTCPeerConnection.prototype.addIceCandidate =
        (candidate) => origAddIceCandidate(candidate);
      browserDetails = {browser: 'safari', version: 'some'};
    });

    it('ignores {candidate: ""}', () => {
      shim.shimAddIceCandidateNullOrEmpty(window, browserDetails);

      const pc = new window.RTCPeerConnection();
      pc.addIceCandidate({candidate: '', sdpMLineIndex: 0});
      expect(origAddIceCandidate.mock.calls.length).toBe(0);
    });
  });
});
