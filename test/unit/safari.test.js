/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
describe('Safari shim', () => {
  const shim = require('../../dist/safari/safari_shim');
  let window;

  beforeEach(() => {
    window = {
      RTCPeerConnection: jest.fn()
    };
  });

  describe('shimStreamsAPI', () => {
    beforeEach(() => {
      window.RTCPeerConnection.prototype.addTrack = jest.fn();
      shim.shimLocalStreamsAPI(window);
      shim.shimRemoteStreamsAPI(window);
    });

    it('shimStreamsAPI existence', () => {
      const prototype = window.RTCPeerConnection.prototype;
      expect(prototype.addTrack.length).toBe(1);
      expect(prototype.addStream.length).toBe(1);
      expect(prototype.removeStream.length).toBe(1);
      expect(prototype.getLocalStreams.length).toBe(0);
      expect(prototype.getRemoteStreams.length).toBe(0);
    });
    it('local streams API', () => {
      const pc = new window.RTCPeerConnection();
      pc.getSenders = () => [];
      const stream = {
        id: 'id1',
        getTracks: () => [],
        getAudioTracks: () => [],
        getVideoTracks: () => [],
      };
      expect(pc.getLocalStreams().length).toBe(0);
      expect(pc.getRemoteStreams().length).toBe(0);

      pc.addStream(stream);
      expect(pc.getLocalStreams()[0]).toBe(stream);
      expect(pc.getRemoteStreams().length).toBe(0);

      const stream2 = {
        id: 'id2',
        getTracks: () => [],
        getAudioTracks: () => [],
        getVideoTracks: () => [],
      };
      pc.removeStream(stream2);
      expect(pc.getLocalStreams()[0]).toBe(stream);

      pc.addTrack({}, stream2);
      expect(pc.getLocalStreams().length).toBe(2);
      expect(pc.getLocalStreams()[0]).toBe(stream);
      expect(pc.getLocalStreams()[1]).toBe(stream2);

      pc.removeStream(stream2);
      expect(pc.getLocalStreams().length).toBe(1);
      expect(pc.getLocalStreams()[0]).toBe(stream);

      pc.removeStream(stream);
      expect(pc.getLocalStreams().length).toBe(0);
    });
  });

  describe('shimCallbacksAPI', () => {
    it('shimCallbacksAPI existence', () => {
      shim.shimCallbacksAPI(window);
      const prototype = window.RTCPeerConnection.prototype;
      expect(prototype.createOffer.length).toBe(2);
      expect(prototype.createAnswer.length).toBe(2);
      expect(prototype.setLocalDescription.length).toBe(3);
      expect(prototype.setRemoteDescription.length).toBe(3);
      expect(prototype.addIceCandidate.length).toBe(3);
    });
  });

  ['createOffer', 'createAnswer'].forEach((method) => {
    describe('legacy ' + method + ' shim', () => {
      describe('options passing with', () => {
        let stub;
        beforeEach(() => {
          stub = jest.fn();
          window.RTCPeerConnection.prototype[method] = stub;
          shim.shimCallbacksAPI(window);
        });

        it('no arguments', () => {
          const pc = new window.RTCPeerConnection();
          pc[method]();
          expect(stub.mock.calls.length).toBe(1);
          expect(stub.mock.calls[0]).toEqual([undefined]);
        });

        it('two callbacks', () => {
          const pc = new window.RTCPeerConnection();
          pc[method](null, null);
          expect(stub.mock.calls.length).toBe(1);
          expect(stub.mock.calls[0]).toEqual([undefined]);
        });

        it('a non-function first argument', () => {
          const pc = new window.RTCPeerConnection();
          pc[method](1);
          expect(stub.mock.calls.length).toBe(1);
          expect(stub.mock.calls[0]).toEqual([1]);
        });

        it('two callbacks and options', () => {
          const pc = new window.RTCPeerConnection();
          pc[method](null, null, 1);
          expect(stub.mock.calls.length).toBe(1);
          expect(stub.mock.calls[0]).toEqual([1]);
        });

        it('two callbacks and two additional arguments', () => {
          const pc = new window.RTCPeerConnection();
          pc[method](null, null, 1, 2);
          expect(stub.mock.calls.length).toBe(1);
          expect(stub.mock.calls[0]).toEqual([1]);
        });
      });
    });
  });

  describe('legacy createOffer shim converts offer into transceivers', () => {
    let pc, stub, options;
    beforeEach(() => {
      stub = jest.fn();
      window.RTCPeerConnection.prototype.createOffer = function() {};
      shim.shimCreateOfferLegacy(window);

      pc = new window.RTCPeerConnection();
      pc.getTransceivers = function() {
        return [];
      };
      pc.addTransceiver = stub;

      options = {
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      };
    });

    it('when offerToReceive Audio is true', () => {
      options.offerToReceiveAudio = true;
      pc.createOffer(options);
      expect(stub.mock.calls.length).toBe(1);
      expect(stub.mock.calls[0]).toEqual(['audio', {direction: 'recvonly'}]);
    });

    it('when offerToReceive Video is true', () => {
      options.offerToReceiveVideo = true;
      pc.createOffer(options);
      expect(stub.mock.calls.length).toBe(1);
      expect(stub.mock.calls[0]).toEqual(['video', {direction: 'recvonly'}]);
    });

    it('when both offers are false', () => {
      pc.createOffer(options);
      expect(stub.mock.calls.length).toBe(0);
    });

    it('when both offers are true', () => {
      options.offerToReceiveAudio = true;
      options.offerToReceiveVideo = true;
      pc.createOffer(options);
      expect(stub.mock.calls.length).toBe(2);
      expect(stub.mock.calls[0]).toEqual(['audio', {direction: 'recvonly'}]);
      expect(stub.mock.calls[1]).toEqual(['video', {direction: 'recvonly'}]);
    });

    it('when offerToReceive has bit values', () => {
      options.offerToReceiveAudio = 0;
      options.offerToReceiveVideo = 1;
      pc.createOffer(options);
      expect(stub.mock.calls.length).toBe(1);
      expect(stub.mock.calls[0]).toEqual(['video', {direction: 'recvonly'}]);
    });
  });

  describe('conversion of RTCIceServer.url', () => {
    let nativeStub;
    beforeEach(() => {
      nativeStub = jest.spyOn(window, 'RTCPeerConnection');
      shim.shimRTCIceServerUrls(window);
    });

    const stunURL = 'stun:stun.l.google.com:19302';
    const url = {url: stunURL};
    const urlArray = {url: [stunURL]};
    const urls = {urls: stunURL};
    const urlsArray = {urls: [stunURL]};

    describe('does not modify RTCIceServer.urls', () => {
      it('for strings', () => {
        new window.RTCPeerConnection({iceServers: [urls]});
        expect(nativeStub.mock.calls.length).toBe(1);
        expect(nativeStub.mock.calls[0][0]).toEqual({
          iceServers: [urls],
        });
      });

      it('for arrays', () => {
        new window.RTCPeerConnection({iceServers: [urlsArray]});
        expect(nativeStub.mock.calls.length).toBe(1);
        expect(nativeStub.mock.calls[0][0]).toEqual({
          iceServers: [urlsArray],
        });
      });
    });

    describe('transforms RTCIceServer.url to RTCIceServer.urls', () => {
      it('for strings', () => {
        new window.RTCPeerConnection({iceServers: [url]});
        expect(nativeStub.mock.calls.length).toBe(1);
        expect(nativeStub.mock.calls[0][0]).toEqual({
          iceServers: [urls],
        });
      });

      it('for arrays', () => {
        new window.RTCPeerConnection({iceServers: [urlArray]});
        expect(nativeStub.mock.calls.length).toBe(1);
        expect(nativeStub.mock.calls[0][0]).toEqual({
          iceServers: [urlsArray],
        });
      });
    });
  });
});
