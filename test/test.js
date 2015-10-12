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
    t.fail(err);
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
    t.fail(err);
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
    t.fail(err);
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
    t.fail(err);
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
    t.fail(err);
    t.end();
  });
});

test('attachMediaStream', function(t) {
  var driver = seleniumHelpers.buildDriver();
  // Define test.
  var testDefinition = function() {
    var constraints = {video: true, fake: false};
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
    t.ok(!error, 'Test definition executed with ' + errorMessage);
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
    // Cleanup.
    driver.executeScript(
      'window.stream.getTracks().forEach(function(track) { track.stop(); });' +
      'window.stream = null;' +
      'document.body.removeChild(document.getElementById(\'video\'))');
    t.end();
  })
  .then(null, function(err) {
    t.fail(err);
    t.end();
  });
});

test('reattachMediaStream', function(t) {
  var driver = seleniumHelpers.buildDriver();
  // Define test.
  var testDefinition = function() {
    var constraints = {video: true, fake: false};
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
      window.gumError = err.message;
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
    t.ok(!error, 'Test definition executed with ' + errorMessage);
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
      t.ok(width > 2, 'Video width is: ' + width);
    })
    .then(function() {
      videoElement2.getAttribute('videoHeight')
      .then(function(height) {
        t.ok(height > 2, 'Video height is: ' + height);
      });
    });
  })
  .then(function() {
    // Cleanup.
    driver.executeScript(
      'window.stream.getTracks().forEach(function(track) { track.stop(); });' +
      'window.stream = null;' +
      'document.body.removeChild(document.getElementById(\'video\'))');
    t.end();
  })
  .then(null, function(err) {
    t.fail(err);
    t.end();
  });
});

test('video srcObject getter/setter test', function(t) {
  var driver = seleniumHelpers.buildDriver();
  // Define test.
  var testDefinition = function() {
    var constraints = {video: true, fake: false};
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
      window.gumError = err.message;
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
    t.ok(!error, 'Test definition executed with ' + errorMessage);
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
    // Cleanup.
    driver.executeScript(
      'window.stream.getTracks().forEach(function(track) { track.stop(); });' +
      'window.stream = null;' +
      'document.body.removeChild(document.getElementById(\'video\'))');
    t.end();
  })
  .then(null, function(err) {
    t.fail(err);
    t.end();
  });
});

// test('audio srcObject getter/setter test', function(t) {
//   t.plan(3);
//   var audio = document.createElement('audio');

//   var constraints = {video: false, audio: true, fake: true};
//   navigator.mediaDevices.getUserMedia(constraints)
//   .then(function(stream) {
//     t.pass('got stream');
//     audio.srcObject = stream;
//     t.pass('srcObject set');
//     t.ok(audio.srcObject.id === stream.id,
//         'srcObject getter returns stream object');
//     stream.getTracks().forEach(function(track) { track.stop(); });
//   })
//   .catch(function(err) {
//     t.fail(err.toString());
//   });
// });

// test('srcObject set from another object', function(t) {
//   var video = document.createElement('video');
//   var video2 = document.createElement('video');

//   var constraints = {video: true, fake: true};
//   navigator.mediaDevices.getUserMedia(constraints)
//   .then(function(stream) {
//     t.pass('got stream.');
//     video.srcObject = stream;
//     video2.srcObject = video.srcObject;
//     t.ok(video.srcObject.id === video2.srcObject.id,
//         'stream ids from srcObjects match');
//     stream.getTracks().forEach(function(track) { track.stop(); });
//     t.end();
//   })
//   .catch(function(err) {
//     t.fail(err.toString());
//   });
// });

// test('attach mediaStream directly', function(t) {
//   // onloadedmetadata had issues in Firefox < 38.
//   t.plan((m.webrtcDetectedBrowser === 'firefox' &&
//           m.webrtcDetectedVersion < 38) ? 2 : 3);
//   var video = document.createElement('video');
//   var constraints = {video: true, fake: true};
//   navigator.mediaDevices.getUserMedia(constraints)
//   .then(function(stream) {
//     t.pass('got stream.');
//     video.srcObject = stream;
//     t.pass('attachMediaStream returned');

