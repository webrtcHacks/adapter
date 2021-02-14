/*
 *  Copyright (c) 2021 The adapter.js project authors. All Rights Reserved.
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

describe('removal of extmap-allow-mixed', () => {
  const shim = require('../../dist/common_shim');
  let window;
  let origSetRemoteDescription;
  beforeEach(() => {
    window = {
      RTCPeerConnection: sinon.stub(),
    };
    origSetRemoteDescription = sinon.stub();
    window.RTCPeerConnection.prototype.setRemoteDescription =
      origSetRemoteDescription;
  });

  const sdp = 'a=extmap-allow-mixed\r\n';

  describe('does nothing if', () => {
    it('RTCPeerConnection is not defined', () => {
      expect(() => shim.removeExtmapAllowMixed({}, {})).not.to.throw();
    });
  });

  describe('Chrome behaviour', () => {
    let browserDetails;
    // Override addIceCandidate to simulate legacy behaviour.
    beforeEach(() => {
      window.RTCPeerConnection.prototype.setRemoteDescription = function() {
        return origSetRemoteDescription.apply(this, arguments);
      };
      browserDetails = {browser: 'chrome', version: '88'};
    });

    it('does not remove the extmap-allow-mixed line after Chrome 71', () => {
      browserDetails.version = 71;
      shim.removeExtmapAllowMixed(window, browserDetails);

      const pc = new window.RTCPeerConnection();
      pc.setRemoteDescription({sdp: '\n' + sdp});
      expect(origSetRemoteDescription.firstCall.args[0].sdp)
        .to.equal('\n' + sdp);
    });

    it('does remove the extmap-allow-mixed line before Chrome 71', () => {
      browserDetails.version = 70;
      shim.removeExtmapAllowMixed(window, browserDetails);

      const pc = new window.RTCPeerConnection();
      pc.setRemoteDescription({sdp: '\n' + sdp});
      console.log(origSetRemoteDescription.firstCall.args);
      expect(origSetRemoteDescription.firstCall.args[0].sdp).to.equal('\n');
    });
  });

  describe('Safari behaviour', () => {
    let browserDetails;
    // Override addIceCandidate to simulate legacy behaviour.
    beforeEach(() => {
      window.RTCPeerConnection.prototype.setRemoteDescription = function() {
        return origSetRemoteDescription.apply(this, arguments);
      };
      browserDetails = {browser: 'safari', version: '605'};
    });

    it('does not remove the extmap-allow-mixed line after 605', () => {
      browserDetails.version = 605;
      shim.removeExtmapAllowMixed(window, browserDetails);

      const pc = new window.RTCPeerConnection();
      pc.setRemoteDescription({sdp: '\n' + sdp});
      expect(origSetRemoteDescription.firstCall.args[0].sdp)
        .to.equal('\n' + sdp);
    });

    it('does remove the extmap-allow-mixed line before 605', () => {
      browserDetails.version = 604;
      shim.removeExtmapAllowMixed(window, browserDetails);

      const pc = new window.RTCPeerConnection();
      pc.setRemoteDescription({sdp: '\n' + sdp});
      console.log(origSetRemoteDescription.firstCall.args);
      expect(origSetRemoteDescription.firstCall.args[0].sdp).to.equal('\n');
    });
  });
});
