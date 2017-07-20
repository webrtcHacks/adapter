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
});
