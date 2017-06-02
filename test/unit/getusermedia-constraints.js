/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

describe('Chrome getUserMedia constraints converter', () => {
  const shim = require('../../src/js/chrome/getusermedia');
  let window;

  beforeEach(() => {
    window = {
      navigator: {
        webkitGetUserMedia: sinon.stub(),
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.3029.110 ' +
            'Safari/537.36'
      }
    };
    shim(window);
  });

  it('back-converts spec video constraints', () => {
    window.navigator.getUserMedia({
      video: {
        width: 1280,
        height: {min: 200, ideal: 720, max: 1080},
        frameRate: {exact: 50}
      }
    });
    expect(window.navigator.webkitGetUserMedia).to.have.been.calledWith({
      video: {
        mandatory: {
          maxFrameRate: 50,
          maxHeight: 1080,
          minHeight: 200,
          minFrameRate: 50
        },
        optional: [
                {minWidth: 1280},
                {maxWidth: 1280},
                {minHeight: 720},
                {maxHeight: 720}
        ]
      }
    });
  });

  it('back-converts spec audio constraints', () => {
    window.navigator.getUserMedia({
      audio: {
        autoGainControl: true,
        echoCancellation: false,
        noiseSuppression: {exact: false},
      }
    });
    expect(window.navigator.webkitGetUserMedia).to.have.been.calledWith({
      audio: {
        mandatory: {
          googNoiseSuppression: false
        },
        optional: [
          {echoCancellation: false},
          {googAutoGainControl: true},
        ]
      }
    });
  });

  it('passes legacy video constraints through', () => {
    const legacy = {
      video: {
        mandatory: {
          maxFrameRate: 50,
          maxHeight: 1080,
          minHeight: 200,
          minFrameRate: 50
        },
        optional: [
                {minWidth: 1280},
                {maxWidth: 1280},
                {minHeight: 720},
                {maxHeight: 720}
        ]
      }
    };
    window.navigator.getUserMedia(legacy);
    expect(window.navigator.webkitGetUserMedia).to.have.been.calledWith(legacy);
  });

  it('passes legacy audio constraints through', () => {
    const legacy = {
      audio: {
        mandatory: {
          googNoiseSuppression: false
        },
        optional: [
          {echoCancellation: false},
          {googAutoGainControl: true},
        ]
      }
    };
    window.navigator.getUserMedia(legacy);
    expect(window.navigator.webkitGetUserMedia).to.have.been.calledWith(legacy);
  });

  it('does not choke on common unknown constraints', () => {
    window.navigator.getUserMedia({
      video: {
        mediaSource: 'screen',
        advanced: [
                {facingMode: 'user'}
        ],
        require: ['height', 'frameRate']
      }
    });
    expect(window.navigator.webkitGetUserMedia).to.have.been.calledWith({
      video: {
        optional: [
                {facingMode: 'user'}
        ]
      }
    });
  });
});

describe('Firefox getUserMedia constraints converter', () => {
  const shim = require('../../src/js/firefox/getusermedia');
  let window;

  beforeEach(() => {
    window = {
      navigator: {
        mozGetUserMedia: sinon.stub()
      }
    };
  });

  describe('in Firefox 37', () => {
    beforeEach(() => {
      window.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel ' +
          'Mac OS X 10.12; rv:37.0) Gecko/20100101 Firefox/37.0';
      shim(window);
    });

    it('converts spec-constraints to legacy constraints', () => {
      window.navigator.getUserMedia({
        video: {
          mediaSource: 'screen',
          width: 1280,
          height: {min: 200, ideal: 720, max: 1080},
          facingMode: 'user',
          frameRate: {exact: 50}
        }
      });
      expect(window.navigator.mozGetUserMedia).to.have.been.calledWith({
        video: {
          mediaSource: 'screen',
          height: {min: 200, max: 1080},
          frameRate: {max: 50, min: 50},
          advanced: [
                  {width: {min: 1280, max: 1280}},
                  {height: {min: 720, max: 720}},
                  {facingMode: 'user'}
          ],
          require: ['height', 'frameRate']
        }
      });
    });

    it('passes legacy constraints through', () => {
      const legacy = {
        video: {
          height: {min: 200, max: 1080},
          frameRate: {max: 50, min: 50},
          advanced: [
                  {width: {min: 1280, max: 1280}},
                  {height: {min: 720, max: 720}},
                  {facingMode: 'user'}
          ],
          require: ['height', 'frameRate']
        }
      };
      window.navigator.getUserMedia(legacy);
      expect(window.navigator.mozGetUserMedia).to.have.been.calledWith(legacy);
    });
  });

  describe('in Firefox 38+', () => {
    beforeEach(() => {
      window.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel ' +
          'Mac OS X 10.12; rv:38.0) Gecko/20100101 Firefox/38.0';
      shim(window);
    });
    it('passes through spec-constraints', () => {
      const spec = {video: {
        mediaSource: 'screen',
        width: 1280,
        height: {min: 200, ideal: 720, max: 1080},
        facingMode: 'user',
        frameRate: {exact: 50}
      }
      };
      window.navigator.getUserMedia(spec);
      expect(window.navigator.mozGetUserMedia).to.have.been.calledWith(spec);
    });
  });
});
