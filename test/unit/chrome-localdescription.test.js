/*
 *  Copyright (c) 2024 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
describe('Chrome version detection with iOS emulated UA', () => {
  const detectBrowser = require('../../dist/utils.js').detectBrowser;
  let window;
  let navigator;

  beforeEach(() => {
    navigator = {};
    window = {navigator};
  });

  it('returns version null when Chrome API exists but UA has no Chrome version (iOS emulator)', () => {
    // Chrome DevTools simulating iPhone: webkitGetUserMedia exists
    // but UA is iOS Safari format without Chrome/XX
    navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 ' +
        'like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
        'Version/18.5 Mobile/15E148 Safari/604.1';
    navigator.webkitGetUserMedia = function() {};
    window.webkitRTCPeerConnection = function() {};

    const browserDetails = detectBrowser(window);
    expect(browserDetails.browser).toEqual('chrome');
    expect(browserDetails.version).toBeNull();
  });

  it('returns version null when Chrome API exists but UA has no Chrome version (iPad emulator)', () => {
    navigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 18_5 ' +
        'like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
        'Version/18.5 Mobile/15E148 Safari/604.1';
    navigator.webkitGetUserMedia = function() {};
    window.webkitRTCPeerConnection = function() {};

    const browserDetails = detectBrowser(window);
    expect(browserDetails.browser).toEqual('chrome');
    expect(browserDetails.version).toBeNull();
  });

  it('returns correct version for normal Chrome UA', () => {
    navigator.userAgent = 'Mozilla/5.0 (X11; Linux x86_64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 ' +
        'Safari/537.36';
    navigator.webkitGetUserMedia = function() {};
    window.webkitRTCPeerConnection = function() {};

    const browserDetails = detectBrowser(window);
    expect(browserDetails.browser).toEqual('chrome');
    expect(browserDetails.version).toEqual(144);
  });
});
