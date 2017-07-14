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

var test = require('tape');
var webdriver = require('selenium-webdriver');
var seleniumHelpers = require('./selenium-lib');

// Start of tests.
test('createObjectURL shim test', function(t) {
  var driver = seleniumHelpers.buildDriver();

  // Define test.
  var testDefinition = function() {
    var callback = arguments[arguments.length - 1];

    ['audio', 'video'].reduce(function(p, type) {
      return p.then(function() {
        var constraints = {fake: true};
        constraints[type] = true;
        return navigator.mediaDevices.getUserMedia(constraints);
      })
      .then(function(stream) {
        var element = document.createElement(type);
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
    var gumResult = error ? 'error: ' + error : 'no errors';
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
      'return window.videoStream.id'
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
    var callback = arguments[arguments.length - 1];

    var constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      var video = document.createElement('video');
      var video2 = document.createElement('video2');
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
    var gumResult = (error) ? 'error: ' + error : 'no errors';
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
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('srcObject null setter', function(t) {
  var driver = seleniumHelpers.buildDriver();

  // Define test.
  var testDefinition = function() {
    var callback = arguments[arguments.length - 1];

    var constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      var video = document.createElement('video');
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
    var gumResult = (error) ? 'error: ' + error : 'no errors';
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
    var callback = arguments[arguments.length - 1];

    var constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      var video = document.createElement('video');
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
    var gumResult = (error) ? 'error: ' + error : 'no errors';
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
    var callback = arguments[arguments.length - 1];

    var constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      var video = document.createElement('video');
      var video2 = document.createElement('video');
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
    var gumResult = (error) ? 'error: ' + error : 'no errors';
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
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

// deactivated in Chrome due to https://github.com/webrtc/adapter/issues/180
test('Call getUserMedia with impossible constraints',
    {skip: process.env.BROWSER === 'chrome'},
    function(t) {
      var driver = seleniumHelpers.buildDriver();

      // Define test.
      var testDefinition = function() {
        var callback = arguments[arguments.length - 1];

        var impossibleConstraints = {
          video: {
            width: 1280,
            height: {min: 200, ideal: 720, max: 1080},
            frameRate: {exact: 0} // to fail
          }
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
          throw 'skip-test';
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
        if (err !== 'skip-test') {
          t.fail(err);
        }
        t.end();
      });
    });

test('addIceCandidate with null', function(t) {
  var driver = seleniumHelpers.buildDriver();

  var testDefinition = function() {
    var callback = arguments[arguments.length - 1];

    var pc1 = new RTCPeerConnection(null);
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
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('addIceCandidate with undefined', function(t) {
  var driver = seleniumHelpers.buildDriver();

  var testDefinition = function() {
    var callback = arguments[arguments.length - 1];

    var pc1 = new RTCPeerConnection(null);
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
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

// Test polyfill for getStats.
test('getStats', {skip: true}, function(t) {
  var driver = seleniumHelpers.buildDriver();

  var testDefinition = function() {
    var callback = arguments[arguments.length - 1];

    window.testsEqualArray = [];
    var pc1 = new RTCPeerConnection(null);

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
      for (var key in report) {
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
    var getStatsResult = (error) ? 'error: ' + error.toString() : 'no errors';
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
    if (err !== 'skip-test') {
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
  var driver = seleniumHelpers.buildDriver();

  var testDefinition = function() {
    var callback = arguments[arguments.length - 1];

    window.testsEqualArray = [];
    window.testsNotEqualArray = [];
    var pc1 = new RTCPeerConnection(null);

    new Promise(function(resolve, reject) {  // jshint ignore: line
      pc1.getStats(resolve, null);
    })
    .then(function(response) {
      var reports = response.result();
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
        throw 'skip-test';
      }
    });
  })
  .then(function() {
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(error) {
    var getStatsResult = (error) ? 'error: ' + error.toString() : 'no errors';
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
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('getStats promise', function(t) {
  var driver = seleniumHelpers.buildDriver();

  // Define test.
  var testDefinition = function() {
    var callback = arguments[arguments.length - 1];

    var testsEqualArray = [];
    var pc1 = new RTCPeerConnection(null);

    pc1.getStats(null)
    .then(function(report) {
      testsEqualArray.push([typeof report, 'object',
        'getStats with no selector returns a Promise']);
      // Firefox does not like getStats without any arguments, therefore we call
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
          'getStats with no arguments returns a Promise']);
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
          t.skip('Firefox does not support getStats without arguments.');
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

test('icegatheringstatechange event',
    {skip: process.env.BROWSER !== 'MicrosoftEdge'},
    function(t) {
      var driver = seleniumHelpers.buildDriver();

      // Define test.
      var testDefinition = function() {
        var callback = arguments[arguments.length - 1];

        var pc1 = new RTCPeerConnection();
        pc1.onicegatheringstatechange = function(event) {
          if (pc1.iceGatheringState === 'complete') {
            callback();
          }
        };

        var constraints = {video: true, fake: true};
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
        if (err !== 'skip-test') {
          t.fail(err);
        }
        t.end();
      });
    });

// This MUST to be the last test since it loads adapter
// again which may result in unintended behaviour.
test('Non-module logging to console still works', function(t) {
  var driver = seleniumHelpers.buildDriver();

  var testDefinition = function() {
    window.testsEqualArray = [];
    window.logCount = 0;
    var saveConsole = console.log.bind(console);
    console.log = function() {
      window.logCount++;
    };

    console.log('log me');
    console.log = saveConsole;

    // Check for existence of variables and functions from public API.
    window.testsEqualArray.push([typeof RTCPeerConnection,'function',
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
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});
