/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* jshint node: true */

'use strict';

// This is a basic test file for use with testling and webdriver.
// The test script language comes from tape.

var test = require('tape');
var webdriver = require('selenium-webdriver');
var seleniumHelpers = require('./selenium-lib');

// Start of tests.

test('Log suppression', function(t) {
  var driver = seleniumHelpers.buildDriver();

  // Define test.
  var testDefinition = function() {
    // adapter.js is not supposed to spill console.log
    // when used as a module. This temporarily overloads
    // console.log so we can assert this.
    var logCount = 0;
    var saveConsole = console.log.bind(console);
    console.log = function() {
      logCount++;
      saveConsole.apply(saveConsole, arguments);
    };
    console.log = saveConsole;
    console.log('TryToIncreaseLogCount');
    return logCount;
  };

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.pass('Page loaded');
    return driver.executeScript(testDefinition);
  })
  .then(function(logCount) {
    t.ok(logCount === 0, 'adapter.js does not use console.log');
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Browser identified', function(t) {
  var driver = seleniumHelpers.buildDriver();

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.plan(4);
    t.pass('Page loaded');
    return driver.executeScript('return webrtcDetectedBrowser');
  })
  .then(function(webrtcDetectedBrowser) {
    t.ok(webrtcDetectedBrowser, 'Browser detected: ' + webrtcDetectedBrowser);
    return driver.executeScript('return webrtcDetectedVersion');
  })
  .then(function(webrtcDetectVersion) {
    t.ok(webrtcDetectVersion, 'Browser version detected: ' +
        webrtcDetectVersion);
    return driver.executeScript('return webrtcMinimumVersion');
  })
  .then(function(webrtcMinimumVersion) {
    t.ok(webrtcMinimumVersion, 'Minimum Browser version detected: ' +
        webrtcMinimumVersion);
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Browser supported by adapter.js', function(t) {
  var driver = seleniumHelpers.buildDriver();

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.plan(2);
    t.pass('Page loaded');
  })
  .then(function() {
    return driver.executeScript(
      'return webrtcDetectedVersion >= webrtcMinimumVersion');
  })
  .then(function(webrtcVersionIsGreaterOrEqual) {
    t.ok(webrtcVersionIsGreaterOrEqual,
        'Browser version supported by adapter.js');
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('getUserMedia shim', function(t) {
  var driver = seleniumHelpers.buildDriver();

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.plan(3);
    t.pass('Page loaded');
    return driver.executeScript(
      'return typeof navigator.getUserMedia !== \'undefined\'');
  })
  .then(function(isGetUserMediaDefined) {
    t.ok(isGetUserMediaDefined, 'navigator.getUserMedia is defined');
    return driver.executeScript(
      'return typeof navigator.mediaDevices.getUserMedia !== \'undefined\'');
  })
   .then(function(isMediaDevicesDefined) {
    t.ok(isMediaDevicesDefined,
      'navigator.mediaDevices.getUserMedia is defined');
    t.end();
  })
 .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('RTCPeerConnection shim', function(t) {
  var driver = seleniumHelpers.buildDriver();

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.plan(4);
    t.pass('Page loaded');
    return driver.executeScript(
      'return window.RTCPeerConnection !== \'undefined\'');
  })
  .then(function(isRTCPeerConnectionDefined) {
    t.ok(isRTCPeerConnectionDefined, 'RTCPeerConnection is defined');
    return driver.executeScript(
      'return typeof window.RTCSessionDescription !== \'undefined\'');
  })
  .then(function(isRTCSessionDescriptionDefined) {
    t.ok(isRTCSessionDescriptionDefined, 'RTCSessionDescription is defined');
    return driver.executeScript(
      'return typeof window.RTCIceCandidate !== \'undefined\'');
  })
  .then(function(isRTCIceCandidateDefined) {
    t.ok(isRTCIceCandidateDefined, 'RTCIceCandidate is defined');
    t.end();
  })
  .then(null, function(err) {
    t.fail(err);
    t.end();
  });
});

