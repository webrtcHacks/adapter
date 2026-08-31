/*
 *  Copyright (c) 2026 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

describe('wrapPeerConnectionEvent', () => {
  const wrapPeerConnectionEvent =
		require('../../dist/utils.js').wrapPeerConnectionEvent;
  let window;
  let RTCPeerConnection;
  let addEventListener;
  let removeEventListener;

  beforeEach(() => {
    addEventListener = jest.fn();
    removeEventListener = jest.fn();
    RTCPeerConnection = jest.fn();

    window = {
      RTCPeerConnection,
    };
  });

  it('should patch RTCPeerConnection if the props are writable', () => {
    changeAccessorDescriptor({writable: false, configurable: true});

    wrapPeerConnectionEvent(window, 'track', (e) => {
      return {type: e.type, wrapped: true};
    });

    expect(RTCPeerConnection.prototype.addEventListener)
      .not.toBe(addEventListener);
    expect(RTCPeerConnection.prototype.removeEventListener)
      .not.toBe(removeEventListener);
  });

  it('shouldn\'t patch RTCPeerConnection if the props are not configurable',
    () => {
      changeAccessorDescriptor({writable: false, configurable: false});

      wrapPeerConnectionEvent(window, 'track', () => {
        return null;
      });

      expect(RTCPeerConnection.prototype.addEventListener)
        .toBe(addEventListener);
      expect(RTCPeerConnection.prototype.removeEventListener)
        .toBe(removeEventListener);
    });

  function changeAccessorDescriptor(
    {writable, configurable},
  ) {
    Object.defineProperty(RTCPeerConnection.prototype, 'addEventListener', {
      value: addEventListener,
      writable,
      configurable,
    });
    Object.defineProperty(RTCPeerConnection.prototype, 'removeEventListener', {
      value: removeEventListener,
      writable,
      configurable,
    });
  }
});

