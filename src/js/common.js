/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

var SDPUtils = require('sdp');

module.exports = {
  shimRTCIceCandidate: function() {
    if (!window.RTCIceCandidate ||
        !window.RTCIceCandidate.prototype.foundation) {
      window.RTCIceCandidate = function(args) {
        var cand = SDPUtils.parseCandidate(args.candidate);
        Object.keys(args).forEach(function(key) {
          if (key === 'candidate' && args[key].indexOf('a=') === 0) {
            cand[key] = args[key].substr(2);
          } else {
            cand[key] = args[key];
          }
        });
        cand.toJSON = function() {
          return {
            candidate: cand.candidate,
            sdpMid: cand.sdpMid,
            sdpMLineIndex: cand.sdpMLineIndex,
            ufrag: cand.ufrag
          };
        }
        return cand;
      };
    }
  }
};
