'use strict';
// This is a basic test file for use with testling.
// The test script language comes from tape.
/* jshint node: true */
/* global Promise */
var test = require('tape');

// adapter.js is not supposed to spill console.log
// when used as a module. This temporarily overloads
// console.log so we can assert this.
var logCount = 0;
var saveConsole = console.log.bind(console);
console.log = function() {
  logCount++;
  saveConsole.apply(saveConsole, arguments);
};

var m = require('../adapter.js');
console.log = saveConsole;

test('log suppression', function(t) {
  t.ok(logCount === 0, 'adapter.js does not use console.log');
  t.end();
});

// Helpers to test adapter's legacy constraints-manipulation.

function pretendVersion(m, version, func) {
  var realVersion = m.webrtcDetectedVersion;
  m.webrtcTesting.version = version;
  func();
  m.webrtcTesting.version = realVersion;
}

function interceptGumForConstraints(gum, func) {
  var origGum = navigator[gum].bind(navigator);
  var netConstraints;
  navigator[gum] = function(constraints) {
    netConstraints = constraints;
  };
  func();
  navigator[gum] = origGum;
  return netConstraints;
}

// Start of tests.

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

test('getUserMedia shim', function(t) {
  t.ok(typeof navigator.getUserMedia !== 'undefined',
       'navigator.getUserMedia is defined');
  t.ok(navigator.mediaDevices &&
       typeof navigator.mediaDevices.getUserMedia !== 'undefined',
       'navigator.mediaDevices.getUserMedia is defined');
  t.end();
});

test('RTCPeerConnection shim', function(t) {
  t.ok(typeof window.RTCPeerConnection !== 'undefined',
       'RTCPeerConnection is defined');
  t.ok(typeof window.RTCSessionDescription !== 'undefined',
       'RTCSessionDescription is defined');
  t.ok(typeof window.RTCIceCandidate !== 'undefined',
       'RTCIceCandidate is defined');
  t.end();
});

test('create RTCPeerConnection', function(t) {
  t.plan(1);
  t.ok(typeof(new RTCPeerConnection()) === 'object',
      'RTCPeerConnection constructor');
});

test('attachMediaStream', function(t) {
  // onloadedmetadata had issues in Firefox < 38.
  t.plan((m.webrtcDetectedBrowser === 'firefox' &&
          m.webrtcDetectedVersion < 38) ? 2 : 3);
  var video = document.createElement('video');
  // if attachMediaStream works, we should get a video
  // at some point. This will trigger onloadedmetadata.
  video.onloadedmetadata = function() {
    t.pass('got stream with w=' + video.videoWidth +
           ',h=' + video.videoHeight);
  };

  var constraints = {video: true, fake: true};
  navigator.mediaDevices.getUserMedia(constraints)
  .then(function(stream) {
    t.pass('got stream.');
    m.attachMediaStream(video, stream);
    t.pass('attachMediaStream returned');
  })
  .catch(function(err) {
    t.fail(err.toString());
  });
});

test('call getUserMedia with constraints', function(t) {
  t.plan(1);
  var impossibleConstraints = {
    video: {
      width: 1280,
      height: {min: 200, ideal: 720, max: 1080},
      frameRate: {exact: 0} // to fail
    },
  };
  if (m.webrtcDetectedBrowser === 'firefox') {
    if (m.webrtcDetectedVersion < 42) {
      t.skip('getUserMedia(impossibleConstraints) must fail ' +
             '(firefox <42 cannot turn off fake devices)');
      return;
    }
    impossibleConstraints.fake = false; // override
  }
  new Promise(function(resolve, reject) {
    navigator.getUserMedia(impossibleConstraints, resolve, reject);
  })
  .then(function() {
    t.fail('getUserMedia(impossibleConstraints) must fail');
  })
  .catch(function(err) {
    t.ok(err.name.indexOf('Error') >= 0,
         'getUserMedia(impossibleConstraints) must fail');
  });
});

