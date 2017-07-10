/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

describe('navigator.mediaDevices', () => {
  it('exists', () => {
    expect(navigator).to.have.property('mediaDevices');
  });

  describe('getUserMedia', () => {
    it('exists', () => {
      expect(navigator.mediaDevices).to.have.property('getUserMedia');
    });

    it('fulfills the promise', () => {
      return navigator.mediaDevices.getUserMedia({video: true})
      .then((stream) => {
        expect(stream.getTracks()).to.have.length(1);
      });
    });
  });

  it('is an EventTarget', () => {
    // Test that adding and removing an eventlistener on navigator.mediaDevices
    // is possible. The usecase for this is the devicechanged event.
    // This does not test whether devicechanged is actually called.
    expect(navigator.mediaDevices).to.have.property('addEventListener');
    expect(navigator.mediaDevices).to.have.property('removeEventListener');
  });

  it('implements the devicechange event', () => {
    expect(navigator.mediaDevices).to.have.property('ondevicechange');
  });

  describe('enumerateDevices', () => {
    it('exists', () => {
      expect(navigator.mediaDevices).to.have.property('enumerateDevices');
    });

    describe('returns', () => {
      it('an array of devices', () => {
        return navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          expect(devices).to.be.an('Array');
        });
      });

      ['audioinput', 'videoinput', 'audiooutput'].forEach(kind => {
        it('some ' + kind + ' devices', () => {
          return navigator.mediaDevices.enumerateDevices()
          .then(devices => {
            expect(devices.find(d => d.kind === kind)).not.to.equal(undefined);
          });
        });
      });
    });
  });
});
