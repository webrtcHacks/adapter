/* eslint-env node */
const chai = require('chai');
const expect = chai.expect;

describe('Safari shim', () => {
  const shimFactory = require('../../src/js/safari/safari_shim');
  let utils;
  let shim;

  beforeEach(() => {
    global.window = global;
    global.RTCPeerConnection = function() {};

    utils = require('../../src/js/utils')({window});
  });

  describe('shimCallbacksAPI', () => {
    it('shimCallbacksAPI existence', () => {
      shim = shimFactory({window, utils});
      shim.shimCallbacksAPI();
      var prototype = window.RTCPeerConnection.prototype;
      expect(prototype.createOffer.length).to.equal(2);
      expect(prototype.createAnswer.length).to.equal(2);
      expect(prototype.setLocalDescription.length).to.equal(3);
      expect(prototype.setRemoteDescription.length).to.equal(3);
      expect(prototype.addIceCandidate.length).to.equal(3);
    });
  });
  describe('createAnswer/createOffer shiming', () => {
    it('createAnswer/createOffer options passing', () => {
      var createOfferOptions, createAnswerOptions;
      global.RTCPeerConnection = function() {};
      global.RTCPeerConnection.prototype = {
        createOffer: (options) => {
          createOfferOptions = options;
          return Promise.resolve();
        },
        createAnswer: (options) => {
          createAnswerOptions = options;
          return Promise.resolve();
        }
      };
      shim = shimFactory({window, utils});
      shim.shimCallbacksAPI();
      var prototype = window.RTCPeerConnection.prototype;

      prototype.createOffer();
      expect(createOfferOptions).to.equal(undefined);
      prototype.createOffer(null, null);
      expect(createOfferOptions).to.equal(undefined);
      prototype.createOffer(1);
      expect(createOfferOptions).to.equal(1);
      prototype.createOffer(null, null, 1);
      expect(createOfferOptions).to.equal(1);
      prototype.createOffer(null, null, 1, 2);
      expect(createOfferOptions).to.equal(1);

      prototype.createAnswer();
      expect(createAnswerOptions).to.equal(undefined);
      prototype.createAnswer(null, null);
      expect(createAnswerOptions).to.equal(undefined);
      prototype.createAnswer(1);
      expect(createAnswerOptions).to.equal(1);
      prototype.createAnswer(null, null, 1);
      expect(createAnswerOptions).to.equal(1);
      prototype.createAnswer(null, null, 1, 2);
      expect(createAnswerOptions).to.equal(1);
    });
  });

  describe('shimAddStream', () => {
    it('shimAddStream existence', () => {
      shim = shimFactory({window, utils});
      shim.shimAddStream();
      var prototype = window.RTCPeerConnection.prototype;
      expect(prototype.addStream.length).to.equal(1);
    });
  });
});
