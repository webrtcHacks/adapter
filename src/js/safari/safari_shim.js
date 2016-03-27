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
  // TODO: alex, should be here, double check against LayoutTests
  shimOnTrack: function() { },

  // TODO: alex, not sure if the HTMLMediaElement has been updated,
  // ... double-check anyway
  shimSourceObject: function() { },
  attachMediaStream: function(element, stream) { },
  reattachMediaStream: function(to, from) { },

  // TODO: once the back-end for the mac port is done, add.
  // TODO: check for webkitGTK+
  shimPeerConnection: function() { },

  // Very recent implementation, based on Last Call specs
  // ... just need to remove the prefix. navigator.GUM is
  // ... but a wrapper for mediaDevices.GUM. 
  shimGetUserMedia: function() {
    navigator.getUserMedia = navigator.webkitGetUserMedia;
  },
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
