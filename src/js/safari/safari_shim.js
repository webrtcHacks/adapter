/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
'use strict';
var logging = require('../utils.js').log;
var browserDetails = require('../utils.js').browserDetails;

var safariShim = {
  shimOnTrack: function() {
  },

  shimSourceObject: function() {
  },

  shimPeerConnection: function() {
  },

  shimGetUserMedia: function() {
    navigator.getUserMedia = navigator.webkitGetUserMedia;
  },

  attachMediaStream: function(element, stream) {
  },

  reattachMediaStream: function(to, from) {
  }
}

// Expose public methods.
module.exports = {
  shimOnTrack: safariShim.shimOnTrack,
  shimSourceObject: safariShim.shimSourceObject,
  shimPeerConnection: safariShim.shimPeerConnection,
  shimGetUserMedia: safariShim.shimGetUserMedia,
  attachMediaStream: safariShim.attachMediaStream,
  reattachMediaStream: safariShim.reattachMediaStream
};
