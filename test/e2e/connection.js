/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

describe('establishes a connection', () => {
  let pc1;
  let pc2;
  function noop() {}
  function throwError(err) {
    console.error(err.toString());
    throw err;
  }

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

  it('with legacy callbacks', (done) => {
    pc1.onicecandidate = function(event) {
      pc2.addIceCandidate(event.candidate, noop, throwError);
    };
    pc2.onicecandidate = function(event) {
      pc1.addIceCandidate(event.candidate, noop, throwError);
    };
    pc1.oniceconnectionstatechange = function() {
      if (pc1.iceConnectionState === 'connected' ||
          pc1.iceConnectionState === 'completed') {
        done();
      }
    };

    var constraints = {video: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      pc1.addStream(stream);

      pc1.createOffer(
        function(offer) {
          pc1.setLocalDescription(offer,
            function() {
              pc2.setRemoteDescription(offer,
                function() {
                  pc2.createAnswer(
                    function(answer) {
                      pc2.setLocalDescription(answer,
                        function() {
                          pc1.setRemoteDescription(answer, noop, throwError);
                        },
                        throwError
                      );
                    },
                    throwError
                  );
                },
                throwError
              );
            },
            throwError
          );
        },
        throwError
      );
    });
  });

  it('with promises', (done) => {
    pc1.oniceconnectionstatechange = function() {
      if (pc1.iceConnectionState === 'connected' ||
          pc1.iceConnectionState === 'completed') {
        done();
      }
    };

    var constraints = {video: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      pc1.addStream(stream);
      return negotiate(pc1, pc2);
    })
    .catch(throwError);
  });

  it('with streams in both directions', (done) => {
    pc1.oniceconnectionstatechange = function() {
      if (pc1.iceConnectionState === 'connected' ||
          pc1.iceConnectionState === 'completed') {
        done();
      }
    };

    var constraints = {video: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      pc1.addStream(stream);
      pc2.addStream(stream);
      return negotiate(pc1, pc2);
    })
    .catch(throwError);
  });

  describe('with addTrack', () => {
    it('and all tracks of a stream', (done) => {
      pc1.oniceconnectionstatechange = function() {
        if (pc1.iceConnectionState === 'connected' ||
            pc1.iceConnectionState === 'completed') {
          done();
        }
      };

      pc2.onaddstream = function(event) {
        expect(event).to.have.property('stream');
        expect(event.stream.getAudioTracks()).to.have.length(1);
        expect(event.stream.getVideoTracks()).to.have.length(1);
      };

      var constraints = {audio: true, video: true};
      navigator.mediaDevices.getUserMedia(constraints)
      .then(function(stream) {
        stream.getTracks().forEach(function(track) {
          pc1.addTrack(track, stream);
        });
        return negotiate(pc1, pc2);
      })
      .catch(throwError);
    });

    it('but only the audio track of an av stream', (done) => {
      pc1.oniceconnectionstatechange = function() {
        if (pc1.iceConnectionState === 'connected' ||
            pc1.iceConnectionState === 'completed') {
          done();
        }
      };

      pc2.onaddstream = function(event) {
        expect(event).to.have.property('stream');
        expect(event.stream.getAudioTracks()).to.have.length(1);
        expect(event.stream.getVideoTracks()).to.have.length(0);
      };

      var constraints = {audio: true, video: true};
      navigator.mediaDevices.getUserMedia(constraints)
      .then(function(stream) {
        stream.getAudioTracks().forEach(function(track) {
          pc1.addTrack(track, stream);
        });
        return negotiate(pc1, pc2);
      })
      .catch(throwError);
    });

    it('as two streams', (done) => {
      let streams = [];
      pc1.oniceconnectionstatechange = function() {
        if (pc1.iceConnectionState === 'connected' ||
            pc1.iceConnectionState === 'completed') {
          expect(streams).to.have.length(2);
          done();
        }
      };

      pc2.onaddstream = function(event) {
        expect(event).to.have.property('stream');
        expect(event.stream.getTracks()).to.have.length(1);
        streams.push(event.stream);
      };

      var constraints = {audio: true, video: true};
      navigator.mediaDevices.getUserMedia(constraints)
      .then(function(stream) {
        var audioStream = new MediaStream(stream.getAudioTracks());
        var videoStream = new MediaStream(stream.getVideoTracks());
        audioStream.getTracks().forEach(function(track) {
          pc1.addTrack(track, audioStream);
        });
        videoStream.getTracks().forEach(function(track) {
          pc1.addTrack(track, videoStream);
        });
        return negotiate(pc1, pc2);
      })
      .catch(throwError);
    });
  });

  it('with no explicit end-of-candidates', function(done) {
    if (window.adapter.browserDetails.browser === 'edge') {
      this.timeout(10000);
    }
    pc1.oniceconnectionstatechange = function() {
      if (pc1.iceConnectionState === 'connected' ||
          pc1.iceConnectionState === 'completed') {
        done();
      }
    };

    pc1.onicecandidate = (event) => {
      if (event.candidate) {
        pc2.addIceCandidate(event.candidate, noop, throwError);
      }
    };
    pc2.onicecandidate = (event) => {
      if (event.candidate) {
        pc1.addIceCandidate(event.candidate, noop, throwError);
      }
    };

    var constraints = {video: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      stream.getTracks().forEach(function(track) {
        pc1.addTrack(track, stream);
      });
      return negotiate(pc1, pc2);
    })
    .catch(throwError);
  });

  describe('with datachannel', function() {
    beforeEach(function() {
      if (window.adapter.browserDetails.browser === 'edge') {
        this.skip();
      }
    });

    it('establishes a connection', (done) => {
      pc1.oniceconnectionstatechange = function() {
        if (pc1.iceConnectionState === 'connected' ||
            pc1.iceConnectionState === 'completed') {
          done();
        }
      };

      pc1.createDataChannel('foo');
      negotiate(pc1, pc2)
      .catch(throwError);
    });
  });

  it('and calls the video loadedmetadata', (done) => {
    pc2.addEventListener('addstream', function(e) {
      var v = document.createElement('video');
      v.autoplay = true;
      v.addEventListener('loadedmetadata', function() {
        done();
      });
      v.srcObject = e.stream;
    });
    var constraints = {video: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      stream.getTracks().forEach(function(track) {
        pc1.addTrack(track, stream);
      });
      return negotiate(pc1, pc2);
    })
    .catch(throwError);
  });

  it('and triggers the connectionstatechange event', (done) => {
    pc1.onconnectionstatechange = function() {
      if (pc1.connectionState === 'connected') {
        done();
      }
    };

    var constraints = {video: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      pc1.addStream(stream);
      return negotiate(pc1, pc2);
    })
    .catch(throwError);
  });
});
