/*
 *  Copyright (c) 2024 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

/* eslint-env node */
'use strict';

const shim = require('../../dist/chrome/chrome_shim');

describe('Chrome shim: localDescription getter (OLD path)', () => {
  let window;

  beforeEach(() => {
    global.RTCSessionDescription = function(init) {
      this.type = init.type;
      this.sdp = init.sdp;
    };
  });

  afterEach(() => {
    delete global.RTCSessionDescription;
  });

  // 使用 version: 64 (< 65) 或 NaN 触发 OLD shim 路径
  // OLD 路径会包装 localDescription getter

  describe('when localDescription returns null', () => {
    it('should not throw when accessing localDescription', () => {
      window = {
        RTCPeerConnection: function() {
          this._streams = {};
          this._reverseStreams = {};
        },
        RTCSessionDescription: global.RTCSessionDescription,
        navigator: {
          mediaDevices: {}
        }
      };

      Object.defineProperty(
        window.RTCPeerConnection.prototype,
        'localDescription',
        {
          get: function() {
            return null;
          },
          configurable: true
        }
      );

      // version: 64 < 65, 走 OLD 路径
      shim.shimAddTrackRemoveTrack(window, {version: 64});

      const pc = new window.RTCPeerConnection();

      expect(() => {
        const desc = pc.localDescription;
        expect(desc).toBe(null);
      }).not.toThrow();
    });
  });

  describe('when localDescription returns empty object', () => {
    it('should return the description as-is when type is empty', () => {
      const emptyDesc = {
        type: '',
        sdp: ''
      };

      window = {
        RTCPeerConnection: function() {},
        RTCSessionDescription: global.RTCSessionDescription,
        navigator: {
          mediaDevices: {}
        }
      };

      Object.defineProperty(
        window.RTCPeerConnection.prototype,
        'localDescription',
        {
          get: function() {
            return emptyDesc;
          },
          configurable: true
        }
      );

      shim.shimAddTrackRemoveTrack(window, {version: 64});

      const pc = new window.RTCPeerConnection();
      const desc = pc.localDescription;

      expect(desc).toBe(emptyDesc);
    });
  });

  describe('when localDescription returns a valid description', () => {
    it('should process the description through replaceInternalStreamId',
      () => {
        const validDesc = {
          type: 'offer',
          sdp: 'v=0\r\n'
        };

        window = {
          RTCPeerConnection: function() {
            this._streams = {};
            this._reverseStreams = {};
          },
          RTCSessionDescription: global.RTCSessionDescription,
          navigator: {
            mediaDevices: {}
          }
        };

        Object.defineProperty(
          window.RTCPeerConnection.prototype,
          'localDescription',
          {
            get: function() {
              return validDesc;
            },
            configurable: true
          }
        );

        shim.shimAddTrackRemoveTrack(window, {version: 64});

        const pc = new window.RTCPeerConnection();
        const desc = pc.localDescription;

        expect(desc).toBeDefined();
        expect(desc.type).toBe('offer');
      });
  });
});
