/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
describe('Firefox shim', () => {
  const shim = require('../../dist/firefox/firefox_shim');
  let window;

  beforeEach(() => {
    window = {
      navigator: {
        mediaDevices: {
          getUserMedia: jest.fn(),
        },
      },
    };
  });

  describe('getDisplayMedia shim', () => {
    it('does not if navigator.mediaDevices does not exist', () => {
      delete window.navigator.mediaDevices;
      shim.shimGetDisplayMedia(window);
      expect(window.navigator.mediaDevices).toBe(undefined);
    });

    it('does not overwrite an existing ' +
        'navigator.mediaDevices.getDisplayMedia', () => {
      window.navigator.mediaDevices.getDisplayMedia = 'foo';
      shim.shimGetDisplayMedia(window, 'screen');
      expect(window.navigator.mediaDevices.getDisplayMedia).toBe('foo');
    });

    it('shims navigator.mediaDevices.getDisplayMedia', () => {
      shim.shimGetDisplayMedia(window, 'screen');
      expect(typeof window.navigator.mediaDevices.getDisplayMedia)
        .toBe('function');
    });

    ['screen', 'window'].forEach((mediaSource) => {
      it('calls getUserMedia with the given default mediaSource', () => {
        shim.shimGetDisplayMedia(window, mediaSource);
        window.navigator.mediaDevices.getDisplayMedia({video: true});
        expect(window.navigator.mediaDevices.getUserMedia.mock.calls.length)
          .toBe(1);
        expect(window.navigator.mediaDevices.getUserMedia.mock.calls[0][0])
          .toEqual({video: {mediaSource}});
      });
    });
  });
});
