
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
'use strict';
import * as utils from '../utils.js';
const logging = utils.log;

export {shimGetUserMedia} from './getusermedia';

/* iterates the stats graph recursively. */
function walkStats(stats, base, resultSet) {
  if (!base || resultSet.has(base.id)) {
    return;
  }
  resultSet.set(base.id, base);
  Object.keys(base).forEach(name => {
    if (name.endsWith('Id')) {
      walkStats(stats, stats.get(base[name]), resultSet);
    } else if (name.endsWith('Ids')) {
      base[name].forEach(id => {
        walkStats(stats, stats.get(id), resultSet);
      });
    }
  });
}

/* filter getStats for a sender/receiver track. */
function filterStats(result, track, outbound) {
  const streamStatsType = outbound ? 'outbound-rtp' : 'inbound-rtp';
  const filteredResult = new Map();
  if (track === null) {
    return filteredResult;
  }
  const trackStats = [];
  result.forEach(value => {
    if (value.type === 'track' &&
        value.trackIdentifier === track.id) {
      trackStats.push(value);
    }
  });
  trackStats.forEach(trackStat => {
    result.forEach(stats => {
      if (stats.type === streamStatsType && stats.trackId === trackStat.id) {
        walkStats(result, stats, filteredResult);
      }
    });
  });
  return filteredResult;
}

export function shimMediaStream(window) {
  window.MediaStream = window.MediaStream || window.webkitMediaStream;
}

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
        }
        this.addEventListener('track', this._ontrack = f);
      }
    });
    const origSetRemoteDescription =
        window.RTCPeerConnection.prototype.setRemoteDescription;
    window.RTCPeerConnection.prototype.setRemoteDescription = function() {
      const pc = this;
      if (!pc._ontrackpoly) {
        pc._ontrackpoly = function(e) {
          // onaddstream does not fire when a track is added to an existing
          // stream. But stream.onaddtrack is implemented so we use that.
          e.stream.addEventListener('addtrack', te => {
            let receiver;
            if (window.RTCPeerConnection.prototype.getReceivers) {
              receiver = pc.getReceivers()
                .find(r => r.track && r.track.id === te.track.id);
            } else {
              receiver = {track: te.track};
            }

            const event = new Event('track');
            event.track = te.track;
            event.receiver = receiver;
            event.transceiver = {receiver};
            event.streams = [e.stream];
            pc.dispatchEvent(event);
          });
          e.stream.getTracks().forEach(track => {
            let receiver;
            if (window.RTCPeerConnection.prototype.getReceivers) {
              receiver = pc.getReceivers()
                .find(r => r.track && r.track.id === track.id);
            } else {
              receiver = {track};
            }
            const event = new Event('track');
            event.track = track;
            event.receiver = receiver;
            event.transceiver = {receiver};
            event.streams = [e.stream];
            pc.dispatchEvent(event);
          });
        };
        pc.addEventListener('addstream', pc._ontrackpoly);
      }
      return origSetRemoteDescription.apply(pc, arguments);
    };
  } else if (!('RTCRtpTransceiver' in window)) {
    utils.wrapPeerConnectionEvent(window, 'track', e => {
      if (!e.transceiver) {
        e.transceiver = {receiver: e.receiver};
      }
      return e;
    });
  }
}

