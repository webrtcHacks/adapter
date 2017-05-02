/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
const chai = require('chai');
const expect = chai.expect;

const SDPUtils = require('sdp');
const EventEmitter = require('events');

const utils = require('../../src/js/utils');

function mockORTC() {
  // make sure the browser detection gets the right information.
  utils.browserDetails.browser = 'edge';
  utils.browserDetails.version = 15025;

  // required by the shim to mock an EventEmitter.
  global.document = {
    createDocumentFragment: () => {
      let e = new EventEmitter();
      e.addEventListener = e.addListener.bind(e);
      e.removeEventListener = e.removeListener.bind(e);
      e.dispatchEvent = function(ev) {
        e.emit(ev.type, ev);
      };
      return e;
    }
  };
  global.Event = function(type) {
    this.type = type;
  };

  global.RTCSessionDescription = function(init) {
    return init;
  };

  global.RTCIceGatherer = function() {
    this.getLocalParameters = function() {
      return {
        usernameFragment: 'someufrag',
        password: 'somepass'
      };
    };
  };
  global.RTCIceTransport = function() {
    this.start = function() {};
  };
  global.RTCDtlsTransport = function() {
    this.start = function() {};
    this.getLocalParameters = function() {
      return {
        role: 'auto',
        fingerprints: [
          {
            algorithm: 'alg',
            value: 'fi:ng:ger:pr:in:t1'
          }
        ]
      };
    };
  };

  global.RTCRtpReceiver = function(transport, kind) {
    this.track = new MediaStreamTrack();
    this.track.kind = kind;
    this.transport = transport;

    this.receive = function() {};
  };
  function getCapabilities(kind) {
    var opus = {
      name: 'opus',
      kind: 'audio',
      clockRate: 48000,
      preferredPayloadType: 111,
      numChannels: 2
    };
    var vp8 = {
      name: 'vp8',
      kind: 'video',
      clockRate: 90000,
      preferredPayloadType: 100,
      numChannels: 1
    };
    var rtx = {
      name: 'rtx',
      kind: 'video',
      clockRate: 90000,
      preferredPayloadType: 101,
      numChannels: 1,
      parameters: {apt: 100}
    };
    var codecs;
    switch (kind) {
      case 'audio':
        codecs = [opus];
        break;
      case 'video':
        codecs = [vp8, rtx];
        break;
      default:
        codecs = [opus, vp8, rtx];
        break;
    }
    return {
      codecs: codecs,
      headerExtensions: []
    };
  }
  RTCRtpReceiver.getCapabilities = getCapabilities;

  global.RTCRtpSender = function(track, transport) {
    this.track = track;
    this.transport = transport;
    this.send = function() {};
  };
  RTCRtpSender.getCapabilities = getCapabilities;

  global.MediaStream = function(tracks) {
    this.id = SDPUtils.generateIdentifier();
    this._tracks = tracks || [];
    this.getTracks = () => this._tracks;
    this.getAudioTracks = () => this._tracks.filter(t => t.kind === 'audio');
    this.getVideoTracks = () => this._tracks.filter(t => t.kind === 'video');
    this.addTrack = (t) => this._tracks.push(t);
  };
  global.MediaStreamTrack = function() {
    this.id = SDPUtils.generateIdentifier();
  };
}

