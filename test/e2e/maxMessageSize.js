/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

describe('maxMessageSize', () => {
  let pc1;
  let pc2;
  const browserDetails = window.adapter.browserDetails;
  let defaultRemoteMMS = 65536;
  if (browserDetails.browser === 'firefox' && browserDetails.version === 57) {
    defaultRemoteMMS = 65535;
  }

  function negotiate(pc, otherPc, mapRemoteDescriptionCallback) {
    return pc.createOffer()
    .then((offer) => {
      return pc.setLocalDescription(offer);
    }).then(() => {
      let description = pc.localDescription;
      if (mapRemoteDescriptionCallback) {
        description = mapRemoteDescriptionCallback(description);
      }
      return otherPc.setRemoteDescription(description);
    }).then(() => {
      return otherPc.createAnswer();
    }).then((answer) => {
      return otherPc.setLocalDescription(answer);
    }).then(() => {
      let description = otherPc.localDescription;
      if (mapRemoteDescriptionCallback) {
        description = mapRemoteDescriptionCallback(description);
      }
      return pc.setRemoteDescription(description);
    });
  }

  function patchMaxMessageSizeFactory(maxMessageSize) {
    return ((description) => {
      description.sdp = description.sdp.replace(
        /^a=max-message-size:\s*(\d+)\s*$/gm, '');
      description.sdp = description.sdp.replace(
        /(^m=application\s+\d+\s+[\w\/]*SCTP.*$)/m,
        '$1\r\na=max-message-size:' + maxMessageSize);
      return description;
    });
  }

  beforeEach(() => {
    pc1 = new RTCPeerConnection(null);
    pc2 = new RTCPeerConnection(null);

    pc1.onicecandidate = event => pc2.addIceCandidate(event.candidate);
    pc2.onicecandidate = event => pc1.addIceCandidate(event.candidate);
  });
  afterEach(() => {
    pc1.close();
    pc2.close();
  });

  it('sctp attribute exists', () => {
    expect(pc1).to.have.property('sctp');
  });

  it('sctp attribute is null before offer/answer', () => {
    expect(pc1.sctp).to.equal(null);
  });

  it('sctp attribute is null if SCTP not negotiated', () => {
    return navigator.mediaDevices.getUserMedia({audio: true})
    .then((stream) => {
      pc1.addTrack(stream.getTracks()[0], stream);
      return negotiate(pc1, pc2);
    })
    .then(() => {
      expect(pc1.sctp).to.equal(null);
      expect(pc2.sctp).to.equal(null);
    });
  });

  it('sctp and maxMessageSize set if SCTP negotiated', () => {
    pc1.createDataChannel('test');
    return negotiate(pc1, pc2)
    .then(() => {
      expect(pc1.sctp).to.have.property('maxMessageSize');
      expect(pc2.sctp).to.have.property('maxMessageSize');
      expect(pc1.sctp.maxMessageSize).to.be.at.least(defaultRemoteMMS);
      expect(pc2.sctp.maxMessageSize).to.be.at.least(defaultRemoteMMS);
    });
  });

  it('send largest possible single message', () => {
    // Note: Patching MMS here to prevent creation of large arrays.
    const maxMessageSize = defaultRemoteMMS;
    const patchMaxMessageSize = patchMaxMessageSizeFactory(maxMessageSize);

    pc1.createDataChannel('test');
    return negotiate(pc1, pc2, patchMaxMessageSize)
    .then(() => {
      expect(pc1.sctp.maxMessageSize).to.equal(maxMessageSize);
      expect(pc2.sctp.maxMessageSize).to.equal(maxMessageSize);

      // Ensure TypeError is thrown when sending a message that's too large
      return new Promise((resolve, reject) => {
        const dc = pc1.createDataChannel('test2');
        const send = () => {
          dc.send(new Uint8Array(maxMessageSize));
        };
        dc.onopen = () => {
          expect(send).not.to.throw();
          resolve();
        };
      });
    });
  });

  describe('throws an exception', () => {
    it('if the message is too large', () => {
      // Note: Patching MMS here to prevent creation of large arrays.
      const maxMessageSize = defaultRemoteMMS;
      const patchMaxMessageSize = patchMaxMessageSizeFactory(maxMessageSize);

      const dc = pc1.createDataChannel('test');
      return negotiate(pc1, pc2, patchMaxMessageSize)
      .then(() => {
        expect(pc1.sctp.maxMessageSize).to.equal(maxMessageSize);
        expect(pc2.sctp.maxMessageSize).to.equal(maxMessageSize);

        // Ensure TypeError is thrown when sending a message that's too large
        return new Promise((resolve, reject) => {
          const send = () => {
            dc.send(new Uint8Array(maxMessageSize + 1));
          };
          dc.onopen = () => {
            expect(send).to.throw().with.property('name', 'TypeError');
            resolve();
          };
        });
      });
    });

    it('if the message is too large (using a secondary data channel)', () => {
      // Background of this test:
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1426831

      // Note: Patching MMS here to prevent creation of large arrays.
      const maxMessageSize = defaultRemoteMMS;
      const patchMaxMessageSize = patchMaxMessageSizeFactory(maxMessageSize);

      pc1.createDataChannel('test');
      return negotiate(pc1, pc2, patchMaxMessageSize)
      .then(() => {
        expect(pc1.sctp.maxMessageSize).to.equal(maxMessageSize);
        expect(pc2.sctp.maxMessageSize).to.equal(maxMessageSize);

        // Ensure TypeError is thrown when sending a message that's too large
        return new Promise((resolve, reject) => {
          const dc = pc1.createDataChannel('test2');
          const send = () => {
            dc.send(new Uint8Array(maxMessageSize + 1));
          };
          dc.onopen = () => {
            expect(send).to.throw().with.property('name', 'TypeError');
            resolve();
          };
        });
      });
    });
  });

  // Note: These run in e2e as a browser is needed for them to run
  describe('is as expected for', () => {
    const fakeWindow = Object.assign({}, window);
    fakeWindow.RTCPeerConnection = function() {};
    fakeWindow.RTCPeerConnection.prototype.setRemoteDescription = () => {};
    window.adapter.commonShim.shimMaxMessageSize(fakeWindow);

    // Map specific browser versions to a test case.
    // You can use the following version comparators: '<=', '>=' and '=='.
    // Multiple comparators can be chained with ',' which is equivalent to the
    // logical AND.
    //
    // The innermost array contains the other browser's version, the expected
    // maximum message size and the offer SDP.
    //
    // Note: Be aware that you MUST store expected results for both browsers
    //       where the object's key resembles the sending peer.
    /* eslint-disable max-len */
    const testCases = {
      'firefox<=56': [
        ['chrome>=0', 16384, 'v=0\r\no=- 6575128786484314789 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE data\r\na=msid-semantic: WMS\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:oZF1\r\na=ice-pwd:8+qEgoDOiFd49nDG9oNSYYaz\r\na=ice-options:trickle\r\na=fingerprint:sha-256 F2:01:D6:88:9E:0C:F1:CE:EE:85:9C:B4:A5:B7:36:D4:CB:29:F2:4F:E0:97:81:25:34:00:71:65:2B:39:C1:C1\r\na=setup:actpass\r\na=mid:data\r\na=sctpmap:5000 webrtc-datachannel 1024\r\n'],
        ['firefox<=56', 2147483637, 'v=0\r\no=mozilla...THIS_IS_SDPARTA-56.0.2 3250009914871290350 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 C8:36:D3:FD:E6:9A:B8:4E:7C:FB:61:03:22:E5:8E:E1:7D:17:AF:D2:EB:0F:87:BA:28:6C:9A:2E:76:D9:B3:0C\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:bb3ee909b8452eb93722d223b26d6193\r\na=ice-ufrag:1c03e3ae\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\n'],
        ['firefox>=57', 1073741823, 'v=0\r\no=mozilla...THIS_IS_SDPARTA-57.0 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:1073741823\r\n'],
        ['64 KiB', 16384, 'v=0\r\no=- 6575128786484314789 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE data\r\na=msid-semantic: WMS\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:oZF1\r\na=ice-pwd:8+qEgoDOiFd49nDG9oNSYYaz\r\na=ice-options:trickle\r\na=fingerprint:sha-256 F2:01:D6:88:9E:0C:F1:CE:EE:85:9C:B4:A5:B7:36:D4:CB:29:F2:4F:E0:97:81:25:34:00:71:65:2B:39:C1:C1\r\na=setup:actpass\r\na=mid:data\r\na=sctpmap:5000 webrtc-datachannel 1024\r\na=max-message-size:65536\r\n'],
        ['1.5 GiB', 16384, 'v=0\r\no=1.5 GiB 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:1610612736\r\n'],
        ['2 GiB', 16384, 'v=0\r\no=2 GiB 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:2147483648\r\n'],
        ['Unlimited', 16384, 'v=0\r\no=Unlimited 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:0\r\n'],
      ],
      'firefox==57': [
        ['chrome>=0', 65535, 'v=0\r\no=- 6575128786484314789 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE data\r\na=msid-semantic: WMS\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:oZF1\r\na=ice-pwd:8+qEgoDOiFd49nDG9oNSYYaz\r\na=ice-options:trickle\r\na=fingerprint:sha-256 F2:01:D6:88:9E:0C:F1:CE:EE:85:9C:B4:A5:B7:36:D4:CB:29:F2:4F:E0:97:81:25:34:00:71:65:2B:39:C1:C1\r\na=setup:actpass\r\na=mid:data\r\na=sctpmap:5000 webrtc-datachannel 1024\r\n'],
        ['firefox<=56', 65535, 'v=0\r\no=mozilla...THIS_IS_SDPARTA-56.0.2 3250009914871290350 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 C8:36:D3:FD:E6:9A:B8:4E:7C:FB:61:03:22:E5:8E:E1:7D:17:AF:D2:EB:0F:87:BA:28:6C:9A:2E:76:D9:B3:0C\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:bb3ee909b8452eb93722d223b26d6193\r\na=ice-ufrag:1c03e3ae\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\n'],
        ['firefox>=57', 65535, 'v=0\r\no=mozilla...THIS_IS_SDPARTA-57.0 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:1073741823\r\n'],
        ['64 KiB', 65535, 'v=0\r\no=- 6575128786484314789 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE data\r\na=msid-semantic: WMS\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:oZF1\r\na=ice-pwd:8+qEgoDOiFd49nDG9oNSYYaz\r\na=ice-options:trickle\r\na=fingerprint:sha-256 F2:01:D6:88:9E:0C:F1:CE:EE:85:9C:B4:A5:B7:36:D4:CB:29:F2:4F:E0:97:81:25:34:00:71:65:2B:39:C1:C1\r\na=setup:actpass\r\na=mid:data\r\na=sctpmap:5000 webrtc-datachannel 1024\r\na=max-message-size:65536\r\n'],
        ['1.5 GiB', 65535, 'v=0\r\no=1.5 GiB 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:1610612736\r\n'],
        ['2 GiB', 65535, 'v=0\r\no=2 GiB 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:2147483648\r\n'],
        ['Unlimited', 65535, 'v=0\r\no=Unlimited 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:0\r\n'],
      ],
      'firefox>=58,firefox<=59': [
        ['chrome>=0', 65536, 'v=0\r\no=- 6575128786484314789 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE data\r\na=msid-semantic: WMS\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:oZF1\r\na=ice-pwd:8+qEgoDOiFd49nDG9oNSYYaz\r\na=ice-options:trickle\r\na=fingerprint:sha-256 F2:01:D6:88:9E:0C:F1:CE:EE:85:9C:B4:A5:B7:36:D4:CB:29:F2:4F:E0:97:81:25:34:00:71:65:2B:39:C1:C1\r\na=setup:actpass\r\na=mid:data\r\na=sctpmap:5000 webrtc-datachannel 1024\r\n'],
        ['firefox<=56', 65536, 'v=0\r\no=mozilla...THIS_IS_SDPARTA-56.0.2 3250009914871290350 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 C8:36:D3:FD:E6:9A:B8:4E:7C:FB:61:03:22:E5:8E:E1:7D:17:AF:D2:EB:0F:87:BA:28:6C:9A:2E:76:D9:B3:0C\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:bb3ee909b8452eb93722d223b26d6193\r\na=ice-ufrag:1c03e3ae\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\n'],
        ['firefox>=57', 65536, 'v=0\r\no=mozilla...THIS_IS_SDPARTA-57.0 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:1073741823\r\n'],
        ['64 KiB', 65536, 'v=0\r\no=- 6575128786484314789 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE data\r\na=msid-semantic: WMS\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:oZF1\r\na=ice-pwd:8+qEgoDOiFd49nDG9oNSYYaz\r\na=ice-options:trickle\r\na=fingerprint:sha-256 F2:01:D6:88:9E:0C:F1:CE:EE:85:9C:B4:A5:B7:36:D4:CB:29:F2:4F:E0:97:81:25:34:00:71:65:2B:39:C1:C1\r\na=setup:actpass\r\na=mid:data\r\na=sctpmap:5000 webrtc-datachannel 1024\r\na=max-message-size:65536\r\n'],
        ['1.5 GiB', 65536, 'v=0\r\no=1.5 GiB 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:1610612736\r\n'],
        ['2 GiB', 65536, 'v=0\r\no=2 GiB 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:2147483648\r\n'],
        ['Unlimited', 65536, 'v=0\r\no=Unlimited 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:0\r\n'],
      ],
      'firefox>=60': [
        ['chrome>=0', 65536, 'v=0\r\no=- 6575128786484314789 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE data\r\na=msid-semantic: WMS\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:oZF1\r\na=ice-pwd:8+qEgoDOiFd49nDG9oNSYYaz\r\na=ice-options:trickle\r\na=fingerprint:sha-256 F2:01:D6:88:9E:0C:F1:CE:EE:85:9C:B4:A5:B7:36:D4:CB:29:F2:4F:E0:97:81:25:34:00:71:65:2B:39:C1:C1\r\na=setup:actpass\r\na=mid:data\r\na=sctpmap:5000 webrtc-datachannel 1024\r\n'],
        ['firefox<=56', 2147483637, 'v=0\r\no=mozilla...THIS_IS_SDPARTA-56.0.2 3250009914871290350 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 C8:36:D3:FD:E6:9A:B8:4E:7C:FB:61:03:22:E5:8E:E1:7D:17:AF:D2:EB:0F:87:BA:28:6C:9A:2E:76:D9:B3:0C\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:bb3ee909b8452eb93722d223b26d6193\r\na=ice-ufrag:1c03e3ae\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\n'],
        ['firefox>=57', 1073741823, 'v=0\r\no=mozilla...THIS_IS_SDPARTA-57.0 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:1073741823\r\n'],
        ['64 KiB', 65536, 'v=0\r\no=- 6575128786484314789 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE data\r\na=msid-semantic: WMS\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:oZF1\r\na=ice-pwd:8+qEgoDOiFd49nDG9oNSYYaz\r\na=ice-options:trickle\r\na=fingerprint:sha-256 F2:01:D6:88:9E:0C:F1:CE:EE:85:9C:B4:A5:B7:36:D4:CB:29:F2:4F:E0:97:81:25:34:00:71:65:2B:39:C1:C1\r\na=setup:actpass\r\na=mid:data\r\na=sctpmap:5000 webrtc-datachannel 1024\r\na=max-message-size:65536\r\n'],
        ['1.5 GiB', 1610612736, 'v=0\r\no=1.5 GiB 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:1610612736\r\n'],
        ['2 GiB', 2147483637, 'v=0\r\no=2 GiB 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:2147483648\r\n'],
        ['Unlimited', 2147483637, 'v=0\r\no=Unlimited 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:0\r\n'],
      ],
      'chrome>=0': [
        ['chrome>=0', 65536, 'v=0\r\no=- 6575128786484314789 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE data\r\na=msid-semantic: WMS\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:oZF1\r\na=ice-pwd:8+qEgoDOiFd49nDG9oNSYYaz\r\na=ice-options:trickle\r\na=fingerprint:sha-256 F2:01:D6:88:9E:0C:F1:CE:EE:85:9C:B4:A5:B7:36:D4:CB:29:F2:4F:E0:97:81:25:34:00:71:65:2B:39:C1:C1\r\na=setup:actpass\r\na=mid:data\r\na=sctpmap:5000 webrtc-datachannel 1024\r\n'],
        ['firefox<=56', 65536, 'v=0\r\no=mozilla...THIS_IS_SDPARTA-56.0.2 3250009914871290350 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 C8:36:D3:FD:E6:9A:B8:4E:7C:FB:61:03:22:E5:8E:E1:7D:17:AF:D2:EB:0F:87:BA:28:6C:9A:2E:76:D9:B3:0C\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:bb3ee909b8452eb93722d223b26d6193\r\na=ice-ufrag:1c03e3ae\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\n'],
        ['firefox>=57', 65536, 'v=0\r\no=mozilla...THIS_IS_SDPARTA-57.0 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:1073741823\r\n'],
        ['64 KiB', 65536, 'v=0\r\no=- 6575128786484314789 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE data\r\na=msid-semantic: WMS\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:oZF1\r\na=ice-pwd:8+qEgoDOiFd49nDG9oNSYYaz\r\na=ice-options:trickle\r\na=fingerprint:sha-256 F2:01:D6:88:9E:0C:F1:CE:EE:85:9C:B4:A5:B7:36:D4:CB:29:F2:4F:E0:97:81:25:34:00:71:65:2B:39:C1:C1\r\na=setup:actpass\r\na=mid:data\r\na=sctpmap:5000 webrtc-datachannel 1024\r\na=max-message-size:65536\r\n'],
        ['1.5 GiB', 65536, 'v=0\r\no=1.5 GiB 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:1610612736\r\n'],
        ['2 GiB', 65536, 'v=0\r\no=2 GiB 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:2147483648\r\n'],
        ['Unlimited', 65536, 'v=0\r\no=Unlimited 169150732617742973 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8C:EB:14:5C:60:1E:E8:1E:FA:C7:D8:90:38:E9:EB:05:A8:2B:32:9F:FE:2B:D9:1C:85:3D:59:70:A9:6D:3A:17\r\na=group:BUNDLE sdparta_0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=ice-pwd:c224ece79b15dcb92de87e2b67e62d7a\r\na=ice-ufrag:96c030e8\r\na=mid:sdparta_0\r\na=sctpmap:5000 webrtc-datachannel 256\r\na=setup:actpass\r\na=max-message-size:0\r\n'],
      ],
      // TODO: Safari test cases!
    };
    /* eslint-enable max-len */

    const matchesVersion = ((comparator, left, right) => {
      switch (comparator) {
        case '==': return left === right;
        case '<=': return left <= right;
        case '>=': return left >= right;
        default: throw 'Invalid comparator: ' + comparator;
      }
    });

    const matchesBrowser = (browserVersions, browserDetails_) => {
      return browserVersions.split(',').every((browserVersion) => {
        return ['==', '<=', '>='].some((comparator) => {
          if (!browserVersion.includes(comparator)) {
            return false;
          }
          let [browser, version] = browserVersion.split(comparator);
          version = parseInt(version, 10);
          return browser === browserDetails_.browser
            && matchesVersion(comparator, browserDetails_.version, version);
        });
      });
    };

    Object.keys(testCases)
      .filter((browserVersion) => {
        return matchesBrowser(browserVersion, browserDetails);
      })
      .forEach((browserVersion) => {
        testCases[browserVersion].forEach((testCase) => {
          const [otherVersion, expectedMMS, sdp] = testCase;
          const description = browserVersion + ' and ' + otherVersion +
            ' -> ' + expectedMMS;
          it(description, () => {
            // Check if adapter determines the expected maximum message size
            const pc = new fakeWindow.RTCPeerConnection();
            pc.setRemoteDescription({
              type: 'offer',
              sdp: sdp
            });
            expect(pc.sctp.maxMessageSize).to.equal(expectedMMS);
          });
        });
      });
  });
});
