/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */

describe('URL.createObjectURL shim', () => {
  ['audio', 'video'].forEach(mediaType => {
    ['src=', 'setAttribute'].forEach(variant => {
      it('works for ' + mediaType + ' using ' + variant, (done) => {
        const constraints = {};
        constraints[mediaType] = true;
        navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          let element = document.createElement(mediaType);
          element.autoplay = true;
          document.body.appendChild(element);
          element.addEventListener('loadedmetadata', () => {
            document.body.removeChild(element);
            done();
          });
          if (variant === 'setAttribute') {
            element.setAttribute('src', URL.createObjectURL(stream));
          } else {
            element.src = URL.createObjectURL(stream);
          }
          expect(element.srcObject).to.equal(stream);
        });
      });
    });
  });
});
