/*
 *  Copyright (c) 2022 The adapter.js project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

describe('getDataChannels', () => {
  let pc1;
  let pc2;

  function negotiate(pc, otherPc) {
    return pc.createOffer()
    .then(function(offer) {
      return pc.setLocalDescription(offer);
    }).then(function() {
      return otherPc.setRemoteDescription(pc.localDescription);
    }).then(function() {
      return otherPc.createAnswer();
    }).then(function(answer) {
      return otherPc.setLocalDescription(answer);
    }).then(function() {
      return pc.setRemoteDescription(otherPc.localDescription);
    });
  }

  beforeEach(() => {
    pc1 = new RTCPeerConnection(null);
    pc2 = new RTCPeerConnection(null);

    pc1.onicecandidate = event => pc2.addIceCandidate(event.candidate);
    pc2.onicecandidate = event => pc1.addIceCandidate(event.candidate);
  });
  afterEach(() => {
    pc1.close();
    pc2.close();
  });

  it('returns an array when no datachannel was created', () => {
    const channels = pc1.getDataChannels();
    expect(channels).to.be.an('array');
    expect(channels).to.have.length(0);
  });

  it('returns local channels', () => {
    pc1.createDataChannel('foo');
    const channels = pc1.getDataChannels();
    expect(channels).to.be.an('array');
    expect(channels).to.have.length(1);
  });

  it('returns remote channels', () => {
    pc1.createDataChannel('foo');
    const waitForChannel = new Promise(resolve => {
      pc2.addEventListener('datachannel', (e) => {
        resolve(e.channel);
      });
    });
    return negotiate(pc1, pc2)
      .then(() => waitForChannel)
      .then(() => {
        const channels = pc2.getDataChannels();
        expect(channels).to.be.an('array');
        expect(channels).to.have.length(1);
      });
  });

  it('does not return closed local channels', () => {
    const dc = pc1.createDataChannel('foo');
    dc.close();
    const channels = pc1.getDataChannels();
    expect(channels).to.be.an('array');
    expect(channels).to.have.length(0);
  });

  it('does not return closed remote channels', () => {
    const dc = pc1.createDataChannel('foo');
    dc.close();
    pc1.createDataChannel('foo');
    const waitForChannelAndClose = new Promise(resolve => {
      pc2.addEventListener('datachannel', (e) => {
        e.channel.close();
        resolve(e.channel);
      });
    });
    return negotiate(pc1, pc2)
      .then(() => waitForChannelAndClose)
      .then(() => {
        const channels = pc2.getDataChannels();
        expect(channels).to.be.an('array');
        expect(channels).to.have.length(0);
      });
  });
});
