'use strict';
// This is a basic test file for use with testling.
// The test script language comes from tape.
/* jshint node: true */
/* global Promise */
var test = require('tape');

var m = require('../adapter.js');

test('Browser identified', function(t) {
  t.plan(3);
  t.ok(m.webrtcDetectedBrowser, 'Browser detected:' + m.webrtcDetectedBrowser);
  t.ok(m.webrtcDetectedVersion,
       'Browser version detected:' + m.webrtcDetectedVersion);
  t.ok(m.webrtcMinimumVersion, 'Minimum Browser version detected');
});

test('Browser supported by adapter.js', function(t) {
  t.plan(1);
  t.ok(m.webrtcDetectedVersion >= m.webrtcMinimumVersion,
      'Browser version supported by adapter.js');
});

test('create RTCPeerConnection', function(t) {
  t.plan(1);
  t.ok(typeof(new RTCPeerConnection()) === 'object',
      'RTCPeerConnection constructor');
});

test('call getUserMedia with constraints', function(t) {
  var impossibleConstraints = {
    video: {
      width: 1280,
      height: {min: 200, ideal: 720, max: 1080},
      frameRate: {exact: 0} // to fail
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
    t.ok(err.name.indexOf('Error') >= 0, 'must fail with named Error');
    t.end();
  });
});

test('basic connection establishment', function(t) {
  var pc1 = new RTCPeerConnection(null);
  var pc2 = new RTCPeerConnection(null);
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
          t.pass('addIceCandidate');
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
      t.pass('pc1.createOffer');
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

test('basic connection establishment with promise', function(t) {
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
      pc.addIceCandidate(cand).catch(function(err) {
        t.fail('addIceCandidate ' + err.toString());
      });
    }
  };
  pc1.onicecandidate = function(event) {
    addCandidate(pc2, event);
  };
  pc2.onicecandidate = function(event) {
    addCandidate(pc1, event);
  };

  pc1.createOffer().then(function(offer) {
    t.pass('pc1.createOffer');
    return pc1.setLocalDescription(offer);
  }).then(function() {
    t.pass('pc1.setLocalDescription');
    return pc2.setRemoteDescription(pc1.localDescription);
  }).then(function() {
    t.pass('pc2.setRemoteDescription');
    return pc2.createAnswer();
  }).then(function(answer) {
    t.pass('pc2.createAnswer');
    return pc2.setLocalDescription(answer);
  }).then(function() {
    t.pass('pc2.setLocalDescription');
    return pc1.setRemoteDescription(pc2.localDescription);
  }).then(function() {
    t.pass('pc1.setRemoteDescription');
  }).catch(function(err) {
    t.fail(err.toString());
  });
});

test('call enumerateDevices', function(t) {
  var step = 'enumerateDevices() must succeed';
  navigator.mediaDevices.enumerateDevices()
  .then(function(devices) {
    t.pass(step);
    step = 'valid enumerateDevices output: ' + JSON.stringify(devices);
    t.ok(typeof devices.length === 'number', 'Produced a devices array');
    devices.forEach(function(d) {
      t.ok(d.kind === 'videoinput' ||
           d.kind === 'audioinput' ||
           d.kind === 'audiooutput', 'Known device kind');
      t.ok(d.deviceId.length !== undefined, 'device id present');
      t.ok(d.label.length !== undefined, 'device label present');
    });
    t.pass(step);
    t.end();
  })
  .catch(function(err) {
    t.fail(step + ' - ' + err.toString());
    t.end();
  });
});

// test that adding and removing an eventlistener on navigator.mediaDevices
// is possible. The usecase for this is the devicechanged event.
// This does not test whether devicechanged is actually called.
test('navigator.mediaDevices eventlisteners', function(t) {
  t.plan(2);
  t.ok(typeof(navigator.mediaDevices.addEventListener) === 'function',
      'navigator.mediaDevices.addEventListener is a function');
  t.ok(typeof(navigator.mediaDevices.removeEventListener) === 'function',
      'navigator.mediaDevices.removeEventListener is a function');
});

// Test Chrome polyfill for getStats.
test('getStats', function(t) {
  var pc1 = new m.RTCPeerConnection(null);

  // Test expected new behavior.
  new Promise(function(resolve, reject) {
    pc1.getStats(null, resolve, reject);
  })
  .then(function(report) {
    t.equal(typeof(report), 'object', 'report is an object.');
    for (var key in report) {
      // This avoids problems with Firefox
      if (typeof(report[key]) === 'function') {
        continue;
      }
      t.equal(report[key].id, key, 'report key matches stats id.');
    }
    t.end();
  })
  .catch(function(err) {
    t.fail('getStats() should never fail with error: ' + err.toString());
    t.end();
  });
});

// Test that polyfill for Chrome getStats falls back to builtin functionality
// when the old getStats function signature is used; when the callback is passed
// as the first argument.
test('originalChromeGetStats', function(t) {
  var pc1 = new m.RTCPeerConnection(null);

  if (m.webrtcDetectedBrowser === 'chrome') {
    new Promise(function(resolve, reject) {  // jshint ignore: line
      pc1.getStats(resolve, null);
    })
    .then(function(response) {
      var reports = response.result();
      reports.forEach(function(report) {
        t.equal(typeof(report), 'object');
        t.equal(typeof(report.id), 'string');
        t.equal(typeof(report.type), 'string');
        t.equal(typeof(report.timestamp), 'object');
        report.names().forEach(function(name) {
          t.notEqual(report.stat(name), null,
              'stat ' +
              name + ' not equal to null');
        });
      });
      t.end();
    })
    .catch(function(err) {
      t.fail('getStats() should never fail with error: ' + err.toString());
      t.end();
    });
  } else {
    // All other browsers.
    t.end();
  }
});