export function shimGetSendersWithDtmf(window) {
  // Overrides addTrack/removeTrack, depends on shimAddTrackRemoveTrack.
  if (typeof window === 'object' && window.RTCPeerConnection &&
      !('getSenders' in window.RTCPeerConnection.prototype) &&
      'createDTMFSender' in window.RTCPeerConnection.prototype) {
    const shimSenderWithDtmf = function(pc, track) {
      return {
        track,
        get dtmf() {
          if (this._dtmf === undefined) {
            if (track.kind === 'audio') {
              this._dtmf = pc.createDTMFSender(track);
            } else {
              this._dtmf = null;
            }
          }
          return this._dtmf;
        },
        _pc: pc
      };
    };

    // augment addTrack when getSenders is not available.
    if (!window.RTCPeerConnection.prototype.getSenders) {
      window.RTCPeerConnection.prototype.getSenders = function() {
        this._senders = this._senders || [];
        return this._senders.slice(); // return a copy of the internal state.
      };
      const origAddTrack = window.RTCPeerConnection.prototype.addTrack;
      window.RTCPeerConnection.prototype.addTrack = function(track, stream) {
        const pc = this;
        let sender = origAddTrack.apply(pc, arguments);
        if (!sender) {
          sender = shimSenderWithDtmf(pc, track);
          pc._senders.push(sender);
        }
        return sender;
      };

      const origRemoveTrack = window.RTCPeerConnection.prototype.removeTrack;
      window.RTCPeerConnection.prototype.removeTrack = function(sender) {
        const pc = this;
        origRemoveTrack.apply(pc, arguments);
        const idx = pc._senders.indexOf(sender);
        if (idx !== -1) {
          pc._senders.splice(idx, 1);
        }
      };
    }
    const origAddStream = window.RTCPeerConnection.prototype.addStream;
    window.RTCPeerConnection.prototype.addStream = function(stream) {
      const pc = this;
      pc._senders = pc._senders || [];
      origAddStream.apply(pc, [stream]);
      stream.getTracks().forEach(track => {
        pc._senders.push(shimSenderWithDtmf(pc, track));
      });
    };

    const origRemoveStream = window.RTCPeerConnection.prototype.removeStream;
    window.RTCPeerConnection.prototype.removeStream = function(stream) {
      const pc = this;
      pc._senders = pc._senders || [];
      origRemoveStream.apply(pc, [stream]);

      stream.getTracks().forEach(track => {
        const sender = pc._senders.find(s => s.track === track);
        if (sender) {
          pc._senders.splice(pc._senders.indexOf(sender), 1); // remove sender
        }
      });
    };
  } else if (typeof window === 'object' && window.RTCPeerConnection &&
             'getSenders' in window.RTCPeerConnection.prototype &&
             'createDTMFSender' in window.RTCPeerConnection.prototype &&
             window.RTCRtpSender &&
             !('dtmf' in window.RTCRtpSender.prototype)) {
    const origGetSenders = window.RTCPeerConnection.prototype.getSenders;
    window.RTCPeerConnection.prototype.getSenders = function() {
      const pc = this;
      const senders = origGetSenders.apply(pc, []);
      senders.forEach(sender => {
        sender._pc = pc;
      });
      return senders;
    };

    Object.defineProperty(window.RTCRtpSender.prototype, 'dtmf', {
      get() {
        if (this._dtmf === undefined) {
          if (this.track.kind === 'audio') {
            this._dtmf = this._pc.createDTMFSender(this.track);
          } else {
            this._dtmf = null;
          }
        }
        return this._dtmf;
      }
    });
  }
}

