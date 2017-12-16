/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

describe('maxMessageSize', () => {
  let pc1;
  let pc2;

  function negotiate(pc, otherPc, mapRemoteDescriptionCallback) {
    return pc.createOffer()
    .then((offer) => {
      return pc.setLocalDescription(offer);
    }).then(() => {
      let description = pc.localDescription;
      if (mapRemoteDescriptionCallback) {
        description = mapRemoteDescriptionCallback(description);
      }
      return otherPc.setRemoteDescription(description);
    }).then(() => {
      return otherPc.createAnswer();
    }).then((answer) => {
      return otherPc.setLocalDescription(answer);
    }).then(() => {
      let description = otherPc.localDescription;
      if (mapRemoteDescriptionCallback) {
        description = mapRemoteDescriptionCallback(description);
      }
      return pc.setRemoteDescription(description);
    });
  }

  function patchMaxMessageSizeFactory(maxMessageSize) {
    return ((description) => {
      description.sdp = description.sdp.replace(
        /^a=max-message-size:\s*(\d+)\s*$/gm, '');
      description.sdp = description.sdp.replace(
        /(^m=application\s+\d+\s+[\w\/]*SCTP.*$)/m,
        '$1\r\na=max-message-size:' + maxMessageSize);
      return description;
    });
  }

  beforeEach(() => {
    pc1 = new RTCPeerConnection(null);
    pc2 = new RTCPeerConnection(null);

    pc1.onicecandidate = event => pc2.addIceCandidate(event.candidate);
    pc2.onicecandidate = event => pc1.addIceCandidate(event.candidate);
  });
  afterEach(() => {
    pc1.close();
    pc2.close();
  });

  it('sctp attribute exists', () => {
    expect(pc1).to.have.property('sctp');
  });

  it('sctp attribute is null before offer/answer', () => {
    expect(pc1.sctp).to.equal(null);
  });

  it('sctp attribute is null if SCTP not negotiated', () => {
    return navigator.mediaDevices.getUserMedia({audio: true})
    .then((stream) => {
      pc1.addTrack(stream.getTracks()[0], stream);
      return negotiate(pc1, pc2);
    })
    .then(() => {
      expect(pc1.sctp).to.equal(null);
      expect(pc2.sctp).to.equal(null);
    });
  });

  it('sctp and maxMessageSize set if SCTP negotiated', () => {
    const browserDetails = window.adapter.browserDetails;
    pc1.createDataChannel('test');
    return negotiate(pc1, pc2)
    .then(() => {
      expect(pc1.sctp).to.have.property('maxMessageSize');
      expect(pc2.sctp).to.have.property('maxMessageSize');
      expect(pc1.sctp.maxMessageSize).to.be.at.least(65536);
      expect(pc2.sctp.maxMessageSize).to.be.at.least(65536);
      if (browserDetails.browser === 'firefox') {
        expect(pc1.sctp.maxMessageSize).to.equal(1073741823);
        expect(pc2.sctp.maxMessageSize).to.equal(1073741823);
      }
    });
  });

  it('send largest possible single message', () => {
    // Note: Patching to 65536 here as anything beyond that will take too long.
    const maxMessageSize = 65536;
    const patchMaxMessageSize = patchMaxMessageSizeFactory(maxMessageSize);

    pc1.createDataChannel('test');
    return negotiate(pc1, pc2, patchMaxMessageSize)
    .then(() => {
      expect(pc1.sctp.maxMessageSize).to.equal(maxMessageSize);
      expect(pc2.sctp.maxMessageSize).to.equal(maxMessageSize);

      // Ensure TypeError is thrown when sending a message that's too large
      return new Promise((resolve, reject) => {
        const dc = pc1.createDataChannel('test2');
        const send = () => {
          dc.send(new Uint8Array(maxMessageSize));
        };
        dc.onopen = () => {
          expect(send).not.to.throw();
          resolve();
        };
      });
    });
  });

  describe('throws an exception', () => {
    it('if the message is too large', () => {
      // Note: Patching to 65536 here as anything beyond that will take too
      //       long (including creation of a large array).
      const maxMessageSize = 65536;
      const patchMaxMessageSize = patchMaxMessageSizeFactory(maxMessageSize);

      pc1.createDataChannel('test');
      return negotiate(pc1, pc2, patchMaxMessageSize)
      .then(() => {
        expect(pc1.sctp.maxMessageSize).to.equal(maxMessageSize);
        expect(pc2.sctp.maxMessageSize).to.equal(maxMessageSize);

        // Ensure TypeError is thrown when sending a message that's too large
        return new Promise((resolve, reject) => {
          const dc = pc1.createDataChannel('test2');
          const send = () => {
            dc.send(new Uint8Array(maxMessageSize + 1));
          };
          dc.onopen = () => {
            expect(send).to.throw().with.property('name', 'TypeError');
            resolve();
          };
        });
      });
    });
  });
});
