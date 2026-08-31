/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
'use strict';

describe('RTCPeerConnection', () => {
  it('window.RTCPeerConnection exists', () => {
    expect(window).to.have.property('RTCPeerConnection');
  });

  it('constructor works', () => {
    const constructor = () => {
      return new RTCPeerConnection();
    };
    expect(constructor).not.to.throw();
  });

  describe('getSenders', () => {
    it('exists', () => {
      expect(RTCPeerConnection.prototype).to.have.property('getSenders');
    });
  });

  describe('generateCertificate', () => {
    it('is a static method', () => {
      expect(window.RTCPeerConnection).to.have.property('generateCertificate');
    });
  });

  describe('icegatheringstatechange', () => {
    let pc;
    beforeEach(() => {
      pc = new RTCPeerConnection();
    });
    afterEach(() => {
      pc.close();
    });

    it('fires the event', (done) => {
      pc.addEventListener('icegatheringstatechange', () => {
        if (pc.iceGatheringState === 'complete') {
          done();
        }
      });
      pc.createOffer({offerToReceiveAudio: true})
        .then(offer => pc.setLocalDescription(offer));
    });

    it('calls the event handler', (done) => {
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') {
          done();
        }
      };
      pc.createOffer({offerToReceiveAudio: true})
        .then(offer => pc.setLocalDescription(offer));
    });
  });

  it('has the correct number of arguments for shimmed methods', () => {
    // createOffer(optional RTCOfferOptions options = {})
    expect(RTCPeerConnection.prototype.createOffer.length).to.equal(0);

    // createAnswer(optional RTCAnswerOptions options = {})
    expect(RTCPeerConnection.prototype.createAnswer.length).to.equal(0);

    // setLocalDescription(optional RTCSessionDescriptionInit description = {})
    expect(RTCPeerConnection.prototype.setLocalDescription.length).to.equal(0);

    // setRemoteDescription(RTCSessionDescriptionInit description)
    expect(RTCPeerConnection.prototype.setRemoteDescription.length).to.equal(1);

    // addIceCandidate(optional RTCIceCandidateInit candidate = {})
    expect(RTCPeerConnection.prototype.addIceCandidate.length).to.equal(0);

    // getStats(optional MediaStreamTrack? selector = null)
    expect(RTCPeerConnection.prototype.getStats.length).to.equal(0);

    // addTransceiver((MediaStreamTrack or DOMString) trackOrKind,
    //   optional RTCRtpTransceiverInit init = {})
    expect(RTCPeerConnection.prototype.addTransceiver.length).to.equal(1);

    // addTrack(MediaStreamTrack track, MediaStream... streams)
    expect(RTCPeerConnection.prototype.addTrack.length).to.equal(1);

    // removeTrack(RTCRtpSender sender)
    expect(RTCPeerConnection.prototype.removeTrack.length).to.equal(1);

    // createDataChannel(USVString label,
    //   optional RTCDataChannelInit dataChannelDict = {})
    expect(RTCPeerConnection.prototype.createDataChannel.length).to.equal(1);
  });
});