export function shimSenderReceiverGetStats(window) {
  if (!(typeof window === 'object' && window.RTCPeerConnection &&
      window.RTCRtpSender && window.RTCRtpReceiver)) {
    return;
  }

  // shim sender stats.
  if (!('getStats' in window.RTCRtpSender.prototype)) {
    const origGetSenders = window.RTCPeerConnection.prototype.getSenders;
    if (origGetSenders) {
      window.RTCPeerConnection.prototype.getSenders = function() {
        const pc = this;
        const senders = origGetSenders.apply(pc, []);
        senders.forEach(sender => {
          sender._pc = pc;
        });
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
      const sender = this;
      return this._pc.getStats().then(result =>
        /* Note: this will include stats of all senders that
         * send a track with the same id as sender.track as
         * it is not possible to identify the RTCRtpSender.
         */
        filterStats(result, sender.track, true));
    };
  }

  // shim receiver stats.
  if (!('getStats' in window.RTCRtpReceiver.prototype)) {
    const origGetReceivers = window.RTCPeerConnection.prototype.getReceivers;
    if (origGetReceivers) {
      window.RTCPeerConnection.prototype.getReceivers = function() {
        const pc = this;
        const receivers = origGetReceivers.apply(pc, []);
        receivers.forEach(receiver => {
          receiver._pc = pc;
        });
        return receivers;
      };
    }
    utils.wrapPeerConnectionEvent(window, 'track', e => {
      e.receiver._pc = e.srcElement;
      return e;
    });
    window.RTCRtpReceiver.prototype.getStats = function() {
      const receiver = this;
      return this._pc.getStats()
        .then(result => filterStats(result, receiver.track, false));
    };
  }

  if (!('getStats' in window.RTCRtpSender.prototype &&
      'getStats' in window.RTCRtpReceiver.prototype)) {
    return;
  }

  // shim RTCPeerConnection.getStats(track).
  const origGetStats = window.RTCPeerConnection.prototype.getStats;
  window.RTCPeerConnection.prototype.getStats = function() {
    const pc = this;
    if (arguments.length > 0 &&
        arguments[0] instanceof window.MediaStreamTrack) {
      const track = arguments[0];
      let sender;
      let receiver;
      let err;
      pc.getSenders().forEach(s => {
        if (s.track === track) {
          if (sender) {
            err = true;
          } else {
            sender = s;
          }
        }
      });
      pc.getReceivers().forEach(r => {
        if (r.track === track) {
          if (receiver) {
            err = true;
          } else {
            receiver = r;
          }
        }
        return r.track === track;
      });
      if (err || (sender && receiver)) {
        return Promise.reject(new DOMException(
          'There are more than one sender or receiver for the track.',
          'InvalidAccessError'));
      } else if (sender) {
        return sender.getStats();
      } else if (receiver) {
        return receiver.getStats();
      }
      return Promise.reject(new DOMException(
        'There is no sender or receiver for the track.',
        'InvalidAccessError'));
    }
    return origGetStats.apply(pc, arguments);
  };
}

export function shimSourceObject(window) {
  const URL = window && window.URL;

  if (typeof window === 'object') {
    if (window.HTMLMediaElement &&
      !('srcObject' in window.HTMLMediaElement.prototype)) {
      // Shim the srcObject property, once, when HTMLMediaElement is found.
      Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
        get() {
          return this._srcObject;
        },
        set(stream) {
          const self = this;
          // Use _srcObject as a private property for this shim
          this._srcObject = stream;
          if (this.src) {
            URL.revokeObjectURL(this.src);
          }

          if (!stream) {
            this.src = '';
            return undefined;
          }
          this.src = URL.createObjectURL(stream);
          // We need to recreate the blob url when a track is added or
          // removed. Doing it manually since we want to avoid a recursion.
          stream.addEventListener('addtrack', () => {
            if (self.src) {
              URL.revokeObjectURL(self.src);
            }
            self.src = URL.createObjectURL(stream);
          });
          stream.addEventListener('removetrack', () => {
            if (self.src) {
              URL.revokeObjectURL(self.src);
            }
            self.src = URL.createObjectURL(stream);
          });
        }
      });
    }
  }
}

