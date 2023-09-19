/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
describe('adapter factory', () => {
  const {adapterFactory} = require('../../dist/adapter_factory.js');
  const utils = require('../../dist/utils.js');

  let window;
  beforeEach(() => {
    window = {
      RTCPeerConnection: jest.fn(),
    };
  });

  describe('does not shim', () => {
    afterEach(() => {
      utils.detectBrowser.mockRestore();
    });
    ['Chrome', 'Firefox', 'Safari'].forEach(browser => {
      it(browser + ' when disabled', () => {
        jest.spyOn(utils, 'detectBrowser').mockReturnValue({
          browser: browser.toLowerCase()
        });
        let options = {};
        options['shim' + browser] = false;
        const adapter = adapterFactory(window, options);
        expect(adapter).not.toHaveProperty('browserShim');
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
    expect(constructor).not.toThrow();
  });
});
