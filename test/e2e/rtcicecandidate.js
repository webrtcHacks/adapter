/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

describe('RTCIceCandidate', () => {
  it('window.RTCIceCandidate exists', () => {
    expect(window).to.have.property('RTCIceCandidate');
  });

  describe('is augmented in', () => {
    it('the onicecandidate callback', (done) => {
      let hasAddress = false;
      const pc = new window.RTCPeerConnection();
      pc.onicecandidate = (e) => {
        if (!e.candidate) {
          expect(hasAddress).to.equal(true);
          done();
        } else {
          hasAddress = !!e.candidate.address;
        }
      };
      pc.createOffer({offerToReceiveAudio: true})
      .then(offer => pc.setLocalDescription(offer));
    });

    it('the icecandidate event', (done) => {
      let hasAddress = false;
      const pc = new window.RTCPeerConnection();
      pc.addEventListener('icecandidate', (e) => {
        if (!e.candidate) {
          expect(hasAddress).to.equal(true);
          done();
        } else {
          hasAddress = !!e.candidate.address;
        }
      });
      pc.createOffer({offerToReceiveAudio: true})
      .then(offer => pc.setLocalDescription(offer));
    });
  });

  describe('with empty candidate.candidate', () => {
    it('does not throw', () => {
      const constructor = () => {
        return new RTCIceCandidate({sdpMid: 'foo', candidate: ''});
      };
      expect(constructor).not.to.throw();
    });
  });

  describe('icecandidate eventlistener', () => {
    it('can be removed', () => {
      let wrongCalled = false;
      let rightCalled = false;
      const wrongCb = () => wrongCalled = true;
      const rightCb = () => rightCalled = true;
      const pc = new window.RTCPeerConnection();
      pc.addEventListener('icecandidate', wrongCb);
      pc.removeEventListener('icecandidate', wrongCb);
      pc.addEventListener('icecandidate', rightCb);
      pc.addEventListener('icegatheringstatechange', () => {
        if (pc.iceGatheringState !== 'complete') {
          return;
        }
        expect(wrongCalled).to.equal(false);
        expect(rightCalled).to.equal(true);
      });
    });
  });
});
