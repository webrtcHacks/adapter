/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
'use strict';

describe('simulcast', () => {
  let pc1;

  beforeEach(() => {
    pc1 = new RTCPeerConnection(null);
  });
  afterEach(() => {
    pc1.close();
  });

  it('using transceivers APIs', function() {
    if (window.adapter.browserDetails.browser === 'edge' ||
      window.adapter.browserDetails.browser === 'safari') {
      this.skip();
    }
    const constraints = {video: true};
    return navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        const initOpts = {
          sendEncodings: [
            {rid: 'high'},
            {rid: 'medium', scaleResolutionDownBy: 2},
            {rid: 'low', scaleResolutionDownBy: 4}
          ]
        };
        pc1.addTransceiver(stream.getVideoTracks()[0], initOpts);

        return pc1.createOffer().then((offer) => {
          const simulcastRegex =
          /a=simulcast:[\s]?send (?:rid=)?high;medium;low/g;
          return expect(simulcastRegex.test(offer.sdp)).to.equal(true);
        });
      });
  });
});
