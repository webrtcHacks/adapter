/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

/* a mock of the Chrome RTCLegacyStatReport */
function RTCLegacyStatsReport() {
  this.id = 'someid';
  this.type = 'set-me';
  this.timestamp = new Date();
  this._data = {};
}
RTCLegacyStatsReport.prototype.names = function() {
  return Object.keys(this._data);
};
RTCLegacyStatsReport.prototype.stat = function(name) {
  return this._data[name];
};

describe('Chrome shim', () => {
  const shim = require('../../dist/chrome/chrome_shim');
  let window;

  beforeEach(() => {
    window = {
      navigator: {
        mediaDevices: {
          getUserMedia: jest.fn().mockReturnValue(Promise.resolve('stream')),
        },
      },
      RTCPeerConnection: function() {}
    };
  });

  describe('PeerConnection shim', () => {
    it('fail silently if RTCPeerConnection is not present', () => {
      window = {};

      shim.shimPeerConnection(window);
    });
  });

  describe('AddTrackRemoveTrack shim', () => {
    it('fail silently if RTCPeerConnection is not present', () => {
      window = {};

      shim.shimAddTrackRemoveTrack(window);
    });
  });

  describe('getUserMedia shim', () => {
    it('fail silently if navigator.mediaDevices is not present', () => {
      window = {
        navigator: {}
      };

      shim.shimGetUserMedia(window);
    });
  });
});
