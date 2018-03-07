/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

describe('Safari shim', () => {
  const shim = require('../../src/js/safari/safari_shim');
  let window;

  beforeEach(() => {
    window = {
      RTCPeerConnection: sinon.stub()
    };
  });

  describe('shimStreamsAPI', () => {
    beforeEach(() => {
      window.RTCPeerConnection.prototype.addTrack = sinon.stub();
      shim.shimLocalStreamsAPI(window);
      shim.shimRemoteStreamsAPI(window);
    });

    it('shimStreamsAPI existence', () => {
      const prototype = window.RTCPeerConnection.prototype;
      expect(prototype.addTrack.length).to.equal(2);
      expect(prototype.addStream.length).to.equal(1);
      expect(prototype.removeStream.length).to.equal(1);
      expect(prototype.getLocalStreams.length).to.equal(0);
      expect(prototype.getStreamById.length).to.equal(1);
      expect(prototype.getRemoteStreams.length).to.equal(0);
    });
    it('local streams API', () => {
      const pc = new window.RTCPeerConnection();
      pc.getSenders = () => {
        return [];
      };
      var stream = {id: 'id1', getTracks: () => {
        return [];
      }};
      expect(pc.getStreamById(stream.id)).to.equal(null);
      expect(pc.getLocalStreams().length).to.equal(0);
      expect(pc.getRemoteStreams().length).to.equal(0);

      pc.addStream(stream);
      expect(pc.getStreamById(stream.id)).to.equal(stream);
      expect(pc.getLocalStreams()[0]).to.equal(stream);
      expect(pc.getRemoteStreams().length).to.equal(0);

      var stream2 = {id: 'id2', getTracks: stream.getTracks};
      pc.removeStream(stream2);
      expect(pc.getStreamById(stream.id)).to.equal(stream);
      expect(pc.getLocalStreams()[0]).to.equal(stream);

      pc.addTrack({}, stream2);
      expect(pc.getStreamById(stream.id)).to.equal(stream);
      expect(pc.getStreamById(stream2.id)).to.equal(stream2);
      expect(pc.getLocalStreams().length).to.equal(2);
      expect(pc.getLocalStreams()[0]).to.equal(stream);
      expect(pc.getLocalStreams()[1]).to.equal(stream2);

      pc.removeStream(stream2);
      expect(pc.getStreamById(stream.id)).to.equal(stream);
      expect(pc.getLocalStreams().length).to.equal(1);
      expect(pc.getLocalStreams()[0]).to.equal(stream);

      pc.removeStream(stream);
      expect(pc.getStreamById(stream.id)).to.equal(null);
      expect(pc.getLocalStreams().length).to.equal(0);
    });
  });

  describe('shimCallbacksAPI', () => {
    it('shimCallbacksAPI existence', () => {
      shim.shimCallbacksAPI(window);
      const prototype = window.RTCPeerConnection.prototype;
      expect(prototype.createOffer.length).to.equal(2);
      expect(prototype.createAnswer.length).to.equal(2);
      expect(prototype.setLocalDescription.length).to.equal(3);
      expect(prototype.setRemoteDescription.length).to.equal(3);
      expect(prototype.addIceCandidate.length).to.equal(3);
    });
  });

  ['createOffer', 'createAnswer'].forEach((method) => {
    describe('legacy ' + method + ' shim', () => {
      describe('options passing with', () => {
        let stub;
        beforeEach(() => {
          stub = sinon.stub();
          window.RTCPeerConnection.prototype[method] = stub;
          shim.shimCallbacksAPI(window);
        });

        it('no arguments', () => {
          const pc = new window.RTCPeerConnection();
          pc[method]();
          expect(stub).to.have.been.calledWith(undefined);
        });

        it('two callbacks', () => {
          const pc = new window.RTCPeerConnection();
          pc[method](null, null);
          expect(stub).to.have.been.calledWith(undefined);
        });

        it('a non-function first argument', () => {
          const pc = new window.RTCPeerConnection();
          pc[method](1);
          expect(stub).to.have.been.calledWith(1);
        });

        it('two callbacks and options', () => {
          const pc = new window.RTCPeerConnection();
          pc[method](null, null, 1);
          expect(stub).to.have.been.calledWith(1);
        });

        it('two callbacks and two additional arguments', () => {
          const pc = new window.RTCPeerConnection();
          pc[method](null, null, 1, 2);
          expect(stub).to.have.been.calledWith(1);
        });
      });
    });
  });

  describe('legacy createOffer shim converts offer into transceivers', () => {
    let pc, stub, options;
    beforeEach(() => {
      stub = sinon.stub();
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
      expect(stub).to.have.been.calledWith('audio');
    });

    it('when offerToReceive Video is true', () => {
      options.offerToReceiveVideo = true;
      pc.createOffer(options);
      expect(stub).to.have.been.calledWith('video');
    });

    it('when both offers are false', () => {
      pc.createOffer(options);
      expect(stub).to.not.have.been.calledWith('audio');
      expect(stub).to.not.have.been.calledWith('video');
    });

    it('when both offers are true', () => {
      options.offerToReceiveAudio = true;
      options.offerToReceiveVideo = true;
      pc.createOffer(options);
      expect(stub).to.have.been.calledWith('audio');
      expect(stub).to.have.been.calledWith('video');
    });

    it('when offerToReceive has bit values', () => {
      options.offerToReceiveAudio = 0;
      options.offerToReceiveVideo = 1;
      pc.createOffer(options);
      expect(stub).to.not.have.been.calledWith('audio');
      expect(stub).to.have.been.calledWith('video');
    });
  });

  describe('conversion of RTCIceServer.url', () => {
    let nativeStub;
    beforeEach(() => {
      nativeStub = window.RTCPeerConnection;
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
        expect(nativeStub).to.have.been.calledWith(sinon.match({
          iceServers: sinon.match([
            sinon.match(urls)
          ])
        }));
      });

      it('for arrays', () => {
        new window.RTCPeerConnection({iceServers: [urlsArray]});
        expect(nativeStub).to.have.been.calledWith(sinon.match({
          iceServers: sinon.match([
            sinon.match(urlsArray)
          ])
        }));
      });
    });

    describe('transforms RTCIceServer.url to RTCIceServer.urls', () => {
      it('for strings', () => {
        new window.RTCPeerConnection({iceServers: [url]});
        expect(nativeStub).to.have.been.calledWith(sinon.match({
          iceServers: sinon.match([
            sinon.match(urls)
          ])
        }));
      });

      it('for arrays', () => {
        new window.RTCPeerConnection({iceServers: [urlArray]});
        expect(nativeStub).to.have.been.calledWith(sinon.match({
          iceServers: sinon.match([
            sinon.match(urlsArray)
          ])
        }));
      });
    });
  });
});
