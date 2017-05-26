/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
import chai, {expect} from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);

import adapterFactory from '../../src/js/adapter_factory.js';
import * as utils from '../../src/js/utils.js';

describe('adapter factory', () => {
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
