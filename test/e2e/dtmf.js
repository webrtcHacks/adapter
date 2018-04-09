/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';


describe('dtmf', () => {
  describe('RTCRtpSender.dtmf', () => {
    // we can not test existence on the prototype because we do
    // not shim RTCRtpSender when it does not exist.
    it('exists on audio senders', () => {
      const pc = new RTCPeerConnection();
      return navigator.mediaDevices.getUserMedia({audio: true})
      .then(stream => {
        pc.addStream(stream);
        const senders = pc.getSenders();
        const dtmf = senders[0].dtmf;
        expect(dtmf).not.to.equal(null);
        expect(dtmf).to.have.property('insertDTMF');
      });
    });

    it('does not exist on video senders', () => {
      const pc = new RTCPeerConnection();
      return navigator.mediaDevices.getUserMedia({video: true})
      .then(stream => {
        pc.addStream(stream);
        const senders = pc.getSenders();
        const dtmf = senders[0].dtmf;
        expect(dtmf).to.equal(null);
      });
    });
  });

  describe('inserts DTMF', () => {
    let pc1;
    let pc2;

    beforeEach(() => {
      pc1 = new RTCPeerConnection(null);
      pc2 = new RTCPeerConnection(null);

      pc1.onicecandidate = e => pc2.addIceCandidate(e.candidate);
      pc2.onicecandidate = e => pc1.addIceCandidate(e.candidate);
      pc1.onnegotiationneeded = e => pc1.createOffer()
        .then(offer => pc1.setLocalDescription(offer))
        .then(() => pc2.setRemoteDescription(pc1.localDescription))
        .then(() => pc2.createAnswer())
        .then(answer => pc2.setLocalDescription(answer))
        .then(() => pc1.setRemoteDescription(pc2.localDescription));
    });
    afterEach(() => {
      pc1.close();
      pc2.close();
    });

    it('when using addStream', () => {
      return navigator.mediaDevices.getUserMedia({audio: true})
      .then(stream => pc1.addStream(stream))
      .then(() => {
        return pc1.iceConnectionState === 'connected' ||
            pc1.iceConnectionState === 'completed' ||
            new Promise(resolve => pc1.oniceconnectionstatechange =
              e => (pc1.iceConnectionState === 'connected' ||
              pc1.iceConnectionState === 'completed') && resolve());
      })
      .then(() => {
        return pc2.iceConnectionState === 'connected' ||
            pc2.iceConnectionState === 'completed' ||
            new Promise(resolve => pc2.oniceconnectionstatechange =
              e => (pc2.iceConnectionState === 'connected' ||
              pc2.iceConnectionState === 'completed') && resolve());
      })
      .then(() => {
        let sender = pc1.getSenders().find(s => s.track.kind === 'audio');
        sender.dtmf.insertDTMF('1');
        return new Promise(resolve => sender.dtmf.ontonechange = resolve);
      })
      .then(toneEvent => {
        expect(toneEvent.tone).to.equal('1');
      });
    });

    it('when using addTrack', () => {
      return navigator.mediaDevices.getUserMedia({audio: true})
      .then(stream => pc1.addTrack(stream.getAudioTracks()[0], stream))
      .then(() => {
        return pc1.iceConnectionState === 'connected' ||
            pc1.iceConnectionState === 'completed' ||
            new Promise(resolve => pc1.oniceconnectionstatechange =
              e => (pc1.iceConnectionState === 'connected' ||
              pc1.iceConnectionState === 'completed') && resolve());
      })
      .then(() => {
        return pc2.iceConnectionState === 'connected' ||
            pc2.iceConnectionState === 'completed' ||
            new Promise(resolve => pc2.oniceconnectionstatechange =
              e => (pc2.iceConnectionState === 'connected' ||
              pc2.iceConnectionState === 'completed') && resolve());
      })
      .then(() => {
        if (!(window.RTCDTMFSender &&
            'canInsertDTMF' in window.RTCDTMFSender.prototype)) {
          return;
        }
        return new Promise((resolve) => {
          setTimeout(function canInsert() {
            const sender = pc1.getSenders().find(s => s.track.kind === 'audio');
            if (sender.dtmf.canInsertDTMF) {
              return resolve();
            }
            setTimeout(canInsert, 10);
          }, 0);
        });
      })
      .then(() => {
        const sender = pc1.getSenders().find(s => s.track.kind === 'audio');
        sender.dtmf.insertDTMF('1');
        return new Promise(resolve => sender.dtmf.ontonechange = resolve);
      })
      .then(toneEvent => {
        expect(toneEvent.tone).to.equal('1');
      });
    });
  }).timeout(5000);
});
