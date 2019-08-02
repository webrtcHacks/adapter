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
  function throwError(err) {
    console.error(err.toString());
    throw err;
  }

  beforeEach(() => {
    pc1 = new RTCPeerConnection(null);
  });
  afterEach(() => {
    pc1.close();
  });

  it('using transceivers APIs', (done) => {
    if (window.adapter.browserDetails.browser === 'edge' ||
      window.adapter.browserDetails.browser === 'safari') {
      this.skip();
    }
    var constraints = {video: true};
    navigator.mediaDevices.getUserMedia(constraints)
      .then(function(stream) {
        const initOpts = {
          sendEncodings: [
            {'rid': 'high'},
            {'rid': 'medium', 'scaleResolutionDownBy': 2},
            {'rid': 'low', 'scaleResolutionDownBy': 3}
          ]
        };
        pc1.addTransceiver(stream.getVideoTracks()[0], initOpts);

        pc1.createOffer().then((offer) => {
          const simulcastRegex = /a=simulcast:.*send .*high;medium;low/g;
          expect(simulcastRegex.test(offer.sdp)).to.equal(true);
          done();
        })
        .catch(throwError);
      })
      .catch(throwError);
  });
});