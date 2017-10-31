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

  function negotiate(pc, otherPc, mapDescriptionCallback) {
    return pc.createOffer()
    .then((offer) => {
      if (mapDescriptionCallback) {
        offer = mapDescriptionCallback(offer);
      }
      return pc.setLocalDescription(offer);
    }).then(() => {
      return otherPc.setRemoteDescription(pc.localDescription);
    }).then(() => {
      return otherPc.createAnswer();
    }).then((answer) => {
      if (mapDescriptionCallback) {
        answer = mapDescriptionCallback(answer);
      }
      return otherPc.setLocalDescription(answer);
    }).then(() => {
      return pc.setRemoteDescription(otherPc.localDescription);
    });
  }

  function patchMaxMessageSizeFactory(maxMessageSize) {
    return ((description) => {
      description.sdp = description.sdp.replace(
        /^a=max-message-size:\s*(\d+)\s*$/gm, '');
      description.sdp = description.sdp.replace(
        /(^m=application\s+\d+\s+[\w/]*SCTP.*$)/m,
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
    pc1.createDataChannel('test');
    return negotiate(pc1, pc2)
    .then(() => {
      expect(pc1.sctp).to.have.property('maxMessageSize');
      expect(pc2.sctp).to.have.property('maxMessageSize');
      expect(pc1.sctp.maxMessageSize).to.be.a('number');
      expect(pc2.sctp.maxMessageSize).to.be.a('number');
    });
  });

  it('0 case handled correctly', (done) => {
    const patchMaxMessageSize = patchMaxMessageSizeFactory(0);

    // Ensure TypeError isn't thrown when sending data
    const dc = pc1.createDataChannel('test');
    const send = () => {
      dc.send('meow');
    };
    dc.onopen = () => {
      expect(send).not.to.throw();
      done();
    };
    negotiate(pc1, pc2, patchMaxMessageSize)
    .then(() => {
      expect(pc1.sctp.maxMessageSize).to.equal(0);
      expect(pc2.sctp.maxMessageSize).to.equal(0);
    });
  });

  it('send largest possible single message', () => {
    let maxMessageSize = 1000;
    const patchMaxMessageSize = patchMaxMessageSizeFactory(1000);
    if (window.adapter.browserDetails.browser === 'firefox' &&
        window.adapter.browserDetails.version < 57) {
      maxMessageSize = 1073741823;
    }

    pc1.createDataChannel('test');
    return negotiate(pc1, pc2, patchMaxMessageSize)
    .then(() => {
      expect(pc1.sctp.maxMessageSize).to.equal(maxMessageSize);
      expect(pc2.sctp.maxMessageSize).to.equal(maxMessageSize);

      // Ensure TypeError is thrown when sending a message that's too large
      return new Promise((resolve, reject) => {
        const dc = pc1.createDataChannel('test2');
        const send = () => {
          // Note: Falling back to 1000 here as the special case of FF would
          //       take way too long.
          dc.send(new Uint8Array(1000));
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
      let maxMessageSize = 1000;
      const patchMaxMessageSize = patchMaxMessageSizeFactory(maxMessageSize);
      if (window.adapter.browserDetails.browser === 'firefox' &&
          window.adapter.browserDetails.version < 57) {
        maxMessageSize = 1073741823;
      }

      pc1.createDataChannel('test');
      return negotiate(pc1, pc2, patchMaxMessageSize)
      .then(() => {
        expect(pc1.sctp.maxMessageSize).to.equal(maxMessageSize);
        expect(pc2.sctp.maxMessageSize).to.equal(maxMessageSize);

        // Ensure TypeError is thrown when sending a message that's too large
        return new Promise((resolve, reject) => {
          const dc = pc1.createDataChannel('test2');
          const send = () => {
            // Note: The local MMS is determined incorrectly by FF >= 57
            //       See: https://bugzilla.mozilla.org/show_bug.cgi?id=1413140
            if (window.adapter.browserDetails.browser === 'firefox' &&
                window.adapter.browserDetails.version >= 57) {
              maxMessageSize = 1073741823;
            }
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