test('check getUserMedia legacy constraints converter', function(t) {
  function testBeforeAfterPairs(gum, pairs) {
    pairs.forEach(function(beforeAfter, i) {
      var constraints = interceptGumForConstraints(gum, function() {
        navigator.getUserMedia(beforeAfter[0], function() {}, function() {});
      });
      t.deepEqual(constraints, beforeAfter[1],
                  'Constraints ' + (i + 1) + ' back-converted to ' + gum);
    });
  }

  if (m.webrtcDetectedBrowser === 'firefox') {
    pretendVersion(m, 37, function() {
      testBeforeAfterPairs('mozGetUserMedia', [
        // Test that spec constraints get back-converted on FF37.
        [
         {
           video: {
             mediaSource: 'screen',
             width: 1280,
             height: {min: 200, ideal: 720, max: 1080},
             facingMode: 'user',
             frameRate: {exact: 50}
           }
         },
         {
           video: {
             mediaSource: 'screen',
             height: {min: 200, max: 1080},
             frameRate: {max: 50, min: 50},
             advanced: [
               {width: {min: 1280, max: 1280}},
               {height: {min: 720, max: 720}},
               {facingMode: 'user'}
             ],
             require: ['height', 'frameRate']
           }
         }
        ],
        // Test that legacy constraints pass through unharmed on FF37.
        [
         {
           video: {
             height: {min: 200, max: 1080},
             frameRate: {max: 50, min: 50},
             advanced: [
               {width: {min: 1280, max: 1280}},
               {height: {min: 720, max: 720}},
               {facingMode: 'user'}
             ],
             require: ['height', 'frameRate']
           }
         },
         {
           video: {
             height: {min: 200, max: 1080},
             frameRate: {max: 50, min: 50},
             advanced: [
               {width: {min: 1280, max: 1280}},
               {height: {min: 720, max: 720}},
               {facingMode: 'user'}
             ],
             require: ['height', 'frameRate']
           }
         }
        ],
      ]);
    });
    pretendVersion(m, 38, function() {
      testBeforeAfterPairs('mozGetUserMedia', [
        // Test that spec constraints pass through unharmed on FF38+.
        [
         {
           video: {
             mediaSource: 'screen',
             width: 1280,
             height: {min: 200, ideal: 720, max: 1080},
             facingMode: 'user',
             frameRate: {exact: 50}
           }
         },
         {
           video: {
             mediaSource: 'screen',
             width: 1280,
             height: {min: 200, ideal: 720, max: 1080},
             facingMode: 'user',
             frameRate: {exact: 50}
           }
         },
        ],
      ]);
    });
  } else if (m.webrtcDetectedBrowser === 'chrome') {
    testBeforeAfterPairs('webkitGetUserMedia', [
      // Test that spec constraints get back-converted on Chrome.
      [
       {
         video: {
           width: 1280,
           height: {min: 200, ideal: 720, max: 1080},
           frameRate: {exact: 50}
         }
       },
       {
         video: {
           mandatory: {
             maxFrameRate: 50,
             maxHeight: 1080,
             minHeight: 200,
             minFrameRate: 50
           },
           optional: [
             {minWidth: 1280},
             {maxWidth: 1280},
             {minHeight: 720},
             {maxHeight: 720},
           ]
         }
       }
      ],
      // Test that legacy constraints pass through unharmed on Chrome.
      [
       {
         video: {
           mandatory: {
             maxFrameRate: 50,
             maxHeight: 1080,
             minHeight: 200,
             minFrameRate: 50
           },
           optional: [
             {minWidth: 1280},
             {maxWidth: 1280},
             {minHeight: 720},
             {maxHeight: 720},
           ]
         }
       },
       {
         video: {
           mandatory: {
             maxFrameRate: 50,
             maxHeight: 1080,
             minHeight: 200,
             minFrameRate: 50
           },
           optional: [
             {minWidth: 1280},
             {maxWidth: 1280},
             {minHeight: 720},
             {maxHeight: 720},
           ]
         }
       }
      ],
      // Test code protecting Chrome from choking on common unknown constraints.
      [
       {
         video: {
           mediaSource: 'screen',
           advanced: [
             {facingMode: 'user'}
           ],
           require: ['height', 'frameRate']
         }
       },
       {
         video: {
           optional: [
             {facingMode: 'user'}
           ]
         }
       }
      ]
    ]);
  }
  t.end();
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

// Test that adding and removing an eventlistener on navigator.mediaDevices
// is possible. The usecase for this is the devicechanged event.
// This does not test whether devicechanged is actually called.
test('navigator.mediaDevices eventlisteners', function(t) {
  t.plan(2);
  t.ok(typeof(navigator.mediaDevices.addEventListener) === 'function',
      'navigator.mediaDevices.addEventListener is a function');
  t.ok(typeof(navigator.mediaDevices.removeEventListener) === 'function',
      'navigator.mediaDevices.removeEventListener is a function');
});

// Test that getUserMedia is shimmed properly.
test('navigator.mediaDevices.getUserMedia', function(t) {
  navigator.mediaDevices.getUserMedia({video: true, fake: true})
  .then(function(stream) {
    t.ok(stream.getVideoTracks().length > 0, 'Got stream with video tracks.');
    t.end();
  })
  .catch(function(err) {
    t.fail('getUserMedia failed with error: ' + err.toString());
    t.end();
  });
});

// Test Chrome polyfill for getStats.
test('getStats', function(t) {
  var pc1 = new RTCPeerConnection(null);

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
  var pc1 = new RTCPeerConnection(null);

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

test('getStats promise', function(t) {
  t.plan(2);
  var pc1 = new m.RTCPeerConnection(null);

  var p = pc1.getStats();
  t.ok(typeof p === 'object', 'getStats with no arguments returns a Promise');

  var q = pc1.getStats(null);
  t.ok(typeof q === 'object', 'getStats with a selector returns a Promise');
});

test('iceTransportPolicy is translated to iceTransports', function(t) {
  if (m.webrtcDetectedBrowser === 'firefox') {
    // not implemented yet.
    t.pass('iceTransportPolicy is not implemented by Firefox yet.');
    t.end();
  }
  var pc1 = new RTCPeerConnection({iceTransportPolicy: 'relay',
      iceServers: []});

  // Since we try to gather only relay candidates without specifying
  // a TURN server, we should not get any candidates.
  var candidates = [];
  pc1.createDataChannel('somechannel');
  pc1.onicecandidate = function(event) {
    if (!event.candidate) {
      if (candidates.length === 0) {
        t.pass('iceTransportPolicy was translated to iceTransport');
        t.end();
      } else {
        t.fail('got unexpected candidates. ' + JSON.stringify(candidates));
      }
    } else {
      candidates.push(event.candidate);
    }
  };

  pc1.createOffer().then(function(offer) {
    return pc1.setLocalDescription(offer);
  }).catch(function(err) {
    t.fail(err.toString());
  });
});
