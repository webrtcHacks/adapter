/*
 *  Copyright (c) 2018 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

describe('negotiationneeded event', () => {
  let pc;
  beforeEach(() => {
    pc = new RTCPeerConnection();
  });
  afterEach(() => {
    pc.close();
  });

  it('does not fire when adding a track after ' +
     'setRemoteDescription', (done) => {
    const sdp = 'v=0\r\n' +
        'o=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
        's=-\r\n' +
        't=0 0\r\n' +
        'a=msid-semantic:WMS *\r\n' +
        'm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n' +
        'c=IN IP4 0.0.0.0\r\n' +
        'a=rtcp:9 IN IP4 0.0.0.0\r\n' +
        'a=ice-ufrag:someufrag\r\n' +
        'a=ice-pwd:somelongpwdwithenoughrandomness\r\n' +
        'a=fingerprint:sha-256 8C:71:B3:8D:A5:38:FD:8F:A4:2E:A2:65:6C:86:52' +
        ':BC:E0:6E:94:F2:9F:7C:4D:B5:DF:AF:AA:6F:44:90:8D:F4\r\n' +
        'a=setup:actpass\r\n' +
        'a=rtcp-mux\r\n' +
        'a=mid:mid1\r\n' +
        'a=sendonly\r\n' +
        'a=rtpmap:111 opus/48000/2\r\n' +
        'a=msid:stream1 track1\r\n' +
        'a=ssrc:1001 cname:some\r\n';
    var onnfired = false;
    pc.onnegotiationneeded = () => {
      onnfired = true;
    };
    pc.setRemoteDescription({type: 'offer', sdp})
    .then(() => navigator.mediaDevices.getUserMedia({audio: true}))
    .then((stream) => pc.addTrack(stream.getTracks()[0], stream))
    .then(() => {
      setTimeout(() => {
        expect(onnfired).to.equal(false);
        done();
      }, 0);
    });
  });
});
