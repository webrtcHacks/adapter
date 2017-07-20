/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

describe('srcObject', () => {
  ['audio', 'video'].forEach((mediaType) => {
    describe('setter', () => {
      it('triggers loadedmetadata (' + mediaType + ')', (done) => {
        let constraints = {};
        constraints[mediaType] = true;
        navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          const mediaElement = document.createElement(mediaType);
          mediaElement.setAttribute('autoplay', 'true');
          // If the srcObject shim works, we should get media
          // at some point. This will trigger loadedmetadata.
          mediaElement.addEventListener('loadedmetadata', function() {
            done();
          });
          mediaElement.srcObject = stream;
        });
      });
    });

    describe('getter', () => {
      it('returns the stream (' + mediaType + ')', () => {
        let constraints = {};
        constraints[mediaType] = true;
        return navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          const mediaElement = document.createElement(mediaType);
          mediaElement.setAttribute('autoplay', 'true');
          mediaElement.setAttribute('id', mediaType);
          mediaElement.srcObject = stream;
          expect(mediaElement.srcObject).to.have.property('id');
          expect(mediaElement.srcObject.id).to.equal(stream.id);
        });
      });
    });
  });

  it('setting from another object works', () => {
    return navigator.mediaDevices.getUserMedia({video: true})
    .then(stream => {
      const video = document.createElement('video');
      video.autoplay = true;
      video.srcObject = stream;

      const video2 = document.createElement('video2');
      video2.autoplay = true;
      video2.srcObject = video.srcObject;

      expect(video2.srcObject.id).to.equal(video.srcObject.id);
    });
  });
});