describe('Edge shim', () => {
  global.navigator = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36 Edge/15.15031',
    mediaDevices: function() {}
  };
  global.window = global;

  const shim = require('../../src/js/edge/edge_shim');

  beforeEach(() => {
    mockORTC();
    shim.shimPeerConnection();
  });

  it('creates window.RTCPeerConnection', () => {
    delete window.RTCPeerConnection;
    shim.shimPeerConnection();
    expect(window.RTCPeerConnection).not.to.equal(undefined);
  });

  it('overrides window.RTCPeerConnection if it exists', () => {
    global.window.RTCPeerConnection = true;
    shim.shimPeerConnection();
    expect(window.RTCPeerConnection).not.to.equal(true);
  });

  describe('filtering of STUN and TURN servers', () => {
    let pc;
    it('filters STUN before r14393', () => {
      utils.browserDetails.version = 14392;
      // need to re-evaluate after changing the browser version.
      shim.shimPeerConnection();
      pc = new RTCPeerConnection({
        iceServers: [{urls: 'stun:stun.l.google.com'}]
      });
      expect(pc.iceOptions.iceServers).to.deep.equal([]);
    });

    it('does not filter STUN after r14393', () => {
      pc = new RTCPeerConnection({
        iceServers: [{urls: 'stun:stun.l.google.com'}]
      });
      expect(pc.iceOptions.iceServers).to.deep.equal([
        {urls: 'stun:stun.l.google.com'}
      ]);
    });

    it('filters incomplete TURN urls', () => {
      pc = new RTCPeerConnection({
        iceServers: [
          {urls: 'turn:stun.l.google.com'},
          {urls: 'turn:stun.l.google.com:19302'}
        ]
      });
      expect(pc.iceOptions.iceServers).to.deep.equal([]);
    });

    it('filters TURN TCP', () => {
      pc = new RTCPeerConnection({
        iceServers: [
          {urls: 'turn:stun.l.google.com:19302?transport=tcp'}
        ]
      });
      expect(pc.iceOptions.iceServers).to.deep.equal([]);
    });

    describe('removes all but the first server of a type', () => {
      it('in separate entries', () => {
        pc = new RTCPeerConnection({
          iceServers: [
            {urls: 'stun:stun.l.google.com'},
            {urls: 'turn:stun.l.google.com:19301?transport=udp'},
            {urls: 'turn:stun.l.google.com:19302?transport=udp'}
          ]
        });
        expect(pc.iceOptions.iceServers).to.deep.equal([
          {urls: 'stun:stun.l.google.com'},
          {urls: 'turn:stun.l.google.com:19301?transport=udp'}
        ]);
      });

      it('in urls entries', () => {
        pc = new RTCPeerConnection({
          iceServers: [
            {urls: 'stun:stun.l.google.com'},
            {urls: [
              'turn:stun.l.google.com:19301?transport=udp',
              'turn:stun.l.google.com:19302?transport=udp'
            ]}
          ]
        });
        expect(pc.iceOptions.iceServers).to.deep.equal([
          {urls: 'stun:stun.l.google.com'},
          {urls: ['turn:stun.l.google.com:19301?transport=udp']}
        ]);
      });
    });
  });

  describe('setLocalDescription', () => {
    let pc;
    beforeEach(() => {
      pc = new RTCPeerConnection();
    });

    it('returns a promise', (done) => {
      pc.createOffer({offerToReceiveAudio: 1})
      .then((offer) => {
        return pc.setLocalDescription(offer);
      })
      .then(done);
    });

    it('calls the legacy success callback', (done) => {
      pc.createOffer({offerToReceiveAudio: 1})
      .then((offer) => {
        return pc.setLocalDescription(offer, done);
      });
    });

    it('changes the signalingState to have-local-offer', (done) => {
      pc.createOffer({offerToReceiveAudio: 1})
      .then((offer) => {
        return pc.setLocalDescription(offer);
      })
      .then(() => {
        expect(pc.localDescription.type).to.equal('offer');
        expect(pc.signalingState = 'have-local-offer');
        done();
      });
    });

    describe('ІnvalidStateError is thrown when called with', () => {
      it('an answer in signalingState stable', (done) => {
        pc.setRemoteDescription({type: 'answer'})
        .catch((e) => {
          expect(e.name).to.equal('InvalidStateError');
          done();
        });
      });

      it('an offer in signalingState have-local-offer', (done) => {
        pc.createOffer({offerToReceiveAudio: 1})
        .then((offer) => {
          return pc.setLocalDescription(offer);
        })
        .then(() => {
          return pc.setRemoteDescription({type: 'offer'});
        })
        .catch((e) => {
          expect(e.name).to.equal('InvalidStateError');
          done();
        });
      });
    });
  });

  describe('setRemoteDescription', () => {
    let pc;
    beforeEach(() => {
      pc = new RTCPeerConnection();
    });

    it('returns a promise', (done) => {
      const sdp = 'v=0\r\no=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
          's=-\r\nt=0 0\r\na=msid-semantic: WMS\r\n';
      pc.setRemoteDescription({type: 'offer', sdp: sdp})
      .then(done);
    });
    it('calls the legacy success callback', (done) => {
      const sdp = 'v=0\r\no=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
          's=-\r\nt=0 0\r\na=msid-semantic: WMS\r\n';
      pc.setRemoteDescription({type: 'offer', sdp: sdp}, done);
    });

    it('changes the signalingState to have-remote-offer', (done) => {
      const sdp = 'v=0\r\no=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
          's=-\r\nt=0 0\r\na=msid-semantic: WMS\r\n';
      pc.setRemoteDescription({type: 'offer', sdp: sdp})
      .then(() => {
        expect(pc.signalingState = 'have-remote-offer');
        done();
      });
    });

    it('sets the remoteDescription', (done) => {
      const sdp = 'v=0\r\no=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
          's=-\r\nt=0 0\r\na=msid-semantic: WMS\r\n';
      pc.setRemoteDescription({type: 'offer', sdp: sdp}, () => {
        expect(pc.remoteDescription.type).to.equal('offer');
        expect(pc.remoteDescription.sdp).to.equal(sdp);
        done();
      });
    });

    describe('when called with an offer containing a track', () => {
      const sdp = 'v=0\r\no=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
          's=-\r\nt=0 0\r\na=msid-semantic: WMS\r\n' +
          'm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n' +
          'c=IN IP4 0.0.0.0\r\n' +
          'a=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:foo\r\na=ice-pwd:bar\r\n' +
          'a=fingerprint:sha-256 so:me:co:lo:ns\r\n' +
          'a=setup:actpass\r\n' +
          'a=mid:audio1\r\n' +
          'a=sendonly\r\na=rtcp-mux\r\n' +
          'a=rtcp-rsize\r\n' +
          'a=rtpmap:111 opus/48000\r\n' +
          'a=ssrc:1001 msid:stream1 track1\r\n' +
          'a=ssrc:1001 cname:some\r\n';
      it('triggers onaddstream', (done) => {
        pc.onaddstream = function(event) {
          const stream = event.stream;
          expect(stream.getTracks().length).to.equal(1);
          expect(stream.getTracks()[0].kind).to.equal('audio');

          done();
        };
        pc.setRemoteDescription({type: 'offer', sdp: sdp});
      });

      it('emits a addstream event', (done) => {
        pc.addEventListener('addstream', function(event) {
          const stream = event.stream;
          expect(stream.getTracks().length).to.equal(1);
          expect(stream.getTracks()[0].kind).to.equal('audio');

          done();
        });
        pc.setRemoteDescription({type: 'offer', sdp: sdp});
      });

      it('triggers ontrack', (done) => {
        pc.ontrack = function(event) {
          expect(event.track.kind).to.equal('audio');
          expect(event.receiver);
          expect(event.streams.length).to.equal(1);

          done();
        };
        pc.setRemoteDescription({type: 'offer', sdp: sdp});
      });

      it('emits a track event', (done) => {
        pc.addEventListener('track', function(event) {
          expect(event.track.kind).to.equal('audio');
          expect(event.receiver);
          expect(event.streams.length).to.equal(1);

          done();
        });
        pc.setRemoteDescription({type: 'offer', sdp: sdp});
      });
    });

    describe('when called with an offer without (explicit) tracks', () => {
      const sdp = 'v=0\r\no=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
          's=-\r\nt=0 0\r\n' +
          // 'a=msid-semantic: WMS\r\n' + // no msid-semantic
          'm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n' +
          'c=IN IP4 0.0.0.0\r\n' +
          'a=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:foo\r\na=ice-pwd:bar\r\n' +
          'a=fingerprint:sha-256 so:me:co:lo:ns\r\n' +
          'a=setup:actpass\r\n' +
          'a=mid:audio1\r\n' +
          'a=sendonly\r\na=rtcp-mux\r\n' +
          'a=rtcp-rsize\r\n' +
          'a=rtpmap:111 opus/48000\r\n';

      it('triggers onaddstream', (done) => {
        pc.onaddstream = function(event) {
          const stream = event.stream;
          expect(stream.getTracks().length).to.equal(1);
          expect(stream.getTracks()[0].kind).to.equal('audio');

          done();
        };
        pc.setRemoteDescription({type: 'offer', sdp: sdp});
      });

      it('triggers ontrack', (done) => {
        pc.ontrack = function(event) {
          expect(event.track.kind).to.equal('audio');
          expect(event.receiver);
          expect(event.streams.length).to.equal(1);
          done();
        };
        pc.setRemoteDescription({type: 'offer', sdp: sdp});
      });
    });

    describe('when called with an offer containing multiple streams ' +
        '/ tracks', () => {
      const sdp = 'v=0\r\no=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
          's=-\r\nt=0 0\r\na=msid-semantic: WMS\r\n' +
          'm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n' +
          'c=IN IP4 0.0.0.0\r\n' +
          'a=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:foo\r\na=ice-pwd:bar\r\n' +
          'a=fingerprint:sha-256 so:me:co:lo:ns\r\n' +
          'a=setup:actpass\r\n' +
          'a=mid:audio1\r\n' +
          'a=sendonly\r\na=rtcp-mux\r\n' +
          'a=rtcp-rsize\r\n' +
          'a=rtpmap:111 opus/48000\r\n' +
          'a=ssrc:1001 msid:stream1 track1\r\n' +
          'a=ssrc:1001 cname:some\r\n' +
          'm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n' +
          'c=IN IP4 0.0.0.0\r\n' +
          'a=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:foo\r\na=ice-pwd:bar\r\n' +
          'a=fingerprint:sha-256 so:me:co:lo:ns\r\n' +
          'a=setup:actpass\r\n' +
          'a=mid:audio1\r\n' +
          'a=sendonly\r\na=rtcp-mux\r\n' +
          'a=rtcp-rsize\r\n' +
          'a=rtpmap:111 opus/48000\r\n' +
          'a=ssrc:2002 msid:stream2 track2\r\n' +
          'a=ssrc:2002 cname:some\r\n';

      it('triggers onaddstream twice', (done) => {
        let numStreams = 0;
        pc.onaddstream = function(event) {
          numStreams++;
          expect(event.stream.id).to.equal('stream' + numStreams);
          if (numStreams === 2) {
            done();
          }
        };
        pc.setRemoteDescription({type: 'offer', sdp: sdp});
      });

      it('triggers ontrack twice', (done) => {
        let numTracks = 0;
        pc.ontrack = function(event) {
          numTracks++;
          expect(event.streams[0].id).to.equal('stream' + numTracks);
          if (numTracks === 2) {
            done();
          }
        };
        pc.setRemoteDescription({type: 'offer', sdp: sdp});
      });
    });

    // TODO: add a test for recvonly to show it doesn't trigger the callback.
    //   probably easiest done using a sinon.stub
    //
    describe('sets the canTrickleIceCandidates property', () => {
      it('to true when called with an offer that contains ' +
          'a=ice-options:trickle', (done) => {
        const sdp = 'v=0\r\no=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
            's=-\r\nt=0 0\r\na=msid-semantic: WMS\r\n' +
            'a=ice-options:trickle\r\n';
        pc.setRemoteDescription({type: 'offer', sdp: sdp})
        .then(() => {
          expect(pc.canTrickleIceCandidates).to.equal(true);
          done();
        });
      });

      it('to false when called with an offer that does not contain ' +
          'a=ice-options:trickle', (done) => {
        const sdp = 'v=0\r\no=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
            's=-\r\nt=0 0\r\na=msid-semantic: WMS\r\n';
        pc.setRemoteDescription({type: 'offer', sdp: sdp})
        .then(() => {
          expect(pc.canTrickleIceCandidates).to.equal(false);
          done();
        });
      });
    });

    describe('ІnvalidStateError is thrown when called with', () => {
      it('an answer in signalingState stable', (done) => {
        pc.setRemoteDescription({type: 'answer'})
        .catch((e) => {
          expect(e.name).to.equal('InvalidStateError');
          done();
        });
      });

      it('an offer in signalingState have-local-offer', (done) => {
        pc.createOffer({offerToReceiveAudio: 1})
        .then((offer) => {
          return pc.setLocalDescription(offer);
        })
        .then(() => {
          return pc.setRemoteDescription({type: 'offer'});
        })
        .catch((e) => {
          expect(e.name).to.equal('InvalidStateError');
          done();
        });
      });
    });
  });

  describe('createOffer', () => {
    let pc;
    beforeEach(() => {
      pc = new RTCPeerConnection();
    });

    it('returns a promise', (done) => {
      pc.createOffer({offerToReceiveAudio: 1})
      .then(() => {
        done();
      });
    });
    it('calls the legacy success callback', (done) => {
      pc.createOffer({offerToReceiveAudio: 1})
      .then(() => {
        done();
      });
    });
    it('does not change the signalingState', (done) => {
      pc.createOffer({offerToReceiveAudio: 1})
      .then(() => {
        expect(pc.signalingState).to.equal('stable');
        done();
      });
    });

    describe('when called with offerToReceiveAudio', () => {
      it('= 1 the generated SDP should contain one audio m-line', (done) => {
        pc.createOffer({offerToReceiveAudio: 1})
        .then((offer) => {
          const sections = SDPUtils.splitSections(offer.sdp);
          expect(sections.length).to.equal(2);
          expect(SDPUtils.getDirection(sections[1])).to.equal('recvonly');
          done();
        });
      });
      it('= 2 the generated SDP should contain two audio m-lines', (done) => {
        pc.createOffer({offerToReceiveAudio: 2})
        .then((offer) => {
          const sections = SDPUtils.splitSections(offer.sdp);
          expect(sections.length).to.equal(3);
          expect(SDPUtils.getDirection(sections[1])).to.equal('recvonly');
          expect(SDPUtils.getDirection(sections[2])).to.equal('recvonly');
          done();
        });
      });
      it('= true the generated SDP should contain one audio m-line', (done) => {
        pc.createOffer({offerToReceiveAudio: true})
        .then((offer) => {
          const sections = SDPUtils.splitSections(offer.sdp);
          expect(sections.length).to.equal(2);
          expect(SDPUtils.getDirection(sections[1])).to.equal('recvonly');
          done();
        });
      });
      it('= false the generated SDP should not offer to receive ' +
          'audio', (done) => {
        const audioTrack = new MediaStreamTrack();
        audioTrack.kind = 'audio';
        const stream = new MediaStream([audioTrack]);

        pc.addStream(stream);
        pc.createOffer({offerToReceiveAudio: false})
        .then((offer) => {
          const sections = SDPUtils.splitSections(offer.sdp);
          expect(sections.length).to.equal(2);
          expect(SDPUtils.getDirection(sections[1])).to.equal('sendonly');
          done();
        });
      });
    });

    describe('when called with offerToReceiveVideo', () => {
      it('the generated SDP should contain a video m-line', (done) => {
        pc.createOffer({offerToReceiveVideo: 1})
        .then((offer) => {
          const sections = SDPUtils.splitSections(offer.sdp);
          expect(sections.length).to.equal(2);
          expect(SDPUtils.getDirection(sections[1])).to.equal('recvonly');
          done();
        });
      });
    });

    describe('when called with offerToReceiveAudio and ' +
        'offerToReceiveVideo', () => {
      it('the generated SDP should contain two m-lines', (done) => {
        pc.createOffer({offerToReceiveAudio: 1, offerToReceiveVideo: 1})
        .then((offer) => {
          const sections = SDPUtils.splitSections(offer.sdp);
          expect(sections.length).to.equal(3);
          expect(SDPUtils.getDirection(sections[1])).to.equal('recvonly');
          expect(SDPUtils.getKind(sections[1])).to.equal('audio');
          expect(SDPUtils.getDirection(sections[2])).to.equal('recvonly');
          expect(SDPUtils.getKind(sections[2])).to.equal('video');
          done();
        });
      });
    });

    describe('when called after adding a stream', () => {
      describe('with an audio track', () => {
        it('the generated SDP should contain an audio m-line', (done) => {
          const audioTrack = new MediaStreamTrack();
          audioTrack.kind = 'audio';
          const stream = new MediaStream([audioTrack]);

          pc.addStream(stream);
          pc.createOffer()
          .then((offer) => {
            const sections = SDPUtils.splitSections(offer.sdp);
            expect(sections.length).to.equal(2);
            expect(SDPUtils.getDirection(sections[1])).to.equal('sendrecv');
            done();
          });
        });
      });

      describe('with an audio track not offering to receive audio', () => {
        it('the generated SDP should contain a sendonly audio ' +
            'm-line', (done) => {
          const audioTrack = new MediaStreamTrack();
          audioTrack.kind = 'audio';
          const stream = new MediaStream([audioTrack]);

          pc.addStream(stream);
          pc.createOffer({offerToReceiveAudio: 0})
          .then((offer) => {
            const sections = SDPUtils.splitSections(offer.sdp);
            expect(sections.length).to.equal(2);
            expect(SDPUtils.getDirection(sections[1])).to.equal('sendonly');
            done();
          });
        });
      });

      describe('with an audio track and offering to receive video', () => {
        it('the generated SDP should contain a recvonly m-line', (done) => {
          const audioTrack = new MediaStreamTrack();
          audioTrack.kind = 'audio';
          const stream = new MediaStream([audioTrack]);

          pc.addStream(stream);
          pc.createOffer({offerToReceiveVideo: 1})
          .then((offer) => {
            const sections = SDPUtils.splitSections(offer.sdp);
            expect(sections.length).to.equal(3);
            expect(SDPUtils.getKind(sections[1])).to.equal('audio');
            expect(SDPUtils.getDirection(sections[1])).to.equal('sendrecv');
            expect(SDPUtils.getKind(sections[2])).to.equal('video');
            expect(SDPUtils.getDirection(sections[2])).to.equal('recvonly');
            done();
          });
        });
      });

      describe('with a video track', () => {
        it('the generated SDP should contain an video m-line', (done) => {
          const videoTrack = new MediaStreamTrack();
          videoTrack.kind = 'video';
          const stream = new MediaStream([videoTrack]);

          pc.addStream(stream);
          pc.createOffer()
          .then((offer) => {
            const sections = SDPUtils.splitSections(offer.sdp);
            expect(sections.length).to.equal(2);
            expect(SDPUtils.getKind(sections[1])).to.equal('video');
            done();
          });
        });
      });

      describe('with a video track and offerToReceiveAudio', () => {
        it('the generated SDP should contain an audio and a ' +
            'video m-line', (done) => {
          const videoTrack = new MediaStreamTrack();
          videoTrack.kind = 'video';
          const stream = new MediaStream([videoTrack]);

          pc.addStream(stream);
          pc.createOffer({offerToReceiveAudio: 1})
          .then((offer) => {
            const sections = SDPUtils.splitSections(offer.sdp);
            expect(sections.length).to.equal(3);
            expect(SDPUtils.getKind(sections[1])).to.equal('audio');
            expect(SDPUtils.getKind(sections[2])).to.equal('video');
            done();
          });
        });
      });


      describe('with an audio track and a video track', () => {
        it('the generated SDP should contain an audio and video ' +
            'm-line', (done) => {
          const audioTrack = new MediaStreamTrack();
          audioTrack.kind = 'audio';
          const videoTrack = new MediaStreamTrack();
          videoTrack.kind = 'video';
          const stream = new MediaStream([audioTrack, videoTrack]);

          pc.addStream(stream);
          pc.createOffer()
          .then((offer) => {
            const sections = SDPUtils.splitSections(offer.sdp);
            expect(sections.length).to.equal(3);
            expect(SDPUtils.getKind(sections[1])).to.equal('audio');
            expect(SDPUtils.getKind(sections[2])).to.equal('video');
            done();
          });
        });
      });

      describe('with an audio track and two video tracks', () => {
        it('the generated SDP should contain an audio and ' +
            'video m-line', (done) => {
          const audioTrack = new MediaStreamTrack();
          audioTrack.kind = 'audio';
          const videoTrack = new MediaStreamTrack();
          videoTrack.kind = 'video';
          const videoTrack2 = new MediaStreamTrack();
          videoTrack2.kind = 'video';
          const stream = new MediaStream([audioTrack, videoTrack]);
          const stream2 = new MediaStream([videoTrack2]);

          pc.addStream(stream);
          pc.addStream(stream2);
          pc.createOffer()
          .then((offer) => {
            const sections = SDPUtils.splitSections(offer.sdp);
            expect(sections.length).to.equal(4);
            expect(SDPUtils.getKind(sections[1])).to.equal('audio');
            expect(SDPUtils.getKind(sections[2])).to.equal('video');
            expect(SDPUtils.getKind(sections[3])).to.equal('video');
            done();
          });
        });
      });
    });

    describe('when called after addTrack', () => {
      describe('with an audio track', () => {
        it('the generated SDP should contain an audio m-line', (done) => {
          const audioTrack = new MediaStreamTrack();
          audioTrack.kind = 'audio';
          const stream = new MediaStream([audioTrack]);

          pc.addTrack(audioTrack, stream);
          pc.createOffer()
          .then((offer) => {
            const sections = SDPUtils.splitSections(offer.sdp);
            expect(sections.length).to.equal(2);
            expect(SDPUtils.getDirection(sections[1])).to.equal('sendrecv');
            done();
          });
        });
      });

      describe('with an audio track not offering to receive audio', () => {
        it('the generated SDP should contain a sendonly audio ' +
            'm-line', (done) => {
          const audioTrack = new MediaStreamTrack();
          audioTrack.kind = 'audio';
          const stream = new MediaStream([audioTrack]);

          pc.addTrack(audioTrack, stream);
          pc.createOffer({offerToReceiveAudio: 0})
          .then((offer) => {
            const sections = SDPUtils.splitSections(offer.sdp);
            expect(sections.length).to.equal(2);
            expect(SDPUtils.getDirection(sections[1])).to.equal('sendonly');
            done();
          });
        });
      });

      describe('with an audio track and offering to receive video', () => {
        it('the generated SDP should contain a recvonly m-line', (done) => {
          const audioTrack = new MediaStreamTrack();
          audioTrack.kind = 'audio';
          const stream = new MediaStream([audioTrack]);

          pc.addTrack(audioTrack, stream);
          pc.createOffer({offerToReceiveVideo: 1})
          .then((offer) => {
            const sections = SDPUtils.splitSections(offer.sdp);
            expect(sections.length).to.equal(3);
            expect(SDPUtils.getKind(sections[1])).to.equal('audio');
            expect(SDPUtils.getDirection(sections[1])).to.equal('sendrecv');
            expect(SDPUtils.getKind(sections[2])).to.equal('video');
            expect(SDPUtils.getDirection(sections[2])).to.equal('recvonly');
            done();
          });
        });
      });

      describe('with a video track', () => {
        it('the generated SDP should contain an video m-line', (done) => {
          const videoTrack = new MediaStreamTrack();
          videoTrack.kind = 'video';
          const stream = new MediaStream([videoTrack]);

          pc.addTrack(videoTrack, stream);
          pc.createOffer()
          .then((offer) => {
            const sections = SDPUtils.splitSections(offer.sdp);
            expect(sections.length).to.equal(2);
            expect(SDPUtils.getKind(sections[1])).to.equal('video');
            done();
          });
        });
      });

      describe('with a video track and offerToReceiveAudio', () => {
        it('the generated SDP should contain an audio and a ' +
            'video m-line', (done) => {
          const videoTrack = new MediaStreamTrack();
          videoTrack.kind = 'video';
          const stream = new MediaStream([videoTrack]);

          pc.addTrack(videoTrack, stream);
          pc.createOffer({offerToReceiveAudio: 1})
          .then((offer) => {
            const sections = SDPUtils.splitSections(offer.sdp);
            expect(sections.length).to.equal(3);
            expect(SDPUtils.getKind(sections[1])).to.equal('audio');
            expect(SDPUtils.getKind(sections[2])).to.equal('video');
            done();
          });
        });
      });


      describe('with an audio track and a video track', () => {
        it('the generated SDP should contain an audio and video ' +
            'm-line', (done) => {
          const audioTrack = new MediaStreamTrack();
          audioTrack.kind = 'audio';
          const videoTrack = new MediaStreamTrack();
          videoTrack.kind = 'video';
          const stream = new MediaStream([audioTrack, videoTrack]);

          pc.addTrack(audioTrack, stream);
          pc.addTrack(videoTrack, stream);
          pc.createOffer()
          .then((offer) => {
            const sections = SDPUtils.splitSections(offer.sdp);
            expect(sections.length).to.equal(3);
            expect(SDPUtils.getKind(sections[1])).to.equal('audio');
            expect(SDPUtils.getKind(sections[2])).to.equal('video');
            done();
          });
        });
      });

      describe('with an audio track and two video tracks', () => {
        it('the generated SDP should contain an audio and ' +
            'video m-line', (done) => {
          const audioTrack = new MediaStreamTrack();
          audioTrack.kind = 'audio';
          const videoTrack = new MediaStreamTrack();
          videoTrack.kind = 'video';
          const videoTrack2 = new MediaStreamTrack();
          videoTrack2.kind = 'video';
          const stream = new MediaStream([audioTrack, videoTrack]);
          const stream2 = new MediaStream([videoTrack2]);

          pc.addTrack(audioTrack, stream);
          pc.addTrack(videoTrack, stream);
          pc.addTrack(videoTrack2, stream2);
          pc.createOffer()
          .then((offer) => {
            const sections = SDPUtils.splitSections(offer.sdp);
            expect(sections.length).to.equal(4);
            expect(SDPUtils.getKind(sections[1])).to.equal('audio');
            expect(SDPUtils.getKind(sections[2])).to.equal('video');
            expect(SDPUtils.getKind(sections[3])).to.equal('video');
            done();
          });
        });
      });
    });
  });

  describe('createAnswer', () => {
    let pc;
    beforeEach(() => {
      pc = new RTCPeerConnection();
    });

    it('returns a promise', (done) => {
      const sdp = 'v=0\r\no=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
          's=-\r\nt=0 0\r\na=msid-semantic: WMS\r\n';
      pc.setRemoteDescription({type: 'offer', sdp: sdp})
      .then(() => {
        return pc.createAnswer();
      })
      .then(() => {
        done();
      });
    });
    it('calls the legacy success callback', (done) => {
      const sdp = 'v=0\r\no=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
          's=-\r\nt=0 0\r\na=msid-semantic: WMS\r\n';
      pc.setRemoteDescription({type: 'offer', sdp: sdp})
      .then(() => {
        return pc.createAnswer(() => {
          done();
        });
      });
    });

    it('does not change the signaling state', (done) => {
      const sdp = 'v=0\r\no=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
          's=-\r\nt=0 0\r\na=msid-semantic: WMS\r\n';
      pc.setRemoteDescription({type: 'offer', sdp: sdp})
      .then(() => {
        expect(pc.signalingState).to.equal('have-remote-offer');
        return pc.createAnswer();
      })
      .then(() => {
        expect(pc.signalingState).to.equal('have-remote-offer');
        done();
      });
    });

    it('uses payload types of offerer', (done) => {
      const sdp = 'v=0\r\no=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
          's=-\r\nt=0 0\r\na=msid-semantic: WMS\r\n' +
          'm=audio 9 UDP/TLS/RTP/SAVPF 98\r\n' +
          'c=IN IP4 0.0.0.0\r\n' +
          'a=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:foo\r\na=ice-pwd:bar\r\n' +
          'a=fingerprint:sha-256 so:me:co:lo:ns\r\n' +
          'a=setup:actpass\r\n' +
          'a=mid:audio1\r\n' +
          'a=sendrecv\r\na=rtcp-mux\r\n' +
          'a=rtcp-rsize\r\n' +
          'a=rtpmap:98 opus/48000\r\n' +
          'a=ssrc:1001 msid:stream1 track1\r\n' +
          'a=ssrc:1001 cname:some\r\n';
      pc.setRemoteDescription({type: 'offer', sdp: sdp})
      .then(() => {
        return pc.createAnswer();
      })
      .then((answer) => {
        expect(answer.sdp).to.contain('a=rtpmap:98 opus');
        done();
      });
    });

    // test https://tools.ietf.org/html/draft-ietf-rtcweb-jsep-15#section-5.3.4
    describe('direction attribute', () => {
      const sdp = 'v=0\r\no=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
          's=-\r\nt=0 0\r\na=msid-semantic: WMS\r\n' +
          'm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n' +
          'c=IN IP4 0.0.0.0\r\n' +
          'a=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:foo\r\na=ice-pwd:bar\r\n' +
          'a=fingerprint:sha-256 so:me:co:lo:ns\r\n' +
          'a=setup:actpass\r\n' +
          'a=mid:audio1\r\n' +
          'a=sendrecv\r\na=rtcp-mux\r\n' +
          'a=rtcp-rsize\r\n' +
          'a=rtpmap:111 opus/48000\r\n' +
          'a=ssrc:1001 msid:stream1 track1\r\n' +
          'a=ssrc:1001 cname:some\r\n';

      it('responds with a inactive answer to inactive', (done) => {
        pc.setRemoteDescription({type: 'offer', sdp: sdp.replace('sendrecv',
            'recvonly')})
        .then(() => {
          return pc.createAnswer();
        })
        .then((answer) => {
          const sections = SDPUtils.splitSections(answer.sdp);
          expect(sections.length).to.equal(2);
          expect(SDPUtils.getDirection(sections[1])).to.equal('inactive');
          done();
        });
      });

      describe('with a local track', () => {
        beforeEach(() => {
          const audioTrack = new MediaStreamTrack();
          audioTrack.kind = 'audio';
          const stream = new MediaStream([audioTrack]);

          pc.addStream(stream);
        });

        it('responds with a sendrecv answer to sendrecv', (done) => {
          pc.setRemoteDescription({type: 'offer', sdp: sdp})
          .then(() => {
            return pc.createAnswer();
          })
          .then((answer) => {
            const sections = SDPUtils.splitSections(answer.sdp);
            expect(SDPUtils.getDirection(sections[1])).to.equal('sendrecv');
            done();
          });
        });

        it('responds with a sendonly answer to recvonly', (done) => {
          pc.setRemoteDescription({type: 'offer', sdp: sdp.replace('sendrecv',
              'recvonly')})
          .then(() => {
            return pc.createAnswer();
          })
          .then((answer) => {
            const sections = SDPUtils.splitSections(answer.sdp);
            expect(sections.length).to.equal(2);
            expect(SDPUtils.getDirection(sections[1])).to.equal('sendonly');
            done();
          });
        });
      });

      describe('with a local track added after setRemoteDescription', () => {
        it('responds with a sendrecv answer to sendrecv', (done) => {
          pc.setRemoteDescription({type: 'offer', sdp: sdp})
          .then(() => {
            const audioTrack = new MediaStreamTrack();
            audioTrack.kind = 'audio';
            const stream = new MediaStream([audioTrack]);

            pc.addStream(stream);
            return pc.createAnswer();
          })
          .then((answer) => {
            const sections = SDPUtils.splitSections(answer.sdp);
            expect(SDPUtils.getDirection(sections[1])).to.equal('sendrecv');
            done();
          });
        });

        it('responds with a sendonly answer to recvonly', (done) => {
          pc.setRemoteDescription({type: 'offer', sdp: sdp.replace('sendrecv',
              'recvonly')})
          .then(() => {
            const audioTrack = new MediaStreamTrack();
            audioTrack.kind = 'audio';
            const stream = new MediaStream([audioTrack]);

            pc.addStream(stream);
            return pc.createAnswer();
          })
          .then((answer) => {
            const sections = SDPUtils.splitSections(answer.sdp);
            expect(sections.length).to.equal(2);
            expect(SDPUtils.getDirection(sections[1])).to.equal('sendonly');
            done();
          });
        });
      });

      describe('with no local track', () => {
        it('responds with a recvonly answer to sendrecv', (done) => {
          pc.setRemoteDescription({type: 'offer', sdp: sdp})
          .then(() => {
            return pc.createAnswer();
          })
          .then((answer) => {
            const sections = SDPUtils.splitSections(answer.sdp);
            expect(SDPUtils.getDirection(sections[1])).to.equal('recvonly');
            done();
          });
        });

        it('responds with a inactive answer to recvonly', (done) => {
          pc.setRemoteDescription({type: 'offer', sdp: sdp.replace('sendrecv',
              'recvonly')})
          .then(() => {
            return pc.createAnswer();
          })
          .then((answer) => {
            const sections = SDPUtils.splitSections(answer.sdp);
            expect(SDPUtils.getDirection(sections[1])).to.equal('inactive');
            done();
          });
        });
      });
    });

    describe('after a video offer with RTX', () => {
      const sdp = 'v=0\r\no=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
          's=-\r\nt=0 0\r\na=msid-semantic: WMS\r\n' +
          'm=video 9 UDP/TLS/RTP/SAVPF 102 103\r\n' +
          'c=IN IP4 0.0.0.0\r\n' +
          'a=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:foo\r\na=ice-pwd:bar\r\n' +
          'a=fingerprint:sha-256 so:me:co:lo:ns\r\n' +
          'a=setup:actpass\r\n' +
          'a=mid:video1\r\n' +
          'a=sendrecv\r\na=rtcp-mux\r\n' +
          'a=rtcp-rsize\r\n' +
          'a=rtpmap:102 vp8/90000\r\n' +
          'a=rtpmap:103 rtx/90000\r\n' +
          'a=fmtp:103 apt=102\r\n' +
          'a=ssrc-group:FID 1001 1002\r\n' +
          'a=ssrc:1001 msid:stream1 track1\r\n' +
          'a=ssrc:1001 cname:some\r\n' +
          'a=ssrc:1002 msid:stream1 track1\r\n' +
          'a=ssrc:1002 cname:some\r\n';
      describe('with no local track', () => {
        it('creates an answer with RTX but no FID group', (done) => {
          pc.setRemoteDescription({type: 'offer', sdp: sdp})
          .then(() => {
            return pc.createAnswer();
          })
          .then((answer) => {
            expect(answer.sdp).to.contain('a=rtpmap:102 vp8');
            expect(answer.sdp).to.contain('a=rtpmap:103 rtx');
            expect(answer.sdp).to.contain('a=fmtp:103 apt=102');
            expect(answer.sdp).not.to.contain('a=ssrc-group:FID');
            done();
          });
        });
      });

      describe('with a local track', () => {
        beforeEach(() => {
          const videoTrack = new MediaStreamTrack();
          videoTrack.kind = 'video';
          const stream = new MediaStream([videoTrack]);

          pc.addStream(stream);
        });
        it('creates an answer with RTX', (done) => {
          pc.setRemoteDescription({type: 'offer', sdp: sdp})
          .then(() => {
            return pc.createAnswer();
          })
          .then((answer) => {
            expect(answer.sdp).to.contain('a=rtpmap:102 vp8');
            expect(answer.sdp).to.contain('a=rtpmap:103 rtx');
            expect(answer.sdp).to.contain('a=fmtp:103 apt=102');
            expect(answer.sdp).to.contain('a=ssrc-group:FID 2002 2003');
            done();
          });
        });
      });
    });

    describe('after a video offer without RTX', () => {
      const sdp = 'v=0\r\no=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
          's=-\r\nt=0 0\r\na=msid-semantic: WMS\r\n' +
          'm=video 9 UDP/TLS/RTP/SAVPF 102\r\n' +
          'c=IN IP4 0.0.0.0\r\n' +
          'a=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:foo\r\na=ice-pwd:bar\r\n' +
          'a=fingerprint:sha-256 so:me:co:lo:ns\r\n' +
          'a=setup:actpass\r\n' +
          'a=mid:video1\r\n' +
          'a=sendrecv\r\na=rtcp-mux\r\n' +
          'a=rtcp-rsize\r\n' +
          'a=rtpmap:102 vp8/90000\r\n' +
          'a=ssrc:1001 msid:stream1 track1\r\n' +
          'a=ssrc:1001 cname:some\r\n';
      it('there is no ssrc-group in the answer', (done) => {
        const videoTrack = new MediaStreamTrack();
        videoTrack.kind = 'video';
        const stream = new MediaStream([videoTrack]);

        pc.addStream(stream);

        pc.setRemoteDescription({type: 'offer', sdp: sdp})
        .then(() => {
          return pc.createAnswer();
        })
        .then((answer) => {
          expect(answer.sdp).not.to.contain('a=ssrc-group:FID ');
          done();
        });
      });
    });

    describe('rtcp-rsize is', () => {
      const sdp = 'v=0\r\no=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
          's=-\r\nt=0 0\r\na=msid-semantic: WMS\r\n' +
          'm=audio 9 UDP/TLS/RTP/SAVPF 98\r\n' +
          'c=IN IP4 0.0.0.0\r\n' +
          'a=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:foo\r\na=ice-pwd:bar\r\n' +
          'a=fingerprint:sha-256 so:me:co:lo:ns\r\n' +
          'a=setup:actpass\r\n' +
          'a=mid:audio1\r\n' +
          'a=sendrecv\r\na=rtcp-mux\r\n' +
          'a=rtcp-rsize\r\n' +
          'a=rtpmap:98 opus/48000\r\n' +
          'a=ssrc:1001 msid:stream1 track1\r\n' +
          'a=ssrc:1001 cname:some\r\n';

      it('set if the offer contained rtcp-rsize', (done) => {
        pc.setRemoteDescription({type: 'offer', sdp: sdp})
        .then(() => {
          return pc.createAnswer();
        })
        .then((answer) => {
          expect(answer.sdp).to.contain('a=rtcp-rsize\r\n');
          done();
        });
      });

      it('not set if the offer did not contain rtcp-rsize', (done) => {
        pc.setRemoteDescription({type: 'offer',
          sdp: sdp.replace('a=rtcp-rsize\r\n', '')})
        .then(() => {
          return pc.createAnswer();
        })
        .then((answer) => {
          expect(answer.sdp).not.to.contain('a=rtcp-rsize\r\n');
          done();
        });
      });
    });
  });

  describe('full cycle', () => {
    let pc1;
    let pc2;
    beforeEach(() => {
      pc1 = new RTCPeerConnection();
      pc2 = new RTCPeerConnection();
    });
    it('completes a full createOffer-SLD-SRD-createAnswer-SLD-SRD ' +
       'cycle', (done) => {
      const audioTrack = new MediaStreamTrack();
      audioTrack.kind = 'audio';
      const stream = new MediaStream([audioTrack]);

      pc1.addStream(stream);
      pc2.addStream(stream);

      pc1.createOffer()
      .then((offer) => pc1.setLocalDescription(offer))
      .then(() => pc2.setRemoteDescription(pc1.localDescription))
      .then(() => pc2.createAnswer())
      .then((answer) => pc2.setLocalDescription(answer))
      .then(() => pc1.setRemoteDescription(pc2.localDescription))
      .then(() => {
        expect(pc1.signalingState).to.equal('stable');
        expect(pc2.signalingState).to.equal('stable');
        done();
      });
    });
  });

  describe('bundlePolicy', () => {
    it('creates an offer with a=group:BUNDLE by default', (done) => {
      const pc = new RTCPeerConnection();

      pc.createOffer({offerToReceiveAudio: 1})
      .then((offer) => {
        expect(offer.sdp).to.contain('a=group:BUNDLE');
        done();
      });
    });

    it('max-compat creates an offer without a=group:BUNDLE', (done) => {
      const pc = new RTCPeerConnection({bundlePolicy: 'max-compat'});

      pc.createOffer({offerToReceiveAudio: 1})
      .then((offer) => {
        expect(offer.sdp).not.to.contain('a=group:BUNDLE');
        done();
      });
    });
  });

  describe('negotationneeded', () => {
    it('fires asynchronously after addTrack', (done) => {
      const pc = new RTCPeerConnection();

      const audioTrack = new MediaStreamTrack();
      audioTrack.kind = 'audio';
      const videoTrack = new MediaStreamTrack();
      videoTrack.kind = 'video';
      const stream = new MediaStream([audioTrack, videoTrack]);

      pc.onnegotiationneeded = function(e) {
        pc.createOffer()
        .then((offer) => {
          const sections = SDPUtils.splitSections(offer.sdp);
          expect(sections.length).to.equal(3);
          done();
        });
      };
      pc.addTrack(audioTrack, stream); // onn should not execute now.
      pc.addTrack(videoTrack, stream); // but after this.
    });
  });
});
