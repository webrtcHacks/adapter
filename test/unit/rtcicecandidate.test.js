/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
describe('RTCIceCandidate', () => {
  const shim = require('../../dist/common_shim');
  let RTCIceCandidate;
  let window;
  beforeEach(() => {
    window = {};
    window.RTCIceCandidate = function(args) {
      return args;
    };
    window.RTCPeerConnection = function() {};
    shim.shimRTCIceCandidate(window);

    RTCIceCandidate = window.RTCIceCandidate;
  });

  const candidateString = 'candidate:702786350 2 udp 41819902 8.8.8.8 60769 ' +
      'typ relay raddr 8.8.8.8 rport 1234 ' +
      'tcptype active ' +
      'ufrag abc ' +
      'generation 0';

  describe('constructor', () => {
    it('retains the candidate', () => {
      const candidate = new RTCIceCandidate({
        candidate: candidateString,
        sdpMid: 'audio',
        sdpMLineIndex: 0
      });
      expect(candidate.candidate).toBe(candidateString);
      expect(candidate.sdpMid).toBe('audio');
      expect(candidate.sdpMLineIndex).toBe(0);
    });

    it('drops the a= part of the candidate if present', () => {
      const candidate = new RTCIceCandidate({
        candidate: 'a=' + candidateString,
        sdpMid: 'audio',
        sdpMLineIndex: 0
      });
      expect(candidate.candidate).toBe(candidateString);
    });

    it('parses the candidate', () => {
      const candidate = new RTCIceCandidate({
        candidate: candidateString,
        sdpMid: 'audio',
        sdpMLineIndex: 0
      });
      expect(candidate.foundation).toBe('702786350');
      expect(candidate.component).toBe('rtcp');
      expect(candidate.priority).toBe(41819902);
      expect(candidate.ip).toBe('8.8.8.8');
      expect(candidate.protocol).toBe('udp');
      expect(candidate.port).toBe(60769);
      expect(candidate.type).toBe('relay');
      expect(candidate.tcpType).toBe('active');
      expect(candidate.relatedAddress).toBe('8.8.8.8');
      expect(candidate.relatedPort).toBe(1234);
      expect(candidate.generation).toBe('0');
      expect(candidate.usernameFragment).toBe('abc');
    });
  });

  it('does not serialize the extra attributes', () => {
    const candidate = new RTCIceCandidate({
      candidate: candidateString,
      sdpMid: 'audio',
      sdpMLineIndex: 0,
      usernameFragment: 'someufrag'
    });
    const serialized = JSON.stringify(candidate);
    // there should be only 4 items in the JSON.
    expect(Object.keys(JSON.parse(serialized)).length).toBe(4);
  });
});
