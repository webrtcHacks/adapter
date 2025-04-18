/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
describe('extractVersion', () => {
  const extractVersion = require('../../dist/utils.js').extractVersion;

  let ua;
  describe('Chrome regular expression', () => {
    const expr = /Chrom(e|ium)\/(\d+)\./;

    it('matches Chrome', () => {
      ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like ' +
          'Gecko) Chrome/45.0.2454.101 Safari/537.36';
      expect(extractVersion(ua, expr, 2)).toBe(45);
    });

    it('matches Chrome 100+', () => {
      ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like ' +
          'Gecko) Chrome/100.0.2454.101 Safari/537.36';
      expect(extractVersion(ua, expr, 2)).toBe(100);
    });

    it('matches Chromium', () => {
      ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like ' +
          'Gecko) Ubuntu Chromium/45.0.2454.85 Chrome/45.0.2454.85 ' +
          'Safari/537.36';
      expect(extractVersion(ua, expr, 2)).toBe(45);
    });

    it('matches Chrome on Android', () => {
      ua = 'Mozilla/5.0 (Linux; Android 4.3; Nexus 10 Build/JSS15Q) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2307.2 ' +
          'Safari/537.36';
      expect(extractVersion(ua, expr, 2)).toBe(42);
    });

    it('recognizes Opera as Chrome', () => {
      // Opera, should match chrome/webrtc version 45.0 not Opera 32.0.
      ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, ' +
          'like Gecko) Chrome/45.0.2454.85 Safari/537.36 OPR/32.0.1948.44';
      expect(extractVersion(ua, /Chrom(e|ium)\/(\d+)\./, 2)).toBe(45);
    });

    it('does not match Firefox', () => {
      ua = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:44.0) Gecko/20100101 ' +
          'Firefox/44.0';
      expect(extractVersion(ua, expr, 2)).toBe(null);
    });

    it('does not match Safari', () => {
      ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) ' +
          'AppleWebKit/604.1.6 (KHTML, like Gecko) Version/10.2 Safari/604.1.6';
      expect(extractVersion(ua, expr, 2)).toBe(null);
    });

    it('does match Edge (by design, do not use for Edge)', () => {
      ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10547';
      expect(extractVersion(ua, expr, 2)).toBe(46);
    });

    it('does not match non-Chrome', () => {
      ua = 'Mozilla/5.0 (Linux; U; en-us; KFAPWI Build/JDQ39) ' +
          'AppleWebKit/535.19 KHTML, like Gecko) Silk/3.13 Safari/535.19 ' +
          'Silk-Accelerated=true';
      expect(extractVersion(ua, expr, 2)).toBe(null);
    });

    it('does not match the iPhone simulator', () => {
      ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) ' +
          'AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 ' +
          'Mobile/12A4345d Safari/600.1.4';
      expect(extractVersion(ua, expr, 1)).toBe(null);
    });
  });

  describe('Firefox regular expression', () => {
    const expr = /Firefox\/(\d+)\./;
    it('matches Firefox', () => {
      ua = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:44.0) Gecko/20100101 ' +
          'Firefox/44.0';
      expect(extractVersion(ua, expr, 1)).toBe(44);
    });

    it('matches Firefox 100+', () => {
      ua = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:44.0) Gecko/20100101 ' +
          'Firefox/100.0';
      expect(extractVersion(ua, expr, 1)).toBe(100);
    });

    it('does not match Chrome', () => {
      ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like ' +
          'Gecko) Chrome/45.0.2454.101 Safari/537.36';
      expect(extractVersion(ua, expr, 1)).toBe(null);
    });

    it('does not match Safari', () => {
      ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) ' +
          'AppleWebKit/604.1.6 (KHTML, like Gecko) Version/10.2 Safari/604.1.6';
      expect(extractVersion(ua, expr, 1)).toBe(null);
    });

    it('does not match Edge', () => {
      ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10547';
      expect(extractVersion(ua, expr, 1)).toBe(null);
    });
  });

  describe('Webkit regular expression', () => {
    const expr = /AppleWebKit\/(\d+)/;
    it('matches the webkit version', () => {
      ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) ' +
          'AppleWebKit/604.1.6 (KHTML, like Gecko) Version/10.2 Safari/604.1.6';
      expect(extractVersion(ua, expr, 1)).toBe(604);
    });

    it('matches the iphone simulator', () => {
      ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) ' +
          'AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 ' +
          'Mobile/12A4345d Safari/600.1.4';
      expect(extractVersion(ua, expr, 1)).toBe(600);
    });

    it('matches Chrome (by design, do not use for Chrome)', () => {
      ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like ' +
          'Gecko) Chrome/45.0.2454.101 Safari/537.36';
      expect(extractVersion(ua, expr, 1)).toBe(537);
    });

    it('matches Edge (by design, do not use for Edge', () => {
      ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10547';
      expect(extractVersion(ua, expr, 1)).toBe(537);
    });

    it('does not match Firefox', () => {
      ua = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:44.0) Gecko/20100101 ' +
          'Firefox/44.0';
      expect(extractVersion(ua, expr, 1)).toBe(null);
    });
  });
  describe('Safari regular expression', () => {
    const expr = /Version\/(\d+(\.?\d+))/;
    it('extracts the Safari version', () => {
      ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) ' +
          'AppleWebKit/604.1.6 (KHTML, like Gecko) Version/10.2 Safari/604.1.6';
      expect(extractVersion(ua, expr, 1)).toBe(10.2);
    });
  });
});

