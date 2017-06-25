/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

describe('window.adapter', () => {
  it('exists', () => {
    expect(window).to.have.property('adapter');
  });

  describe('browserDetails', () => {
    it('exists', () => {
      expect(window.adapter).to.have.property('browserDetails');
    });

    it('detects a browser type', () => {
      expect(window.adapter.browserDetails).to.have.property('browser');
    });

    it('detects a browser version', () => {
      expect(window.adapter.browserDetails).to.have.property('version');
    });
  });
});
