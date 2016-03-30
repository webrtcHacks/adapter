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

var videoSDP = 'v=0\r\no=- 1376706046264470145 3 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE video\r\na=msid-semantic: WMS EZVtYL50wdbfttMdmVFITVoKc4XgA0KBZXzd\r\nm=video 9 UDP/TLS/RTP/SAVPF 100 101 107 116 117 96 97 99 98\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:npaLWmWDg3Yp6vJt\r\na=ice-pwd:pdfQZAiFbcsFmUKWw55g4TD5\r\na=fingerprint:sha-256 3D:05:43:01:66:AC:57:DC:17:55:08:5C:D4:25:D7:CA:FD:E1:0E:C1:F4:F8:43:3E:10:CE:3E:E7:6E:20:B9:90\r\na=setup:actpass\r\na=mid:video\r\na=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r\na=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:4 urn:3gpp:video-orientation\r\na=sendrecv\r\na=rtcp-mux\r\na=rtcp-rsize\r\na=rtpmap:100 VP8/90000\r\na=rtcp-fb:100 ccm fir\r\na=rtcp-fb:100 nack\r\na=rtcp-fb:100 nack pli\r\na=rtcp-fb:100 goog-remb\r\na=rtcp-fb:100 transport-cc\r\na=rtpmap:101 VP9/90000\r\na=rtcp-fb:101 ccm fir\r\na=rtcp-fb:101 nack\r\na=rtcp-fb:101 nack pli\r\na=rtcp-fb:101 goog-remb\r\na=rtcp-fb:101 transport-cc\r\na=rtpmap:107 H264/90000\r\na=rtcp-fb:107 ccm fir\r\na=rtcp-fb:107 nack\r\na=rtcp-fb:107 nack pli\r\na=rtcp-fb:107 goog-remb\r\na=rtcp-fb:107 transport-cc\r\na=rtpmap:116 red/90000\r\na=rtpmap:117 ulpfec/90000\r\na=rtpmap:96 rtx/90000\r\na=fmtp:96 apt=100\r\na=rtpmap:97 rtx/90000\r\na=fmtp:97 apt=101\r\na=rtpmap:99 rtx/90000\r\na=fmtp:99 apt=107\r\na=rtpmap:98 rtx/90000\r\na=fmtp:98 apt=116\r\na=ssrc-group:FID 1734522595 2715962409\r\na=ssrc:1734522595 cname:VrveQctHgkwqDKj6\r\na=ssrc:1734522595 msid:EZVtYL50wdbfttMdmVFITVoKc4XgA0KBZXzd 63238d63-9a20-4afc-832c-48678926afce\r\na=ssrc:1734522595 mslabel:EZVtYL50wdbfttMdmVFITVoKc4XgA0KBZXzd\r\na=ssrc:1734522595 label:63238d63-9a20-4afc-832c-48678926afce\r\na=ssrc:2715962409 cname:VrveQctHgkwqDKj6\r\na=ssrc:2715962409 msid:EZVtYL50wdbfttMdmVFITVoKc4XgA0KBZXzd 63238d63-9a20-4afc-832c-48678926afce\r\na=ssrc:2715962409 mslabel:EZVtYL50wdbfttMdmVFITVoKc4XgA0KBZXzd\r\na=ssrc:2715962409 label:63238d63-9a20-4afc-832c-48678926afce\r\n'; // jscs: disable

test('parseRtpParameters', function(t) {
  var sections = SDPUtils.splitSections(videoSDP);
  var data = SDPUtils.parseRtpParameters(sections[1]);
  t.ok(data.codecs.length === 9, 'parsed 9 codecs');
  t.ok(data.fecMechanisms.length === 2, 'parsed FEC mechanisms');
  t.ok(data.fecMechanisms.indexOf('RED') !== -1, 'parsed RED as FEC mechanism');
  t.ok(data.fecMechanisms.indexOf('ULPFEC') !== -1, 'parsed ULPFEC as FEC mechanism');
  t.ok(data.headerExtensions.length === 3, 'parsed 3 header extensions');
  t.end();
});
