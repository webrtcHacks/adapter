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
