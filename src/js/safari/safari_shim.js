/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
'use strict';
var safariShim = {
  // TODO: DrAlex, should be here, double check against LayoutTests

  // TODO: once the back-end for the mac port is done, add.
  // TODO: check for webkitGTK+
  // shimPeerConnection: function() { },

  shimAddStream: function() {
    if (typeof window === 'object' && window.RTCPeerConnection &&
        !('addStream' in window.RTCPeerConnection.prototype)) {
      RTCPeerConnection.prototype.addStream = function(stream) {
        stream.getTracks().forEach(track => this.addTrack(track, stream));
      }
    }
  },
  shimOnAddStream: function() {
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
  },
  shimCallbacksAPI: function() {
    if (typeof window !== 'object' || !window.RTCPeerConnection)
      return;
    var createOffer = RTCPeerConnection.prototype.createOffer;
    var createAnswer = RTCPeerConnection.prototype.createAnswer;
    var setLocalDescription = RTCPeerConnection.prototype.setLocalDescription;
    var setRemoteDescription = RTCPeerConnection.prototype.setRemoteDescription;
    var addIceCandidate = RTCPeerConnection.prototype.addIceCandidate;

    RTCPeerConnection.prototype.createOffer = function(successCallback, failureCallback) {
      var promise = createOffer.apply(this, [arguments[2]]);
      if (!failureCallback)
        return promise;
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    }

    RTCPeerConnection.prototype.createAnswer = function(successCallback, failureCallback) {
      var promise = createAnswer.apply(this);
      if (!failureCallback)
        return promise;
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    }

    RTCPeerConnection.prototype.setLocalDescription = function(description, successCallback, failureCallback) {
      var promise = setLocalDescription.apply(this, [description]);
      if (!failureCallback)
        return promise;
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    }

    RTCPeerConnection.prototype.setRemoteDescription = function(description, successCallback, failureCallback) {
      var promise = setRemoteDescription.apply(this, [description]);
      if (!failureCallback)
        return promise;
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    }

    RTCPeerConnection.prototype.addIceCandidate = function(candidate, successCallback, failureCallback) {
      var promise = addIceCandidate.apply(this, [candidate]);
      if (!failureCallback)
        return promise;
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    }
  },
  shimGetUserMedia: function() {
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
};

// Expose public methods.
module.exports = {
  shimCallbacksAPI: safariShim.shimCallbacksAPI,
  shimAddStream: safariShim.shimAddStream,
  shimOnAddStream: safariShim.shimOnAddStream,
  shimGetUserMedia: safariShim.shimGetUserMedia
  // TODO
  // shimPeerConnection: safariShim.shimPeerConnection
};