export function shimAddTrackRemoveTrackWithNative(window) {
  // shim addTrack/removeTrack with native variants in order to make
  // the interactions with legacy getLocalStreams behave as in other browsers.
  // Keeps a mapping stream.id => [stream, rtpsenders...]
  window.RTCPeerConnection.prototype.getLocalStreams = function() {
    const pc = this;
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    return Object.keys(this._shimmedLocalStreams)
      .map(streamId => pc._shimmedLocalStreams[streamId][0]);
  };

  const origAddTrack = window.RTCPeerConnection.prototype.addTrack;
  window.RTCPeerConnection.prototype.addTrack = function(track, stream) {
    if (!stream) {
      return origAddTrack.apply(this, arguments);
    }
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};

    const sender = origAddTrack.apply(this, arguments);
    if (!this._shimmedLocalStreams[stream.id]) {
      this._shimmedLocalStreams[stream.id] = [stream, sender];
    } else if (this._shimmedLocalStreams[stream.id].indexOf(sender) === -1) {
      this._shimmedLocalStreams[stream.id].push(sender);
    }
    return sender;
  };

  const origAddStream = window.RTCPeerConnection.prototype.addStream;
  window.RTCPeerConnection.prototype.addStream = function(stream) {
    const pc = this;
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};

    stream.getTracks().forEach(track => {
      const alreadyExists = pc.getSenders().find(s => s.track === track);
      if (alreadyExists) {
        throw new DOMException('Track already exists.',
            'InvalidAccessError');
      }
    });
    const existingSenders = pc.getSenders();
    origAddStream.apply(this, arguments);
    const newSenders = pc.getSenders()
      .filter(newSender => existingSenders.indexOf(newSender) === -1);
    this._shimmedLocalStreams[stream.id] = [stream].concat(newSenders);
  };

  const origRemoveStream = window.RTCPeerConnection.prototype.removeStream;
  window.RTCPeerConnection.prototype.removeStream = function(stream) {
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    delete this._shimmedLocalStreams[stream.id];
    return origRemoveStream.apply(this, arguments);
  };

  const origRemoveTrack = window.RTCPeerConnection.prototype.removeTrack;
  window.RTCPeerConnection.prototype.removeTrack = function(sender) {
    const pc = this;
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    if (sender) {
      Object.keys(this._shimmedLocalStreams).forEach(streamId => {
        const idx = pc._shimmedLocalStreams[streamId].indexOf(sender);
        if (idx !== -1) {
          pc._shimmedLocalStreams[streamId].splice(idx, 1);
        }
        if (pc._shimmedLocalStreams[streamId].length === 1) {
          delete pc._shimmedLocalStreams[streamId];
        }
      });
    }
    return origRemoveTrack.apply(this, arguments);
  };
}

