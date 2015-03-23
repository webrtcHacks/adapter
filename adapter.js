/*
 *  Copyright (c) 2014 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

/* More information about these options at jshint.com/docs/options */
/* jshint browser: true, camelcase: true, curly: true, devel: true,
   eqeqeq: true, forin: false, globalstrict: true, node: true,
   quotmark: single, undef: true, unused: strict */
/* global mozRTCIceCandidate, mozRTCPeerConnection, Promise,
mozRTCSessionDescription, webkitRTCPeerConnection, MediaStreamTrack */
/* exported trace,requestUserMedia */
'use strict';

var RTCPeerConnection = null;
var getUserMedia = null;
var attachMediaStream = null;
var reattachMediaStream = null;
var webrtcDetectedBrowser = null;
var webrtcDetectedVersion = null;
var webrtcMinimumVersion = null;

function trace(text) {
  // This function is used for logging.
  if (text[text.length - 1] === '\n') {
    text = text.substring(0, text.length - 1);
  }
  if (window.performance) {
    var now = (window.performance.now() / 1000).toFixed(3);
    console.log(now + ': ' + text);
  } else {
    console.log(text);
  }
}

if (navigator.mozGetUserMedia) {
  console.log('This appears to be Firefox');

  webrtcDetectedBrowser = 'firefox';

  // the detected firefox version.
  webrtcDetectedVersion =
    parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1], 10);

  // the minimum firefox version still supported by adapter.
  webrtcMinimumVersion = 31;

  // The RTCPeerConnection object.
  RTCPeerConnection = function(pcConfig, pcConstraints) {
    if (webrtcDetectedVersion < 38) {
      // .urls is not supported in FF < 38.
      // create RTCIceServers with a single url.
      if (pcConfig && pcConfig.iceServers) {
        var newIceServers = [];
        for (var i = 0; i < pcConfig.iceServers.length; i++) {
          var server = pcConfig.iceServers[i];
          if (server.hasOwnProperty('urls')) {
            for (var j = 0; j < server.urls.length; j++) {
              var newServer = {
                url: server.urls[j]
              };
              if (server.urls[j].indexOf('turn') === 0) {
                newServer.username = server.username;
                newServer.credential = server.credential;
              }
              newIceServers.push(newServer);
            }
          } else {
            newIceServers.push(pcConfig.iceServers[i]);
          }
        }
        pcConfig.iceServers = newIceServers;
      }
    }
    return new mozRTCPeerConnection(pcConfig, pcConstraints);
  };

  // The RTCSessionDescription object.
  window.RTCSessionDescription = mozRTCSessionDescription;

  // The RTCIceCandidate object.
  window.RTCIceCandidate = mozRTCIceCandidate;

  // getUserMedia shim (only difference is the prefix).
  // Code from Adam Barth.
  getUserMedia = navigator.mozGetUserMedia.bind(navigator);
  navigator.getUserMedia = getUserMedia;

  // Shim for MediaStreamTrack.getSources.
  MediaStreamTrack.getSources = function(successCb) {
    setTimeout(function() {
      var infos = [
        {kind: 'audio', id: 'default', label:'', facing:''},
        {kind: 'video', id: 'default', label:'', facing:''}
      ];
      successCb(infos);
    }, 0);
  };

  // Attach a media stream to an element.
  attachMediaStream = function(element, stream) {
    console.log('Attaching media stream');
    element.mozSrcObject = stream;
  };

  reattachMediaStream = function(to, from) {
    console.log('Reattaching media stream');
    to.mozSrcObject = from.mozSrcObject;
  };

} else if (navigator.webkitGetUserMedia) {
  console.log('This appears to be Chrome');

  webrtcDetectedBrowser = 'chrome';

  // the detected chrome version.
  webrtcDetectedVersion = 
    parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2], 10);

  // the minimum chrome version still supported by adapter.
  webrtcMinimumVersion = 38;

  // The RTCPeerConnection object.
  RTCPeerConnection = function(pcConfig, pcConstraints) {
    return new webkitRTCPeerConnection(pcConfig, pcConstraints);
  };

  // Get UserMedia (only difference is the prefix).
  // Code from Adam Barth.
  getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
  navigator.getUserMedia = getUserMedia;

  // Attach a media stream to an element.
  attachMediaStream = function(element, stream) {
    if (typeof element.srcObject !== 'undefined') {
      element.srcObject = stream;
    } else if (typeof element.mozSrcObject !== 'undefined') {
      element.mozSrcObject = stream;
    } else if (typeof element.src !== 'undefined') {
      element.src = URL.createObjectURL(stream);
    } else {
      console.log('Error attaching stream to element.');
    }
  };

  reattachMediaStream = function(to, from) {
    to.src = from.src;
  };
} else {
  console.log('Browser does not appear to be WebRTC-capable');
}

// Returns the result of getUserMedia as a Promise.
function requestUserMedia(constraints) {
  return new Promise(function(resolve, reject) {
    var onSuccess = function(stream) {
      resolve(stream);
    };
    var onError = function(error) {
      reject(error);
    };

    try {
      getUserMedia(constraints, onSuccess, onError);
    } catch (e) {
      reject(e);
    }
  });
}

if (typeof module !== 'undefined') {
  module.exports = {
    RTCPeerConnection: RTCPeerConnection,
    getUserMedia: getUserMedia,
    attachMediaStream: attachMediaStream,
    reattachMediaStream: reattachMediaStream,
    webrtcDetectedBrowser: webrtcDetectedBrowser,
    webrtcDetectedVersion: webrtcDetectedVersion,
    webrtcMinimumVersion: webrtcMinimumVersion
    //requestUserMedia: not exposed on purpose.
    //trace: not exposed on purpose.
  };
}
