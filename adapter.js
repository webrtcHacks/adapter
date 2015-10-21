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

var getUserMedia = null;
var attachMediaStream = null;
var reattachMediaStream = null;
var webrtcDetectedBrowser = null;
var webrtcDetectedVersion = null;
var webrtcMinimumVersion = null;
var webrtcUtils = {
  log: function() {
    // suppress console.log output when being included as a module.
    if (typeof module !== 'undefined' ||
        typeof require === 'function' && typeof define === 'function') {
      return;
    }
    console.log.apply(console, arguments);
  }
};

function trace(text) {
  // This function is used for logging.
  if (text[text.length - 1] === '\n') {
    text = text.substring(0, text.length - 1);
  }
  if (window.performance) {
    var now = (window.performance.now() / 1000).toFixed(3);
    webrtcUtils.log(now + ': ' + text);
  } else {
    webrtcUtils.log(text);
  }
}

if (typeof window === 'object') {
  if (window.HTMLMediaElement &&
    !('srcObject' in window.HTMLMediaElement.prototype)) {
    // Shim the srcObject property, once, when HTMLMediaElement is found.
    Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
      get: function() {
        // If prefixed srcObject property exists, return it.
        // Otherwise use the shimmed property, _srcObject
        return 'mozSrcObject' in this ? this.mozSrcObject : this._srcObject;
      },
      set: function(stream) {
        if ('mozSrcObject' in this) {
          this.mozSrcObject = stream;
        } else {
          // Use _srcObject as a private property for this shim
          this._srcObject = stream;
          // TODO: revokeObjectUrl(this.src) when !stream to release resources?
          this.src = URL.createObjectURL(stream);
        }
      }
    });
  }
  // Proxy existing globals
  getUserMedia = window.navigator && window.navigator.getUserMedia;
}

// Attach a media stream to an element.
attachMediaStream = function(element, stream) {
  element.srcObject = stream;
};

reattachMediaStream = function(to, from) {
  to.srcObject = from.srcObject;
};