export function shimAddTrackRemoveTrack(window) {
  const browserDetails = utils.detectBrowser(window);
  // shim addTrack and removeTrack.
  if (window.RTCPeerConnection.prototype.addTrack &&
      browserDetails.version >= 65) {
    return this.shimAddTrackRemoveTrackWithNative(window);
  }

  // also shim pc.getLocalStreams when addTrack is shimmed
  // to return the original streams.
  const origGetLocalStreams = window.RTCPeerConnection.prototype
      .getLocalStreams;
  window.RTCPeerConnection.prototype.getLocalStreams = function() {
    const pc = this;
    const nativeStreams = origGetLocalStreams.apply(this);
    pc._reverseStreams = pc._reverseStreams || {};
    return nativeStreams.map(stream => pc._reverseStreams[stream.id]);
  };

  const origAddStream = window.RTCPeerConnection.prototype.addStream;
  window.RTCPeerConnection.prototype.addStream = function(stream) {
    const pc = this;
    pc._streams = pc._streams || {};
    pc._reverseStreams = pc._reverseStreams || {};

    stream.getTracks().forEach(track => {
      const alreadyExists = pc.getSenders().find(s => s.track === track);
      if (alreadyExists) {
        throw new DOMException('Track already exists.',
            'InvalidAccessError');
      }
    });
    // Add identity mapping for consistency with addTrack.
    // Unless this is being used with a stream from addTrack.
    if (!pc._reverseStreams[stream.id]) {
      const newStream = new window.MediaStream(stream.getTracks());
      pc._streams[stream.id] = newStream;
      pc._reverseStreams[newStream.id] = stream;
      stream = newStream;
    }
    origAddStream.apply(pc, [stream]);
  };

  const origRemoveStream = window.RTCPeerConnection.prototype.removeStream;
  window.RTCPeerConnection.prototype.removeStream = function(stream) {
    const pc = this;
    pc._streams = pc._streams || {};
    pc._reverseStreams = pc._reverseStreams || {};

    origRemoveStream.apply(pc, [(pc._streams[stream.id] || stream)]);
    delete pc._reverseStreams[(pc._streams[stream.id] ?
        pc._streams[stream.id].id : stream.id)];
    delete pc._streams[stream.id];
  };

  window.RTCPeerConnection.prototype.addTrack = function(track, stream) {
    const pc = this;
    if (pc.signalingState === 'closed') {
      throw new DOMException(
        'The RTCPeerConnection\'s signalingState is \'closed\'.',
        'InvalidStateError');
    }
    const streams = [].slice.call(arguments, 1);
    if (streams.length !== 1 ||
        !streams[0].getTracks().find(t => t === track)) {
      // this is not fully correct but all we can manage without
      // [[associated MediaStreams]] internal slot.
      throw new DOMException(
        'The adapter.js addTrack polyfill only supports a single ' +
        ' stream which is associated with the specified track.',
        'NotSupportedError');
    }

    const alreadyExists = pc.getSenders().find(s => s.track === track);
    if (alreadyExists) {
      throw new DOMException('Track already exists.',
          'InvalidAccessError');
    }

    pc._streams = pc._streams || {};
    pc._reverseStreams = pc._reverseStreams || {};
    const oldStream = pc._streams[stream.id];
    if (oldStream) {
      // this is using odd Chrome behaviour, use with caution:
      // https://bugs.chromium.org/p/webrtc/issues/detail?id=7815
      // Note: we rely on the high-level addTrack/dtmf shim to
      // create the sender with a dtmf sender.
      oldStream.addTrack(track);

      // Trigger ONN async.
      Promise.resolve().then(() => {
        pc.dispatchEvent(new Event('negotiationneeded'));
      });
    } else {
      const newStream = new window.MediaStream([track]);
      pc._streams[stream.id] = newStream;
      pc._reverseStreams[newStream.id] = stream;
      pc.addStream(newStream);
    }
    return pc.getSenders().find(s => s.track === track);
  };

  // replace the internal stream id with the external one and
  // vice versa.
  function replaceInternalStreamId(pc, description) {
    let sdp = description.sdp;
    Object.keys(pc._reverseStreams || []).forEach(internalId => {
      const externalStream = pc._reverseStreams[internalId];
      const internalStream = pc._streams[externalStream.id];
      sdp = sdp.replace(new RegExp(internalStream.id, 'g'),
          externalStream.id);
    });
    return new RTCSessionDescription({
      type: description.type,
      sdp
    });
  }
  function replaceExternalStreamId(pc, description) {
    let sdp = description.sdp;
    Object.keys(pc._reverseStreams || []).forEach(internalId => {
      const externalStream = pc._reverseStreams[internalId];
      const internalStream = pc._streams[externalStream.id];
      sdp = sdp.replace(new RegExp(externalStream.id, 'g'),
          internalStream.id);
    });
    return new RTCSessionDescription({
      type: description.type,
      sdp
    });
  }
  ['createOffer', 'createAnswer'].forEach(function(method) {
    const nativeMethod = window.RTCPeerConnection.prototype[method];
    window.RTCPeerConnection.prototype[method] = function() {
      const pc = this;
      const args = arguments;
      const isLegacyCall = arguments.length &&
          typeof arguments[0] === 'function';
      if (isLegacyCall) {
        return nativeMethod.apply(pc, [
          function(description) {
            const desc = replaceInternalStreamId(pc, description);
            args[0].apply(null, [desc]);
          },
          function(err) {
            if (args[1]) {
              args[1].apply(null, err);
            }
          }, arguments[2]
        ]);
      }
      return nativeMethod.apply(pc, arguments)
      .then(description => replaceInternalStreamId(pc, description));
    };
  });

  const origSetLocalDescription =
      window.RTCPeerConnection.prototype.setLocalDescription;
  window.RTCPeerConnection.prototype.setLocalDescription = function() {
    const pc = this;
    if (!arguments.length || !arguments[0].type) {
      return origSetLocalDescription.apply(pc, arguments);
    }
    arguments[0] = replaceExternalStreamId(pc, arguments[0]);
    return origSetLocalDescription.apply(pc, arguments);
  };

  // TODO: mangle getStats: https://w3c.github.io/webrtc-stats/#dom-rtcmediastreamstats-streamidentifier

  const origLocalDescription = Object.getOwnPropertyDescriptor(
      window.RTCPeerConnection.prototype, 'localDescription');
  Object.defineProperty(window.RTCPeerConnection.prototype,
      'localDescription', {
        get() {
          const pc = this;
          const description = origLocalDescription.get.apply(this);
          if (description.type === '') {
            return description;
          }
          return replaceInternalStreamId(pc, description);
        }
      });

  window.RTCPeerConnection.prototype.removeTrack = function(sender) {
    const pc = this;
    if (pc.signalingState === 'closed') {
      throw new DOMException(
        'The RTCPeerConnection\'s signalingState is \'closed\'.',
        'InvalidStateError');
    }
    // We can not yet check for sender instanceof RTCRtpSender
    // since we shim RTPSender. So we check if sender._pc is set.
    if (!sender._pc) {
      throw new DOMException('Argument 1 of RTCPeerConnection.removeTrack ' +
          'does not implement interface RTCRtpSender.', 'TypeError');
    }
    const isLocal = sender._pc === pc;
    if (!isLocal) {
      throw new DOMException('Sender was not created by this connection.',
          'InvalidAccessError');
    }

    // Search for the native stream the senders track belongs to.
    pc._streams = pc._streams || {};
    let stream;
    Object.keys(pc._streams).forEach(streamid => {
      const hasTrack = pc._streams[streamid].getTracks()
        .find(track => sender.track === track);
      if (hasTrack) {
        stream = pc._streams[streamid];
      }
    });

    if (stream) {
      if (stream.getTracks().length === 1) {
        // if this is the last track of the stream, remove the stream. This
        // takes care of any shimmed _senders.
        pc.removeStream(pc._reverseStreams[stream.id]);
      } else {
        // relying on the same odd chrome behaviour as above.
        stream.removeTrack(sender.track);
      }
      pc.dispatchEvent(new Event('negotiationneeded'));
    }
  };
}

