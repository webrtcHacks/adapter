// This is a basic test file for use with testling.
// The test script language comes from tape.
var test = require('tape');

m = require('../adapter.js');

test('Browser identified', function(t) {
  t.plan(2);
  t.ok(m.webrtcDetectedBrowser);
  t.ok(m.webrtcDetectedVersion);
});
