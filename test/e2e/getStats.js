/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

describe('getStats', () => {
  let pc;
  beforeEach(() => {
    pc = new RTCPeerConnection();
  });
  afterEach(() => {
    pc.close();
  });

  it('returns a Promise', () => {
    return pc.getStats();
  });

  it('resolves the Promise with a Map(like)', () => {
    return pc.getStats()
    .then(result => {
      expect(result).to.have.property('get');
      expect(result).to.have.property('keys');
      expect(result).to.have.property('values');
      expect(result).to.have.property('forEach');
    });
  });
});
