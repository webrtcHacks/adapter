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

describe('detectBrowser', () => {
  const detectBrowser = require('../../src/js/utils.js').detectBrowser;
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
    expect(browserDetails.browser).to.equal('firefox');
    expect(browserDetails.version).to.equal(44);
  });

  it('detects Chrome if navigator.webkitGetUserMedia exists', () => {
    navigator.userAgent = 'Mozilla/5.0 (X11; Linux x86_64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 ' +
        'Safari/537.36';
    navigator.webkitGetUserMedia = function() {};
    window.webkitRTCPeerConnection = function() {};

    const browserDetails = detectBrowser(window);
    expect(browserDetails.browser).to.equal('chrome');
    expect(browserDetails.version).to.equal(45);
  });

  it('detects Edge if navigator.mediaDevices exists', () => {
    navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 ' +
        'Safari/537.36 Edge/13.10547';
    navigator.mediaDevices = function() {};

    const browserDetails = detectBrowser(window);
    expect(browserDetails.browser).to.equal('edge');
    expect(browserDetails.version).to.equal(10547);
  });

  it('detects Safari if window.RTCPeerConnection exists', () => {
    navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) ' +
          'AppleWebKit/604.1.6 (KHTML, like Gecko) Version/10.2 Safari/604.1.6';
    window.RTCPeerConnection = function() {};

    const browserDetails = detectBrowser(window);
    expect(browserDetails.browser).to.equal('safari');
    expect(browserDetails.version).to.equal(604);
  });
});
