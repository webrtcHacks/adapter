/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
/* global beforeEach, afterEach */
'use strict';

/* wrap navigator.getUserMedia and navigator.mediaDevices.getUserMedia
 * so that any streams acquired are released after each test.
 */
beforeEach(() => {
  let streams = [];
  let release = () => {
    streams.forEach((stream) => {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    });
    streams = [];
  };


  if (navigator.getUserMedia) {
    let origGetUserMedia = navigator.getUserMedia.bind(navigator);
    navigator.getUserMedia = (constraints, cb, eb) => {
      origGetUserMedia(constraints, (stream) => {
        streams.push(stream);
        if (cb) {
          cb.apply(null, [stream]);
        }
      }, eb);
    };
    navigator.getUserMedia.restore = () => {
      navigator.getUserMedia = origGetUserMedia;
      release();
    };
  }

  let origMediaDevicesGetUserMedia =
      navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = (constraints) => {
    return origMediaDevicesGetUserMedia(constraints, (stream) => {
      streams.push(stream);
      return stream;
    });
  };
  navigator.mediaDevices.getUserMedia.restore = () => {
    navigator.mediaDevices.getUserMedia = origMediaDevicesGetUserMedia;
    release();
  };
});

afterEach(() => {
  if (navigator.getUserMedia) {
    navigator.getUserMedia.restore();
  }
  navigator.mediaDevices.getUserMedia.restore();
});
