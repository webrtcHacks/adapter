/* eslint-env node */
const chai = require('chai');
const expect = chai.expect;

describe('Safari shim', () => {
  const shim = require('../../src/js/safari/safari_shim');

  beforeEach(() => {
    global.window = global;
    delete global.RTCPeerConnection;
  });

  describe('shimCallbacksAPI', () => {
    it('shimCallbacksAPI existence', () => {
      shim.shimCallbacksAPI();
      //expect(window.RTCPeerConnection).not.to.equal(undefined);
      expect(window.RTCPeerConnection.prototype.createOffer.length).to.equal(2);
      expect(window.RTCPeerConnection.prototype.createAnswer.length).to.equal(2);
      expect(window.RTCPeerConnection.prototype.setLocalDescription.length).to.equal(3);
      expect(window.RTCPeerConnection.prototype.setRemoteDescription.length).to.equal(3);
      expect(window.RTCPeerConnection.prototype.addIceCandidate.length).to.equal(3);
    });
  });

  describe('shimAddStream', () => {
    it('shimAddStream existence', () => {
      shim.shimAddStream();
      expect(RTCPeerConnection).not.to.equal(undefined);
      expect(RTCPeerConnection.prototype.addStream.length).to.equal(1);
    });
  });
});
