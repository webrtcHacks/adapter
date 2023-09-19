/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

describe('compactObject', () => {
  const compactObject = require('../../dist/utils.js').compactObject;

  it('returns an empty object as is', () => {
    expect(compactObject({})).toEqual({});
  });

  it('removes undefined values', () => {
    expect(compactObject({
      nothing: undefined,
      value: 'hello',
      something: undefined,
    })).toEqual({
      value: 'hello',
    });
  });

  it('removes nested empty objects', () => {
    expect(compactObject({
      nothing: {},
      val: 12,
    })).toEqual({
      val: 12,
    });
  });

  it('removes nested undefined values', () => {
    expect(compactObject({
      value: 'hello',
      something: {
        nestedValue: 12,
        nestedEmpty: {},
        nestedNothing: undefined,
      },
    })).toEqual({
      value: 'hello',
      something: {
        nestedValue: 12,
      },
    });
  });

  it('leaves arrays alone', () => {
    const arr = [{val: 'hello'}, undefined, 525];
    expect(compactObject({
      nothing: undefined,
      value: arr,
      something: undefined,
    })).toEqual({
      value: arr,
    });
  });
});
