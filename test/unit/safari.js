/* eslint-env node */
const chai = require('chai');
const expect = chai.expect;

describe('Safari shim', () => {
  const shim = require('../../src/js/safari/safari_shim');

  beforeEach(() => {
    global.window = global;
    global.RTCPeerConnection = function() {};
  });

  describe('shimCallbacksAPI', () => {
    it('shimCallbacksAPI existence', () => {
      shim.shimCallbacksAPI();
      var prototype = window.RTCPeerConnection.prototype;
      expect(prototype.createOffer.length).to.equal(2);
      expect(prototype.createAnswer.length).to.equal(2);
      expect(prototype.setLocalDescription.length).to.equal(3);
      expect(prototype.setRemoteDescription.length).to.equal(3);
      expect(prototype.addIceCandidate.length).to.equal(3);
    });
  });

  describe('shimAddStream', () => {
    it('shimAddStream existence', () => {
      shim.shimAddStream();
      var prototype = window.RTCPeerConnection.prototype;
      expect(prototype.addStream.length).to.equal(1);
    });
  });
});
