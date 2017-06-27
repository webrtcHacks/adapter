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
  const adapterFactory = require('../../src/js/adapter_factory.js');
  const utils = require('../../src/js/utils.js');

  let window;
  beforeEach(() => {
    window = {
      RTCPeerConnection: sinon.stub(),
    };
  });
  afterEach(() => {
    utils.detectBrowser.restore();
  });

  ['Chrome', 'Firefox', 'Safari', 'Edge'].forEach(browser => {
    it('does not shim ' + browser + ' when disabled', () => {
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
