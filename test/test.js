// This is a basic test file for use with testling.
// The test script language comes from tape.
var test = require('tape');

m = require('../adapter.js');

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
  t.plan(3);
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
  });
});
