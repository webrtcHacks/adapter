/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

describe('MediaStream', () => {
  it('window.MediaStream exists', () => {
    expect(window).to.have.property('MediaStream');
  });
});
