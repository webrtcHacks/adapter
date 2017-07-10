/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

describe('addTrack', () => {
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
    it('if the track has already been added', () => {
      return navigator.mediaDevices.getUserMedia({audio: true})
      .then(stream => {
        pc.addTrack(stream.getTracks()[0], stream);
        const again = () => {
          pc.addTrack(stream.getTracks()[0], stream);
        };
        expect(again).to.throw(/already/)
          .that.has.property('name').that.equals('InvalidAccessError');
      });
    });

    it('if the track has already been added via addStream', () => {
      return navigator.mediaDevices.getUserMedia({audio: true})
      .then(stream => {
        pc.addStream(stream);
        const again = () => {
          pc.addTrack(stream.getTracks()[0], stream);
        };
        expect(again).to.throw(/already/)
          .that.has.property('name').that.equals('InvalidAccessError');
      });
    });

    it('if addStream is called with a stream containing a track ' +
       'already added', () => {
      return navigator.mediaDevices.getUserMedia({audio: true, video: true})
      .then(stream => {
        pc.addTrack(stream.getTracks()[0], stream);
        const again = () => {
          pc.addStream(stream);
        };
        expect(again).to.throw(/already/)
          .that.has.property('name').that.equals('InvalidAccessError');
      });
    });

    it('if the peerconnection has been closed already', () => {
      return navigator.mediaDevices.getUserMedia({audio: true})
      .then(stream => {
        pc.close();
        const afterClose = () => {
          pc.addTrack(stream.getTracks()[0], stream);
        };
        expect(afterClose).to.throw(/closed/)
          .that.has.property('name').that.equals('InvalidStateError');
      });
    });
  });

  describe('and getSenders', () => {
    it('creates a sender', () => {
      return navigator.mediaDevices.getUserMedia({audio: true})
      .then(stream => {
        pc.addTrack(stream.getTracks()[0], stream);
        const senders = pc.getSenders();
        expect(senders).to.have.length(1);
        expect(senders[0].track).to.equal(stream.getTracks()[0]);
      });
    });
  });

  describe('and getLocalStreams', () => {
    it('returns a stream with audio and video even if just an ' +
        'audio track was added', () => {
      return navigator.mediaDevices.getUserMedia({audio: true, video: true})
      .then(stream => {
        pc.addTrack(stream.getTracks()[0], stream);
        const localStreams = pc.getLocalStreams();
        expect(localStreams).to.have.length(1);
        expect(localStreams[0].getTracks()).to.have.length(2);
        expect(pc.getSenders()).to.have.length(1);
      });
    });

    it('adds another track to the same stream', () => {
      return navigator.mediaDevices.getUserMedia({audio: true, video: true})
      .then(stream => {
        pc.addTrack(stream.getTracks()[0], stream);
        const localStreams = pc.getLocalStreams();
        expect(localStreams).to.have.length(1);
        expect(localStreams[0].getTracks()).to.have.length(2);
        expect(pc.getSenders()).to.have.length(1);

        pc.addTrack(stream.getTracks()[1], stream);
        expect(pc.getLocalStreams()).to.have.length(1);
        expect(pc.getSenders()).to.have.length(2);
      });
    });

    it('plays together nicely', () => {
      return navigator.mediaDevices.getUserMedia({audio: true})
      .then(stream => {
        pc.addTrack(stream.getTracks()[0], stream);
        const localStreams = pc.getLocalStreams();
        expect(localStreams).to.have.length(1);
        expect(localStreams[0].getTracks()).to.have.length(1);
        expect(pc.getSenders()).to.have.length(1);
        return navigator.mediaDevices.getUserMedia({video: true});
      })
      .then(stream => {
        const localStreams = pc.getLocalStreams();
        const localStream = localStreams[0];
        const track = stream.getTracks()[0];
        localStream.addTrack(track);
        pc.addTrack(track, localStream);
        expect(localStreams).to.have.length(1);
        expect(localStreams[0].getTracks()).to.have.length(2);
        expect(pc.getSenders()).to.have.length(2);
      });
    });
  });
});
