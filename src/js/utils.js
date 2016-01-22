/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
'use strict';

// Utility methods.
var utils = {
  //TODO Fix logging as it's now always included as a module. Maybe make it
  //toggle-able?
  log: function() {
    // Suppress console.log output when being included as a module.
    if (typeof module !== 'undefined' ||
        typeof require === 'function' && typeof define === 'function') {
      return;
    }
    console.log.apply(console, arguments);
  },

   /**
   * Extract browser version out of the provided user agent string.
   * @param {!string} uastring userAgent string.
   * @param {!string} expr Regular expression used as match criteria.
   * @param {!number} pos position in the version string to be returned.
   * @return {!number} browser version.
   */
  extractVersion: function(uastring, expr, pos) {
    var match = uastring.match(expr);
    return match && match.length >= pos && parseInt(match[pos], 10);
  },

  /**
   * Browser detector.
   * @return {object} result containing browser, version and minVersion
   *     properties.
   */
  detectBrowser: function() {
    // Returned result object.
    var result = {};
    result.browser = null;
    result.version = null
    result.minVersion = null;

    // Non supported browser.
    if (typeof window === 'undefined' || !window.navigator) {
      result.browser = 'Not a supported browser.';
      return result;
    }

    // Firefox.
    if (navigator.mozGetUserMedia && window.mozRTCPeerConnection) {
      result.browser = 'firefox';
      result.version = this.extractVersion(navigator.userAgent,
          /Firefox\/([0-9]+)\./, 1);
      result.minVersion = 31;
      return result;
    }

    // Chrome/Chromium/Webview.
    if (navigator.webkitGetUserMedia && window.webkitRTCPeerConnection) {
      result.browser = 'chrome';
      result.version = this.extractVersion(navigator.userAgent,
          /Chrom(e|ium)\/([0-9]+)\./, 2);
      result.minVersion = 38;
      return result;
    }

    // Edge.
    if (navigator.mediaDevices &&
        navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
      result.browser = 'edge';
      result.version = this.extractVersion(navigator.userAgent,
          /Edge\/(\d+).(\d+)$/, 2);
      result.minVersion = 10547;
      return result;
    }
  }
};

// Export.
module.exports = {
  log: utils.log,
  browserDetails: utils.detectBrowser(),
  extractVersion: utils.extractVersion
};
