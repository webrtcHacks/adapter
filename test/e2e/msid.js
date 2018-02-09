/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

describe('MSID', () => {
  let pc1;
  let pc2;
  let localStream;

  function negotiate(pc, otherPc) {
    return pc.createOffer()
    .then(function(offer) {
      return pc.setLocalDescription(offer);
    }).then(function() {
      return otherPc.setRemoteDescription(pc.localDescription);
    }).then(function() {
      return otherPc.createAnswer();
    }).then(function(answer) {
      return otherPc.setLocalDescription(answer);
    }).then(function() {
      return pc.setRemoteDescription(otherPc.localDescription);
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

  it('signals stream ids', (done) => {
    pc2.ontrack = (e) => {
      expect(e.streams[0].id).to.equal(localStream.id);
      done();
    };
    navigator.mediaDevices.getUserMedia({video: true})
    .then((stream) => {
      localStream = stream;
      pc1.addTrack(stream.getTracks()[0], stream);
      return negotiate(pc1, pc2);
    });
  });

  it('puts the track msid attribute into the localDescription', () => {
    return navigator.mediaDevices.getUserMedia({video: true})
    .then((stream) => {
      localStream = stream;
      pc1.addTrack(stream.getTracks()[0], stream);
      return negotiate(pc1, pc2);
    })
    .then(() => {
      const track = localStream.getTracks()[0];
      expect(pc1.localDescription.sdp)
          .to.contain('msid:' + localStream.id + ' ' + track.id);
    });
  });
});