//     // If attachMediaStream works, we should get a video
//     // at some point. This will trigger onloadedmetadata.
//     video.onloadedmetadata = function() {
//       t.pass('got stream with w=' + video.videoWidth +
//              ',h=' + video.videoHeight);
//       stream.getTracks().forEach(function(track) { track.stop(); });
//     };
//   })
//   .catch(function(err) {
//     t.fail(err.toString());
//   });
// });

// test('reattaching mediaStream directly', function(t) {
//   // onloadedmetadata had issues in Firefox < 38.
//   t.plan((m.webrtcDetectedBrowser === 'firefox' &&
//           m.webrtcDetectedVersion < 38) ? 2 : 4);
//   var video = document.createElement('video');
//   var constraints = {video: true, fake: true};
//   navigator.mediaDevices.getUserMedia(constraints)
//   .then(function(stream) {
//     t.pass('got stream.');
//     video.srcObject = stream;
//     t.pass('srcObject set');

//     // If attachMediaStream works, we should get a video
//     // at some point. This will trigger onloadedmetadata.
//     // This reattaches to the second video which will trigger
//     // onloadedmetadata there.
//     video.onloadedmetadata = function() {
//       t.pass('got stream on first video with w=' + video.videoWidth +
//              ',h=' + video.videoHeight);
//       video2.srcObject = video.srcObject;
//     };

//     var video2 = document.createElement('video');
//     video2.onloadedmetadata = function() {
//       t.pass('got stream on second video with w=' + video.videoWidth +
//              ',h=' + video.videoHeight);
//     };
//   })
//   .catch(function(err) {
//     t.fail(err.toString());
//   });
// });

// test('call getUserMedia with constraints', function(t) {
//   t.plan(1);
//   var impossibleConstraints = {
//     video: {
//       width: 1280,
//       height: {min: 200, ideal: 720, max: 1080},
//       frameRate: {exact: 0} // to fail
//     },
//   };
//   if (m.webrtcDetectedBrowser === 'firefox') {
//     if (m.webrtcDetectedVersion < 42) {
//       t.skip('getUserMedia(impossibleConstraints) must fail ' +
//              '(firefox <42 cannot turn off fake devices)');
//       return;
//     }
//     impossibleConstraints.fake = false; // override
//   }
//   new Promise(function(resolve, reject) {
//     navigator.getUserMedia(impossibleConstraints, resolve, reject);
//   })
//   .then(function() {
//     t.fail('getUserMedia(impossibleConstraints) must fail');
//   })
//   .catch(function(err) {
//     t.ok(err.name.indexOf('Error') >= 0,
//          'getUserMedia(impossibleConstraints) must fail');
//   });
// });

// test('check getUserMedia legacy constraints converter', function(t) {
//   function testBeforeAfterPairs(gum, pairs) {
//     pairs.forEach(function(beforeAfter, i) {
//       var constraints = interceptGumForConstraints(gum, function() {
//         navigator.getUserMedia(beforeAfter[0], function() {}, function() {});
//       });
//       t.deepEqual(constraints, beforeAfter[1],
//                   'Constraints ' + (i + 1) + ' back-converted to ' + gum);
//     });
//   }

