/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* jshint node: true */
'use strict';

// tests for the Edge SDP parser. Tests plain JS so can be run in node.
var test = require('tape');
var SDPUtils = require('../src/js/edge/edge_sdp.js');

var videoSDP =
  'v=0\r\no=- 1376706046264470145 3 IN IP4 127.0.0.1\r\ns=-\r\n' +
  't=0 0\r\na=group:BUNDLE video\r\n' +
  'a=msid-semantic: WMS EZVtYL50wdbfttMdmVFITVoKc4XgA0KBZXzd\r\n' +
  'm=video 9 UDP/TLS/RTP/SAVPF 100 101 107 116 117 96 97 99 98\r\n' +
  'c=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\n' +
  'a=ice-ufrag:npaLWmWDg3Yp6vJt\r\na=ice-pwd:pdfQZAiFbcsFmUKWw55g4TD5\r\n' +
  'a=fingerprint:sha-256 3D:05:43:01:66:AC:57:DC:17:55:08:5C:D4:25:D7:CA:FD' +
  ':E1:0E:C1:F4:F8:43:3E:10:CE:3E:E7:6E:20:B9:90\r\n' +
  'a=setup:actpass\r\na=mid:video\r\n' +
  'a=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r\n' +
  'a=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\n' +
  'a=extmap:4 urn:3gpp:video-orientation\r\na=sendrecv\r\na=rtcp-mux\r\n' +
  'a=rtcp-rsize\r\na=rtpmap:100 VP8/90000\r\n' +
  'a=rtcp-fb:100 ccm fir\r\na=rtcp-fb:100 nack\r\na=rtcp-fb:100 nack pli\r\n' +
  'a=rtcp-fb:100 goog-remb\r\na=rtcp-fb:100 transport-cc\r\n' +
  'a=rtpmap:101 VP9/90000\r\na=rtcp-fb:101 ccm fir\r\na=rtcp-fb:101 nack\r\n' +
  'a=rtcp-fb:101 nack pli\r\na=rtcp-fb:101 goog-remb\r\n' +
  'a=rtcp-fb:101 transport-cc\r\na=rtpmap:107 H264/90000\r\n' +
  'a=rtcp-fb:107 ccm fir\r\na=rtcp-fb:107 nack\r\na=rtcp-fb:107 nack pli\r\n' +
  'a=rtcp-fb:107 goog-remb\r\na=rtcp-fb:107 transport-cc\r\n' +
  'a=rtpmap:116 red/90000\r\na=rtpmap:117 ulpfec/90000\r\n' +
  'a=rtpmap:96 rtx/90000\r\na=fmtp:96 apt=100\r\na=rtpmap:97 rtx/90000\r\n' +
  'a=fmtp:97 apt=101\r\na=rtpmap:99 rtx/90000\r\na=fmtp:99 apt=107\r\n' +
  'a=rtpmap:98 rtx/90000\r\na=fmtp:98 apt=116\r\n' +
  'a=ssrc-group:FID 1734522595 2715962409\r\n' +
  'a=ssrc:1734522595 cname:VrveQctHgkwqDKj6\r\n' +
  'a=ssrc:1734522595 msid:EZVtYL50wdbfttMdmVFITVoKc4XgA0KBZXzd ' +
  '63238d63-9a20-4afc-832c-48678926afce\r\na=ssrc:1734522595 ' +
  'mslabel:EZVtYL50wdbfttMdmVFITVoKc4XgA0KBZXzd\r\n' +
  'a=ssrc:1734522595 label:63238d63-9a20-4afc-832c-48678926afce\r\n' +
  'a=ssrc:2715962409 cname:VrveQctHgkwqDKj6\r\n' +
  'a=ssrc:2715962409 msid:EZVtYL50wdbfttMdmVFITVoKc4XgA0KBZXzd ' +
  '63238d63-9a20-4afc-832c-48678926afce\r\n' +
  'a=ssrc:2715962409 mslabel:EZVtYL50wdbfttMdmVFITVoKc4XgA0KBZXzd\r\n' +
  'a=ssrc:2715962409 label:63238d63-9a20-4afc-832c-48678926afce\r\n';

test('splitSections', function(t) {
  var parsed = SDPUtils.splitSections(videoSDP.replace(/\r\n/g, '\n'));
  t.ok(parsed.length === 2,
      'split video-only SDP with only LF into two sections');

  parsed = SDPUtils.splitSections(videoSDP);
  t.ok(parsed.length === 2, 'split video-only SDP into two sections');

  t.ok(parsed.every(function(section) {
    return section.substr(-2) === '\r\n';
  }), 'every section ends with CRLF');

  t.ok(parsed.join('') === videoSDP,
      'joining sections without separator recreates SDP');
  t.end();
});

test('parseRtpParameters', function(t) {
  var sections = SDPUtils.splitSections(videoSDP);
  var parsed = SDPUtils.parseRtpParameters(sections[1]);
  t.ok(parsed.codecs.length === 9, 'parsed 9 codecs');
  t.ok(parsed.fecMechanisms.length === 2, 'parsed FEC mechanisms');
  t.ok(parsed.fecMechanisms.indexOf('RED') !== -1,
      'parsed RED as FEC mechanism');
  t.ok(parsed.fecMechanisms.indexOf('ULPFEC') !== -1,
      'parsed ULPFEC as FEC mechanism');
  t.ok(parsed.headerExtensions.length === 3, 'parsed 3 header extensions');
  t.end();
});

test('fmtp parsing and serialization', function(t) {
  var line = 'a=fmtp:111 minptime=10; useinbandfec=1';
  var parsed = SDPUtils.parseFmtp(line);
  t.ok(Object.keys(parsed).length === 2, 'parsed 2 parameters');
  t.ok(parsed.minptime === '10', 'parsed minptime');
  t.ok(parsed.useinbandfec === '1', 'parsed useinbandfec');

  // TODO: is this safe or can the order change?
  // serialization strings the extra whitespace after ';'
  t.ok(SDPUtils.writeFmtp({payloadType: 111, parameters: parsed})
      === line.replace('; ', ';') + '\r\n',
      'serialization does not add extra spaces between parameters');
  t.end();
});

test('rtpmap parsing and serialization', function(t) {
  var line = 'a=rtpmap:111 opus/48000/2';
  var parsed = SDPUtils.parseRtpMap(line);
  t.ok(parsed.name === 'opus', 'parsed codec name');
  t.ok(parsed.payloadType === 111, 'parsed payloadType as integer');
  t.ok(parsed.clockRate === 48000, 'parsed clockRate as integer');
  t.ok(parsed.numChannels === 2, 'parsed numChannels');

  parsed = SDPUtils.parseRtpMap('a=rtpmap:0 PCMU/8000');
  t.ok(parsed.numChannels === 1, 'numChannels defaults to 1 if not present');

  t.ok(SDPUtils.writeRtpMap({
    payloadType: 111,
    name: 'opus',
    clockRate: 48000,
    numChannels: 2
  }).trim() === line, 'serialized rtpmap');

  t.end();
});
