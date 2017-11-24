/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

describe('removeTrack', () => {
  let pc;
  beforeEach(() => {
    pc = new RTCPeerConnection();
  });
  afterEach(() => {
    if (pc.signalingState !== 'closed') {
      pc.close();
    }
  });

  describe('throws an exception', () => {
    it('if the argument is a track, not a sender', () => {
      return navigator.mediaDevices.getUserMedia({audio: true})
      .then(stream => {
        pc.addTrack(stream.getTracks()[0], stream);
        const withTrack = () => {
          pc.removeTrack(stream.getTracks()[0]);
        };
        expect(withTrack).to.throw()
          .that.has.property('name').that.equals('TypeError');
      });
    });

    it('if the sender does not belong to the peerconnection', () => {
      return navigator.mediaDevices.getUserMedia({audio: true})
      .then(stream => {
        const pc2 = new RTCPeerConnection();
        const sender = pc2.addTrack(stream.getTracks()[0], stream);
        const invalidSender = () => {
          pc.removeTrack(sender);
        };
        expect(invalidSender).to.throw()
            .that.has.property('name').that.equals('InvalidAccessError');
        pc2.close();
      });
    });

    it('if the peerconnection has been closed already', () => {
      return navigator.mediaDevices.getUserMedia({audio: true})
      .then(stream => {
        const sender = pc.addTrack(stream.getTracks()[0], stream);
        pc.close();
        const afterClose = () => {
          pc.removeTrack(sender);
        };
        expect(afterClose).to.throw()
          .that.has.property('name').that.equals('InvalidStateError');
      });
    });
  });

  it('allows removeTrack twice', () => {
    return navigator.mediaDevices.getUserMedia({audio: true})
    .then(stream => {
      const sender = pc.addTrack(stream.getTracks()[0], stream);
      pc.removeTrack(sender);
      const again = () => {
        pc.removeTrack(sender);
      };
      expect(again).not.to.throw();
    });
  });

  ['addStream', 'addTrack'].forEach(variant => {
    describe('after ' + variant + ' for an audio/video track', () => {
      beforeEach(() => {
        return navigator.mediaDevices.getUserMedia({audio: true, video: true})
        .then(stream => {
          if (variant === 'addStream') {
            pc.addStream(stream);
          } else {
            stream.getTracks().forEach(track => {
              pc.addTrack(track, stream);
            });
          }
        });
      });

      describe('after removing a single track', () => {
        it('only a single sender remains', () => {
          const senders = pc.getSenders();
          expect(pc.getSenders()).to.have.length(2);

          pc.removeTrack(senders[0]);
          expect(pc.getSenders()).to.have.length(1);
        });

        it('the local stream remains untouched', () => {
          const senders = pc.getSenders();

          pc.removeTrack(senders[0]);
          expect(pc.getLocalStreams()).to.have.length(1);
          expect(pc.getLocalStreams()[0].getTracks()).to.have.length(2);
        });
      });

      describe('after removing all tracks', () => {
        it('no senders remain', () => {
          const senders = pc.getSenders();
          senders.forEach(sender => pc.removeTrack(sender));
          expect(pc.getSenders()).to.have.length(0);
        });

        it('no local streams remain', () => {
          const senders = pc.getSenders();
          senders.forEach(sender => pc.removeTrack(sender));
          expect(pc.getLocalStreams()).to.have.length(0);
        });
      });
    });
  });
});