//   if (m.webrtcDetectedBrowser === 'firefox') {
//     pretendVersion(m, 37, function() {
//       testBeforeAfterPairs('mozGetUserMedia', [
//         // Test that spec constraints get back-converted on FF37.
//         [
//          {
//            video: {
//              mediaSource: 'screen',
//              width: 1280,
//              height: {min: 200, ideal: 720, max: 1080},
//              facingMode: 'user',
//              frameRate: {exact: 50}
//            }
//          },
//          {
//            video: {
//              mediaSource: 'screen',
//              height: {min: 200, max: 1080},
//              frameRate: {max: 50, min: 50},
//              advanced: [
//                {width: {min: 1280, max: 1280}},
//                {height: {min: 720, max: 720}},
//                {facingMode: 'user'}
//              ],
//              require: ['height', 'frameRate']
//            }
//          }
//         ],
//         // Test that legacy constraints pass through unharmed on FF37.
//         [
//          {
//            video: {
//              height: {min: 200, max: 1080},
//              frameRate: {max: 50, min: 50},
//              advanced: [
//                {width: {min: 1280, max: 1280}},
//                {height: {min: 720, max: 720}},
//                {facingMode: 'user'}
//              ],
//              require: ['height', 'frameRate']
//            }
//          },
//          {
//            video: {
//              height: {min: 200, max: 1080},
//              frameRate: {max: 50, min: 50},
//              advanced: [
//                {width: {min: 1280, max: 1280}},
//                {height: {min: 720, max: 720}},
//                {facingMode: 'user'}
//              ],
//              require: ['height', 'frameRate']
//            }
//          }
//         ],
//       ]);
//     });
//     pretendVersion(m, 38, function() {
//       testBeforeAfterPairs('mozGetUserMedia', [
//         // Test that spec constraints pass through unharmed on FF38+.
//         [
//          {
//            video: {
//              mediaSource: 'screen',
//              width: 1280,
//              height: {min: 200, ideal: 720, max: 1080},
//              facingMode: 'user',
//              frameRate: {exact: 50}
//            }
//          },
//          {
//            video: {
//              mediaSource: 'screen',
//              width: 1280,
//              height: {min: 200, ideal: 720, max: 1080},
//              facingMode: 'user',
//              frameRate: {exact: 50}
//            }
//          },
//         ],
//       ]);
//     });
//   } else if (m.webrtcDetectedBrowser === 'chrome') {
//     testBeforeAfterPairs('webkitGetUserMedia', [
//       // Test that spec constraints get back-converted on Chrome.
//       [
//        {
//          video: {
//            width: 1280,
//            height: {min: 200, ideal: 720, max: 1080},
//            frameRate: {exact: 50}
//          }
//        },
//        {
//          video: {
//            mandatory: {
//              maxFrameRate: 50,
//              maxHeight: 1080,
//              minHeight: 200,
//              minFrameRate: 50
//            },
//            optional: [
//              {minWidth: 1280},
//              {maxWidth: 1280},
//              {minHeight: 720},
//              {maxHeight: 720},
//            ]
//          }
//        }
//       ],
//       // Test that legacy constraints pass through unharmed on Chrome.
//       [
//        {
//          video: {
//            mandatory: {
//              maxFrameRate: 50,
//              maxHeight: 1080,
//              minHeight: 200,
//              minFrameRate: 50
//            },
//            optional: [
//              {minWidth: 1280},
//              {maxWidth: 1280},
//              {minHeight: 720},
//              {maxHeight: 720},
//            ]
//          }
//        },
//        {
//          video: {
//            mandatory: {
//              maxFrameRate: 50,
//              maxHeight: 1080,
//              minHeight: 200,
//              minFrameRate: 50
//            },
//            optional: [
//              {minWidth: 1280},
//              {maxWidth: 1280},
//              {minHeight: 720},
//              {maxHeight: 720},
//            ]
//          }
//        }
//       ],
//       // Test code protecting Chrome from choking on common unknown constraints.
//       [
//        {
//          video: {
//            mediaSource: 'screen',
//            advanced: [
//              {facingMode: 'user'}
//            ],
//            require: ['height', 'frameRate']
//          }
//        },
//        {
//          video: {
//            optional: [
//              {facingMode: 'user'}
//            ]
//          }
//        }
//       ]
//     ]);
//   }
//   t.end();
// });

// test('basic connection establishment', function(t) {
//   var pc1 = new RTCPeerConnection(null);
//   var pc2 = new RTCPeerConnection(null);
//   var ended = false;

