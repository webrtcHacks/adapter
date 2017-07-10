/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

describe('getUserMedia', () => {
  describe('navigator.getUserMedia', () => {
    it('exists', () => {
      expect(navigator).to.have.property('getUserMedia');
    });

    it('calls the callback', (done) => {
      navigator.getUserMedia({video: true}, (stream) => {
        expect(stream.getTracks()).to.have.length(1);
        done();
      }, (err) => {
        throw err;
      });
    });
  });
});
