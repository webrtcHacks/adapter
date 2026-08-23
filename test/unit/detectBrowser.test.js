/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
describe('detectBrowser', () => {
  const detectBrowser = require('../../dist/utils.js').detectBrowser;
  let window;
  let navigator;

  beforeEach(() => {
    navigator = {};
    window = {navigator};
  });

  it('detects Firefox if navigator.mozGetUserMedia exists', () => {
    navigator.userAgent = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; ' +
        'rv:44.0) Gecko/20100101 Firefox/44.0';
    navigator.mozGetUserMedia = function() {};

    const browserDetails = detectBrowser(window);
    expect(browserDetails.browser).toEqual('firefox');
    expect(browserDetails.version).toEqual(44);
  });

  it('detects Chrome via the user agent if navigator.webkitGetUserMedia ' +
     'exists', () => {
    navigator.userAgent = 'Mozilla/5.0 (X11; Linux x86_64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 ' +
        'Safari/537.36';
    navigator.webkitGetUserMedia = function() {};
    window.webkitRTCPeerConnection = function() {};

    const browserDetails = detectBrowser(window);
    expect(browserDetails.browser).toEqual('chrome');
    expect(browserDetails.version).toEqual(45);
  });

  it('detects chrome with reduced useragent', () => {
    navigator.userAgent = 'Mozilla/5.0 (X11; Linux x86_64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.0.0 ' +
        'Safari/537.36';
    navigator.webkitGetUserMedia = function() {};
    window.webkitRTCPeerConnection = function() {};

    const browserDetails = detectBrowser(window);
    expect(browserDetails.browser).toEqual('chrome');
    expect(browserDetails.version).toEqual(95);
  });

  it('detects Chrome if navigator.userAgentData exists', () => {
    navigator.userAgentData = {brands: [{brand: 'Chromium', version: '102'}]};
    // Use the wrong UA string for Firefox.
    navigator.userAgent = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; ' +
        'rv:44.0) Gecko/20100101 Firefox/44.0';
    navigator.mozGetUserMedia = function() {};

    const browserDetails = detectBrowser(window);
    expect(browserDetails.browser).toEqual('chrome');
    expect(browserDetails.version).toEqual(102);
  });

  it('detects Safari if window.RTCPeerConnection exists', () => {
    navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) ' +
          'AppleWebKit/604.1.6 (KHTML, like Gecko) Version/10.2 Safari/604.1.6';
    window.RTCPeerConnection = function() {};

    const browserDetails = detectBrowser(window);
    expect(browserDetails.browser).toEqual('safari');
    expect(browserDetails.version).toEqual(604);
    expect(browserDetails._safariVersion).toEqual(10.2);
  });

  it('does not misdetect Chrome devtools iOS emulation', () => {
    navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 ' +
        'like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
        'Version/18.5 Mobile/15E148 Safari/604.1';
    navigator.webkitGetUserMedia = function() {};
    window.webkitRTCPeerConnection = function() {};

    const browserDetails = detectBrowser(window);
    expect(browserDetails.browser).toEqual('chrome');
    expect(browserDetails.version).toEqual(null);
  });

  it('detects Chrome < 90 without userAgentData via the user agent', () => {
    // userAgentData shipped in Chromium 90. Older versions (including
    // WebViews) must still be detected from the user agent string.
    expect(navigator.userAgentData).toBeUndefined();
    navigator.userAgent = 'Mozilla/5.0 (Linux; Android 10; wv) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 ' +
        'Chrome/85.0.4183.101 Mobile Safari/537.36';
    navigator.webkitGetUserMedia = function() {};
    window.webkitRTCPeerConnection = function() {};

    const browserDetails = detectBrowser(window);
    expect(browserDetails.browser).toEqual('chrome');
    expect(browserDetails.version).toEqual(85);
  });

  it('falls back to UA when userAgentData Chromium version < 90', () => {
    // SLBrowser incorrectly reports its own version (9.x) as the
    // Chromium brand version. Since userAgentData shipped in Chromium 90,
    // any version below 90 is invalid and should be ignored.
    navigator.userAgentData = {
      brands: [
        {brand: 'Chromium', version: '9'},
        {brand: 'Not?A_Brand', version: '8'}
      ]
    };
    navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 ' +
        'Safari/537.36 SLBrowser/9.0.8.3131 SLBChan/103 SLBVPV/64-bit';
    navigator.webkitGetUserMedia = function() {};
    window.webkitRTCPeerConnection = function() {};

    const browserDetails = detectBrowser(window);
    expect(browserDetails.browser).toEqual('chrome');
    expect(browserDetails.version).toEqual(141);
  });
});
