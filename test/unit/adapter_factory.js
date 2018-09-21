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

describe('adapter factory', () => {
  const {adapterFactory} = require('../../dist/adapter_factory.js');
  const utils = require('../../dist/utils.js');

  let window;
  beforeEach(() => {
    window = {
      RTCPeerConnection: sinon.stub(),
    };
  });

  describe('does not shim', () => {
    afterEach(() => {
      utils.detectBrowser.restore();
    });
    ['Chrome', 'Firefox', 'Safari', 'Edge'].forEach(browser => {
      it(browser + ' when disabled', () => {
        sinon.stub(utils, 'detectBrowser').returns({
          browser: browser.toLowerCase()
        });
        let options = {};
        options['shim' + browser] = false;
        const adapter = adapterFactory(window, options);
        expect(adapter).not.to.have.property('browserShim');
      });
    });
  });

  it('does not throw in Firefox with peerconnection disabled', () => {
    window = {navigator: {
      mozGetUserMedia: () => {},
      mediaDevices: {getUserMedia: () => {}},
      userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:44.0) ' +
          'Gecko/20100101 Firefox/44.0'
    }};
    const constructor = () => adapterFactory({window});
    expect(constructor).not.to.throw();
  });
});