//   pc1.oniceconnectionstatechange = function() {
//     if (pc1.iceConnectionState === 'connected' ||
//         pc1.iceConnectionState === 'completed') {
//       t.pass('P2P connection established');
//       if (!ended) {
//         ended = true;
//         t.end();
//       }
//     }
//   };

//   var addCandidate = function(pc, event) {
//     if (event.candidate) {
//       var cand = new RTCIceCandidate(event.candidate);
//       pc.addIceCandidate(cand,
//         function() {
//           t.pass('addIceCandidate');
//         },
//         function(err) {
//           t.fail('addIceCandidate ' + err.toString());
//         }
//       );
//     }
//   };
//   pc1.onicecandidate = function(event) {
//     addCandidate(pc2, event);
//   };
//   pc2.onicecandidate = function(event) {
//     addCandidate(pc1, event);
//   };

//   var constraints = {video: true, fake: true};
//   navigator.mediaDevices.getUserMedia(constraints)
//   .then(function(stream) {
//     pc1.addStream(stream);

//     pc1.createOffer(
//       function(offer) {
//         t.pass('pc1.createOffer');
//         pc1.setLocalDescription(offer,
//           function() {
//             t.pass('pc1.setLocalDescription');

//             offer = new RTCSessionDescription(offer);
//             t.pass('created RTCSessionDescription from offer');
//             pc2.setRemoteDescription(offer,
//               function() {
//                 t.pass('pc2.setRemoteDescription');
//                 pc2.createAnswer(
//                   function(answer) {
//                     t.pass('pc2.createAnswer');
//                     pc2.setLocalDescription(answer,
//                       function() {
//                         t.pass('pc2.setLocalDescription');
//                         answer = new RTCSessionDescription(answer);
//                         t.pass('created RTCSessionDescription from answer');
//                         pc1.setRemoteDescription(answer,
//                           function() {
//                             t.pass('pc1.setRemoteDescription');
//                           },
//                           function(err) {
//                             t.fail('pc1.setRemoteDescription ' +
//                                 err.toString());
//                           }
//                         );
//                       },
//                       function(err) {
//                         t.fail('pc2.setLocalDescription ' + err.toString());
//                       }
//                     );
//                   },
//                   function(err) {
//                     t.fail('pc2.createAnswer ' + err.toString());
//                   }
//                 );
//               },
//               function(err) {
//                 t.fail('pc2.setRemoteDescription ' + err.toString());
//               }
//             );
//           },
//           function(err) {
//             t.fail('pc1.setLocalDescription ' + err.toString());
//           }
//         );
//       },
//       function(err) {
//         t.fail('pc1 failed to create offer ' + err.toString());
//       }
//     );
//   });
// });

// test('basic connection establishment with promise', function(t) {
//   var pc1 = new RTCPeerConnection(null);
//   var pc2 = new RTCPeerConnection(null);
//   var ended = false;

//   pc1.oniceconnectionstatechange = function() {
//     if (pc1.iceConnectionState === 'connected' ||
//         pc1.iceConnectionState === 'completed') {
//       t.pass('P2P connection established');
//       if (!ended) {
//         ended = true;
//         t.end();
//       }
//     }
//   };

//   var addCandidate = function(pc, event) {
//     if (event.candidate) {
//       var cand = new RTCIceCandidate(event.candidate);
//       pc.addIceCandidate(cand).catch(function(err) {
//         t.fail('addIceCandidate ' + err.toString());
//       });
//     }
//   };
//   pc1.onicecandidate = function(event) {
//     addCandidate(pc2, event);
//   };
//   pc2.onicecandidate = function(event) {
//     addCandidate(pc1, event);
//   };

