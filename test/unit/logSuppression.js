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

describe('Log suppression', () => {
  const utils = require('../../dist/utils.js');
  const saveConsole = console.log.bind(console);

  let logCount;
  beforeEach(() => {
    logCount = 0;
    console.log = function() {
      if (arguments.length === 1 && arguments[0] === 'test') {
        logCount++;
      } else {
        saveConsole.apply(saveConsole, arguments);
      }
    };
    global.window = {};
    require('../../out/adapter.js');
  });

  afterEach(() => {
    console.log = saveConsole;
    delete global.window;
  });

  it('does not call console.log by default', () => {
    utils.log('test');
    expect(logCount).to.equal(0);
  });
  it('does call console.log when enabled', () => {
    utils.disableLog(false);
    utils.log('test');
    expect(logCount).to.equal(1);
  });
});
