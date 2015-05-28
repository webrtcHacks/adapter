'use strict';
// This is a basic test file for use with testling.
// The test script language comes from tape.
/* jshint node: true */
var test = require('tape');

var m = require('../adapter.js');

test('Browser identified', function(t) {
  t.plan(3);
  t.ok(m.webrtcDetectedBrowser, 'Browser detected');
  t.ok(m.webrtcDetectedVersion, 'Browser version detected');
  t.ok(m.webrtcMinimumVersion, 'Minimum Browser version detected');
});

test('Browser supported by adapter.js', function (t) {
  t.plan(1);
  t.ok(m.webrtcDetectedVersion >= m.webrtcMinimumVersion, 'Browser version supported by adapter.js');
});

test('create RTCPeerConnection', function (t) {
  t.plan(1);
  t.ok(typeof(new m.RTCPeerConnection()) === 'object', 'RTCPeerConnection constructor');
});

test('call getUserMedia with constraints', function (t) {
  var impossibleConstraints = {
    video: {
      width: 1280,
      height: {min: 200, ideal: 720, max: 1080},
      frameRate: { exact: 0 } // to fail
    },
  };
  new Promise(function(resolve, reject) {
    navigator.getUserMedia(impossibleConstraints, resolve, reject);
  })
  .then(function() {
    t.fail('getUserMedia(impossibleConstraints) must fail');
    t.end();
  })
  .catch(function(err) {
    t.pass('getUserMedia(impossibleConstraints) must fail');
    t.ok(err.name.indexOf("Error") >= 0, 'must fail with named Error');
    t.end();
  });
});

test('basic connection establishment', function(t) {
  var pc1 = new m.RTCPeerConnection(null);
  var pc2 = new m.RTCPeerConnection(null);
  var ended = false;

  pc1.createDataChannel('somechannel');
  pc1.oniceconnectionstatechange = function() {
    if (pc1.iceConnectionState === 'connected' ||
        pc1.iceConnectionState === 'completed') {
      t.pass('P2P connection established');
      if (!ended) {
        ended = true;
        t.end();
      }
    }
  };

  var addCandidate = function(pc, event) {
    if (event.candidate) {
      var cand = new RTCIceCandidate(event.candidate);
      pc.addIceCandidate(cand,
        function() {
        },
        function(err) {
          t.fail('addIceCandidate ' + err.toString());
        }
      );
    }
  };
  pc1.onicecandidate = function(event) {
    addCandidate(pc2, event);
  };
  pc2.onicecandidate = function(event) {
    addCandidate(pc1, event);
  };

  pc1.createOffer(
    function(offer) {
      pc1.setLocalDescription(offer,
        function() {
          t.pass('pc1.setLocalDescription');

          offer = new RTCSessionDescription(offer);
          t.pass('created RTCSessionDescription from offer');
          pc2.setRemoteDescription(offer,
            function() {
              t.pass('pc2.setRemoteDescription');
              pc2.createAnswer(
                function(answer) {
                  t.pass('pc2.createAnswer');
                  pc2.setLocalDescription(answer,
                    function() {
                      t.pass('pc2.setLocalDescription');
                      answer = new RTCSessionDescription(answer);
                      t.pass('created RTCSessionDescription from answer');
                      pc1.setRemoteDescription(answer,
                        function() {
                          t.pass('pc1.setRemoteDescription');
                        },
                        function(err) {
                          t.fail('pc1.setRemoteDescription ' + err.toString());
                        }
                      );
                    },
                    function(err) {
                      t.fail('pc2.setLocalDescription ' + err.toString());
                    }
                  );
                },
                function(err) {
                  t.fail('pc2.createAnswer ' + err.toString());
                }
              );
            },
            function(err) {
              t.fail('pc2.setRemoteDescription ' + err.toString());
            }
          );
        },
        function(err) {
          t.fail('pc1.setLocalDescription ' + err.toString());
        }
      );
    },
    function(err) {
      t.fail('pc1 failed to create offer ' + err.toString());
    }
  );
});