if (typeof window === 'undefined' || !window.navigator) {
  webrtcUtils.log('This does not appear to be a browser');
  webrtcDetectedBrowser = 'not a browser';
} else if (navigator.mozGetUserMedia && window.mozRTCPeerConnection) {
  webrtcUtils.log('This appears to be Firefox');

  webrtcDetectedBrowser = 'firefox';

  // the detected firefox version.
  webrtcDetectedVersion =
    parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1], 10);

  // the minimum firefox version still supported by adapter.
  webrtcMinimumVersion = 31;

  // The RTCPeerConnection object.
  window.RTCPeerConnection = function(pcConfig, pcConstraints) {
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
    return new mozRTCPeerConnection(pcConfig, pcConstraints); // jscs:ignore requireCapitalizedConstructors
  };

  // The RTCSessionDescription object.
  window.RTCSessionDescription = mozRTCSessionDescription;

  // The RTCIceCandidate object.
  window.RTCIceCandidate = mozRTCIceCandidate;

  // getUserMedia constraints shim.
  getUserMedia = function(constraints, onSuccess, onError) {
    var constraintsToFF37 = function(c) {
      if (typeof c !== 'object' || c.require) {
        return c;
      }
      var require = [];
      Object.keys(c).forEach(function(key) {
        if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
          return;
        }
        var r = c[key] = (typeof c[key] === 'object') ?
            c[key] : {ideal: c[key]};
        if (r.min !== undefined ||
            r.max !== undefined || r.exact !== undefined) {
          require.push(key);
        }
        if (r.exact !== undefined) {
          if (typeof r.exact === 'number') {
            r.min = r.max = r.exact;
          } else {
            c[key] = r.exact;
          }
          delete r.exact;
        }
        if (r.ideal !== undefined) {
          c.advanced = c.advanced || [];
          var oc = {};
          if (typeof r.ideal === 'number') {
            oc[key] = {min: r.ideal, max: r.ideal};
          } else {
            oc[key] = r.ideal;
          }
          c.advanced.push(oc);
          delete r.ideal;
          if (!Object.keys(r).length) {
            delete c[key];
          }
        }
      });
      if (require.length) {
        c.require = require;
      }
      return c;
    };
    if (webrtcDetectedVersion < 38) {
      webrtcUtils.log('spec: ' + JSON.stringify(constraints));
      if (constraints.audio) {
        constraints.audio = constraintsToFF37(constraints.audio);
      }
      if (constraints.video) {
        constraints.video = constraintsToFF37(constraints.video);
      }
      webrtcUtils.log('ff37: ' + JSON.stringify(constraints));
    }
    return navigator.mozGetUserMedia(constraints, onSuccess, onError);
  };

  navigator.getUserMedia = getUserMedia;

  // Shim for mediaDevices on older versions.
  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {getUserMedia: requestUserMedia,
      addEventListener: function() { },
      removeEventListener: function() { }
    };
  }
  navigator.mediaDevices.enumerateDevices =
      navigator.mediaDevices.enumerateDevices || function() {
    return new Promise(function(resolve) {
      var infos = [
        {kind: 'audioinput', deviceId: 'default', label: '', groupId: ''},
        {kind: 'videoinput', deviceId: 'default', label: '', groupId: ''}
      ];
      resolve(infos);
    });
  };

  if (webrtcDetectedVersion < 41) {
    // Work around http://bugzil.la/1169665
    var orgEnumerateDevices =
        navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
    navigator.mediaDevices.enumerateDevices = function() {
      return orgEnumerateDevices().catch(function(e) {
        if (e.name === 'NotFoundError') {
          return [];
        }
        throw e;
      });
    };
  }
} else if (navigator.webkitGetUserMedia && !!window.chrome) {
  webrtcUtils.log('This appears to be Chrome');

  webrtcDetectedBrowser = 'chrome';

  // the detected chrome version.
  webrtcDetectedVersion =
    parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2], 10);

  // the minimum chrome version still supported by adapter.
  webrtcMinimumVersion = 38;

  // The RTCPeerConnection object.
  window.RTCPeerConnection = function(pcConfig, pcConstraints) {
    // Translate iceTransportPolicy to iceTransports,
    // see https://code.google.com/p/webrtc/issues/detail?id=4869
    if (pcConfig && pcConfig.iceTransportPolicy) {
      pcConfig.iceTransports = pcConfig.iceTransportPolicy;
    }

    var pc = new webkitRTCPeerConnection(pcConfig, pcConstraints); // jscs:ignore requireCapitalizedConstructors
    var origGetStats = pc.getStats;
    pc.getStats = function(selector, successCallback, errorCallback) { // jshint ignore: line
      var args = arguments;

      // If selector is a function then we are in the old style stats so just
      // pass back the original getStats format to avoid breaking old users.
      if (arguments.length > 0 && typeof selector === 'function') {
        return origGetStats.apply(pc, [selector, successCallback]);
      }

      var fixChromeStats = function(response) {
        var standardReport = {};
        var reports = response.result();
        reports.forEach(function(report) {
          var standardStats = {
            id: report.id,
            timestamp: report.timestamp.getTime(),
            type: report.type
          };
          report.names().forEach(function(name) {
            standardStats[name] = report.stat(name);
          });
          // Step 1: translate to standard types and attribute names.
          switch (report.type) {
          case 'ssrc':
            standardStats.trackIdentifier = standardStats.googTrackId;
            // FIXME: not defined in spec, probably whether the track is
            //  remote?
            standardStats.remoteSource =
                standardStats.id.indexOf('recv') !== -1;
            standardStats.ssrc = parseInt(standardStats.ssrc, 10);
            // FIXME: not defined either but I assume sequence of ssrcs
            //  (for FEC)? Or does this contain the ids of the associated
            //  records?!
            standardStats.ssrcIds = [standardStats.ssrc];

            if (!standardStats.mediaType && standardStats.googTrackId) {
              // look up track kind in local or remote streams.
              var streams = standardStats.remoteSource ?
                  pc.getRemoteStreams() : pc.getLocalStreams();
              for (var i = 0; i < streams.length && !standardStats.mediaType;
                  i++) {
                var tracks = streams[i].getTracks();
                for (var j = 0; j < tracks.length; j++) {
                  if (tracks[j].id === standardStats.googTrackId) {
                    standardStats.mediaType = tracks[j].kind;
                  }
                }
              }
            }

            // FIXME: 'only makes sense' <=> not set?
            if (standardStats.googFrameWidthReceived ||
                standardStats.googFrameWidthSent) {
              standardStats.frameWidth = parseInt(
                  standardStats.googFrameWidthReceived ||
                  standardStats.googFrameWidthSent);
            }
            if (standardStats.googFrameHeightReceived ||
                standardStats.googFrameHeightSent) {
              standardStats.frameHeight = parseInt(
                  standardStats.googFrameHeightReceived ||
                  standardStats.googFrameHeightSent, 10);
            }
            if (standardStats.googFrameRateInput ||
                standardStats.googFrameRateReceived) {
              // FIXME: might be something else not available currently
              standardStats.framesPerSecond = parseInt(
                  standardStats.googFrameRateInput ||
                  standardStats.googFrameRateReceived, 10);
            }

            /* FIXME unfortunately the current stats (googFrameRateSent,
             * googFrameRateReceived, googFrameRateDecoded) so we can not
             * calculate the cumulative amount.
             * FIXME (spec) Firefox has frameRateMean why is this
             * not part of the spec?
             */
            if (standardStats.googFrameRateSent) {
              standardStats.framesSent = 0;
            }
            if (standardStats.googFrameRateReceived) {
              standardStats.framesReceived = 0;
            }
            if (standardStats.googFrameRateDecoded) {
              standardStats.framesDecoded = 0;
            }
            // FIXME: both on sender and receiver?
            if (standardStats.mediaType === 'video') {
              standardStats.framesDropped = 0;
            }
            if (standardStats.audioInputLevel ||
                standardStats.audioOutputLevel) {
              standardStats.audioLevel = parseInt(
                  standardStats.audioInputLevel ||
                  standardStats.audioOutputLevel, 10) / 32767.0;
            }

            if (standardStats.googJitterReceived) {
              standardStats.jitter = 1.0 * parseInt(
                  standardStats.googJitterReceived);
            }
            // FIXME: fractionLost

            if (standardStats.googFirsReceived || standardStats.googFirsSent) {
              standardStats.firCount = parseInt(
                  standardStats.googFirsReceived ||
                  standardStats.googFirsSent, 10);
            }
            if (standardStats.googPlisReceived || standardStats.googPlisSent) {
              standardStats.pliCount = parseInt(
                  standardStats.googPlisReceived ||
                  standardStats.googPlisSent, 10);
            }
            if (standardStats.googNacksReceived ||
                standardStats.googNacksSent) {
              standardStats.nackCount = parseInt(
                  standardStats.googNacksReceived ||
                  standardStats.googNacksSent, 10);
            }
            // FIXME: no SLI stats yet?

            if (standardStats.bytesSent) {
              standardStats.bytesSent = parseInt(standardStats.bytesSent, 10);
            }
            if (standardStats.bytesReceived) {
              standardStats.bytesReceived = parseInt(
                  standardStats.bytesReceived, 10);
            }
            if (standardStats.packetsSent) {
              standardStats.packetsSent = parseInt(
                  standardStats.packetsSent, 10);
            }
            if (standardStats.packetsReceived) {
              standardStats.packetsReceived = parseInt(
                  standardStats.packetsReceived, 10);
            }
            if (standardStats.packetsLost) {
              standardStats.packetsLost = parseInt(
                  standardStats.packetsLost, 10);
            }
            if (standardStats.googEchoCancellationReturnLoss) {
              standardStats.echoReturnLoss = 1.0 * parseInt(
                  standardStats.googEchoCancellationReturnLoss, 10);
              standardStats.echoReturnLossEnhancement = 1.0 * parseInt(
                  standardStats.googEchoCancellationReturnLossEnhancement, 10);
            }
            break;
          case 'localCandidate':
          case 'remoteCandidate':
            // https://w3c.github.io/webrtc-stats/#icecandidate-dict*
            standardStats.portNumber = parseInt(standardStats.portNumber, 10);
            standardStats.priority = parseInt(standardStats.priority, 10);
            // FIXME: addressSourceUrl?
            // FIXME: https://github.com/w3c/webrtc-stats/issues/12
            break;
          case 'googCandidatePair':
            // https://w3c.github.io/webrtc-stats/#candidatepair-dict*
            standardStats.type = 'candidatepair';
            standardStats.transportId = standardStats.googChannelId;
            // FIXME: maybe set depending on iceconnectionstate and read/write?
            //standardStats.state = 'FIXME'; // enum

            // FIXME: could be calculated from candidate priorities and role.
            //standardStats.priority = 'FIXME'; // unsigned long long
            standardStats.writable = standardStats.googWritable === 'true';
            standardStats.readable = standardStats.googReadable === 'true';
            // assumption: nominated is readable and writeable.
            standardStats.nominated = standardStats.readable &&
                standardStats.writable;
            // FIXME: missing from spec
            standardStats.selected =
                standardStats.googActiveConnection === 'true';
            standardStats.bytesSent = parseInt(standardStats.bytesSent, 10);
            standardStats.bytesReceived = parseInt(
                standardStats.bytesReceived, 10);
            // FIXME: packetsSent is not in spec?

            standardStats.roundTripTime = parseInt(standardStats.googRtt);

            // backfilled later from videoBWE.
            standardStats.availableOutgoingBitrate = 0.0;
            standardStats.availableIncomingBitrate = 0.0;
            break;
          case 'googComponent':
            // additional RTCTransportStats created later since we
            // want the normalized fields and complete snowball.
            break;
          case 'googCertificate':
            standardStats.type = 'certificate'; // FIXME spec: undefined in spec.
            standardStats.fingerprint = standardStats.googFingerprint;
            standardStats.fingerprintAlgorithm =
                standardStats.googFingerprintAlgorithm;
            standardStats.base64Certificate = standardStats.googDerBase64;
            standardStats.issuerCertificateId = null; // FIXME spec: undefined what 'no issuer' is.
            break;
          case 'VideoBwe':
            standardStats.availableOutgoingBitrate = 1.0 *
                parseInt(standardStats.googAvailableSendBandwidth, 10);
            standardStats.availableIncomingBitrate = 1.0 *
                parseInt(standardStats.googAvailableReceiveBandwidth, 10);
            break;
          }
          standardReport[standardStats.id] = standardStats;
        });
        // Step 2: fix things spanning multiple reports.
        Object.keys(standardReport).forEach(function(id) {
          var report = standardReport[id];
          var other;
          var newId;
          switch (report.type) {
          case 'candidatepair':
            if (standardReport.bweforvideo) {
              report.availableOutgoingBitrate =
                  standardReport.bweforvideo.availableOutgoingBitrate;
              report.availableIncomingBitrate =
                  standardReport.bweforvideo.availableIncomingBitrate;
              standardReport[report.id] = report;
            }
            break;
          case 'googComponent':
            // create a new report since we don't carry over all fields.
            other = standardReport[report.selectedCandidatePairId];
            newId = 'transport_' + report.id;
            standardReport[newId] = {
              type: 'transport',
              timestamp: report.timestamp,
              id: newId,
              bytesSent: other && other.bytesSent || 0,
              bytesReceived: other && other.bytesReceived || 0,
              // FIXME (spec): rtpcpTransportStatsId: rtcp-mux is required so...
              activeConnection: other && other.selected,
              selectedCandidatePairId: report.selectedCandidatePairId,
              localCertificateId: report.localCertificateId,
              remoteCertificateId: report.remoteCertificateId
            };
            break;
          case 'ssrc':
            newId = 'rtpstream_' + report.id;
            // Workaround for https://code.google.com/p/webrtc/issues/detail?id=4808 (fixed in M46)
            if (!report.googCodecName) {
              report.googCodecName = 'VP8';
            }
            standardReport[newId] = {
              //type: 'notastandalonething',
              timestamp: report.timestamp,
              id: newId,
              ssrc: report.ssrc,
              mediaType: report.mediaType,
              associateStatsId: 'rtcpstream_' + report.id, //FIXME spec: remoteId?
              isRemote: false,
              mediaTrackId: 'mediatrack_' + report.id,
              transportId: report.transportId,
              codecId: 'codec_' + report.googCodecName,
            };
            if (report.mediaType === 'video') {
              standardReport[newId].firCount = report.firCount;
              standardReport[newId].pliCount = report.pliCount;
              standardReport[newId].nackCount = report.nackCount;
              standardReport[newId].sliCount = report.sliCount; // undefined yet
            }
            if (report.remoteSource) {
              standardReport[newId].type = 'inboundrtp';
              standardReport[newId].packetsReceived = report.packetsReceived;
              standardReport[newId].bytesReceived = report.bytesReceived;
              standardReport[newId].packetsLost = report.packetsLost;
            } else {
              standardReport[newId].type = 'outboundrtp';
              standardReport[newId].packetsSent = report.packetsSent;
              standardReport[newId].bytesReceived = report.bytesSent;
              // TODO: targetBitrate + roundTripTime
            }

            // FIXME: this is slightly more complicated. inboundrtp can have packetlost
            // but so can outboundrtp via rtcp (isRemote = true)
            // need to unmux with opposite type and put loss into remote report.
            newId = 'rtcpstream_' + report.id;
            standardReport[newId] = {
              //type: 'notastandalonething',
              timestamp: report.timestamp,
              id: newId,
              ssrc: report.ssrc,
              associateStatsId: 'rtpstream_' + report.id, //FIXME spec: remoteId?
              isRemote: true,
              mediaTrackId: 'mediatrack_' + report.id,
              transportId: report.transportId,
              codecId: 'codec_' + report.googCodecName,
            };
            if (report.remoteSource) {
              standardReport[newId].type = 'outboundrtp';
              standardReport[newId].packetsSent = report.packetsSent;
              standardReport[newId].bytesSent = report.bytesSent;
            } else {
              standardReport[newId].type = 'inboundrtp';
              standardReport[newId].packetsReceived = report.packetsReceived;
              standardReport[newId].bytesReceived = report.bytesReceived;
              standardReport[newId].packetsLost = report.packetsLost;
            }
            // FIXME: one of these is not set?
            if (report.jitter) {
              standardReport[newId].jitter = report.jitter;
            }

            newId = 'mediatrack_' + report.id;
            standardReport[newId] = {
              type: 'track',
              timestamp: report.timestamp,
              id: newId,
              trackIdentifier: report.trackIdentifier,
              remoteSource: report.remoteSource,
              ssrcIds: ['rtpstream_' + report.id, 'rtcpstream_' + report.id],
            };
            if (report.mediaType === 'audio') {
              standardReport[newId].audioLevel = report.audioLevel;
              if (report.id.indexOf('send') !== -1) {
                standardReport[newId].echoReturnLoss = report.echoReturnLoss;
                standardReport[newId].echoReturnLossEnhancement =
                    report.echoReturnLossEnhancement;
              }
            } else if (report.mediaType === 'video') {
              standardReport[newId].frameWidth = report.frameWidth;
              standardReport[newId].frameHeight = report.frameHeight;
              standardReport[newId].framesPerSecond = report.framesPerSecond;
              if (report.remoteSource) {
                standardReport[newId].framesReceived = report.framesReceived;
                standardReport[newId].framesDecoded = report.framesDecoded;
                standardReport[newId].framesDropped = report.framesDropped;
                standardReport[newId].framesCorrupted = report.framesCorrupted;
              } else {
                standardReport[newId].framesSent = report.framesSent;
              }
            }

            // We have one codec item per codec name.
            // This might be wrong (in theory) since with unified plan
            // we can have multiple m-lines and codecs and different
            // payload types/parameters but unified is not supported yet.
            if (!standardReport['codec_' + report.googCodecName]) {
              var sdp;
              // determine payload type (from offer) and negotiated (?spec)
              // parameters (from answer). (parameters not negotiated yet)
              if (pc.localDescription &&
                  pc.localDescription.type === 'offer') {
                sdp = pc.localDescription.sdp;
              } else if (pc.remoteDescription &&
                  pc.remoteDescription.type === 'offer') {
                sdp = pc.remoteDescription.sdp;
              }
              if (sdp) {
                // TODO: use a SDP library instead of this regexp-stringsoup approach.
                var match = sdp.match(new RegExp('a=rtpmap:(\\d+) ' +
                    report.googCodecName + '\\/(\\d+)(?:\\/(\\d+))?'));
                if (match) {
                  newId = 'codec_' + report.id;
                  standardReport[newId] = {
                    type: 'codec', // FIXME (spec)
                    timestamp: report.timestamp,
                    id: newId,
                    codec: report.googCodecName,
                    payloadType: parseInt(match[1], 10),
                    clockRate: parseInt(match[2], 10),
                    channels: parseInt(match[3] || '1', 10),
                    parameters: ''
                  };
                }
              }
            }
            break;
          }
        });
        // Step 3: fiddle the transport in between transport and rtp stream
        Object.keys(standardReport).forEach(function(id) {
          var report = standardReport[id];
          var other;
          switch (report.type) {
          case 'transport':
            // RTCTransport has a pointer to the selectedCandidatePair...
            other = standardReport[report.selectedCandidatePairId];
            if (other) {
              other.transportId = report.id;
            }
            // but no pointers to the rtpstreams running over it?!
            // instead, we rely on having added 'transport_'
            Object.keys(standardReport).forEach(function(otherid) {
              other = standardReport[otherid];
              if ((other.type === 'inboundrtp' ||
                  other.type === 'outboundrtp') &&
                  report.id === 'transport_' + other.transportId) {
                other.transportId = report.id;
              }
            });
            break;
          }
        });

        return standardReport;
      };

      if (arguments.length >= 2) {
        var successCallbackWrapper = function(response) {
          args[1](fixChromeStats(response));
        };

        return origGetStats.apply(this, [successCallbackWrapper, arguments[0]]);
      }

      // promise-support
      return new Promise(function(resolve, reject) {
        if (args.length === 1 && selector === null) {
          origGetStats.apply(pc, [
              function(response) {
                resolve.apply(null, [fixChromeStats(response)]);
              }, reject]);
        } else {
          origGetStats.apply(pc, [resolve, reject]);
        }
      });
    };

    return pc;
  };

  // add promise support
  ['createOffer', 'createAnswer'].forEach(function(method) {
    var nativeMethod = webkitRTCPeerConnection.prototype[method];
    webkitRTCPeerConnection.prototype[method] = function() {
      var self = this;
      if (arguments.length < 1 || (arguments.length === 1 &&
          typeof(arguments[0]) === 'object')) {
        var opts = arguments.length === 1 ? arguments[0] : undefined;
        return new Promise(function(resolve, reject) {
          nativeMethod.apply(self, [resolve, reject, opts]);
        });
      } else {
        return nativeMethod.apply(this, arguments);
      }
    };
  });

  ['setLocalDescription', 'setRemoteDescription',
      'addIceCandidate'].forEach(function(method) {
    var nativeMethod = webkitRTCPeerConnection.prototype[method];
    webkitRTCPeerConnection.prototype[method] = function() {
      var args = arguments;
      var self = this;
      return new Promise(function(resolve, reject) {
        nativeMethod.apply(self, [args[0],
            function() {
              resolve();
              if (args.length >= 2) {
                args[1].apply(null, []);
              }
            },
            function(err) {
              reject(err);
              if (args.length >= 3) {
                args[2].apply(null, [err]);
              }
            }]
          );
      });
    };
  });

  // getUserMedia constraints shim.
  var constraintsToChrome = function(c) {
    if (typeof c !== 'object' || c.mandatory || c.optional) {
      return c;
    }
    var cc = {};
    Object.keys(c).forEach(function(key) {
      if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
        return;
      }
      var r = (typeof c[key] === 'object') ? c[key] : {ideal: c[key]};
      if (r.exact !== undefined && typeof r.exact === 'number') {
        r.min = r.max = r.exact;
      }
      var oldname = function(prefix, name) {
        if (prefix) {
          return prefix + name.charAt(0).toUpperCase() + name.slice(1);
        }
        return (name === 'deviceId') ? 'sourceId' : name;
      };
      if (r.ideal !== undefined) {
        cc.optional = cc.optional || [];
        var oc = {};
        if (typeof r.ideal === 'number') {
          oc[oldname('min', key)] = r.ideal;
          cc.optional.push(oc);
          oc = {};
          oc[oldname('max', key)] = r.ideal;
          cc.optional.push(oc);
        } else {
          oc[oldname('', key)] = r.ideal;
          cc.optional.push(oc);
        }
      }
      if (r.exact !== undefined && typeof r.exact !== 'number') {
        cc.mandatory = cc.mandatory || {};
        cc.mandatory[oldname('', key)] = r.exact;
      } else {
        ['min', 'max'].forEach(function(mix) {
          if (r[mix] !== undefined) {
            cc.mandatory = cc.mandatory || {};
            cc.mandatory[oldname(mix, key)] = r[mix];
          }
        });
      }
    });
    if (c.advanced) {
      cc.optional = (cc.optional || []).concat(c.advanced);
    }
    return cc;
  };

  getUserMedia = function(constraints, onSuccess, onError) {
    if (constraints.audio) {
      constraints.audio = constraintsToChrome(constraints.audio);
    }
    if (constraints.video) {
      constraints.video = constraintsToChrome(constraints.video);
    }
    webrtcUtils.log('chrome: ' + JSON.stringify(constraints));
    return navigator.webkitGetUserMedia(constraints, onSuccess, onError);
  };
  navigator.getUserMedia = getUserMedia;

  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {getUserMedia: requestUserMedia,
                              enumerateDevices: function() {
      return new Promise(function(resolve) {
        var kinds = {audio: 'audioinput', video: 'videoinput'};
        return MediaStreamTrack.getSources(function(devices) {
          resolve(devices.map(function(device) {
            return {label: device.label,
                    kind: kinds[device.kind],
                    deviceId: device.id,
                    groupId: ''};
          }));
        });
      });
    }};
  }

  // A shim for getUserMedia method on the mediaDevices object.
  // TODO(KaptenJansson) remove once implemented in Chrome stable.
  if (!navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
      return requestUserMedia(constraints);
    };
  } else {
    // Even though Chrome 45 has navigator.mediaDevices and a getUserMedia
    // function which returns a Promise, it does not accept spec-style
    // constraints.
    var origGetUserMedia = navigator.mediaDevices.getUserMedia.
        bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(c) {
      webrtcUtils.log('spec:   ' + JSON.stringify(c)); // whitespace for alignment
      c.audio = constraintsToChrome(c.audio);
      c.video = constraintsToChrome(c.video);
      webrtcUtils.log('chrome: ' + JSON.stringify(c));
      return origGetUserMedia(c);
    };
  }

  // Dummy devicechange event methods.
  // TODO(KaptenJansson) remove once implemented in Chrome stable.
  if (typeof navigator.mediaDevices.addEventListener === 'undefined') {
    navigator.mediaDevices.addEventListener = function() {
      webrtcUtils.log('Dummy mediaDevices.addEventListener called.');
    };
  }
  if (typeof navigator.mediaDevices.removeEventListener === 'undefined') {
    navigator.mediaDevices.removeEventListener = function() {
      webrtcUtils.log('Dummy mediaDevices.removeEventListener called.');
    };
  }

  // Attach a media stream to an element.
  attachMediaStream = function(element, stream) {
    if (webrtcDetectedVersion >= 43) {
      element.srcObject = stream;
    } else if (typeof element.src !== 'undefined') {
      element.src = URL.createObjectURL(stream);
    } else {
      webrtcUtils.log('Error attaching stream to element.');
    }
  };
  reattachMediaStream = function(to, from) {
    if (webrtcDetectedVersion >= 43) {
      to.srcObject = from.srcObject;
    } else {
      to.src = from.src;
    }
  };

} else if (navigator.mediaDevices && navigator.userAgent.match(
    /Edge\/(\d+).(\d+)$/)) {
  webrtcUtils.log('This appears to be Edge');
  webrtcDetectedBrowser = 'edge';

  webrtcDetectedVersion =
    parseInt(navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)[2], 10);

  // the minimum version still supported by adapter.
  webrtcMinimumVersion = 12;
} else {
  webrtcUtils.log('Browser does not appear to be WebRTC-capable');
}

