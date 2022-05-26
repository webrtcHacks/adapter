/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

describe('RTCDataChannel.binaryType', () => {
  let pc;
  beforeEach(() => {
    pc = new RTCPeerConnection();
  });
  afterEach(() => {
    if (pc.signalingState !== 'closed') {
      pc.close();
    }
  });

  it('is \'blob\' by default', () => {
    const channel = pc.createDataChannel('channel');

    expect(channel.binaryType).to.equal('blob');
  });

  it('can be changed to \'arraybuffer\' and back', () => {
    const channel = pc.createDataChannel('channel');

    expect(channel.binaryType).to.equal('blob');
    channel.binaryType = 'arraybuffer';
    expect(channel.binaryType).to.equal('arraybuffer');
    channel.binaryType = 'blob';
    expect(channel.binaryType).to.equal('blob');
  });

  it('changes the type of `MessageEvent.data`', () => {
    const pc2 = new RTCPeerConnection();

    pc.onicecandidate = ev => pc2.addIceCandidate(ev.candidate);
    pc2.onicecandidate = ev => pc.addIceCandidate(ev.candidate);

    let channel1;
    let channel2;

    const channelsOpen = new Promise(resolve => {
      pc2.ondatachannel = ev => {
        channel2 = ev.channel;
        resolve();
      };
      // Create the channel after setting the listener for it
      // to guarantee that it gets called.
      channel1 = pc.createDataChannel('channel');
    });

    // Set up a connection
    return pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => pc2.setRemoteDescription(pc.localDescription))
      .then(() => pc2.createAnswer())
      .then(answer => pc2.setLocalDescription(answer))
      .then(() => pc.setRemoteDescription(pc2.localDescription))
      // Then wait for our channels to open.
      .then(() => channelsOpen)
      // Test that in the initial 'blob' state, the messages are `Blob`s
      .then(() => new Promise(resolve => {
        expect(channel1.binaryType).to.equal('blob');
        channel1.onmessage = ev => resolve(ev.data);
        channel2.send(new Uint8Array([1, 2, 3, 4]));
      }))
      .then(data => expect(data).to.be.instanceOf(Blob))
      // Then test that when we change `binaryType` to 'arraybuffer',
      // the messages are `ArrayBuffer`s
      .then(() => new Promise(resolve => {
        channel1.binaryType = 'arraybuffer';
        expect(channel1.binaryType).to.equal('arraybuffer');
        channel1.onmessage = ev => resolve(ev.data);
        channel2.send(new Uint8Array([1, 2, 3, 4]));
      }))
      .then(data => expect(data).to.be.instanceOf(ArrayBuffer))
      // Then change it back to 'blob' and test that still works
      .then(() => new Promise(resolve => {
        channel1.binaryType = 'blob';
        expect(channel1.binaryType).to.equal('blob');
        channel1.onmessage = ev => resolve(ev.data);
        channel2.send(new Uint8Array([1, 2, 3, 4]));
      }))
      .then(data => expect(data).to.be.instanceOf(Blob));
  });

  it('throws when you change it to a bogus value', () => {
    const channel = pc.createDataChannel('channel');

    expect(() => channel.binaryType = 'aughadsfiughadsfoiughaoiudf').to.throw();
  });
});
