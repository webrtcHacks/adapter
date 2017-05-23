/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */

'use strict';

// This is a basic test file for use with testling and webdriver.
// The test script language comes from tape.

let test = require('tape');
let webdriver = require('selenium-webdriver');
let seleniumHelpers = require('./selenium-lib');
const browserVersion = seleniumHelpers.getBrowserVersion();

// Start of tests.
test('Browser identified', function(t) {
  let driver = seleniumHelpers.buildDriver();

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.plan(3);
    t.pass('Page loaded');
    return driver.executeScript('return adapter.browserDetails.version');
  })
  .then(function(webrtcDetectedBrowser) {
    t.ok(webrtcDetectedBrowser, 'Browser detected: ' + webrtcDetectedBrowser);
    return driver.executeScript('return adapter.browserDetails.version');
  })
  .then(function(webrtcDetectVersion) {
    t.ok(webrtcDetectVersion, 'Browser version detected: ' +
        webrtcDetectVersion);
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

// Test that getUserMedia is shimmed properly.
test('navigator.mediaDevices.getUserMedia', function(t) {
  let driver = seleniumHelpers.buildDriver();

  // Define test.
  let testDefinition = function(...args) {
    let callback = args[args.length - 1];
    navigator.mediaDevices.getUserMedia({video: true, fake: true})
    .then(function(stream) {
      window.stream = stream;
      callback(null);
    })
    .catch(function(err) {
      callback(err.name);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(error) {
    let gumResult = (error) ? 'error: ' + error : 'no errors';
    t.ok(!error, 'getUserMedia result:  ' + gumResult);
    // Make sure we get a stream before continuing.
    driver.wait(function() {
      return driver.executeScript(
        'return typeof window.stream !== \'undefined\'');
    }, 3000);
  })
  .then(function() {
    return driver.wait(function() {
      return driver.executeScript(
        'return window.stream.getVideoTracks().length > 0');
    });
  })
  .then(function(gotVideoTracks) {
    t.ok(gotVideoTracks, 'Got stream with video tracks.');
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('getUserMedia shim', function(t) {
  let driver = seleniumHelpers.buildDriver();

  // Run test.
  seleniumHelpers.loadTestPage(driver)
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
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

// Test that adding and removing an eventlistener on navigator.mediaDevices
// is possible. The usecase for this is the devicechanged event.
// This does not test whether devicechanged is actually called.
test('navigator.mediaDevices eventlisteners', function(t) {
  let driver = seleniumHelpers.buildDriver();

  // Run test.
  seleniumHelpers.loadTestPage(driver)
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
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('MediaStream shim', function(t) {
  let driver = seleniumHelpers.buildDriver();

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.pass('Page loaded');
    return driver.executeScript(
      'return window.MediaStream !== \'undefined\'');
  })
  .then(function(isMediaStreamDefined) {
    t.ok(isMediaStreamDefined, 'MediaStream is defined');
    t.end();
  })
  .then(null, function(err) {
    t.fail(err);
    t.end();
  });
});

test('RTCPeerConnection shim', function(t) {
  let driver = seleniumHelpers.buildDriver();

  // Run test.
  seleniumHelpers.loadTestPage(driver)
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
  let driver = seleniumHelpers.buildDriver();

  // Run test.
  seleniumHelpers.loadTestPage(driver)
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
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Video srcObject getter/setter test', function(t) {
  let driver = seleniumHelpers.buildDriver();

  // Define test.
  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    let constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      let video = document.createElement('video');
      video.setAttribute('id', 'video');
      video.setAttribute('autoplay', 'true');
      video.srcObject = stream;
      // If the srcObject shim works, we should get a video
      // at some point. This will trigger loadedmetadata.
      video.addEventListener('loadedmetadata', function() {
        document.body.appendChild(video);
        callback(null);
      });
    })
    .catch(function(err) {
      callback(err.name);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.plan(3);
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(error) {
    let gumResult = (error) ? 'error: ' + error : 'no errors';
    t.ok(!error, 'getUserMedia result:  ' + gumResult);
    // Wait until loadedmetadata event has fired and appended video element.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('video')), 3000);
  })
  .then(function() {
    return driver.executeScript(
        'return document.getElementById(\'video\').srcObject.id')
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
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Audio srcObject getter/setter test', function(t) {
  let driver = seleniumHelpers.buildDriver();

  // Define test.
  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    let constraints = {video: false, audio: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      let audio = document.createElement('audio');
      audio.setAttribute('id', 'audio');
      audio.srcObject = stream;
      // If the srcObject shim works, we should get a video
      // at some point. This will trigger loadedmetadata.
      audio.addEventListener('loadedmetadata', function() {
        document.body.appendChild(audio);
        callback(null);
      });
    })
    .catch(function(err) {
      callback(err.name);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.plan(3);
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(error) {
    let gumResult = (error) ? 'error: ' + error : 'no errors';
    t.ok(!error, 'getUserMedia result:  ' + gumResult);
    // Wait until loadedmetadata event has fired and appended video element.
    // 5 second timeout in case the event does not fire for some reason.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('audio')), 3000);
  })
  .then(function() {
    return driver.executeScript(
        'return document.getElementById(\'audio\').srcObject.id')
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
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('createObjectURL shim test', function(t) {
  let driver = seleniumHelpers.buildDriver();

  // Define test.
  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    ['audio', 'video'].reduce(function(p, type) {
      return p.then(function() {
        let constraints = {fake: true};
        constraints[type] = true;
        return navigator.mediaDevices.getUserMedia(constraints);
      })
      .then(function(stream) {
        let element = document.createElement(type);
        window[type] = element;
        window[type + 'Stream'] = stream;
        element.id = type;
        element.autoplay = true;
        // Test both ways of setting src
        if (type === 'audio') {
          element.src = URL.createObjectURL(stream);
        } else {
          element.setAttribute('src', URL.createObjectURL(stream));
        }
        return new Promise(function(resolve) {
          element.addEventListener('loadedmetadata', resolve);
        });
      });
    }, Promise.resolve())
    .then(function() {
      document.body.appendChild(window.audio);
      document.body.appendChild(window.video);
      callback(null);
    })
    .catch(function(err) {
      callback(err.name);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.plan(5);
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(error) {
    let gumResult = error ? 'error: ' + error : 'no errors';
    t.ok(!error, 'getUserMedia result:  ' + gumResult);
    // Wait until loadedmetadata event has fired and appended video element.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('video')), 3000);
  })
  .then(function() {
    return Promise.all([
      'return document.getElementById("audio").srcObject.id',
      'return window.audioStream.id',
      'return document.getElementById("video").srcObject.id',
      'return window.videoStream.id',
    ].map(function(script) {
      return driver.executeScript(script);
    }))
    .then(function(ids) {
      t.ok(ids[0] === ids[1], 'audio srcObject getter returns audio stream');
      t.ok(ids[2] === ids[3], 'video srcObject getter returns video stream');
      t.ok(ids[0] !== ids[2], 'audio and video streams are different');
      t.end();
    });
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('srcObject set from another object', function(t) {
  let driver = seleniumHelpers.buildDriver();

  // Define test.
  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    let constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      let video = document.createElement('video');
      let video2 = document.createElement('video2');
      video.setAttribute('id', 'video');
      video.setAttribute('autoplay', 'true');
      video2.setAttribute('id', 'video2');
      video2.setAttribute('autoplay', 'true');
      video.srcObject = stream;
      video2.srcObject = video.srcObject;

      // If the srcObject shim works, we should get a video
      // at some point. This will trigger loadedmetadata.
      video.addEventListener('loadedmetadata', function() {
        document.body.appendChild(video);
        document.body.appendChild(video2);
        callback(null);
      });
    })
    .catch(function(err) {
      callback(err.name);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.plan(3);
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(error) {
    let gumResult = (error) ? 'error: ' + error : 'no errors';
    t.ok(!error, 'getUserMedia result:  ' + gumResult);
    // Wait until loadedmetadata event has fired and appended video element.
    // 5 second timeout in case the event does not fire for some reason.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('video2')), 3000);
  })
  .then(function() {
    return driver.executeScript(
        'return document.getElementById(\'video\').srcObject.id')
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
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('srcObject null setter', function(t) {
  let driver = seleniumHelpers.buildDriver();

  // Define test.
  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    let constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      let video = document.createElement('video');
      video.setAttribute('id', 'video');
      video.setAttribute('autoplay', 'true');
      document.body.appendChild(video);
      video.srcObject = stream;
      video.srcObject = null;

      callback(null);
    })
    .catch(function(err) {
      callback(err.name);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.plan(3);
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(error) {
    let gumResult = (error) ? 'error: ' + error : 'no errors';
    t.ok(!error, 'getUserMedia result:  ' + gumResult);
    // Wait until loadedmetadata event has fired and appended video element.
    // 5 second timeout in case the event does not fire for some reason.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('video')), 3000);
  })
  .then(function() {
    return driver.executeScript(
        'return document.getElementById(\'video\').src');
  })
  .then(function(src) {
    t.ok(src === 'file://' + process.cwd() + '/test/testpage.html' ||
        // kind of... it actually is this page.
        src === '', 'src is the empty string');
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Attach mediaStream directly', function(t) {
  let driver = seleniumHelpers.buildDriver();

  // Define test.
  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    let constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      let video = document.createElement('video');
      video.setAttribute('id', 'video');
      video.setAttribute('autoplay', 'true');
      // If the srcObject shim works, we should get a video
      // at some point. This will trigger loadedmetadata.
      // Firefox < 38 had issues with this, workaround removed
      // due to 38 being stable now.
      video.addEventListener('loadedmetadata', function() {
        document.body.appendChild(video);
      });

      video.srcObject = stream;
      callback(null);
    })
    .catch(function(err) {
      callback(err.name);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.plan(4);
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(error) {
    let gumResult = (error) ? 'error: ' + error : 'no errors';
    t.ok(!error, 'getUserMedia result:  ' + gumResult);
    // We need to wait due to the stream can take a while to setup.
    driver.wait(function() {
      return driver.executeScript(
        'return typeof window.stream !== \'undefined\'');
    }, 3000);
    return driver.executeScript(
      // Firefox and Chrome have different constructor names.
      'return window.stream.constructor.name.match(\'MediaStream\') !== null');
  })
  .then(function(isMediaStream) {
    t.ok(isMediaStream, 'Stream is a MediaStream');
    // Wait until loadedmetadata event has fired and appended video element.
    // 5 second timeout in case the event does not fire for some reason.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('video')), 3000);
  })
  .then(function() {
    return driver.wait(function() {
      return driver.executeScript(
          'return document.getElementById("video").readyState === 4');
    }, 3000);
  })
  .then(function() {
    t.pass('Stream attached directly succesfully to a video element');
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Re-attaching mediaStream directly', function(t) {
  let driver = seleniumHelpers.buildDriver();

  // Define test.
  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    let constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      let video = document.createElement('video');
      let video2 = document.createElement('video');
      video.setAttribute('id', 'video');
      video.setAttribute('autoplay', 'true');
      video2.setAttribute('id', 'video2');
      video2.setAttribute('autoplay', 'true');
      // If attachMediaStream works, we should get a video
      // at some point. This will trigger loadedmetadata.
      // This reattaches to the second video which will trigger
      // loadedmetadata there.
      video.addEventListener('loadedmetadata', function() {
        document.body.appendChild(video);
        video2.srcObject = video.srcObject;
      });
      video2.addEventListener('loadedmetadata', function() {
        document.body.appendChild(video2);
      });

      video.srcObject = stream;
      callback(null);
    })
    .catch(function(err) {
      callback(err.name);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.plan(5);
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(error) {
    let gumResult = (error) ? 'error: ' + error : 'no errors';
    t.ok(!error, 'getUserMedia result:  ' + gumResult);
    // We need to wait due to the stream can take a while to setup.
    return driver.wait(function() {
      return driver.executeScript(
        'return typeof window.stream !== \'undefined\'');
    }, 3000)
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
      webdriver.By.id('video')), 3000);
  })
  .then(function(videoElement) {
    return driver.wait(function() {
      return driver.executeScript(
          'return document.querySelector("video").readyState === 4');
    }, 3000);
  })
  .then(function() {
    t.pass('Stream attached directly succesfully to a video element');
    // Wait until loadedmetadata event has fired and appended video element.
    // 5 second timeout in case the event does not fire for some reason.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('video2')), 3000);
  })
  .then(function() {
    return driver.wait(function() {
      return driver.executeScript(
          'return document.getElementById("video2").readyState === 4');
    }, 3000);
  })
  .then(function() {
    t.pass('Stream re-attached directly succesfully to a video element');
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

// deactivated in Chrome due to https://github.com/webrtc/adapter/issues/180
test('Call getUserMedia with impossible constraints',
    {skip: process.env.BROWSER === 'chrome'},
    function(t) {
      let driver = seleniumHelpers.buildDriver();

      // Define test.
      let testDefinition = function(...args) {
        let callback = args[args.length - 1];

        let impossibleConstraints = {
          video: {
            width: 1280,
            height: {min: 200, ideal: 720, max: 1080},
            frameRate: {exact: 0}, // to fail
          },
        };
        // TODO: Remove when firefox 42+ accepts impossible constraints
        // on fake devices.
        if (window.adapter.browserDetails.browser === 'firefox') {
          impossibleConstraints.fake = false;
        }
        navigator.mediaDevices.getUserMedia(impossibleConstraints)
        .then(function(stream) {
          window.stream = stream;
          callback(null);
        })
        .catch(function(err) {
          callback(err.name);
        });
      };

      // Run test.
      seleniumHelpers.loadTestPage(driver)
      .then(function() {
        t.plan(2);
        t.pass('Page loaded');
        return driver.executeScript(
          'return adapter.browserDetails.browser === \'firefox\' ' +
          '&& adapter.browserDetails.version < 42');
      })
      .then(function(isFirefoxAndVersionLessThan42) {
        if (isFirefoxAndVersionLessThan42) {
          t.skip('getUserMedia(impossibleConstraints) not supported on < 42');
          throw new Error('skip-test');
        }
        return driver.executeAsyncScript(testDefinition);
      })
      .then(function(error) {
        t.ok(error, 'getUserMedia(impossibleConstraints) must fail');
      })
      .then(function() {
        t.end();
      })
      .then(null, function(err) {
        if (err.message !== 'skip-test') {
          t.fail(err);
        }
        t.end();
      });
    });

test('Basic connection establishment', function(t) {
  let driver = seleniumHelpers.buildDriver();

  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    let counter = 1;
    window.testPassed = [];
    window.testFailed = [];
    let tc = {
      ok: function(ok, msg) {
        window[ok ? 'testPassed' : 'testFailed'].push(msg);
      },
      is: function(a, b, msg) {
        this.ok((a === b), msg + ' - got ' + b);
      },
      pass: function(msg) {
        this.ok(true, msg);
      },
      fail: function(msg) {
        this.ok(false, msg);
      },
    };
    let pc1 = new RTCPeerConnection(null);
    let pc2 = new RTCPeerConnection(null);

    pc1.oniceconnectionstatechange = function() {
      if (pc1.iceConnectionState === 'connected' ||
          pc1.iceConnectionState === 'completed') {
        callback(pc1.iceConnectionState);
      }
    };

    let addCandidate = function(pc, event) {
      pc.addIceCandidate(event.candidate,
        function() {
          // TODO: Decide if we are interested in adding all candidates
          // as passed tests.
          tc.pass('addIceCandidate ' + counter++);
        },
        function(err) {
          tc.fail('addIceCandidate ' + err.toString());
        }
      );
    };
    pc1.onicecandidate = function(event) {
      addCandidate(pc2, event);
    };
    pc2.onicecandidate = function(event) {
      addCandidate(pc1, event);
    };

    let constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      pc1.addStream(stream);

      pc1.createOffer(
        function(offer) {
          tc.pass('pc1.createOffer');
          pc1.setLocalDescription(offer,
            function() {
              tc.pass('pc1.setLocalDescription');
              offer = new RTCSessionDescription(offer);
              tc.pass('created RTCSessionDescription from offer');
              pc2.setRemoteDescription(offer,
                function() {
                  tc.pass('pc2.setRemoteDescription');
                  pc2.createAnswer(
                    function(answer) {
                      tc.pass('pc2.createAnswer');
                      pc2.setLocalDescription(answer,
                        function() {
                          tc.pass('pc2.setLocalDescription');
                          answer = new RTCSessionDescription(answer);
                          tc.pass('created RTCSessionDescription from answer');
                          pc1.setRemoteDescription(answer,
                            function() {
                              tc.pass('pc1.setRemoteDescription');
                            },
                            function(err) {
                              tc.pass('pc1.setRemoteDescription ' +
                                  err.toString());
                            }
                          );
                        },
                        function(err) {
                          tc.fail('pc2.setLocalDescription ' + err.toString());
                        }
                      );
                    },
                    function(err) {
                      tc.fail('pc2.createAnswer ' + err.toString());
                    }
                  );
                },
                function(err) {
                  tc.fail('pc2.setRemoteDescription ' + err.toString());
                }
              );
            },
            function(err) {
              tc.fail('pc1.setLocalDescription ' + err.toString());
            }
          );
        },
        function(err) {
          tc.fail('pc1 failed to create offer ' + err.toString());
        }
      );
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(pc1ConnectionStatus) {
    t.ok(pc1ConnectionStatus === 'completed' || 'connected',
      'P2P connection established');
    return driver.executeScript('return window.testPassed');
  })
  .then(function(testPassed) {
    return driver.executeScript('return window.testFailed')
    .then(function(testFailed) {
      for (let testPass = 0; testPass < testPassed.length; testPass++) {
        t.pass(testPassed[testPass]);
      }
      for (let testFail = 0; testFail < testFailed.length; testFail++) {
        t.fail(testFailed[testFail]);
      }
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Basic connection establishment with promise', function(t) {
  let driver = seleniumHelpers.buildDriver();

  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    let counter = 1;
    window.testPassed = [];
    window.testFailed = [];
    let tc = {
      ok: function(ok, msg) {
        window[ok ? 'testPassed' : 'testFailed'].push(msg);
      },
      is: function(a, b, msg) {
        this.ok((a === b), msg + ' - got ' + b);
      },
      pass: function(msg) {
        this.ok(true, msg);
      },
      fail: function(msg) {
        this.ok(false, msg);
      },
    };
    let pc1 = new RTCPeerConnection(null);
    let pc2 = new RTCPeerConnection(null);

    pc1.oniceconnectionstatechange = function() {
      if (pc1.iceConnectionState === 'connected' ||
          pc1.iceConnectionState === 'completed') {
        callback(pc1.iceConnectionState);
      }
    };

    let dictionary = (obj) => JSON.parse(JSON.stringify(obj));

    let addCandidate = function(pc, event) {
      if (event.candidate) {
        event.candidate = dictionary(event.candidate);
      }
      pc.addIceCandidate(event.candidate).then(function() {
        // TODO: Decide if we are interested in adding all candidates
        // as passed tests.
        tc.pass('addIceCandidate ' + counter++);
      })
      .catch(function(err) {
        tc.fail('addIceCandidate ' + err.toString());
      });
    };
    pc1.onicecandidate = function(event) {
      addCandidate(pc2, event);
    };
    pc2.onicecandidate = function(event) {
      addCandidate(pc1, event);
    };

    let constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      pc1.addStream(stream);
      pc1.createOffer().then(function(offer) {
        tc.pass('pc1.createOffer');
        return pc1.setLocalDescription(dictionary(offer));
      }).then(function() {
        tc.pass('pc1.setLocalDescription');
        return pc2.setRemoteDescription(dictionary(pc1.localDescription));
      }).then(function() {
        tc.pass('pc2.setRemoteDescription');
        return pc2.createAnswer();
      }).then(function(answer) {
        tc.pass('pc2.createAnswer');
        return pc2.setLocalDescription(dictionary(answer));
      }).then(function() {
        tc.pass('pc2.setLocalDescription');
        return pc1.setRemoteDescription(dictionary(pc2.localDescription));
      }).then(function() {
        tc.pass('pc1.setRemoteDescription');
      }).catch(function(err) {
        tc.fail(err.toString());
      });
    })
    .catch(function(error) {
      callback(error);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(callback) {
    // Callback will either return an error object or pc1ConnectionStatus.
    if (callback.name === 'Error') {
      t.fail('getUserMedia failure: ' + callback.toString());
    } else {
      return callback;
    }
  })
  .then(function(pc1ConnectionStatus) {
    t.ok(pc1ConnectionStatus === 'completed' || 'connected',
      'P2P connection established');
    return driver.executeScript('return window.testPassed');
  })
  .then(function(testPassed) {
    return driver.executeScript('return window.testFailed')
    .then(function(testFailed) {
      for (let testPass = 0; testPass < testPassed.length; testPass++) {
        t.pass(testPassed[testPass]);
      }
      for (let testFail = 0; testFail < testFailed.length; testFail++) {
        t.fail(testFailed[testFail]);
      }
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Basic connection establishment with bidirectional streams', function(t) {
  let driver = seleniumHelpers.buildDriver();

  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    let counter = 1;
    window.testPassed = [];
    window.testFailed = [];
    let tc = {
      ok: function(ok, msg) {
        window[ok ? 'testPassed' : 'testFailed'].push(msg);
      },
      is: function(a, b, msg) {
        this.ok((a === b), msg + ' - got ' + b);
      },
      pass: function(msg) {
        this.ok(true, msg);
      },
      fail: function(msg) {
        this.ok(false, msg);
      },
    };
    let pc1 = new RTCPeerConnection(null);
    let pc2 = new RTCPeerConnection(null);

    pc1.oniceconnectionstatechange = function() {
      if (pc1.iceConnectionState === 'connected' ||
          pc1.iceConnectionState === 'completed') {
        callback(pc1.iceConnectionState);
      }
    };

    let dictionary = (obj) => JSON.parse(JSON.stringify(obj));

    let addCandidate = function(pc, event) {
      if (event.candidate) {
        event.candidate = dictionary(event.candidate);
      }
      pc.addIceCandidate(event.candidate).then(function() {
        // TODO: Decide if we are interested in adding all candidates
        // as passed tests.
        tc.pass('addIceCandidate ' + counter++);
      })
      .catch(function(err) {
        tc.fail('addIceCandidate ' + err.toString());
      });
    };
    pc1.onicecandidate = function(event) {
      addCandidate(pc2, event);
    };
    pc2.onicecandidate = function(event) {
      addCandidate(pc1, event);
    };

    let constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      pc1.addStream(stream);
      pc2.addStream(stream);
      pc1.createOffer().then(function(offer) {
        tc.pass('pc1.createOffer');
        return pc1.setLocalDescription(dictionary(offer));
      }).then(function() {
        tc.pass('pc1.setLocalDescription');
        return pc2.setRemoteDescription(dictionary(pc1.localDescription));
      }).then(function() {
        tc.pass('pc2.setRemoteDescription');
        return pc2.createAnswer();
      }).then(function(answer) {
        tc.pass('pc2.createAnswer');
        return pc2.setLocalDescription(dictionary(answer));
      }).then(function() {
        tc.pass('pc2.setLocalDescription');
        return pc1.setRemoteDescription(dictionary(pc2.localDescription));
      }).then(function() {
        tc.pass('pc1.setRemoteDescription');
      }).catch(function(err) {
        tc.fail(err.toString());
      });
    })
    .catch(function(error) {
      callback(error);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(callback) {
    // Callback will either return an error object or pc1ConnectionStatus.
    if (callback.name === 'Error') {
      t.fail('getUserMedia failure: ' + callback.toString());
    } else {
      return callback;
    }
  })
  .then(function(pc1ConnectionStatus) {
    t.ok(pc1ConnectionStatus === 'completed' || 'connected',
      'P2P connection established');
    return driver.executeScript('return window.testPassed');
  })
  .then(function(testPassed) {
    return driver.executeScript('return window.testFailed')
    .then(function(testFailed) {
      for (let testPass = 0; testPass < testPassed.length; testPass++) {
        t.pass(testPassed[testPass]);
      }
      for (let testFail = 0; testFail < testFailed.length; testFail++) {
        t.fail(testFailed[testFail]);
      }
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Basic connection establishment with addTrack', function(t) {
  let driver = seleniumHelpers.buildDriver();

  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    let counter = 1;
    window.testPassed = [];
    window.testFailed = [];
    let tc = {
      ok: function(ok, msg) {
        window[ok ? 'testPassed' : 'testFailed'].push(msg);
      },
      is: function(a, b, msg) {
        this.ok((a === b), msg + ' - got ' + b);
      },
      pass: function(msg) {
        this.ok(true, msg);
      },
      fail: function(msg) {
        this.ok(false, msg);
      },
    };
    let pc1 = new RTCPeerConnection(null);
    let pc2 = new RTCPeerConnection(null);

    pc1.oniceconnectionstatechange = function() {
      if (pc1.iceConnectionState === 'connected' ||
          pc1.iceConnectionState === 'completed') {
        callback(pc1.iceConnectionState);
      }
    };

    pc2.onaddstream = function(event) {
      tc.pass('onaddstream called');
      tc.ok(event.stream.getAudioTracks().length === 1, 'with an audio track');
      tc.ok(event.stream.getVideoTracks().length === 1, 'with a video track');
    };

    let dictionary = (obj) => JSON.parse(JSON.stringify(obj));

    let addCandidate = function(pc, event) {
      if (event.candidate) {
        event.candidate = dictionary(event.candidate);
      }
      pc.addIceCandidate(event.candidate).then(function() {
        // TODO: Decide if we are interested in adding all candidates
        // as passed tests.
        tc.pass('addIceCandidate ' + counter++);
      })
      .catch(function(err) {
        tc.fail('addIceCandidate ' + err.toString());
      });
    };
    pc1.onicecandidate = function(event) {
      addCandidate(pc2, event);
    };
    pc2.onicecandidate = function(event) {
      addCandidate(pc1, event);
    };

    let constraints = {audio: true, video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      stream.getTracks().forEach(function(track) {
        pc1.addTrack(track, stream);
      });
      pc1.createOffer().then(function(offer) {
        tc.pass('pc1.createOffer');
        return pc1.setLocalDescription(dictionary(offer));
      }).then(function() {
        tc.pass('pc1.setLocalDescription');
        return pc2.setRemoteDescription(dictionary(pc1.localDescription));
      }).then(function() {
        tc.pass('pc2.setRemoteDescription');
        return pc2.createAnswer();
      }).then(function(answer) {
        tc.pass('pc2.createAnswer');
        return pc2.setLocalDescription(dictionary(answer));
      }).then(function() {
        tc.pass('pc2.setLocalDescription');
        return pc1.setRemoteDescription(dictionary(pc2.localDescription));
      }).then(function() {
        tc.pass('pc1.setRemoteDescription');
      }).catch(function(err) {
        tc.fail(err.toString());
      });
    })
    .catch(function(error) {
      callback(error);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(callback) {
    // Callback will either return an error object or pc1ConnectionStatus.
    if (callback.name === 'Error') {
      t.fail('getUserMedia failure: ' + callback.toString());
    } else {
      return callback;
    }
  })
  .then(function(pc1ConnectionStatus) {
    t.ok(pc1ConnectionStatus === 'completed' || 'connected',
      'P2P connection established');
    return driver.executeScript('return window.testPassed');
  })
  .then(function(testPassed) {
    return driver.executeScript('return window.testFailed')
    .then(function(testFailed) {
      for (let testPass = 0; testPass < testPassed.length; testPass++) {
        t.pass(testPassed[testPass]);
      }
      for (let testFail = 0; testFail < testFailed.length; testFail++) {
        t.fail(testFailed[testFail]);
      }
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Basic connection establishment with addTrack ' +
    'and only the audio track of an av stream', function(t) {
  let driver = seleniumHelpers.buildDriver();

  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    let counter = 1;
    window.testPassed = [];
    window.testFailed = [];
    let tc = {
      ok: function(ok, msg) {
        window[ok ? 'testPassed' : 'testFailed'].push(msg);
      },
      is: function(a, b, msg) {
        this.ok((a === b), msg + ' - got ' + b);
      },
      pass: function(msg) {
        this.ok(true, msg);
      },
      fail: function(msg) {
        this.ok(false, msg);
      },
    };
    let pc1 = new RTCPeerConnection(null);
    let pc2 = new RTCPeerConnection(null);

    pc1.oniceconnectionstatechange = function() {
      if (pc1.iceConnectionState === 'connected' ||
          pc1.iceConnectionState === 'completed') {
        callback(pc1.iceConnectionState);
      }
    };

    pc2.onaddstream = function(event) {
      tc.pass('onaddstream called');
      tc.ok(event.stream.getAudioTracks().length === 1, 'with an audio track');
      tc.ok(event.stream.getVideoTracks().length === 0, 'with no video track');
    };

    let dictionary = (obj) => JSON.parse(JSON.stringify(obj));

    let addCandidate = function(pc, event) {
      if (event.candidate) {
        event.candidate = dictionary(event.candidate);
      }
      pc.addIceCandidate(event.candidate).then(function() {
        // TODO: Decide if we are interested in adding all candidates
        // as passed tests.
        tc.pass('addIceCandidate ' + counter++);
      })
      .catch(function(err) {
        tc.fail('addIceCandidate ' + err.toString());
      });
    };
    pc1.onicecandidate = function(event) {
      addCandidate(pc2, event);
    };
    pc2.onicecandidate = function(event) {
      addCandidate(pc1, event);
    };

    let constraints = {audio: true, video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      stream.getAudioTracks().forEach(function(track) {
        pc1.addTrack(track, stream);
      });
      pc1.createOffer().then(function(offer) {
        tc.pass('pc1.createOffer');
        return pc1.setLocalDescription(dictionary(offer));
      }).then(function() {
        tc.pass('pc1.setLocalDescription');
        return pc2.setRemoteDescription(dictionary(pc1.localDescription));
      }).then(function() {
        tc.pass('pc2.setRemoteDescription');
        return pc2.createAnswer();
      }).then(function(answer) {
        tc.pass('pc2.createAnswer');
        return pc2.setLocalDescription(dictionary(answer));
      }).then(function() {
        tc.pass('pc2.setLocalDescription');
        return pc1.setRemoteDescription(dictionary(pc2.localDescription));
      }).then(function() {
        tc.pass('pc1.setRemoteDescription');
      }).catch(function(err) {
        tc.fail(err.toString());
      });
    })
    .catch(function(error) {
      callback(error);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(callback) {
    // Callback will either return an error object or pc1ConnectionStatus.
    if (callback.name === 'Error') {
      t.fail('getUserMedia failure: ' + callback.toString());
    } else {
      return callback;
    }
  })
  .then(function(pc1ConnectionStatus) {
    t.ok(pc1ConnectionStatus === 'completed' || 'connected',
      'P2P connection established');
    return driver.executeScript('return window.testPassed');
  })
  .then(function(testPassed) {
    return driver.executeScript('return window.testFailed')
    .then(function(testFailed) {
      for (let testPass = 0; testPass < testPassed.length; testPass++) {
        t.pass(testPassed[testPass]);
      }
      for (let testFail = 0; testFail < testFailed.length; testFail++) {
        t.fail(testFailed[testFail]);
      }
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Basic connection establishment with addTrack ' +
    'and two streams', function(t) {
  let driver = seleniumHelpers.buildDriver();

  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    let counter = 1;
    window.testPassed = [];
    window.testFailed = [];
    let tc = {
      ok: function(ok, msg) {
        window[ok ? 'testPassed' : 'testFailed'].push(msg);
      },
      is: function(a, b, msg) {
        this.ok((a === b), msg + ' - got ' + b);
      },
      pass: function(msg) {
        this.ok(true, msg);
      },
      fail: function(msg) {
        this.ok(false, msg);
      },
    };
    let pc1 = new RTCPeerConnection(null);
    let pc2 = new RTCPeerConnection(null);
    let remoteStreams = 0;

    pc1.oniceconnectionstatechange = function() {
      if (pc1.iceConnectionState === 'connected' ||
          pc1.iceConnectionState === 'completed') {
        callback(pc1.iceConnectionState);
      }
    };

    pc2.onaddstream = function(event) {
      tc.pass('onaddstream called ' + remoteStreams++);
    };

    let dictionary = (obj) => JSON.parse(JSON.stringify(obj));

    let addCandidate = function(pc, event) {
      if (event.candidate) {
        event.candidate = dictionary(event.candidate);
      }
      pc.addIceCandidate(event.candidate).then(function() {
        // TODO: Decide if we are interested in adding all candidates
        // as passed tests.
        tc.pass('addIceCandidate ' + counter++);
      })
      .catch(function(err) {
        tc.fail('addIceCandidate ' + err.toString());
      });
    };
    pc1.onicecandidate = function(event) {
      addCandidate(pc2, event);
    };
    pc2.onicecandidate = function(event) {
      addCandidate(pc1, event);
    };

    let constraints = {audio: true, video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      let audioStream = new MediaStream(stream.getAudioTracks());
      let videoStream = new MediaStream(stream.getVideoTracks());
      audioStream.getTracks().forEach(function(track) {
        pc1.addTrack(track, audioStream);
      });
      videoStream.getTracks().forEach(function(track) {
        pc1.addTrack(track, videoStream);
      });

      pc1.createOffer().then(function(offer) {
        tc.pass('pc1.createOffer');
        return pc1.setLocalDescription(dictionary(offer));
      }).then(function() {
        tc.pass('pc1.setLocalDescription');
        return pc2.setRemoteDescription(dictionary(pc1.localDescription));
      }).then(function() {
        tc.pass('pc2.setRemoteDescription');
        return pc2.createAnswer();
      }).then(function(answer) {
        tc.pass('pc2.createAnswer');
        return pc2.setLocalDescription(dictionary(answer));
      }).then(function() {
        tc.pass('pc2.setLocalDescription');
        return pc1.setRemoteDescription(dictionary(pc2.localDescription));
      }).then(function() {
        tc.pass('pc1.setRemoteDescription');
      }).catch(function(err) {
        tc.fail(err.toString());
      });
    })
    .catch(function(error) {
      callback(error);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(callback) {
    // Callback will either return an error object or pc1ConnectionStatus.
    if (callback.name === 'Error') {
      t.fail('getUserMedia failure: ' + callback.toString());
    } else {
      return callback;
    }
  })
  .then(function(pc1ConnectionStatus) {
    t.ok(pc1ConnectionStatus === 'completed' || 'connected',
      'P2P connection established');
    return driver.executeScript('return window.testPassed');
  })
  .then(function(testPassed) {
    return driver.executeScript('return window.testFailed')
    .then(function(testFailed) {
      for (let testPass = 0; testPass < testPassed.length; testPass++) {
        t.pass(testPassed[testPass]);
      }
      for (let testFail = 0; testFail < testFailed.length; testFail++) {
        t.fail(testFailed[testFail]);
      }
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Basic connection establishment with promise but no' +
    'end-of-candidates', function(t) {
  let driver = seleniumHelpers.buildDriver();

  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    let counter = 1;
    window.testPassed = [];
    window.testFailed = [];
    let tc = {
      ok: function(ok, msg) {
        window[ok ? 'testPassed' : 'testFailed'].push(msg);
      },
      is: function(a, b, msg) {
        this.ok((a === b), msg + ' - got ' + b);
      },
      pass: function(msg) {
        this.ok(true, msg);
      },
      fail: function(msg) {
        this.ok(false, msg);
      },
    };
    let pc1 = new RTCPeerConnection(null);
    let pc2 = new RTCPeerConnection(null);

    pc1.oniceconnectionstatechange = function() {
      if (pc1.iceConnectionState === 'connected' ||
          pc1.iceConnectionState === 'completed') {
        callback(pc1.iceConnectionState);
      }
    };

    let dictionary = (obj) => JSON.parse(JSON.stringify(obj));

    let addCandidate = function(pc, event) {
      if (event.candidate) {
        event.candidate = dictionary(event.candidate);
      }
      pc.addIceCandidate(event.candidate).then(function() {
        // TODO: Decide if we are interested in adding all candidates
        // as passed tests.
        tc.pass('addIceCandidate ' + counter++);
      })
      .catch(function(err) {
        tc.fail('addIceCandidate ' + err.toString());
      });
    };
    pc1.onicecandidate = function(event) {
      if (event.candidate) {
        addCandidate(pc2, event);
      }
    };
    pc2.onicecandidate = function(event) {
      if (event.candidate) {
        addCandidate(pc1, event);
      }
    };

    let constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      pc1.addStream(stream);
      pc1.createOffer().then(function(offer) {
        tc.pass('pc1.createOffer');
        return pc1.setLocalDescription(dictionary(offer));
      }).then(function() {
        tc.pass('pc1.setLocalDescription');
        return pc2.setRemoteDescription(dictionary(pc1.localDescription));
      }).then(function() {
        tc.pass('pc2.setRemoteDescription');
        return pc2.createAnswer();
      }).then(function(answer) {
        tc.pass('pc2.createAnswer');
        return pc2.setLocalDescription(dictionary(answer));
      }).then(function() {
        tc.pass('pc2.setLocalDescription');
        return pc1.setRemoteDescription(dictionary(pc2.localDescription));
      }).then(function() {
        tc.pass('pc1.setRemoteDescription');
      }).catch(function(err) {
        tc.fail(err.toString());
      });
    })
    .catch(function(error) {
      callback(error);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(callback) {
    // Callback will either return an error object or pc1ConnectionStatus.
    if (callback.name === 'Error') {
      t.fail('getUserMedia failure: ' + callback.toString());
    } else {
      return callback;
    }
  })
  .then(function(pc1ConnectionStatus) {
    t.ok(pc1ConnectionStatus === 'completed' || 'connected',
      'P2P connection established');
    return driver.executeScript('return window.testPassed');
  })
  .then(function(testPassed) {
    return driver.executeScript('return window.testFailed')
    .then(function(testFailed) {
      for (let testPass = 0; testPass < testPassed.length; testPass++) {
        t.pass(testPassed[testPass]);
      }
      for (let testFail = 0; testFail < testFailed.length; testFail++) {
        t.fail(testFailed[testFail]);
      }
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Basic connection establishment with datachannel', function(t) {
  let driver = seleniumHelpers.buildDriver();

  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    let counter = 1;
    window.testPassed = [];
    window.testFailed = [];
    let tc = {
      ok: function(ok, msg) {
        window[ok ? 'testPassed' : 'testFailed'].push(msg);
      },
      is: function(a, b, msg) {
        this.ok((a === b), msg + ' - got ' + b);
      },
      pass: function(msg) {
        this.ok(true, msg);
      },
      fail: function(msg) {
        this.ok(false, msg);
      },
    };
    let pc1 = new RTCPeerConnection(null);
    let pc2 = new RTCPeerConnection(null);

    if (typeof pc1.createDataChannel !== 'function') {
      callback('DataChannel is not supported');
      return;
    }

    pc1.oniceconnectionstatechange = function() {
      if (pc1.iceConnectionState === 'connected' ||
          pc1.iceConnectionState === 'completed') {
        callback(pc1.iceConnectionState);
      }
    };

    let addCandidate = function(pc, event) {
      pc.addIceCandidate(event.candidate).then(function() {
        // TODO: Decide if we are interested in adding all candidates
        // as passed tests.
        tc.pass('addIceCandidate ' + counter++);
      })
      .catch(function(err) {
        tc.fail('addIceCandidate ' + err.toString());
      });
    };
    pc1.onicecandidate = function(event) {
      addCandidate(pc2, event);
    };
    pc2.onicecandidate = function(event) {
      addCandidate(pc1, event);
    };

    pc1.createDataChannel('somechannel');
    pc1.createOffer().then(function(offer) {
      tc.pass('pc1.createOffer');
      return pc1.setLocalDescription(offer);
    }).then(function() {
      tc.pass('pc1.setLocalDescription');
      return pc2.setRemoteDescription(pc1.localDescription);
    }).then(function() {
      tc.pass('pc2.setRemoteDescription');
      return pc2.createAnswer();
    }).then(function(answer) {
      tc.pass('pc2.createAnswer');
      return pc2.setLocalDescription(answer);
    }).then(function() {
      tc.pass('pc2.setLocalDescription');
      return pc1.setRemoteDescription(pc2.localDescription);
    }).then(function() {
      tc.pass('pc1.setRemoteDescription');
    }).catch(function(err) {
      tc.fail(err.name);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(callback) {
    // Callback will either return DataChannel not supported
    // or pc1ConnectionStatus.
    if (callback === 'DataChannel is not supported') {
      t.skip(callback);
      throw new Error('skip-test');
    }
    return callback;
  })
  .then(function(pc1ConnectionStatus) {
    t.ok(pc1ConnectionStatus, 'P2P connection established');
    return driver.executeScript('return window.testPassed');
  })
  .then(function(testPassed) {
    return driver.executeScript('return window.testFailed')
    .then(function(testFailed) {
      for (let testPass = 0; testPass < testPassed.length; testPass++) {
        t.pass(testPassed[testPass]);
      }
      for (let testFail = 0; testFail < testFailed.length; testFail++) {
        t.fail(testFailed[testFail]);
      }
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('video loadedmetadata is called for a video call', function(t) {
  let driver = seleniumHelpers.buildDriver();

  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    let counter = 1;
    window.testPassed = [];
    window.testFailed = [];
    let tc = {
      ok: function(ok, msg) {
        window[ok ? 'testPassed' : 'testFailed'].push(msg);
      },
      is: function(a, b, msg) {
        this.ok((a === b), msg + ' - got ' + b);
      },
      pass: function(msg) {
        this.ok(true, msg);
      },
      fail: function(msg) {
        this.ok(false, msg);
      },
    };
    let pc1 = new RTCPeerConnection(null);
    let pc2 = new RTCPeerConnection(null);

    pc2.addEventListener('addstream', function(e) {
      let v = document.createElement('video');
      v.autoplay = true;
      v.addEventListener('loadedmetadata', function() {
        tc.pass('loadedmetadata');
        callback();
      });
      v.srcObject = e.stream;
    });
    let dictionary = (obj) => JSON.parse(JSON.stringify(obj));

    let addCandidate = function(pc, event) {
      if (event.candidate) {
        event.candidate = dictionary(event.candidate);
      }
      pc.addIceCandidate(event.candidate).then(function() {
        // TODO: Decide if we are interested in adding all candidates
        // as passed tests.
        tc.pass('addIceCandidate ' + counter++);
      })
      .catch(function(err) {
        tc.fail('addIceCandidate ' + err.toString());
      });
    };
    pc1.onicecandidate = function(event) {
      addCandidate(pc2, event);
    };
    pc2.onicecandidate = function(event) {
      addCandidate(pc1, event);
    };

    let constraints = {audio: true, video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      pc1.addStream(stream);
      pc1.createOffer().then(function(offer) {
        tc.pass('pc1.createOffer');
        return pc1.setLocalDescription(dictionary(offer));
      }).then(function() {
        tc.pass('pc1.setLocalDescription');
        return pc2.setRemoteDescription(dictionary(pc1.localDescription));
      }).then(function() {
        tc.pass('pc2.setRemoteDescription');
        return pc2.createAnswer();
      }).then(function(answer) {
        tc.pass('pc2.createAnswer');
        return pc2.setLocalDescription(dictionary(answer));
      }).then(function() {
        tc.pass('pc2.setLocalDescription');
        return pc1.setRemoteDescription(dictionary(pc2.localDescription));
      }).then(function() {
        tc.pass('pc1.setRemoteDescription');
      }).catch(function(err) {
        tc.fail(err.toString());
      });
    })
    .catch(function(error) {
      callback(error);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(error) {
    // Callback will either return an error object or pc1ConnectionStatus.
    if (error) {
      throw (error);
    }
    return driver.executeScript('return window.testPassed');
  })
  .then(function(testPassed) {
    return driver.executeScript('return window.testFailed')
    .then(function(testFailed) {
      for (let testPass = 0; testPass < testPassed.length; testPass++) {
        t.pass(testPassed[testPass]);
      }
      for (let testFail = 0; testFail < testFailed.length; testFail++) {
        t.fail(testFailed[testFail]);
      }
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('dtmf', (t) => {
  let driver = seleniumHelpers.buildDriver();

  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    let pc1 = new RTCPeerConnection(null);
    let pc2 = new RTCPeerConnection(null);

    pc1.onicecandidate = (e) => pc2.addIceCandidate(e.candidate);
    pc2.onicecandidate = (e) => pc1.addIceCandidate(e.candidate);
    pc1.onnegotiationneeded = (e) => pc1.createOffer()
      .then((offer) => pc1.setLocalDescription(offer))
      .then(() => pc2.setRemoteDescription(pc1.localDescription))
      .then(() => pc2.createAnswer())
      .then((answer) => pc2.setLocalDescription(answer))
      .then(() => pc1.setRemoteDescription(pc2.localDescription));

    navigator.mediaDevices.getUserMedia({audio: true})
    .then((stream) => {
      pc1.addStream(stream);
      return new Promise((resolve) => pc1.oniceconnectionstatechange =
        (e) => pc1.iceConnectionState === 'connected' && resolve())
      .then(() => {
        let sender = pc1.getSenders().find((s) => s.track.kind === 'audio');
        if (!sender.dtmf) {
          throw new Error('skip-test');
        }
        sender.dtmf.insertDTMF('1');
        return new Promise((resolve) => sender.dtmf.ontonechange = resolve);
      })
      .then((e) => {
        // Test getSenders Chrome polyfill
        try {
          // FF51+ doesn't have removeStream
          if (!('removeStream' in pc1)) {
            throw new DOMException('', 'NotSupportedError');
          }
          // Avoid <FF51 throwing NotSupportedError - https://bugzil.la/1213441
          pc1.removeStream(stream);
        } catch (err) {
          if (err.name !== 'NotSupportedError') {
            throw err;
          }
          pc1.getSenders().forEach((sender) => pc1.removeTrack(sender));
        }
        stream.getTracks().forEach((track) => {
          let sender = pc1.getSenders().find((s) => s.track === track);
          if (sender) {
            throw new Error('sender was not removed when it should have been');
          }
        });
        return e.tone;
      });
    })
    .then((tone) => callback({tone: tone}),
          (err) => callback({error: err.toString()}));
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver).then(() => {
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(({tone, error}) => {
    if (error) {
      if (error === 'skip-test') {
        t.skip('No sender.dtmf support in this browser.');
      } else {
        t.fail('PeerConnection failure: ' + error);
      }
      return;
    }
    t.is(tone, '1', 'DTMF sent');
  })
  .then(null, (err) => t.fail(err))
  .then(() => t.end());
});

test('addIceCandidate with null', function(t) {
  let driver = seleniumHelpers.buildDriver();

  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    let pc1 = new RTCPeerConnection(null);
    pc1.addIceCandidate(null)
    // callback is called with either the empty result
    // of the .then or the error from .catch.
    .then(callback)
    .catch(callback);
  };
  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(err) {
    t.ok(err === null, 'addIceCandidate(null) resolves');
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('addIceCandidate with undefined', function(t) {
  let driver = seleniumHelpers.buildDriver();

  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    let pc1 = new RTCPeerConnection(null);
    pc1.addIceCandidate(undefined)
    // callback is called with either the empty result
    // of the .then or the error from .catch.
    .then(callback)
    .catch(callback);
  };
  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(err) {
    t.ok(err === null, 'addIceCandidate(undefined) resolves');
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('call enumerateDevices', function(t) {
  let driver = seleniumHelpers.buildDriver();

  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    navigator.mediaDevices.enumerateDevices()
    .then(function(devices) {
      callback(devices);
    })
    .catch(function(err) {
      callback(err);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(callback) {
    // Callback will either return an error object or device array.
    if (callback.name === 'Error') {
      t.fail('Enumerate devices failure: ' + callback.toString());
    } else {
      return callback;
    }
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
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

// Test polyfill for getStats.
test('getStats', {skip: true}, function(t) {
  let driver = seleniumHelpers.buildDriver();

  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    window.testsEqualArray = [];
    let pc1 = new RTCPeerConnection(null);

    // Test expected new behavior.
    new Promise(function(resolve, reject) {
      pc1.getStats(null, resolve, reject);
    })
    .then(function(report) {
      window.testsEqualArray.push([typeof report, 'object',
        'report is an object.']);
      report.forEach((stat, key) => {
        window.testsEqualArray.push([stat.id, key,
          'report key matches stats id.']);
      });
      return report;
    })
    .then(function(report) {
      // Test legacy behavior
      for (let key in report) {
        // This avoids problems with Firefox
        if (typeof report[key] === 'function') {
          continue;
        }
        window.testsEqualArray.push([report[key].id, key,
          'legacy report key matches stats id.']);
      }
      callback(null);
    })
    .catch(function(err) {
      callback('getStats() should never fail: ' + err);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(error) {
    let getStatsResult = (error) ? 'error: ' + error.toString() : 'no errors';
    t.ok(!error, 'GetStats result:  ' + getStatsResult);
    return driver.wait(function() {
      return driver.executeScript('return window.testsEqualArray');
    });
  })
  .then(function(testsEqualArray) {
    testsEqualArray.forEach(function(resultEq) {
      // resultEq contains an array of test data,
      // test condition that should be equal and a success message.
      // resultEq[0] = typeof report.
      // resultEq[1] = test condition.
      // resultEq[0] = Success message.
      t.equal(resultEq[0], resultEq[1], resultEq[2]);
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

// Test that polyfill for Chrome getStats falls back to builtin functionality
// when the old getStats function signature is used; when the callback is passed
// as the first argument.
// FIXME: Implement callbacks for the results as well.
test('originalChromeGetStats', function(t) {
  let driver = seleniumHelpers.buildDriver();

  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    window.testsEqualArray = [];
    window.testsNotEqualArray = [];
    let pc1 = new RTCPeerConnection(null);

    new Promise(function(resolve, reject) {  // jshint ignore: line
      pc1.getStats(resolve, null);
    })
    .then(function(response) {
      let reports = response.result();
      // TODO: Figure out a way to get inheritance to work properly in
      // webdriver. report.names() is just an empty object when returned to
      // webdriver.
      reports.forEach(function(report) {
        window.testsEqualArray.push([typeof report, 'object',
          'report is an object']);
        window.testsEqualArray.push([typeof report.id, 'string',
          'report.id is a string']);
        window.testsEqualArray.push([typeof report.type, 'string',
          'report.type is a string']);
        window.testsEqualArray.push([typeof report.timestamp, 'object',
          'report.timestamp is an object']);
        report.names().forEach(function(name) {
          window.testsNotEqualArray.push([report.stat(name), null,
            'stat ' + name + ' not equal to null']);
        });
      });
      callback(null);
    })
    .catch(function(error) {
      callback('getStats() should never fail: ' + error);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.pass('Page loaded');
    return driver.executeScript('return adapter.browserDetails.browser')
    .then(function(browser) {
      if (browser !== 'chrome') {
        t.skip('Non-chrome browser detected.');
        throw new Error('skip-test');
      }
    });
  })
  .then(function() {
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(error) {
    let getStatsResult = (error) ? 'error: ' + error.toString() : 'no errors';
    t.ok(!error, 'GetStats result:  ' + getStatsResult);
    return driver.wait(function() {
      return driver.executeScript('return window.testsEqualArray');
    });
  })
  .then(function(testsEqualArray) {
    driver.executeScript('return window.testsNotEqualArray')
    .then(function(testsNotEqualArray) {
      testsEqualArray.forEach(function(resultEq) {
        // resultEq contains an array of test data,
        // test condition that should be equal and a success message.
        // resultEq[0] = typeof report.
        // resultEq[1] = test condition.
        // resultEq[0] = Success message.
        t.equal(resultEq[0], resultEq[1], resultEq[2]);
      });
      testsNotEqualArray.forEach(function(resultNoEq) {
        // resultNoEq contains an array of test data,
        // test condition that should not be equal and a success message.
        // resultNoEq[0] = typeof report.
        // resultNoEq[1] = test condition.
        // resultNoEq[0] = Success message.
        t.notEqual(resultNoEq[0], resultNoEq[1], resultNoEq[2]);
      });
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('getStats promise', function(t) {
  let driver = seleniumHelpers.buildDriver();

  // Define test.
  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    let testsEqualArray = [];
    let pc1 = new RTCPeerConnection(null);

    pc1.getStats(null)
    .then(function(report) {
      testsEqualArray.push([typeof report, 'object',
        'getStats with no selector returns a Promise']);
      // Firefox does not like getStats without any args, therefore we call
      // the callback before the next getStats call.
      // FIXME: Remove this if ever supported by Firefox, also remove the t.skip
      // section towards the end of the // Run test section.
      if (window.adapter.browserDetails.browser === 'firefox') {
        callback(testsEqualArray);
        return;
      }
      pc1.getStats()
      .then(function(reportWithoutArg) {
        testsEqualArray.push([typeof reportWithoutArg, 'object',
          'getStats with no args returns a Promise']);
        callback(testsEqualArray);
      })
      .catch(function(err) {
        callback(err);
      });
    })
    .catch(function(err) {
      callback(err);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(callback) {
    // If the callback contains a stackTrace property it's an error, else an
    // array of tests results.
    if (callback.stackTrace) {
      throw callback.message;
    }
    return callback;
  })
  .then(function(testsEqualArray) {
    testsEqualArray.forEach(function(resultEq) {
      // resultEq contains an array of test data,
      // test condition that should be equal and a success message.
      // resultEq[0] = typeof report.
      // resultEq[1] = test condition.
      // resultEq[0] = Success message.
      t.equal(resultEq[0], resultEq[1], resultEq[2]);
    });
    // FIXME: Remove if supported by firefox. Also remove browser check in
    // the testDefinition function.
    return driver.executeScript(
      'return adapter.browserDetails.browser === \'firefox\'')
      .then(function(isFirefox) {
        if (isFirefox) {
          t.skip('Firefox does not support getStats without args.');
        }
      });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

// iceTransportPolicy is renamed to iceTransports in Chrome by
// adapter, this tests that when not setting any TURN server,
// no candidates are generated.
test('iceTransportPolicy relay functionality',
    {skip: process.env.BROWSER !== 'chrome'},
    function(t) {
      let driver = seleniumHelpers.buildDriver();

      // Define test.
      let testDefinition = function(...args) {
        let callback = args[args.length - 1];

        window.candidates = [];

        let pc1 = new RTCPeerConnection({iceTransportPolicy: 'relay',
          iceServers: []});

        // Since we try to gather only relay candidates without specifying
        // a TURN server, we should not get any candidates.
        pc1.onicecandidate = function(event) {
          if (event.candidate) {
            window.candidates.push([event.candidate]);
            callback(new Error('Candidate found'), event.candidate);
          } else {
            callback(null);
          }
        };

        let constraints = {video: true, fake: true};
        navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
          pc1.addStream(stream);
          pc1.createOffer().then(function(offer) {
            return pc1.setLocalDescription(offer);
          })
          .catch(function(error) {
            callback(error);
          });
        })
        .catch(function(error) {
          callback(error);
        });
      };

      // Run test.
      seleniumHelpers.loadTestPage(driver)
      .then(function() {
        t.pass('Page loaded');
        return driver.executeAsyncScript(testDefinition);
      })
      .then(function(error) {
        let errorMessage = (error) ? 'error: ' + error.toString() : 'no errors';
        t.ok(!error, 'Result:  ' + errorMessage);
        // We should not really need this due to using an error callback if a
        // candidate is found but I'm not sure we will catch due to async nature
        // of this, hence why this is kept.
        return driver.executeScript('return window.candidates');
      })
      .then(function(candidates) {
        if (candidates.length === 0) {
          t.pass('No candidates generated');
        } else {
          candidates.forEach(function(candidate) {
            t.fail('Candidate found: ' + candidate);
          });
        }
      })
      .then(function() {
        t.end();
      })
      .then(null, function(err) {
        if (err.message !== 'skip-test') {
          t.fail(err);
        }
        t.end();
      });
    });

test('icegatheringstatechange event',
    {skip: process.env.BROWSER !== 'MicrosoftEdge'},
    function(t) {
      let driver = seleniumHelpers.buildDriver();

      // Define test.
      let testDefinition = function(...args) {
        let callback = args[args.length - 1];

        let pc1 = new RTCPeerConnection();
        pc1.onicegatheringstatechange = function(event) {
          if (pc1.iceGatheringState === 'complete') {
            callback();
          }
        };

        let constraints = {video: true, fake: true};
        navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
          pc1.addStream(stream);
          pc1.createOffer().then(function(offer) {
            return pc1.setLocalDescription(offer);
          });
        });
      };

      // Run test.
      seleniumHelpers.loadTestPage(driver)
      .then(function() {
        return driver.executeAsyncScript(testDefinition);
      })
      .then(function() {
        t.pass('gatheringstatechange fired and is \'complete\'');
        t.end();
      })
      .then(null, function(err) {
        if (err.message !== 'skip-test') {
          t.fail(err);
        }
        t.end();
      });
    });

test('static generateCertificate method', function(t) {
  let driver = seleniumHelpers.buildDriver();

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.plan(2);
    t.pass('Page loaded');
  })
  .then(function() {
    return driver.executeScript(function() {
      return (window.adapter.browserDetails.browser === 'chrome' &&
          window.adapter.browserDetails.version >= 49) ||
          (window.adapter.browserDetails.browser === 'firefox' &&
          window.adapter.browserDetails.version > 38);
    });
  })
  .then(function(isSupported) {
    if (!isSupported) {
      t.skip('generateCertificate not supported on < Chrome 49');
      throw new Error('skip-test');
    }
    return driver.executeScript(
      'return typeof RTCPeerConnection.generateCertificate === \'function\'');
  })
  .then(function(hasGenerateCertificateMethod) {
    t.ok(hasGenerateCertificateMethod,
        'RTCPeerConnection has generateCertificate method');
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

// ontrack is shimmed in Chrome so we test that it is called.
test('ontrack', function(t) {
  let driver = seleniumHelpers.buildDriver();

  let testDefinition = function(...args) {
    let callback = args[args.length - 1];

    window.testPassed = [];
    window.testFailed = [];
    let tc = {
      ok: function(ok, msg) {
        window[ok ? 'testPassed' : 'testFailed'].push(msg);
      },
      is: function(a, b, msg) {
        this.ok((a === b), msg + ' - got ' + b);
      },
      pass: function(msg) {
        this.ok(true, msg);
      },
      fail: function(msg) {
        this.ok(false, msg);
      },
    };
    let sdp = 'v=0\r\n' +
        'o=- 166855176514521964 2 IN IP4 127.0.0.1\r\n' +
        's=-\r\n' +
        't=0 0\r\n' +
        'a=msid-semantic:WMS *\r\n' +
        'm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n' +
        'c=IN IP4 0.0.0.0\r\n' +
        'a=rtcp:9 IN IP4 0.0.0.0\r\n' +
        'a=ice-ufrag:someufrag\r\n' +
        'a=ice-pwd:somelongpwdwithenoughrandomness\r\n' +
        'a=fingerprint:sha-256 8C:71:B3:8D:A5:38:FD:8F:A4:2E:A2:65:6C:86:52' +
        ':BC:E0:6E:94:F2:9F:7C:4D:B5:DF:AF:AA:6F:44:90:8D:F4\r\n' +
        'a=setup:actpass\r\n' +
        'a=rtcp-mux\r\n' +
        'a=mid:mid1\r\n' +
        'a=sendonly\r\n' +
        'a=rtpmap:111 opus/48000/2\r\n' +
        'a=msid:stream1 track1\r\n' +
        'a=ssrc:1001 cname:some\r\n';

    let pc = new RTCPeerConnection(null);

    pc.ontrack = function(e) {
      tc.ok(true, 'pc.ontrack called');
      tc.ok(typeof e.track === 'object', 'trackEvent.track is an object');
      tc.ok(typeof e.receiver === 'object',
          'trackEvent.receiver is object');
      tc.ok(Array.isArray(e.streams), 'trackEvent.streams is an array');
      tc.is(e.streams.length, 1, 'trackEvent.streams has one stream');
      tc.ok(e.streams[0].getTracks().indexOf(e.track) !== -1,
          'trackEvent.track is in stream');

      if (pc.getReceivers) {
        let receivers = pc.getReceivers();
        if (receivers && receivers.length) {
          tc.ok(receivers.indexOf(e.receiver) !== -1,
              'trackEvent.receiver matches a known receiver');
        }
      }
      callback({});
    };

    pc.setRemoteDescription({type: 'offer', sdp: sdp})
    .catch(function(error) {
      callback(error);
    });
  };

  // plan for 6 tests in Chrome <= 58 (no getReceivers), 7 elsewhere.
  t.plan(process.env.BROWSER === 'chrome' && browserVersion <= 58 ? 6 : 7);

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(callback) {
    // Callback will either return an error object or pc1ConnectionStatus.
    if (callback.name === 'Error') {
      t.fail('getUserMedia failure: ' + callback.toString());
    } else {
      return callback;
    }
  })
  .then(function() {
    return driver.executeScript('return window.testPassed');
  })
  .then(function(testPassed) {
    return driver.executeScript('return window.testFailed')
    .then(function(testFailed) {
      for (let testPass = 0; testPass < testPassed.length; testPass++) {
        t.pass(testPassed[testPass]);
      }
      for (let testFail = 0; testFail < testFailed.length; testFail++) {
        t.fail(testFailed[testFail]);
      }
    });
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

// This MUST to be the last test since it loads adapter
// again which may result in unintended behaviour.
test('Non-module logging to console still works', function(t) {
  let driver = seleniumHelpers.buildDriver();

  let testDefinition = function(...args) {
    window.testsEqualArray = [];
    window.logCount = 0;
    let saveConsole = console.log.bind(console);
    console.log = function() {
      window.logCount++;
    };

    console.log('log me');
    console.log = saveConsole;

    // Check for existence of variables and functions from public API.
    window.testsEqualArray.push([typeof RTCPeerConnection, 'function',
      'RTCPeerConnection is a function']);
    window.testsEqualArray.push([typeof navigator.getUserMedia, 'function',
      'getUserMedia is a function']);
    window.testsEqualArray.push([typeof window.adapter.browserDetails.browser,
      'string', 'browserDetails.browser browser is a string']);
    window.testsEqualArray.push([typeof window.adapter.browserDetails.version,
      'number', 'browserDetails.version is a number']);
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.pass('Page loaded');
    return driver.executeScript(testDefinition);
  })
  .then(function() {
    return driver.executeScript('return window.testsEqualArray');
  })
  .then(function(testsEqualArray) {
    testsEqualArray.forEach(function(resultEq) {
      // resultEq contains an array of test data,
      // test condition that should be equal and a success message.
      // resultEq[0] = typeof report.
      // resultEq[1] = test condition.
      // resultEq[0] = Success message.
      t.equal(resultEq[0], resultEq[1], resultEq[2]);
    });
  })
  .then(function() {
    return driver.executeScript('return window.logCount');
  })
  .then(function(logCount) {
    t.ok(logCount > 0, 'A log message appeared on the console.');
    t.end();
  })
  .then(null, function(err) {
    if (err.message !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});
