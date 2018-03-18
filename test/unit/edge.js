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

  describe('filtering of STUN and TURN servers', () => {
    const edgeVersion = 15025;
    const filterIceServers = require('../../src/js/edge/filtericeservers');

    it('converts legacy url member to urls', () => {
      const result = filterIceServers([
        {url: 'stun:stun.l.google.com'}
      ], edgeVersion);
      expect(result).to.deep.equal([
        {urls: 'stun:stun.l.google.com'}
      ]);
    });

    it('filters STUN before r14393', () => {
      const result = filterIceServers([
        {urls: 'stun:stun.l.google.com'}
      ], 14392);
      expect(result).to.deep.equal([]);
    });

    it('does not filter STUN without protocol after r14393', () => {
      const result = filterIceServers([
        {urls: 'stun:stun.l.google.com'}
      ], edgeVersion);
      expect(result).to.deep.equal([
        {urls: 'stun:stun.l.google.com'}
      ]);
    });

    it('does filter STUN with protocol even after r14393', () => {
      const result = filterIceServers([
        {urls: 'stun:stun.l.google.com:19302?transport=udp'}
      ], edgeVersion);
      expect(result).to.deep.equal([]);
    });

    it('filters incomplete TURN urls', () => {
      const result = filterIceServers([
        {urls: 'turn:stun.l.google.com'},
        {urls: 'turn:stun.l.google.com:19302'}
      ], edgeVersion);
      expect(result).to.deep.equal([]);
    });

    it('filters TURN TCP', () => {
      const result = filterIceServers([
        {urls: 'turn:stun.l.google.com:19302?transport=tcp'}
      ], edgeVersion);
      expect(result).to.deep.equal([]);
    });

    describe('removes all but the first server of a type', () => {
      it('in separate entries', () => {
        const result = filterIceServers([
          {urls: 'stun:stun.l.google.com'},
          {urls: 'turn:stun.l.google.com:19301?transport=udp'},
          {urls: 'turn:stun.l.google.com:19302?transport=udp'}
        ], edgeVersion);
        expect(result).to.deep.equal([
          {urls: 'stun:stun.l.google.com'},
          {urls: 'turn:stun.l.google.com:19301?transport=udp'}
        ]);
      });

      it('in urls entries', () => {
        const result = filterIceServers([
          {urls: 'stun:stun.l.google.com'},
          {urls: [
            'turn:stun.l.google.com:19301?transport=udp',
            'turn:stun.l.google.com:19302?transport=udp'
          ]}
        ], edgeVersion);
        expect(result).to.deep.equal([
          {urls: 'stun:stun.l.google.com'},
          {urls: ['turn:stun.l.google.com:19301?transport=udp']}
        ]);
      });
    });
  });
});
