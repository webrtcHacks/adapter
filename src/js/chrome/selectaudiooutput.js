/*
 *  Copyright (c) 2022 The adapter.js project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

export function shimSelectAudioOutput(window) {
  // Polyfillying only makes sense when setSinkId is available
  // and the function is not already there.
  if (!('HTMLMediaElement' in window)) {
    return;
  }
  if (!('setSinkId' in window.HTMLMediaElement.prototype)) {
    return;
  }
  if (!(window.navigator && window.navigator.mediaDevices)) {
    return;
  }
  if (!window.navigator.mediaDevices.enumerateDevices) {
    return;
  }
  if (window.navigator.mediaDevices.selectAudioOutput) {
    return;
  }
  window.navigator.mediaDevices.selectAudioOutput = () => {
    return window.navigator.mediaDevices.enumerateDevices()
      .then(devices => devices.filter(d => d.kind === 'audiooutput'));
  };
}
