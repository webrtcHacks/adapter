/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
import {expect} from 'chai';
import * as utils from '../../src/js/utils.js';

describe('Log suppression', () => {
  const saveConsole = console.log;

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
