/*
 *  Copyright (c) 2022 The adapter.js project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

describe('selectAudioOutput', () => {
  it('returns a list of audio output devices', () => {
    return navigator.mediaDevices.selectAudioOutput()
      .then(devices => {
        expect(devices).to.be.an('array');
        devices.forEach(d => {
          expect(d.kind).to.equal('audiooutput');
        });
      });
  });
});
