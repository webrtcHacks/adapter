/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
'use strict';

import * as utils from '../utils';
export {shimGetUserMedia} from './getusermedia';

export function shimOnTrack(window) {
  if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in
      window.RTCPeerConnection.prototype)) {
    Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
      get() {
        return this._ontrack;
      },
      set(f) {
        if (this._ontrack) {
          this.removeEventListener('track', this._ontrack);
          this.removeEventListener('addstream', this._ontrackpoly);
        }
        this.addEventListener('track', this._ontrack = f);
        this.addEventListener('addstream', this._ontrackpoly = e => {
          e.stream.getTracks().forEach(track => {
            const event = new Event('track');
            event.track = track;
            event.receiver = {track};
            event.transceiver = {receiver: event.receiver};
            event.streams = [e.stream];
            this.dispatchEvent(event);
          });
        });
      }
    });
  }
  if (typeof window === 'object' && window.RTCTrackEvent &&
      ('receiver' in window.RTCTrackEvent.prototype) &&
      !('transceiver' in window.RTCTrackEvent.prototype)) {
    Object.defineProperty(window.RTCTrackEvent.prototype, 'transceiver', {
      get() {
        return {receiver: this.receiver};
      }
    });
  }
}

export function shimSourceObject(window) {
  // Firefox has supported mozSrcObject since FF22, unprefixed in 42.
  if (typeof window === 'object') {
    if (window.HTMLMediaElement &&
      !('srcObject' in window.HTMLMediaElement.prototype)) {
      // Shim the srcObject property, once, when HTMLMediaElement is found.
      Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
        get() {
          return this.mozSrcObject;
        },
        set(stream) {
          this.mozSrcObject = stream;
        }
      });
    }
  }
}

