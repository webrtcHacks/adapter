/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

describe('Log suppression', () => {
  const utils = require('../../dist/utils.js');
  beforeEach(() => {
    jest.spyOn(console, 'log');
    global.window = {};
    require('../../out/adapter.js');
  });

  afterEach(() => {
    delete global.window;
  });

  it('does not call console.log by default', () => {
    utils.log('test');
    expect(console.log.mock.calls.length).toBe(0);
  });
  it('does call console.log when enabled', () => {
    utils.disableLog(false);
    utils.log('test');
    expect(console.log.mock.calls.length).toBe(1);
  });
});
