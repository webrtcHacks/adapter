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
      expect(candidate.candidate).to.equal(candidateString);
      expect(candidate.sdpMid).to.equal('audio');
      expect(candidate.sdpMLineIndex).to.equal(0);
    });

    it('drops the a= part of the candidate if present', () => {
      const candidate = new RTCIceCandidate({
        candidate: 'a=' + candidateString,
        sdpMid: 'audio',
        sdpMLineIndex: 0
      });
      expect(candidate.candidate).to.equal(candidateString);
    });

    it('parses the candidate', () => {
      const candidate = new RTCIceCandidate({
        candidate: candidateString,
        sdpMid: 'audio',
        sdpMLineIndex: 0
      });
      expect(candidate.foundation).to.equal('702786350');
      // expect(candidate.component).to.equal('2'); // TODO
      expect(candidate.priority).to.equal(41819902);
      expect(candidate.ip).to.equal('8.8.8.8');
      expect(candidate.protocol).to.equal('udp');
      expect(candidate.port).to.equal(60769);
      expect(candidate.type).to.equal('relay');
      expect(candidate.tcpType).to.equal('active');
      expect(candidate.relatedAddress).to.equal('8.8.8.8');
      expect(candidate.relatedPort).to.equal(1234);
      expect(candidate.generation).to.equal('0');
      expect(candidate.usernameFragment).to.equal('abc');
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
    expect(Object.keys(JSON.parse(serialized)).length).to.equal(4);
  });
});