test('Create RTCPeerConnection', function(t) {
  var driver = seleniumHelpers.buildDriver();

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.plan(2);
    t.pass('Page loaded');
    return driver.executeScript(
      'return typeof(new RTCPeerConnection()) === \'object\'');
  })
  .then(function(hasRTCPeerconnectionObjectBeenCreated) {
    t.ok(hasRTCPeerconnectionObjectBeenCreated,
      'RTCPeerConnection constructor');
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('attachMediaStream', function(t) {
  var driver = seleniumHelpers.buildDriver();

  // Define test.
  var testDefinition = function() {
    var constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      var video = document.createElement('video');
      video.setAttribute('id', 'video');
      // If attachMediaStream works, we should get a video
      // at some point. This will trigger onloadedmetadata.
      // Firefox < 38 had issues with this, workaround removed
      // due to 38 being stable now.
      video.addEventListener('loadedmetadata', function() {
        document.body.appendChild(video);
      });

      attachMediaStream(video, stream);
    })
    .catch(function(err) {
      window.gumError = err.message;
    });
  };

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.plan(6);
    t.pass('Page loaded');
    return driver.executeScript(testDefinition)
    .then(function() {
      return driver.executeScript('return window.gumError');
    });
  })
  .then(function(error) {
    var errorMessage = (error) ? 'error: ' + error : 'no errors';
    t.ok(!error, 'getUserMedia result:  ' + errorMessage);
    // Make sure the stream has some time go get started.
    driver.wait(function() {
      return driver.executeScript(
        'return typeof window.stream !== \'undefined\'');
    }, 5000);
    return driver.executeScript(
      // Firefox and Chrome have different constructor names.
      'return window.stream.constructor.name.match(\'MediaStream\') !== null');
  })
  .then(function(isMediaStream) {
    t.ok(isMediaStream, 'Stream is a MediaStream');
    // Wait until loadedmetadata event has fired and appended video element.
    // 5 second timeout in case the event does not fire for some reason.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('video')), 5000);
  })
  .then(function(videoElement) {
    t.pass('attachMediaStream succesfully attached stream to video element');
    videoElement.getAttribute('videoWidth')
    .then(function(width) {
      t.ok(width > 2, 'Video width is: ' + width);
    })
    .then(function() {
      videoElement.getAttribute('videoHeight')
      .then(function(height) {
        t.ok(height > 2, 'Video height is: ' + height);
      });
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('reattachMediaStream', function(t) {
  var driver = seleniumHelpers.buildDriver();

  // Define test.
  var testDefinition = function() {
    var constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      var video = document.createElement('video');
      var video2 = document.createElement('video');
      video.setAttribute('id', 'video');
      video2.setAttribute('id', 'video2');
      // If attachMediaStream works, we should get a video
      // at some point. This will trigger onloadedmetadata.
      // This reattaches to the second video which will trigger
      // onloadedmetadata there.
      video.addEventListener('loadedmetadata', function() {
        document.body.appendChild(video);
        reattachMediaStream(video2, video);
      });
      video2.addEventListener('loadedmetadata', function() {
        document.body.appendChild(video2);
      });

      attachMediaStream(video, stream);
    })
    .catch(function(err) {
      window.gumError = err.name;
    });
  };

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.plan(9);
    t.pass('Page loaded');
    return driver.executeScript(testDefinition)
    .then(function() {
      return driver.executeScript('return window.gumError');
    });
  })
  .then(function(error) {
    var errorMessage = (error) ? 'error: ' + error : 'no errors';
    t.ok(!error, 'getUserMedia result:  ' + errorMessage);
    return driver.executeScript(
      // Firefox and Chrome have different constructor names.
      'return window.stream.constructor.name.match(\'MediaStream\') !== null');
  })
  .then(function(isMediaStream) {
    t.ok(isMediaStream, 'Stream is a MediaStream');
    // Wait until loadedmetadata event has fired and appended video element.
    // 5 second timeout in case the event does not fire for some reason.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('video')), 5000);
  })
  .then(function(videoElement) {
    t.pass('attachMediaStream succesfully attached stream to video element');
    videoElement.getAttribute('videoWidth')
    .then(function(width) {
      t.ok(width > 2, 'Video width is: ' + width);
    })
    .then(function() {
      videoElement.getAttribute('videoHeight')
      .then(function(height) {
        t.ok(height > 2, 'Video height is: ' + height);
      });
    });
    // Wait until loadedmetadata event has fired and appended video element.
    // 5 second timeout in case the event does not fire for some reason.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('video2')), 5000);
  })
  .then(function(videoElement2) {
    t.pass('attachMediaStream succesfully re-attached stream to video element');
    videoElement2.getAttribute('videoWidth')
    .then(function(width) {
      t.ok(width > 2, 'Video2 width is: ' + width);
    })
    .then(function() {
      videoElement2.getAttribute('videoHeight')
      .then(function(height) {
        t.ok(height > 2, 'Video2 height is: ' + height);
      });
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Video srcObject getter/setter test', function(t) {
  var driver = seleniumHelpers.buildDriver();
  // Define test.
  var testDefinition = function() {
    var constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      var video = document.createElement('video');
      video.setAttribute('id', 'video');
      video.srcObject = stream;

      // If attachMediaStream works, we should get a video
      // at some point. This will trigger onloadedmetadata.
      video.addEventListener('loadedmetadata', function() {
        document.body.appendChild(video);
      });
    })
    .catch(function(err) {
      window.gumError = err.name;
    });
  };

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.plan(3);
    t.pass('Page loaded');
    driver.executeScript(testDefinition);
    return driver.executeScript('return window.gumError');
  })
  .then(function(error) {
    var errorMessage = (error) ? 'error: ' + error : 'no errors';
    t.ok(!error, 'getUserMedia result:  ' + errorMessage);
    // Wait until loadedmetadata event has fired and appended video element.
    // 5 second timeout in case the event does not fire for some reason.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('video')), 5000);
  })
  .then(function() {
    return driver.executeScript(
        'return document.getElementById(\'video\').srcObject.id')
    .then(function(srcObjectId) {
      return srcObjectId;
    })
    .then(function(srcObjectId) {
      driver.executeScript('return window.stream.id')
      .then(function(streamId) {
        t.ok(srcObjectId === streamId,
            'srcObject getter returns stream object');
      });
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Audio srcObject getter/setter test', function(t) {
  var driver = seleniumHelpers.buildDriver();
  // Define test.
  var testDefinition = function() {
    var constraints = {video: false, audio: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      var audio = document.createElement('audio');
      audio.setAttribute('id', 'audio');
      audio.srcObject = stream;

      // If attachMediaStream works, we should get a video
      // at some point. This will trigger onloadedmetadata.
      audio.addEventListener('loadedmetadata', function() {
        document.body.appendChild(audio);
      });
    })
    .catch(function(err) {
      window.gumError = err.name;
    });
  };

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.plan(3);
    t.pass('Page loaded');
    driver.executeScript(testDefinition);
    return driver.executeScript('return window.gumError');
  })
  .then(function(error) {
    var errorMessage = (error) ? 'error: ' + error : 'no errors';
    t.ok(!error, 'getUserMedia result:  ' + errorMessage);
    // Wait until loadedmetadata event has fired and appended video element.
    // 5 second timeout in case the event does not fire for some reason.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('audio')), 5000);
  })
  .then(function() {
    return driver.executeScript(
        'return document.getElementById(\'audio\').srcObject.id')
    .then(function(srcObjectId) {
      return srcObjectId;
    })
    .then(function(srcObjectId) {
      driver.executeScript('return window.stream.id')
      .then(function(streamId) {
        t.ok(srcObjectId === streamId,
            'srcObject getter returns stream object');
      });
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('srcObject set from another object', function(t) {
  var driver = seleniumHelpers.buildDriver();

  // Define test.
  var testDefinition = function() {
    var constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      var video = document.createElement('video');
      var video2 = document.createElement('video2');
      video.setAttribute('id', 'video');
      video2.setAttribute('id', 'video2');
      video.srcObject = stream;
      video2.srcObject = video.srcObject;

      // If attachMediaStream works, we should get a video
      // at some point. This will trigger onloadedmetadata.
      video.addEventListener('loadedmetadata', function() {
        document.body.appendChild(video);
        document.body.appendChild(video2);
      });
    })
    .catch(function(err) {
      window.gumError = err.name;
    });
  };

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.plan(3);
    t.pass('Page loaded');
    driver.executeScript(testDefinition);
    return driver.executeScript('return window.error');
  })
  .then(function(error) {
    var errorMessage = (error) ? 'error: ' + error : 'no errors';
    t.ok(!error, 'getUserMedia result:  ' + errorMessage);
    // Wait until loadedmetadata event has fired and appended video element.
    // 5 second timeout in case the event does not fire for some reason.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('video2')), 5000);
  })
  .then(function() {
    return driver.executeScript(
        'return document.getElementById(\'video\').srcObject.id')
    .then(function(srcObjectId) {
      return srcObjectId;
    })
    .then(function(srcObjectId) {
      driver.executeScript(
        'return document.getElementById(\'video2\').srcObject.id')
      .then(function(srcObjectId2) {
        t.ok(srcObjectId === srcObjectId2,
            'Stream ids from srcObjects match.');
      });
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Attach mediaStream directly', function(t) {
  var driver = seleniumHelpers.buildDriver();

  // Define test.
  var testDefinition = function() {
    var constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      var video = document.createElement('video');
      video.setAttribute('id', 'video');
      // If attachMediaStream works, we should get a video
      // at some point. This will trigger onloadedmetadata.
      // Firefox < 38 had issues with this, workaround removed
      // due to 38 being stable now.
      video.addEventListener('loadedmetadata', function() {
        document.body.appendChild(video);
      });

      video.srcObject = stream;
    })
    .catch(function(err) {
      window.gumError = err.name;
    });
  };

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.plan(6);
    t.pass('Page loaded');
    return driver.executeScript(testDefinition)
    .then(function() {
      return driver.executeScript('return window.gumError');
    });
  })
  .then(function(error) {
    var errorMessage = (error) ? 'error: ' + error : 'no errors';
    t.ok(!error, 'getUserMedia result:  ' + errorMessage);
    // Make sure the stream has some time go get started.
    driver.wait(function() {
      return driver.executeScript(
        'return typeof window.stream !== \'undefined\'');
    }, 5000);
    return driver.executeScript(
      // Firefox and Chrome have different constructor names.
      'return window.stream.constructor.name.match(\'MediaStream\') !== null');
  })
  .then(function(isMediaStream) {
    t.ok(isMediaStream, 'Stream is a MediaStream');
    // Wait until loadedmetadata event has fired and appended video element.
    // 5 second timeout in case the event does not fire for some reason.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('video')), 5000);
  })
  .then(function(videoElement) {
    t.pass('Stream attached directly succesfully to a video element');
    videoElement.getAttribute('videoWidth')
    .then(function(width) {
      t.ok(width > 2, 'Video width is: ' + width);
    })
    .then(function() {
      videoElement.getAttribute('videoHeight')
      .then(function(height) {
        t.ok(height > 2, 'Video height is: ' + height);
      });
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Re-attaching mediaStream directly', function(t) {
  var driver = seleniumHelpers.buildDriver();

  // Define test.
  var testDefinition = function() {
    var constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      var video = document.createElement('video');
      var video2 = document.createElement('video');
      video.setAttribute('id', 'video');
      video2.setAttribute('id', 'video2');
      // If attachMediaStream works, we should get a video
      // at some point. This will trigger onloadedmetadata.
      // This reattaches to the second video which will trigger
      // onloadedmetadata there.
      video.addEventListener('loadedmetadata', function() {
        document.body.appendChild(video);
        video2.srcObject = video.srcObject;
      });
      video2.addEventListener('loadedmetadata', function() {
        document.body.appendChild(video2);
      });

      video.srcObject = stream;
    })
    .catch(function(err) {
      window.gumError = err.name;
    });
  };

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.plan(9);
    t.pass('Page loaded');
    return driver.executeScript(testDefinition)
    .then(function() {
      return driver.executeScript('return window.gumError');
    });
  })
  .then(function(error) {
    var errorMessage = (error) ? 'error: ' + error : 'no errors';
    t.ok(!error, 'getUserMedia result:  ' + errorMessage);
    return driver.wait(function() {
      return driver.executeScript(
        'return typeof window.stream !== \'undefined\'');
    })
    .then(function() {
      return driver.executeScript(
      // Firefox and Chrome have different constructor names.
      'return window.stream.constructor.name.match(\'MediaStream\') !== null');
    });
  })
  .then(function(isMediaStream) {
    t.ok(isMediaStream, 'Stream is a MediaStream');
    // Wait until loadedmetadata event has fired and appended video element.
    // 5 second timeout in case the event does not fire for some reason.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('video')), 5000);
  })
  .then(function(videoElement) {
    t.pass('Stream attached directly succesfully to a video element');
    videoElement.getAttribute('videoWidth')
    .then(function(width) {
      t.ok(width > 2, 'Video width is: ' + width);
    })
    .then(function() {
      videoElement.getAttribute('videoHeight')
      .then(function(height) {
        t.ok(height > 2, 'Video height is: ' + height);
      });
    });
    // Wait until loadedmetadata event has fired and appended video element.
    // 5 second timeout in case the event does not fire for some reason.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('video2')), 5000);
  })
  .then(function(videoElement2) {
    t.pass('Stream re-attached directly succesfully to a video element');
    videoElement2.getAttribute('videoWidth')
    .then(function(width) {
      t.ok(width > 2, 'Video2 width is: ' + width);
    })
    .then(function() {
      videoElement2.getAttribute('videoHeight')
      .then(function(height) {
        t.ok(height > 2, 'Video2 height is: ' + height);
      });
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Call getUserMedia with impossible constraints', function(t) {
  var driver = seleniumHelpers.buildDriver();

  // Define test.
  var testDefinition = function() {
    var impossibleConstraints = {
      video: {
        width: 1280,
        height: {min: 200, ideal: 720, max: 1080},
        frameRate: {exact: 0} // to fail
      }
    };
    // TODO: Remove when firefox 42+ accepts impossible constraints
    // on fake devices.
    if (webrtcDetectedBrowser === 'firefox') {
      impossibleConstraints.fake = false;
    }
    navigator.mediaDevices.getUserMedia(impossibleConstraints)
    .then(function(stream) {
      window.stream = stream;
    })
    .catch(function(err) {
      window.gumError = err;
    });
  };

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.plan(2);
    t.pass('Page loaded');
    return driver.executeScript(
      'return webrtcDetectedBrowser === \'firefox\' ' +
      '&& webrtcDetectedVersion < 42');
  })
  .then(function(isFirefoxAndVersionLessThan42) {
    if (isFirefoxAndVersionLessThan42) {
      t.skip('getUserMedia(impossibleConstraints) must fail');
      throw 'skip-test';
    }
    return driver.executeScript(testDefinition)
    .then(function() {
      return driver.wait(function() {
        return driver.executeScript('return window.gumError');
      }, 5000);
    })
    .then(function(error) {
      t.ok(error, 'getUserMedia(impossibleConstraints) must fail');
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Check getUserMedia legacy constraints converter', function(t) {
  var driver = seleniumHelpers.buildDriver();

  var testDefinition = function() {
    // Used to collect the result of test.
    window.constraintsArray = [];
    // Helpers to test adapter's legacy constraints-manipulation.
    function pretendVersion(version, func) {
      var realVersion = webrtcDetectedVersion;
      window.webrtcTesting.version = version;
      func();
      window.webrtcTesting.version = realVersion;
    }

    function interceptGumForConstraints(gum, func) {
      var origGum = navigator[gum].bind(navigator);
      var netConstraints;
      navigator[gum] = function(constraints) {
        netConstraints = constraints;
      };
      func();
      navigator[gum] = origGum;
      return netConstraints;
    }

    function testBeforeAfterPairs(gum, pairs) {
      pairs.forEach(function(beforeAfter, counter) {
        var constraints = interceptGumForConstraints(gum, function() {
          navigator.getUserMedia(beforeAfter[0], function() {}, function() {});
        });
        window.constraintsArray.push([constraints, beforeAfter[1], gum,
            counter + 1]);
      });
    }

    var testFirefox = function() {
      pretendVersion(37, function() {
        testBeforeAfterPairs('mozGetUserMedia', [
          // Test that spec constraints get back-converted on FF37.
          [
           {
             video: {
               mediaSource: 'screen',
               width: 1280,
               height: {min: 200, ideal: 720, max: 1080},
               facingMode: 'user',
               frameRate: {exact: 50}
             }
           },
           {
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
           }
          ],
          // Test that legacy constraints pass through unharmed on FF37.
          [
           {
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
           },
           {
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
           }
          ],
        ]);
      });
      pretendVersion(38, function() {
        testBeforeAfterPairs('mozGetUserMedia', [
          // Test that spec constraints pass through unharmed on FF38+.
          [
           {
             video: {
               mediaSource: 'screen',
               width: 1280,
               height: {min: 200, ideal: 720, max: 1080},
               facingMode: 'user',
               frameRate: {exact: 50}
             }
           },
           {
             video: {
               mediaSource: 'screen',
               width: 1280,
               height: {min: 200, ideal: 720, max: 1080},
               facingMode: 'user',
               frameRate: {exact: 50}
             }
           },
          ],
        ]);
      });
    };

    var testChrome = function() {
      testBeforeAfterPairs('webkitGetUserMedia', [
        // Test that spec constraints get back-converted on Chrome.
        [
         {
           video: {
             width: 1280,
             height: {min: 200, ideal: 720, max: 1080},
             frameRate: {exact: 50}
           }
         },
         {
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
               {maxHeight: 720},
             ]
           }
         }
        ],
        // Test that legacy constraints pass through unharmed on Chrome.
        [
         {
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
               {maxHeight: 720},
             ]
           }
         },
         {
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
               {maxHeight: 720},
             ]
           }
         }
        ],
        // Test code protecting Chrome from choking on common unknown constraints.
        [
         {
           video: {
             mediaSource: 'screen',
             advanced: [
               {facingMode: 'user'}
             ],
             require: ['height', 'frameRate']
           }
         },
         {
           video: {
             optional: [
               {facingMode: 'user'}
             ]
           }
         }
        ]
      ]);
    };

    if (webrtcDetectedBrowser === 'chrome') {
      testChrome();
    } else if (webrtcDetectedBrowser === 'firefox') {
      testFirefox();
    } else {
      return window.constraintsArray.push('Unsupported browser');
    }
  };

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    // t.plan(2);
    t.pass('Page loaded');
    return driver.executeScript(testDefinition)
    .then(function() {
      return driver.executeScript('return window.constraintsArray');
    });
  })
  .then(function(constraintsArray) {
    if (constraintsArray[0] === 'Unsupported browser') {
      // Skipping if the browser is not supported.
      t.skip(constraintsArray);
      return;
    }
    // constraintsArray[constr][0] = Constraints to adapter.js.
    // constraintsArray[constr][1] = Constraints from adapter.js.
    // constraintsArray[constr][2] = Constraint pair counter.
    // constraintsArray[constr][3] = getUserMedia API called.
    for (var constr = 0; constr < constraintsArray.length; constr++) {
      t.deepEqual(constraintsArray[constr][0], constraintsArray[constr][1],
          'Constraints ' + constraintsArray[constr][3] +
          ' back-converted to: ' + constraintsArray[constr][2]);
    }
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Basic connection establishment', function(t) {
  var driver = seleniumHelpers.buildDriver();

  var testDefinition = function() {
    var counter = 1;
    window.testPassed = [];
    window.testFailed = [];
    window.pc1 = new RTCPeerConnection(null);
    window.pc2 = new RTCPeerConnection(null);
    window.ended = false;

    window.pc1.oniceconnectionstatechange = function() {
      if (window.pc1.iceConnectionState === 'connected' ||
          window.pc1.iceConnectionState === 'completed') {
        window.pc1.connectionStatus = window.pc1.iceConnectionState;
        if (!window.ended) {
          window.ended = true;
        }
      }
    };

    var addCandidate = function(pc, event) {
      if (event.candidate) {
        var cand = new RTCIceCandidate(event.candidate);
        pc.addIceCandidate(cand,
          function() {
            // TODO: Decide if we are intereted in adding all candidates
            // as passed tests.
            window.testPassed.push('addIceCandidate ' + counter++);
          },
          function(err) {
            window.testFailed.push('addIceCandidate ' + err.toString());
          }
        );
      }
    };
    window.pc1.onicecandidate = function(event) {
      addCandidate(window.pc2, event);
    };
    window.pc2.onicecandidate = function(event) {
      addCandidate(window.pc1, event);
    };

    var constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.pc1.addStream(stream);

      window.pc1.createOffer(
        function(offer) {
          window.testPassed.push('pc1.createOffer');
          window.pc1.setLocalDescription(offer,
            function() {
              window.testPassed.push('pc1.setLocalDescription');

              offer = new RTCSessionDescription(offer);
              window.testPassed.push(
                'created RTCSessionDescription from offer');
              window.pc2.setRemoteDescription(offer,
                function() {
                  window.testPassed.push('pc2.setRemoteDescription');
                  window.pc2.createAnswer(
                    function(answer) {
                      window.testPassed.push('pc2.createAnswer');
                      window.pc2.setLocalDescription(answer,
                        function() {
                          window.testPassed.push('pc2.setLocalDescription');
                          answer = new RTCSessionDescription(answer);
                          window.testPassed.push(
                            'created RTCSessionDescription from answer');
                          window.pc1.setRemoteDescription(answer,
                            function() {
                              window.testPassed.push(
                                'pc1.setRemoteDescription');
                            },
                            function(err) {
                              window.testFailed.push(
                                'pc1.setRemoteDescription ' + err.toString());
                            }
                          );
                        },
                        function(err) {
                          window.testFailed.push(
                            'pc2.setLocalDescription ' + err.toString());
                        }
                      );
                    },
                    function(err) {
                      window.testFailed.push(
                        'pc2.createAnswer ' + err.toString());
                    }
                  );
                },
                function(err) {
                  window.testFailed.push(
                    'pc2.setRemoteDescription ' + err.toString());
                }
              );
            },
            function(err) {
              window.testFailed.push(
                'pc1.setLocalDescription ' + err.toString());
            }
          );
        },
        function(err) {
          window.testFailed.push(
            'pc1 failed to create offer ' + err.toString());
        }
      );
    });
  };

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.pass('Page loaded');
    return driver.executeScript(testDefinition)
    .then(function() {
      return driver.wait(function() {
        return driver.executeScript('return window.pc1.connectionStatus === ' +
            '\'completed\' || \'connected\'');
      }, 5000);
    });
  })
  .then(function(pc1ConnectionStatus) {
    t.ok(pc1ConnectionStatus, 'P2P connection established');
    return driver.wait(function() {
      return driver.executeScript('return window.ended');
    });
  })
  .then(function() {
    return driver.executeScript('return window.testPassed');
  })
  .then(function(testPassed) {
    return driver.executeScript('return window.testFailed')
    .then(function(testFailed) {
      for (var testPass = 0; testPass < testPassed.length; testPass++) {
        t.pass(testPassed[testPass]);
      }
      for (var testFail = 0; testFail < testFailed.length; testFail++) {
        t.fail(testFailed[testFail]);
      }
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Basic connection establishment with promise', function(t) {
  var driver = seleniumHelpers.buildDriver();

  var testDefinition = function() {
    var counter = 1;
    window.testPassed = [];
    window.testFailed = [];
    window.pc1 = new RTCPeerConnection(null);
    window.pc2 = new RTCPeerConnection(null);
    window.ended = false;

    window.pc1.oniceconnectionstatechange = function() {
      if (window.pc1.iceConnectionState === 'connected' ||
          window.pc1.iceConnectionState === 'completed') {
        window.testPassed.push('P2P connection established');
        if (!window.ended) {
          window.ended = true;
        }
      }
    };

    var addCandidate = function(pc, event) {
      if (event.candidate) {
        var cand = new RTCIceCandidate(event.candidate);
        pc.addIceCandidate(cand).then(function() {
          // TODO: Decide if we are intereted in adding all candidates
          // as passed tests.
          window.testPassed.push('addIceCandidate ' + counter++);
        })
        .catch(function(err) {
          window.testFailed.push('addIceCandidate ' + err.toString());
        });
      }
    };
    window.pc1.onicecandidate = function(event) {
      addCandidate(window.pc2, event);
    };
    window.pc2.onicecandidate = function(event) {
      addCandidate(window.pc1, event);
    };

    var constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.pc1.addStream(stream);
      window.pc1.createOffer().then(function(offer) {
        window.testPassed.push('pc1.createOffer');
        return window.pc1.setLocalDescription(offer);
      }).then(function() {
        window.testPassed.push('pc1.setLocalDescription');
        return window.pc2.setRemoteDescription(window.pc1.localDescription);
      }).then(function() {
        window.testPassed.push('pc2.setRemoteDescription');
        return window.pc2.createAnswer();
      }).then(function(answer) {
        window.testPassed.push('pc2.createAnswer');
        return window.pc2.setLocalDescription(answer);
      }).then(function() {
        window.testPassed.push('pc2.setLocalDescription');
        return window.pc1.setRemoteDescription(window.pc2.localDescription);
      }).then(function() {
        window.testPassed.push('pc1.setRemoteDescription');
      }).catch(function(err) {
        window.testfailed.push(err.toString());
      });
    });
  };

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.pass('Page loaded');
    return driver.executeScript(testDefinition)
    .then(function() {
      return driver.wait(function() {
        return driver.executeScript('return window.pc1.connectionStatus === ' +
            '\'completed\' || \'connected\'');
      });
    });
  })
  .then(function(pc1ConnectionStatus) {
    t.ok(pc1ConnectionStatus, 'P2P connection established');
    return driver.wait(function() {
      return driver.executeScript('return window.ended');
    }, 5000);
  })
  .then(function() {
    return driver.executeScript('return window.testPassed');
  })
  .then(function(testPassed) {
    return driver.executeScript('return window.testFailed')
    .then(function(testFailed) {
      for (var testPass = 0; testPass < testPassed.length; testPass++) {
        t.pass(testPassed[testPass]);
      }
      for (var testFail = 0; testFail < testFailed.length; testFail++) {
        t.fail(testFailed[testFail]);
      }
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Basic connection establishment with datachannel', function(t) {
  var driver = seleniumHelpers.buildDriver();

  var testDefinition = function() {
    var counter = 1;
    window.testPassed = [];
    window.testFailed = [];
    window.pc1 = new RTCPeerConnection(null);
    window.pc2 = new RTCPeerConnection(null);
    window.ended = false;

    window.pc1.oniceconnectionstatechange = function() {
      if (window.pc1.iceConnectionState === 'connected' ||
          window.pc1.iceConnectionState === 'completed') {
        window.testPassed.push('P2P connection established');
        if (!window.ended) {
          window.ended = true;
        }
      }
    };

    var addCandidate = function(pc, event) {
      if (event.candidate) {
        var cand = new RTCIceCandidate(event.candidate);
        pc.addIceCandidate(cand).then(function() {
          // TODO: Decide if we are intereted in adding all candidates
          // as passed tests.
          window.testPassed.push('addIceCandidate ' + counter++);
        })
        .catch(function(err) {
          window.testFailed.push('addIceCandidate ' + err.toString());
        });
      }
    };
    window.pc1.onicecandidate = function(event) {
      addCandidate(window.pc2, event);
    };
    window.pc2.onicecandidate = function(event) {
      addCandidate(window.pc1, event);
    };

    window.pc1.createDataChannel('somechannel');
    window.pc1.createOffer().then(function(offer) {
      window.testPassed.push('pc1.createOffer');
      return window.pc1.setLocalDescription(offer);
    }).then(function() {
      window.testPassed.push('pc1.setLocalDescription');
      return window.pc2.setRemoteDescription(window.pc1.localDescription);
    }).then(function() {
      window.testPassed.push('pc2.setRemoteDescription');
      return window.pc2.createAnswer();
    }).then(function(answer) {
      window.testPassed.push('pc2.createAnswer');
      return window.pc2.setLocalDescription(answer);
    }).then(function() {
      window.testPassed.push('pc2.setLocalDescription');
      return window.pc1.setRemoteDescription(window.pc2.localDescription);
    }).then(function() {
      window.testPassed.push('pc1.setRemoteDescription');
    }).catch(function(err) {
      window.testFailed.push(err.toString());
    });
  };

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.pass('Page loaded');
    return driver.executeScript(testDefinition)
    .then(function() {
      return driver.executeScript(
        'return typeof window.pc1.createDataChannel === \'function\'');
    });
  })
  .then(function(isDataChannelSupported) {
    if (!isDataChannelSupported) {
      t.skip('Data channel is not supported.');
      throw 'skip-test';
    }
    return driver.wait(function() {
      return driver.executeScript('return window.pc1.connectionStatus === ' +
          '\'completed\' || \'connected\'');
    });
  })
  .then(function(pc1ConnectionStatus) {
    t.ok(pc1ConnectionStatus, 'P2P connection established');
    return driver.wait(function() {
      return driver.executeScript('return window.ended');
    });
  })
  .then(function() {
    return driver.executeScript('return window.testPassed');
  })
  .then(function(testPassed) {
    return driver.executeScript('return window.testFailed')
    .then(function(testFailed) {
      for (var testPass = 0; testPass < testPassed.length; testPass++) {
        t.pass(testPassed[testPass]);
      }
      for (var testFail = 0; testFail < testFailed.length; testFail++) {
        t.fail(testFailed[testFail]);
      }
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('call enumerateDevices', function(t) {
  var driver = seleniumHelpers.buildDriver();

  var testDefinition = function() {
    navigator.mediaDevices.enumerateDevices()
    .then(function(devices) {
      window.devices = devices;
    })
    .catch(function(err) {
      window.error = err.name;
      t.end();
    });
  };

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.pass('Page loaded');
    return driver.executeScript(testDefinition)
    .then(function() {
      return driver.executeScript('return window.gumError');
    });
  })
  .then(function(error) {
    var errorMessage = (error) ? 'error: ' + error : 'no errors';
    t.ok(!error, 'getUserMedia result:  ' + errorMessage);
    return driver.wait(function() {
      return driver.executeScript('return window.devices');
    });
  })
  .then(function(devices) {
    t.ok(typeof devices.length === 'number', 'Produced a devices array');
    devices.forEach(function(device) {
      t.ok(device.kind === 'videoinput' ||
           device.kind === 'audioinput' ||
           device.kind === 'audiooutput', 'Known device kind');
      t.ok(device.deviceId.length !== undefined, 'Device id present');
      t.ok(device.label.length !== undefined, 'Device label present');
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

// Test that adding and removing an eventlistener on navigator.mediaDevices
// is possible. The usecase for this is the devicechanged event.
// This does not test whether devicechanged is actually called.
test('navigator.mediaDevices eventlisteners', function(t) {
  var driver = seleniumHelpers.buildDriver();

  // Run test.
  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.plan(3);
    t.pass('Page loaded');
    return driver.executeScript(
      'return typeof(navigator.mediaDevices.addEventListener) === ' +
          '\'function\'');
  })
  .then(function(isAddEventListenerFunction) {
    t.ok(isAddEventListenerFunction,
        'navigator.mediaDevices.addEventListener is a function');
    return driver.executeScript(
    'return typeof(navigator.mediaDevices.removeEventListener) === ' +
         '\'function\'');
  })
  .then(function(isRemoveEventListenerFunction) {
    t.ok(isRemoveEventListenerFunction,
      'navigator.mediaDevices.removeEventListener is a function');
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

// // Test that getUserMedia is shimmed properly.
// test('navigator.mediaDevices.getUserMedia', function(t) {
//   navigator.mediaDevices.getUserMedia({video: true, fake: true})
//   .then(function(stream) {
//     t.ok(stream.getVideoTracks().length > 0, 'Got stream with video tracks.');
//     t.end();
//   })
//   .catch(function(err) {
//     t.fail('getUserMedia failed with error: ' + err.toString());
//     t.end();
//   });
// });

// // Test Chrome polyfill for getStats.
// test('getStats', function(t) {
//   var pc1 = new RTCPeerConnection(null);

//   // Test expected new behavior.
//   new Promise(function(resolve, reject) {
//     pc1.getStats(null, resolve, reject);
//   })
//   .then(function(report) {
//     t.equal(typeof(report), 'object', 'report is an object.');
//     for (var key in report) {
//       // This avoids problems with Firefox
//       if (typeof(report[key]) === 'function') {
//         continue;
//       }
//       t.equal(report[key].id, key, 'report key matches stats id.');
//     }
//     t.end();
//   })
//   .catch(function(err) {
//     t.fail('getStats() should never fail with error: ' + err.toString());
//     t.end();
//   });
// });

// // Test that polyfill for Chrome getStats falls back to builtin functionality
// // when the old getStats function signature is used; when the callback is passed
// // as the first argument.
// test('originalChromeGetStats', function(t) {
//   var pc1 = new RTCPeerConnection(null);

//   if (m.webrtcDetectedBrowser === 'chrome') {
//     new Promise(function(resolve, reject) {  // jshint ignore: line
//       pc1.getStats(resolve, null);
//     })
//     .then(function(response) {
//       var reports = response.result();
//       reports.forEach(function(report) {
//         t.equal(typeof(report), 'object');
//         t.equal(typeof(report.id), 'string');
//         t.equal(typeof(report.type), 'string');
//         t.equal(typeof(report.timestamp), 'object');
//         report.names().forEach(function(name) {
//           t.notEqual(report.stat(name), null,
//               'stat ' +
//               name + ' not equal to null');
//         });
//       });
//       t.end();
//     })
//     .catch(function(err) {
//       t.fail('getStats() should never fail with error: ' + err.toString());
//       t.end();
//     });
//   } else {
//     // All other browsers.
//     t.end();
//   }
// });

// test('getStats promise', function(t) {
//   t.plan(2);
//   var pc1 = new m.RTCPeerConnection(null);

//   var p = pc1.getStats();
//   t.ok(typeof p === 'object', 'getStats with no arguments returns a Promise');

//   var q = pc1.getStats(null);
//   t.ok(typeof q === 'object', 'getStats with a selector returns a Promise');
// });

// test('iceTransportPolicy relay functionality', function(t) {
//   // iceTransportPolicy is renamed to iceTransports in Chrome by
//   // adapter, this tests that when not setting any TURN server,
//   // no candidates are generated.
//   if (m.webrtcDetectedBrowser === 'firefox') {
//     t.pass('iceTransportPolicy is not implemented in Firefox yet.');
//     t.end();
//     return;
//   }
//   var pc1 = new RTCPeerConnection({iceTransportPolicy: 'relay',
//       iceServers: []});

//   // Since we try to gather only relay candidates without specifying
//   // a TURN server, we should not get any candidates.
//   var candidates = [];
//   pc1.onicecandidate = function(event) {
//     if (!event.candidate) {
//       if (candidates.length === 0) {
//         t.pass('no candidates were gathered.');
//         t.end();
//       } else {
//         t.fail('got unexpected candidates. ' + JSON.stringify(candidates));
//       }
//     } else {
//       candidates.push(event.candidate);
//     }
//   };

//   var constraints = {video: true, fake: true};
//   navigator.mediaDevices.getUserMedia(constraints)
//   .then(function(stream) {
//     pc1.addStream(stream);
//     pc1.createOffer().then(function(offer) {
//       return pc1.setLocalDescription(offer);
//     }).catch(function(err) {
//       t.fail(err.toString());
//     });
//   });
// });

// // This MUST to be the last test since it loads adapter
// // again which may result in unintended behaviour.
// test('Non-module logging to console still works', function(t) {
//   var logCount = 0;
//   var saveConsole = console.log.bind(console);
//   console.log = function() {
//     logCount++;
//   };
//   var script = document.createElement('script');
//   script.src = 'adapter.js';
//   script.type = 'text/javascript';
//   script.async = false;
//   (document.head || document.documentElement).appendChild(script);
//   script.parentNode.removeChild(script);

//   // Using setTimeout is easier than prefetching the script.
//   window.setTimeout(function() {
//     console.log = saveConsole;
//     t.ok(logCount > 0, 'A log message appeared on the console.');

//     // Check for existence of variables and functions from public API.
//     t.ok(typeof RTCPeerConnection === 'function',
//         'RTCPeerConnection is a function');
//     t.ok(typeof getUserMedia === 'function',
//         'getUserMedia is a function');
//     t.ok(typeof attachMediaStream === 'function',
//         'attachMediaStream is a function');
//     t.ok(typeof reattachMediaStream === 'function',
//         'reattachMediaSteam is a function');
//     t.ok(typeof trace === 'function', 'trace is a function');
//     t.ok(typeof webrtcDetectedBrowser === 'string',
//         'webrtcDetected browser is a string');
//     t.ok(typeof webrtcMinimumVersion === 'number',
//         'webrtcDetectedVersion is a number');
//     t.end();
//   }, 500);
// });