export function shimPeerConnection(window) {
  const browserDetails = utils.detectBrowser(window);

  if (typeof window !== 'object' || !(window.RTCPeerConnection ||
      window.mozRTCPeerConnection)) {
    return; // probably media.peerconnection.enabled=false in about:config
  }
  // The RTCPeerConnection object.
  if (!window.RTCPeerConnection) {
    window.RTCPeerConnection = function(pcConfig, pcConstraints) {
      if (browserDetails.version < 38) {
        // .urls is not supported in FF < 38.
        // create RTCIceServers with a single url.
        if (pcConfig && pcConfig.iceServers) {
          const newIceServers = [];
          for (let i = 0; i < pcConfig.iceServers.length; i++) {
            const server = pcConfig.iceServers[i];
            if (server.hasOwnProperty('urls')) {
              for (let j = 0; j < server.urls.length; j++) {
                const newServer = {
                  url: server.urls[j]
                };
                if (server.urls[j].startsWith('turn')) {
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
      return new window.mozRTCPeerConnection(pcConfig, pcConstraints);
    };
    window.RTCPeerConnection.prototype =
        window.mozRTCPeerConnection.prototype;

    // wrap static methods. Currently just generateCertificate.
    if (window.mozRTCPeerConnection.generateCertificate) {
      Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
        get() {
          return window.mozRTCPeerConnection.generateCertificate;
        }
      });
    }

    window.RTCSessionDescription = window.mozRTCSessionDescription;
    window.RTCIceCandidate = window.mozRTCIceCandidate;
  }

  // shim away need for obsolete RTCIceCandidate/RTCSessionDescription.
  ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
      .forEach(function(method) {
        const nativeMethod = window.RTCPeerConnection.prototype[method];
        window.RTCPeerConnection.prototype[method] = function() {
          arguments[0] = new ((method === 'addIceCandidate') ?
              window.RTCIceCandidate :
              window.RTCSessionDescription)(arguments[0]);
          return nativeMethod.apply(this, arguments);
        };
      });

  // support for addIceCandidate(null or undefined)
  const nativeAddIceCandidate =
      window.RTCPeerConnection.prototype.addIceCandidate;
  window.RTCPeerConnection.prototype.addIceCandidate = function() {
    if (!arguments[0]) {
      if (arguments[1]) {
        arguments[1].apply(null);
      }
      return Promise.resolve();
    }
    return nativeAddIceCandidate.apply(this, arguments);
  };

  // shim getStats with maplike support
  const makeMapStats = function(stats) {
    const map = new Map();
    Object.keys(stats).forEach(key => {
      map.set(key, stats[key]);
      map[key] = stats[key];
    });
    return map;
  };

  const modernStatsTypes = {
    inboundrtp: 'inbound-rtp',
    outboundrtp: 'outbound-rtp',
    candidatepair: 'candidate-pair',
    localcandidate: 'local-candidate',
    remotecandidate: 'remote-candidate'
  };

  const nativeGetStats = window.RTCPeerConnection.prototype.getStats;
  window.RTCPeerConnection.prototype.getStats = function(
    selector,
    onSucc,
    onErr
  ) {
    return nativeGetStats.apply(this, [selector || null])
      .then(stats => {
        if (browserDetails.version < 48) {
          stats = makeMapStats(stats);
        }
        if (browserDetails.version < 53 && !onSucc) {
          // Shim only promise getStats with spec-hyphens in type names
          // Leave callback version alone; misc old uses of forEach before Map
          try {
            stats.forEach(stat => {
              stat.type = modernStatsTypes[stat.type] || stat.type;
            });
          } catch (e) {
            if (e.name !== 'TypeError') {
              throw e;
            }
            // Avoid TypeError: "type" is read-only, in old versions. 34-43ish
            stats.forEach((stat, i) => {
              stats.set(i, Object.assign({}, stat, {
                type: modernStatsTypes[stat.type] || stat.type
              }));
            });
          }
        }
        return stats;
      })
      .then(onSucc, onErr);
  };
}

export function shimSenderGetStats(window) {
  if (!(typeof window === 'object' && window.RTCPeerConnection &&
      window.RTCRtpSender)) {
    return;
  }
  if (window.RTCRtpSender && 'getStats' in window.RTCRtpSender.prototype) {
    return;
  }
  const origGetSenders = window.RTCPeerConnection.prototype.getSenders;
  if (origGetSenders) {
    window.RTCPeerConnection.prototype.getSenders = function() {
      const senders = origGetSenders.apply(this, []);
      senders.forEach(sender => sender._pc = this);
      return senders;
    };
  }

  const origAddTrack = window.RTCPeerConnection.prototype.addTrack;
  if (origAddTrack) {
    window.RTCPeerConnection.prototype.addTrack = function() {
      const sender = origAddTrack.apply(this, arguments);
      sender._pc = this;
      return sender;
    };
  }
  window.RTCRtpSender.prototype.getStats = function() {
    return this.track ? this._pc.getStats(this.track) :
        Promise.resolve(new Map());
  };
}

export function shimReceiverGetStats(window) {
  if (!(typeof window === 'object' && window.RTCPeerConnection &&
      window.RTCRtpSender)) {
    return;
  }
  if (window.RTCRtpSender && 'getStats' in window.RTCRtpReceiver.prototype) {
    return;
  }
  const origGetReceivers = window.RTCPeerConnection.prototype.getReceivers;
  if (origGetReceivers) {
    window.RTCPeerConnection.prototype.getReceivers = function() {
      const receivers = origGetReceivers.apply(this, []);
      receivers.forEach(receiver => receiver._pc = this);
      return receivers;
    };
  }
  utils.wrapPeerConnectionEvent(window, 'track', e => {
    e.receiver._pc = e.srcElement;
    return e;
  });
  window.RTCRtpReceiver.prototype.getStats = function() {
    return this._pc.getStats(this.track);
  };
}

export function shimRemoveStream(window) {
  if (!window.RTCPeerConnection ||
      'removeStream' in window.RTCPeerConnection.prototype) {
    return;
  }
  window.RTCPeerConnection.prototype.removeStream = function(stream) {
    utils.deprecated('removeStream', 'removeTrack');
    this.getSenders().forEach(sender => {
      if (sender.track && stream.getTracks().includes(sender.track)) {
        this.removeTrack(sender);
      }
    });
  };
}

export function shimRTCDataChannel(window) {
  // rename DataChannel to RTCDataChannel (native fix in FF60):
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1173851
  if (window.DataChannel && !window.RTCDataChannel) {
    window.RTCDataChannel = window.DataChannel;
  }
}
