/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

var logDisabled_ = true;
var deprecationWarnings_ = true;

// Utility methods.
export function disableLog(bool) {
  if (typeof bool !== 'boolean') {
    return new Error('Argument type: ' + typeof bool +
        '. Please use a boolean.');
  }
  logDisabled_ = bool;
  return (bool) ? 'adapter.js logging disabled' :
      'adapter.js logging enabled';
}

/**
 * Disable or enable deprecation warnings
 * @param {!boolean} bool set to true to disable warnings.
 */
export function disableWarnings(bool) {
  if (typeof bool !== 'boolean') {
    return new Error('Argument type: ' + typeof bool +
        '. Please use a boolean.');
  }
  deprecationWarnings_ = !bool;
  return 'adapter.js deprecation warnings ' + (bool ? 'disabled' : 'enabled');
}

export function log() {
  if (typeof window === 'object') {
    if (logDisabled_) {
      return;
    }
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log.apply(console, arguments);
    }
  }
}

/**
 * Shows a deprecation warning suggesting the modern and spec-compatible API.
 */
export function deprecated(oldMethod, newMethod) {
  if (!deprecationWarnings_) {
    return;
  }
  console.warn(oldMethod + ' is deprecated, please use ' + newMethod +
      ' instead.');
}

/**
 * Extract browser version out of the provided user agent string.
 *
 * @param {!string} uastring userAgent string.
 * @param {!string} expr Regular expression used as match criteria.
 * @param {!number} pos position in the version string to be returned.
 * @return {!number} browser version.
 */
export function extractVersion(uastring, expr, pos) {
  var match = uastring.match(expr);
  return match && match.length >= pos && parseInt(match[pos], 10);
}

/**
 * Browser detector.
 *
 * @return {object} result containing browser and version
 *     properties.
 */
export function detectBrowser(window) {
  var navigator = window && window.navigator;

  // Returned result object.
  var result = {};
  result.browser = null;
  result.version = null;

  // Fail early if it's not a browser
  if (typeof window === 'undefined' || !window.navigator) {
    result.browser = 'Not a browser.';
    return result;
  }

  // Firefox.
  if (navigator.mozGetUserMedia) {
    result.browser = 'firefox';
    result.version = extractVersion(navigator.userAgent,
        /Firefox\/(\d+)\./, 1);
  } else if (navigator.webkitGetUserMedia) {
    // Chrome, Chromium, Webview, Opera, all use the chrome shim for now
    if (window.webkitRTCPeerConnection) {
      result.browser = 'chrome';
      result.version = extractVersion(navigator.userAgent,
        /Chrom(e|ium)\/(\d+)\./, 2);
    } else { // Safari (in an unpublished version) or unknown webkit-based.
      if (navigator.userAgent.match(/Version\/(\d+).(\d+)/)) {
        result.browser = 'safari';
        result.version = extractVersion(navigator.userAgent,
          /AppleWebKit\/(\d+)\./, 1);
      } else { // unknown webkit-based browser.
        result.browser = 'Unsupported webkit-based browser ' +
            'with GUM support but no WebRTC support.';
        return result;
      }
    }
  } else if (navigator.mediaDevices &&
      navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) { // Edge.
    result.browser = 'edge';
    result.version = extractVersion(navigator.userAgent,
        /Edge\/(\d+).(\d+)$/, 2);
  } else if (navigator.mediaDevices &&
      navigator.userAgent.match(/AppleWebKit\/(\d+)\./)) {
      // Safari, with webkitGetUserMedia removed.
    result.browser = 'safari';
    result.version = extractVersion(navigator.userAgent,
        /AppleWebKit\/(\d+)\./, 1);
  } else { // Default fallthrough: not supported.
    result.browser = 'Not a supported browser.';
    return result;
  }

  return result;
}

// shimCreateObjectURL must be called before shimSourceObject to avoid loop.

export function shimCreateObjectURL(window) {
  var URL = window && window.URL;

  if (!(typeof window === 'object' && window.HTMLMediaElement &&
        'srcObject' in window.HTMLMediaElement.prototype)) {
    // Only shim CreateObjectURL using srcObject if srcObject exists.
    return undefined;
  }

  var nativeCreateObjectURL = URL.createObjectURL.bind(URL);
  var nativeRevokeObjectURL = URL.revokeObjectURL.bind(URL);
  var streams = new Map(), newId = 0;

  URL.createObjectURL = function(stream) {
    if ('getTracks' in stream) {
      var url = 'polyblob:' + (++newId);
      streams.set(url, stream);
      deprecated('URL.createObjectURL(stream)',
          'elem.srcObject = stream');
      return url;
    }
    return nativeCreateObjectURL(stream);
  };
  URL.revokeObjectURL = function(url) {
    nativeRevokeObjectURL(url);
    streams.delete(url);
  };

  var dsc = Object.getOwnPropertyDescriptor(window.HTMLMediaElement.prototype,
                                            'src');
  Object.defineProperty(window.HTMLMediaElement.prototype, 'src', {
    get: function() {
      return dsc.get.apply(this);
    },
    set: function(url) {
      this.srcObject = streams.get(url) || null;
      return dsc.set.apply(this, [url]);
    }
  });

  var nativeSetAttribute = window.HTMLMediaElement.prototype.setAttribute;
  window.HTMLMediaElement.prototype.setAttribute = function() {
    if (arguments.length === 2 &&
        ('' + arguments[0]).toLowerCase() === 'src') {
      this.srcObject = streams.get(arguments[1]) || null;
    }
    return nativeSetAttribute.apply(this, arguments);
  };
}