// Returns the result of getUserMedia as a Promise.
function requestUserMedia(constraints) {
  return new Promise(function(resolve, reject) {
    getUserMedia(constraints, resolve, reject);
  });
}

var webrtcTesting = {};
Object.defineProperty(webrtcTesting, 'version', {
  set: function(version) {
    webrtcDetectedVersion = version;
  }
});

if (typeof module !== 'undefined') {
  var RTCPeerConnection;
  if (typeof window !== 'undefined') {
    RTCPeerConnection = window.RTCPeerConnection;
  }
  module.exports = {
    RTCPeerConnection: RTCPeerConnection,
    getUserMedia: getUserMedia,
    attachMediaStream: attachMediaStream,
    reattachMediaStream: reattachMediaStream,
    webrtcDetectedBrowser: webrtcDetectedBrowser,
    webrtcDetectedVersion: webrtcDetectedVersion,
    webrtcMinimumVersion: webrtcMinimumVersion,
    webrtcTesting: webrtcTesting
    //requestUserMedia: not exposed on purpose.
    //trace: not exposed on purpose.
  };
} else if ((typeof require === 'function') && (typeof define === 'function')) {
  // Expose objects and functions when RequireJS is doing the loading.
  define([], function() {
    return {
      RTCPeerConnection: window.RTCPeerConnection,
      getUserMedia: getUserMedia,
      attachMediaStream: attachMediaStream,
      reattachMediaStream: reattachMediaStream,
      webrtcDetectedBrowser: webrtcDetectedBrowser,
      webrtcDetectedVersion: webrtcDetectedVersion,
      webrtcMinimumVersion: webrtcMinimumVersion,
      webrtcTesting: webrtcTesting
      //requestUserMedia: not exposed on purpose.
      //trace: not exposed on purpose.
    };
  });
}