export function shimPeerConnection(window) {
  const browserDetails = utils.detectBrowser(window);

  // The RTCPeerConnection object.
  if (!window.RTCPeerConnection && window.webkitRTCPeerConnection) {
    window.RTCPeerConnection = function(pcConfig, pcConstraints) {
      // Translate iceTransportPolicy to iceTransports,
      // see https://code.google.com/p/webrtc/issues/detail?id=4869
      // this was fixed in M56 along with unprefixing RTCPeerConnection.
      logging('PeerConnection');
      if (pcConfig && pcConfig.iceTransportPolicy) {
        pcConfig.iceTransports = pcConfig.iceTransportPolicy;
      }

      return new window.webkitRTCPeerConnection(pcConfig, pcConstraints);
    };
    window.RTCPeerConnection.prototype =
        window.webkitRTCPeerConnection.prototype;
    // wrap static methods. Currently just generateCertificate.
    if (window.webkitRTCPeerConnection.generateCertificate) {
      Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
        get() {
          return window.webkitRTCPeerConnection.generateCertificate;
        }
      });
    }
  } else {
    // migrate from non-spec RTCIceServer.url to RTCIceServer.urls
    const OrigPeerConnection = window.RTCPeerConnection;
    window.RTCPeerConnection = function(pcConfig, pcConstraints) {
      if (pcConfig && pcConfig.iceServers) {
        const newIceServers = [];
        for (let i = 0; i < pcConfig.iceServers.length; i++) {
          let server = pcConfig.iceServers[i];
          if (!server.hasOwnProperty('urls') &&
              server.hasOwnProperty('url')) {
            utils.deprecated('RTCIceServer.url', 'RTCIceServer.urls');
            server = JSON.parse(JSON.stringify(server));
            server.urls = server.url;
            newIceServers.push(server);
          } else {
            newIceServers.push(pcConfig.iceServers[i]);
          }
        }
        pcConfig.iceServers = newIceServers;
      }
      return new OrigPeerConnection(pcConfig, pcConstraints);
    };
    window.RTCPeerConnection.prototype = OrigPeerConnection.prototype;
    // wrap static methods. Currently just generateCertificate.
    Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
      get() {
        return OrigPeerConnection.generateCertificate;
      }
    });
  }

  const origGetStats = window.RTCPeerConnection.prototype.getStats;
  window.RTCPeerConnection.prototype.getStats = function(selector,
      successCallback, errorCallback) {
    const pc = this;
    const args = arguments;

    // If selector is a function then we are in the old style stats so just
    // pass back the original getStats format to avoid breaking old users.
    if (arguments.length > 0 && typeof selector === 'function') {
      return origGetStats.apply(this, arguments);
    }

    // When spec-style getStats is supported, return those when called with
    // either no arguments or the selector argument is null.
    if (origGetStats.length === 0 && (arguments.length === 0 ||
        typeof arguments[0] !== 'function')) {
      return origGetStats.apply(this, []);
    }

    const fixChromeStats_ = function(response) {
      const standardReport = {};
      const reports = response.result();
      reports.forEach(report => {
        const standardStats = {
          id: report.id,
          timestamp: report.timestamp,
          type: {
            localcandidate: 'local-candidate',
            remotecandidate: 'remote-candidate'
          }[report.type] || report.type
        };
        report.names().forEach(name => {
          standardStats[name] = report.stat(name);
        });
        standardReport[standardStats.id] = standardStats;
      });

      return standardReport;
    };

    // shim getStats with maplike support
    const makeMapStats = function(stats) {
      return new Map(Object.keys(stats).map(key => [key, stats[key]]));
    };

    if (arguments.length >= 2) {
      const successCallbackWrapper_ = function(response) {
        args[1](makeMapStats(fixChromeStats_(response)));
      };

      return origGetStats.apply(this, [successCallbackWrapper_,
        arguments[0]]);
    }

    // promise-support
    return new Promise((resolve, reject) => {
      origGetStats.apply(pc, [
        function(response) {
          resolve(makeMapStats(fixChromeStats_(response)));
        }, reject]);
    }).then(successCallback, errorCallback);
  };

  // add promise support -- natively available in Chrome 51
  if (browserDetails.version < 51) {
    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
        .forEach(function(method) {
          const nativeMethod = window.RTCPeerConnection.prototype[method];
          window.RTCPeerConnection.prototype[method] = function() {
            const args = arguments;
            const pc = this;
            const promise = new Promise((resolve, reject) => {
              nativeMethod.apply(pc, [args[0], resolve, reject]);
            });
            if (args.length < 2) {
              return promise;
            }
            return promise.then(() => {
              args[1].apply(null, []);
            },
            err => {
              if (args.length >= 3) {
                args[2].apply(null, [err]);
              }
            });
          };
        });
  }

  // promise support for createOffer and createAnswer. Available (without
  // bugs) since M52: crbug/619289
  if (browserDetails.version < 52) {
    ['createOffer', 'createAnswer'].forEach(function(method) {
      const nativeMethod = window.RTCPeerConnection.prototype[method];
      window.RTCPeerConnection.prototype[method] = function() {
        const pc = this;
        if (arguments.length < 1 || (arguments.length === 1 &&
            typeof arguments[0] === 'object')) {
          const opts = arguments.length === 1 ? arguments[0] : undefined;
          return new Promise((resolve, reject) => {
            nativeMethod.apply(pc, [resolve, reject, opts]);
          });
        }
        return nativeMethod.apply(this, arguments);
      };
    });
  }

  // shim implicit creation of RTCSessionDescription/RTCIceCandidate
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
}
