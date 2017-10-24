/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

describe('track event', () => {
  let pc;
  beforeEach(() => {
    pc = new RTCPeerConnection();
  });
  afterEach(() => {
    pc.close();
  });

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

  it('RTCPeerConnection.prototype.ontrack exists', () => {
    expect('ontrack' in RTCPeerConnection.prototype).to.equal(true);
  });

  describe('is called by setRemoteDescription', () => {
    it('track event', (done) => {
      pc.addEventListener('track', () => {
        done();
      });
      pc.setRemoteDescription({type: 'offer', sdp});
    });

    it('ontrack', (done) => {
      pc.ontrack = () => {
        done();
      };
      pc.setRemoteDescription({type: 'offer', sdp});
    });
  });

  describe('the event has', () => {
    it('a track', (done) => {
      pc.ontrack = (e) => {
        expect(e).to.have.property('track');
        done();
      };
      pc.setRemoteDescription({type: 'offer', sdp});
    });

    it('a set of streams', (done) => {
      pc.ontrack = (e) => {
        expect(e).to.have.property('streams');
        expect(e.streams).to.be.an('array');
        done();
      };
      pc.setRemoteDescription({type: 'offer', sdp});
    });

    it('a receiver that is contained in the set of receivers', (done) => {
      pc.ontrack = (e) => {
        expect(e).to.have.property('receiver');
        expect(e.receiver.track).to.equal(e.track);
        expect(pc.getReceivers()).to.contain(e.receiver);
        done();
      };
      pc.setRemoteDescription({type: 'offer', sdp});
    });
    it('a transceiver that has a receiver', (done) => {
      pc.ontrack = (e) => {
        expect(e).to.have.property('transceiver');
        expect(e.transceiver).to.have.property('receiver');
        expect(e.transceiver.receiver).to.equal(e.receiver);
        done();
      };
      pc.setRemoteDescription({type: 'offer', sdp});
    });
  });

  it('is called when setRemoteDescription adds a new track to ' +
      'an existing stream', (done) => {
    const videoPart = 'm=video 9 UDP/TLS/RTP/SAVPF 100\r\n' +
      'c=IN IP4 0.0.0.0\r\n' +
      'a=rtcp:9 IN IP4 0.0.0.0\r\n' +
      'a=ice-ufrag:someufrag\r\n' +
      'a=ice-pwd:somelongpwdwithenoughrandomness\r\n' +
      'a=fingerprint:sha-256 8C:71:B3:8D:A5:38:FD:8F:A4:2E:A2:65:6C:86:52' +
      ':BC:E0:6E:94:F2:9F:7C:4D:B5:DF:AF:AA:6F:44:90:8D:F4\r\n' +
      'a=setup:actpass\r\n' +
      'a=rtcp-mux\r\n' +
      'a=mid:mid2\r\n' +
      'a=sendonly\r\n' +
      'a=rtpmap:100 vp8/90000\r\n' +
      'a=msid:stream1 track2\r\n' +
      'a=ssrc:1002 cname:some\r\n';
    pc.ontrack = (e) => {
      if (e.track.id === 'track2') {
        done();
      }
    };
    pc.setRemoteDescription({type: 'offer', sdp})
    .then(() => pc.createAnswer())
    .then((answer) => pc.setLocalDescription(answer))
    .then(() => {
      return pc.setRemoteDescription({type: 'offer', sdp: sdp + videoPart});
    })
    .catch(e => console.error(e.toString()));
  });
});
