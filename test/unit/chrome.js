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

/* a mock of the Chrome RTCLegacyStatReport */
function RTCLegacyStatsReport() {
  this.id = 'someid';
  this.type = 'set-me';
  this.timestamp = new Date();
  this._data = {};
}
RTCLegacyStatsReport.prototype.names = function() {
  return Object.keys(this._data);
};
RTCLegacyStatsReport.prototype.stat = function(name) {
  return this._data[name];
};

function makeLegacyStatsReport(type, data) {
  const report = new RTCLegacyStatsReport();
  report.type = type;
  report._data = data;
  return report;
}

describe('Chrome shim', () => {
  const shim = require('../../src/js/chrome/chrome_shim');
  let window;

  beforeEach(() => {
    window = {
      webkitRTCPeerConnection: function() {}
    };
  });

  describe('shimPeerConnection', () => {
    it('creates window.RTCPeerConnection', () => {
      shim.shimPeerConnection(window);
      expect(window.RTCPeerConnection).not.to.equal(undefined);
    });
  });

  it('translates iceTransportPolicy to iceTransports ' +
      'for webkitRTCPeerConnection', () => {
    shim.shimPeerConnection(window);
    sinon.spy(window, 'webkitRTCPeerConnection');
    new window.RTCPeerConnection({iceTransportPolicy: 'relay'});
    expect(window.webkitRTCPeerConnection).to.have.been.calledWith(sinon.match({
      iceTransports: 'relay'
    }));
  });

  describe('legacy getStats', () => {
    let pc;
    beforeEach(() => {
      window.webkitRTCPeerConnection.prototype.getStats = function(cb) {
        setTimeout(cb, 0, {
          result: () => [
            makeLegacyStatsReport('localcandidate', {
              portNumber: '31337',
              ipAddress: '8.8.8.8',
              transport: 'udp',
              candidateType: 'host',
              priority: '12345'
            }),
          ]
        });
      };
      shim.shimPeerConnection(window);
      pc = new window.RTCPeerConnection();
    });

    it('returns a promise', () => {
      return pc.getStats();
    });

    it('returns chrome legacy getStats when called with a callback', (done) => {
      pc.getStats((result) => {
        expect(result).to.have.property('result');
        const report = result.result()[0];
        expect(report).to.have.property('id');
        expect(report).to.have.property('type');
        expect(report).to.have.property('timestamp');
        expect(report).to.have.property('stat');
        done();
      });
    });

    it('is translated into a Map', () => {
      return pc.getStats()
      .then(result => {
        expect(result).to.be.a('Map');
      });
    });
  });
});