//   var constraints = {video: true, fake: true};
//   navigator.mediaDevices.getUserMedia(constraints)
//   .then(function(stream) {
//     pc1.addStream(stream);
//     pc1.createOffer().then(function(offer) {
//       t.pass('pc1.createOffer');
//       return pc1.setLocalDescription(offer);
//     }).then(function() {
//       t.pass('pc1.setLocalDescription');
//       return pc2.setRemoteDescription(pc1.localDescription);
//     }).then(function() {
//       t.pass('pc2.setRemoteDescription');
//       return pc2.createAnswer();
//     }).then(function(answer) {
//       t.pass('pc2.createAnswer');
//       return pc2.setLocalDescription(answer);
//     }).then(function() {
//       t.pass('pc2.setLocalDescription');
//       return pc1.setRemoteDescription(pc2.localDescription);
//     }).then(function() {
//       t.pass('pc1.setRemoteDescription');
//     }).catch(function(err) {
//       t.fail(err.toString());
//     });
//   });
// });

// test('basic connection establishment with datachannel', function(t) {
//   var pc1 = new RTCPeerConnection(null);
//   var pc2 = new RTCPeerConnection(null);
//   var ended = false;
//   if (typeof pc1.createDataChannel !== 'function') {
//     t.pass('datachannel is not supported.');
//     t.end();
//     return;
//   }

//   pc1.oniceconnectionstatechange = function() {
//     if (pc1.iceConnectionState === 'connected' ||
//         pc1.iceConnectionState === 'completed') {
//       t.pass('P2P connection established');
//       if (!ended) {
//         ended = true;
//         t.end();
//       }
//     }
//   };

//   var addCandidate = function(pc, event) {
//     if (event.candidate) {
//       var cand = new RTCIceCandidate(event.candidate);
//       pc.addIceCandidate(cand).catch(function(err) {
//         t.fail('addIceCandidate ' + err.toString());
//       });
//     }
//   };
//   pc1.onicecandidate = function(event) {
//     addCandidate(pc2, event);
//   };
//   pc2.onicecandidate = function(event) {
//     addCandidate(pc1, event);
//   };

//   pc1.createDataChannel('somechannel');
//   pc1.createOffer().then(function(offer) {
//     t.pass('pc1.createOffer');
//     return pc1.setLocalDescription(offer);
//   }).then(function() {
//     t.pass('pc1.setLocalDescription');
//     return pc2.setRemoteDescription(pc1.localDescription);
//   }).then(function() {
//     t.pass('pc2.setRemoteDescription');
//     return pc2.createAnswer();
//   }).then(function(answer) {
//     t.pass('pc2.createAnswer');
//     return pc2.setLocalDescription(answer);
//   }).then(function() {
//     t.pass('pc2.setLocalDescription');
//     return pc1.setRemoteDescription(pc2.localDescription);
//   }).then(function() {
//     t.pass('pc1.setRemoteDescription');
//   }).catch(function(err) {
//     t.fail(err.toString());
//   });
// });

// test('call enumerateDevices', function(t) {
//   var step = 'enumerateDevices() must succeed';
//   navigator.mediaDevices.enumerateDevices()
//   .then(function(devices) {
//     t.pass(step);
//     step = 'valid enumerateDevices output: ' + JSON.stringify(devices);
//     t.ok(typeof devices.length === 'number', 'Produced a devices array');
//     devices.forEach(function(d) {
//       t.ok(d.kind === 'videoinput' ||
//            d.kind === 'audioinput' ||
//            d.kind === 'audiooutput', 'Known device kind');
//       t.ok(d.deviceId.length !== undefined, 'device id present');
//       t.ok(d.label.length !== undefined, 'device label present');
//     });
//     t.pass(step);
//     t.end();
//   })
//   .catch(function(err) {
//     t.fail(step + ' - ' + err.toString());
//     t.end();
//   });
// });

// // Test that adding and removing an eventlistener on navigator.mediaDevices
// // is possible. The usecase for this is the devicechanged event.
// // This does not test whether devicechanged is actually called.
// test('navigator.mediaDevices eventlisteners', function(t) {
//   t.plan(2);
//   t.ok(typeof(navigator.mediaDevices.addEventListener) === 'function',
//       'navigator.mediaDevices.addEventListener is a function');
//   t.ok(typeof(navigator.mediaDevices.removeEventListener) === 'function',
//       'navigator.mediaDevices.removeEventListener is a function');
// });

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
