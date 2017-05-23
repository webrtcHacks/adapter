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
      RTCPeerConnection: function() {},
    };
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

  describe('shimAddStream', () => {
    it('shimAddStream existence', () => {
      shim.shimAddStream(window);
      const prototype = window.RTCPeerConnection.prototype;
      expect(prototype.addStream.length).to.equal(1);
    });
  });
});
