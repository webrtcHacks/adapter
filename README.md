[![Build Status](https://travis-ci.org/webrtc/adapter.svg)](https://travis-ci.org/webrtc/adapter)

# WebRTC adapter #
[adapter.js] is a shim to insulate apps from spec changes and prefix differences. In fact, the standards and protocols used for WebRTC implementations are highly stable, and there are only a few prefixed names. For full interop information, see [webrtc.org/web-apis/interop](http://www.webrtc.org/web-apis/interop).

## Install ##
#### Bower
```bash
bower install webrtc-adapter
```
#### Inclusion on Browser
```html
<script src="bower_components/webrtc-adapter/adapter.js"></script>
```
#### NPM
```bash
npm install webrtc-adapter-test
```
#### Inclusion on Browser
Copy to desired location in your src tree or use a minify/vulcanize tool (node_modules is usually not published with the code).
See [webrtc/samples repo](https://github.com/webrtc/samples/blob/master/package.json) as an example on how you can do this.

## Development ##
Detailed information on developing in the [webrtc](https://github.com/webrtc) github repo can be found in the [WebRTC GitHub repo developer's guide](https://docs.google.com/document/d/1tn1t6LW2ffzGuYTK3366w1fhTkkzsSvHsBnOHoDfRzY/edit?pli=1#heading=h.e3366rrgmkdk).

This guide assumes you are running a Debian based Linux distribution (travis-multirunner currently fetches .deb browser packages).

#### Clone the repo in desired folder
```bash
git clone https://github.com/webrtc/adapter.git
```

#### Install npm dependencies
Chrome stable is currently installed as the default browser for the tests.
```bash
sudo npm install
```

#### Run tests
Runs the tests in test/tests.js using testling.
```bash
npm test
```

#### Change browser and channel/version for testing
Export desired browser and channel/version(BVER) (Chrome and Firefox is currently supported, check [travis-multirunner](https://github.com/DamonOehlman/travis-multirunner/blob/master/) repo for updates around this).
Current Firefox channels are stable, beta and nightly.
Current Chrome channels for Linux are stable, beta and unstable.

Export env variables BROWSER and BVER to change browser and channel/version and the rerun the tests:
```bash
export BROWSER=firefox BVER=nightly
```
