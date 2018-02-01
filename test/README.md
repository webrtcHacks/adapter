[![Build Status](https://travis-ci.org/webrtc/samples.svg)](https://travis-ci.org/webrtc/samples)

# Intro #
# Intro #

Functional unit tests located in `test/unit` are run in node using [Mocha](https://mochajs.org/), [Chai](http://chaijs.com/) and [Sinon](http://sinonjs.org/).
They are preferred way to test the behaviour of isolated pieces of code or when behaviour depends on the browser version.

[Karma](http://karma-runner.github.io/1.0/index.html) is used to run the end-to-end tests which are also based on Mocha, Chai and Sinon.
Those tests are run in many browsers using the different karma launchers for [Chrome](https://www.npmjs.com/package/karma-chrome-launcher),
[Firefox](https://www.npmjs.com/package/karma-firefox-launcher), [MicrosoftEdge](https://www.npmjs.com/package/karma-edge-launcher) and
[Safari](https://www.npmjs.com/package/karma-safari-launcher). Not all expected tests are expected to pass and they will be compared again
expectation files similar to [Chrome tests](https://chromium.googlesource.com/chromium/src/+/lkcr/docs/testing/layout_test_expectations.md).
This provides ensures stability while not restricting the project to tests that pass in all browsers.

## Development ##
Detailed information on developing in the [webrtc](https://github.com/webrtc) GitHub repo can be mark in the [WebRTC GitHub repo developer's guide](https://docs.google.com/document/d/1tn1t6LW2ffzGuYTK3366w1fhTkkzsSvHsBnOHoDfRzY/edit?pli=1#heading=h.e3366rrgmkdk).

This guide assumes you are running a Debian based Linux distribution (travis-multirunner currently fetches .deb browser packages).

#### Clone the repo in desired folder
```bash
git clone https://github.com/webrtc/adapter.git
```

#### Install npm dependencies
```bash
npm install
```

#### Build
In order to get a usable file, you need to build it.
```bash
grunt build
```
This will result in 4 files in the out/ folder:
* adapter.js - includes all the shims and is visible in the browser under the global `adapter` object (window.adapter).
* adapter_no_edge.js - same as above but does not include the Microsoft Edge (ORTC) shim.
* adapter_no_edge_no_global.js same as above but is not exposed/visible in the browser (you cannot call/interact with the shims in the browser).
* adapter.js_no_global.js - same as adapter.js but is not exposed/visible in the browser (you cannot call/interact with the shims in the browser).

#### Run tests
Runs grunt and tests in test/tests.js. Change the browser to your choice, more details [here](#changeBrowser)
```bash
BROWSER=chrome BVER=stable npm test
```

#### Add tests
When adding tests make sure to update the test expectation file for all browsers and supported version.
The easiest way to do so is to set the `CI` and `UPDATE_STABILITYREPORTER` environment variables and
re-run the tests with all browsers.

Once your test is ready, create a pull request and see how it runs on travis-multirunner.
Usually the expectation is for a test to pass in at least one browser. File browser bugs
for tests that do not meet this expectation!

#### Change browser and channel/version for testing <a id="changeBrowser"></a>
Chrome stable is currently installed as the default browser for the tests.

Currently Chrome and Firefox are supported[*](#expBrowser), check [travis-multirunner](https://github.com/DamonOehlman/travis-multirunner/blob/master/) repo for updates around this.
Firefox channels supported are stable, beta, nightly and ESR.
Chrome channels supported on Linux are stable, beta and unstable.
Microsoft Edge is supported on Windows and Safari on OSX.

To select a different browser and/or channel version, change environment variables BROWSER and BVER, then you can rerun the tests with the new browser.
```bash
export BROWSER=firefox BVER=nightly
```

Alternatively you can also do it without changing environment variables.
```bash
BROWSER=firefox BVER=nightly npm test
```

### Getting crash dumps from karma
Sometimes Chrome may crash when running the tests. This typically shows up in headless runs as a disconnect:
```
05 01 2018 10:42:14.225:WARN [HeadlessChrome 0.0.0 (Linux 0.0.0)]: Disconnected (1 times)
```

Follow these steps to get a crash dump:
* add a `browsers = [];` line in test/karma.conf.js to stop karma from starting Chrome
* change `singlerun` to `false` in test/karma.conf.js
* run `node_modules/.bin/karma start test/karma.conf.js` in a terminal to start a karma server
* start Chrome with `google-chrome --use-fake-device-for-media-stream --use-fake-ui-for-media-stream http://localhost:9876` 
* run `node_modules/.bin/karma run test/karma.conf.js` to start the karma run
* wait for the "awww snap" :-)
