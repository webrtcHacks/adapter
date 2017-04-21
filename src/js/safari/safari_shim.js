/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
'use strict';

// TODO: DrAlex, should be here, double check against LayoutTests

// TODO: once the back-end for the mac port is done, add.
// TODO: check for webkitGTK+
// shimPeerConnection: function() { },

function shimOnAddStream() {
  if (typeof window === 'object' && window.RTCPeerConnection &&
      !('onaddstream' in window.RTCPeerConnection.prototype)) {
    Object.defineProperty(window.RTCPeerConnection.prototype, 'onaddstream', {
      get: function() {
        return this._onaddstream;
      },
      set: function(f) {
        if (this._onaddstream) {
          this.removeEventListener('addstream', this._onaddstream);
          this.removeEventListener('track', this._onaddstreampoly);
        }
        this.addEventListener('addstream', this._onaddstream = f);
        this.addEventListener('track', this._onaddstreampoly = function(e) {
          var stream = e.streams[0];
          if (!this._streams) {
            this._streams = [];
          }
          if (this._streams.indexOf(stream) >= 0) {
            return;
          }
          this._streams.push(stream);
          var event = new Event('addstream');
          event.stream = e.streams[0];
          this.dispatchEvent(event);
        }.bind(this));
      }
    });
  }
}

function shimGetUserMedia() {
  if (!navigator.getUserMedia) {
    if (navigator.webkitGetUserMedia) {
      navigator.getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
    } else if (navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia) {
      navigator.getUserMedia = function(constraints, cb, errcb) {
        navigator.mediaDevices.getUserMedia(constraints)
        .then(cb, errcb);
      }.bind(navigator);
    }
  }
}

export {
  shimOnAddStream,
  shimGetUserMedia
  // TODO
  // shimPeerConnection: safariShim.shimPeerConnection
};
