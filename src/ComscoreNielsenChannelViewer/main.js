/**
 * Copyright 2019 PhenixP2P Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint camelcase: ["error", {properties: "never"}] */

//
// Alias to be used to publish/create/join channel
var channelAlias = 'phenixWebsiteDemo';

// Alternatively, use the following channel alias
// var channelAlias = 'MyChannelAlias';
// Then publish from the following URL once or twice:
// https://phenixrts.com/examples/ChannelPublisher/index.html
// Use 1 concurrent publisher to verify proper start/stop of stream in different lifecycle states
// Use 2 concurrent publishers to verify failover from one stream to another upon stream stop/failure

// Authenticate against our demo backend. Not for production use.
// See our admin api for more info how to setup your own backend
// https://phenixrts.com/docs/#admin-api
var backendUri = 'https://phenixrts.com/demo';

// Video element to view channel with
var videoElement = document.getElementById('myVideoId');

// Video controls
var playButton = document.getElementById('playButton');
var unmuteButton = document.getElementById('unmuteButton');

// Start with everything hidden
videoElement.style.display = 'none';
playButton.style.display = 'none';
unmuteButton.style.display = 'none';

// The following code block deals with the Nielsen integration.
//
// Nielsen: Begin setup
/* global NOLBUNDLE */
var staticTrackerId = 'STATIC-ID';
var videoTrackerId = 'VIDEO-ID';
var nielsenMetadata = {
    type: 'static',
    assetid: 'phenixgame',
    section: 'phenixrts',
    segB: 'phenixgame'
};
var contentMetadataObject = {
    type: 'content',
    assetid: 'phenixgame',
    program: 'phenixrts',
    title: 'phenixgame',
    length: 0,
    mediaURL: window.location.href,
    segB: 'phenixgame',
    airdate: '20190101 20:00:00',
    isfullepisode: 'n',
    crossId1: 'SH01234560000',
    adloadtype: '2'
};

// Static
var nSdkInstanceStatic = NOLBUNDLE.nlsQ(staticTrackerId, 'nlsnInstanceStatic', {
    nol_sdkDebug: 'debug',
    outout: 'false'
});

// Needs to be on every page
nSdkInstanceStatic.ggPM('staticstart', nielsenMetadata);

// Video
var nSdkInstanceVideo = NOLBUNDLE.nlsQ(videoTrackerId, 'nlsnInstanceVideo', {
    nol_sdkDebug: 'debug',
    outout: 'false'
});
var oneSecond = 1000;
var reportPlayheadPositionIntervalId;

function currentUnixTimestamp() {
    return Math.floor(Date.now() / 1000);
}

window.addEventListener('beforeunload', function() {
    // Indicate <end> and <stop> for the content
    nSdkInstanceVideo.ggPM('end', currentUnixTimestamp());
    nSdkInstanceVideo.ggPM('stop', currentUnixTimestamp());

    nSdkInstanceStatic.ggPM('end', currentUnixTimestamp());
    nSdkInstanceStatic.ggPM('stop', currentUnixTimestamp());
});

function videoMetaDataLoaded() {
    nSdkInstanceVideo.ggPM('loadMetadata', contentMetadataObject);
}

function stopReportingPlayheadPosition() {
    if (reportPlayheadPositionIntervalId) {
        clearInterval(reportPlayheadPositionIntervalId);
        reportPlayheadPositionIntervalId = null;
    }
}

function startReportingPlayheadPosition() {
    if (reportPlayheadPositionIntervalId) {
        clearInterval(reportPlayheadPositionIntervalId);
        reportPlayheadPositionIntervalId = null;
    }

    reportPlayheadPositionIntervalId = setInterval(function() {
        nSdkInstanceVideo.ggPM('setPlayheadPosition', currentUnixTimestamp());
    }, oneSecond);
    nSdkInstanceVideo.ggPM('setPlayheadPosition', currentUnixTimestamp());
}

function nielsenVideoPlaying() {
    startReportingPlayheadPosition();
}

function nielsenVideoPause() {
    stopReportingPlayheadPosition();
}

function nielsenVideoStalled() {
    stopReportingPlayheadPosition();
}

function nielsenVideoAbort() {
    stopReportingPlayheadPosition();
}

videoElement.addEventListener('loadedmetadata', videoMetaDataLoaded, true);
videoElement.addEventListener('playing', nielsenVideoPlaying, true);
videoElement.addEventListener('pause', nielsenVideoPause, true);
videoElement.addEventListener('stalled', nielsenVideoStalled, true);
videoElement.addEventListener('abort', nielsenVideoAbort, true);
// Nielsen: End setup

// The following code block deals with the Comscore integration.
//
// Comscore: Begin setup
/* global ns_ */
var publisherId = '123456789';
var customerC2 = '010101010';
ns_.comScore.setAppContext();
ns_.comScore.setCustomerC2(customerC2);

var streamingAnalytics = new ns_.ReducedRequirementsStreamingAnalytics({publisherId: publisherId});
var metadata = {
    ns_st_ci: 'PHENIX',
    ns_st_cl: 0,
    ns_st_pu: 'ABC', // Publisher Brand Name
    ns_st_pr: 'Phenix', // Program Title ???
    ns_st_ep: 'Phenix Game', // Episode Title
    ns_st_ge: 'Awards', // Genre
    ns_st_ddt: '01-01-2019', // Digital Airdate
    ns_st_tdt: '01-01-2019', // TV Airdate
    ns_st_st: 'PHX', // Station Title
    c3: '*null',
    c4: '*null',
    c6: 'PHENIX',
    ns_st_ce: 1 // Complete Episode Flag
};

function videoPlaying() {
    recordVideoLifecycleEvent('Playing');

    // Comscore: Record play event
    streamingAnalytics.playVideoContentPart(metadata, ns_.ReducedRequirementsStreamingAnalytics.ContentType.Live);
}

function videoPause() {
    recordVideoLifecycleEvent('Pause');

    // Comscore: Record stop event
    streamingAnalytics.stop();
}

function videoStalled() {
    recordVideoLifecycleEvent('Stalled');

    // Comscore: Record stop event
    streamingAnalytics.stop();
}

function videoAbort() {
    recordVideoLifecycleEvent('Abort');

    // Comscore: Record stop event
    streamingAnalytics.stop();
}

videoElement.addEventListener('playing', videoPlaying, true);
videoElement.addEventListener('pause', videoPause, true);
videoElement.addEventListener('stalled', videoStalled, true);
videoElement.addEventListener('abort', videoAbort, true);
// Comscore: End setup

// The following code block deals with the lifecycle integration.
// * The basic idea is that the <video> is shown/hidden when the video stream should be visible on the screen.
// * The video stream is provisioned ahead of the time that the <video> is shown so that everything is ready beforehand.
//
// Start of Lifecycle Management
var provisioned = false;

function provisionVideo() {
    if (provisioned) {
        return;
    }

    recordVideoLifecycleEvent('provision');

    provisioned = true;

    joinChannel();
}

function startVideo() {
    if (!provisioned) {
        recordVideoLifecycleEvent('provision on startVideo()');

        provisionVideo();
    }

    videoElement.style.display = '';

    recordVideoLifecycleEvent('startVideo()');

    applyLifecycle();
}

function stopVideo(callback) {
    videoElement.style.display = 'none';
    playButton.style.display = 'none';
    unmuteButton.style.display = 'none';

    recordVideoLifecycleEvent('stopVideo()');

    provisioned = false;
    shouldBeJoined = false;

    stopChannel('stopped', callback);
}

function isVideoVisible() {
    return videoElement.style.display !== 'none';
}

function applyLifecycle() {
    if (isVideoVisible()) {
        if (subscriber) {
            recordVideoLifecycleEvent('render video');

            renderVideoInElement(videoElement, subscriber);
        }
    } else {
        if (subscriber) {
            if (!shouldBeJoined) {
                stopChannel('should-be-stopped', function() {
                    recordVideoLifecycleEvent('video provisioned and then stopped');
                });

                return;
            }

            recordVideoLifecycleEvent('video provisioned and ready to play');
        }
    }
}

// Dispatch click events to setTimeout so it emulates behavior when triggered without a user action
document.getElementById('provisionVideoButton').addEventListener('click', setTimeout.bind(null, provisionVideo, 1));
document.getElementById('startVideoButton').addEventListener('click', setTimeout.bind(null, startVideo, 1));
document.getElementById('stopVideoButton').addEventListener('click', setTimeout.bind(null, stopVideo.bind(null, function() {}), 1));
// End of Lifecycle Management

// Testing

var remainingLoadTestSteps = 0;

function loadTestNextStep(provisionDelay, startDelay, stopDelay) {
    if (remainingLoadTestSteps <= 0) {
        return;
    }

    remainingLoadTestSteps--;

    setTimeout(function() {
        provisionVideo();

        setTimeout(function() {
            startVideo();

            setTimeout(function() {
                stopVideo(function() {
                    loadTestNextStep(provisionDelay, startDelay, stopDelay);
                });
            }, stopDelay);
        }, startDelay);
    }, provisionDelay);
}

document.getElementById('loadTestNormalCyclesButton').addEventListener('click', function() {
    remainingLoadTestSteps = 20;

    loadTestNextStep(600000, 30000, 240000);
});

document.getElementById('loadTestFastCyclesButton').addEventListener('click', function() {
    remainingLoadTestSteps = 50;

    loadTestNextStep(3000, 3000, 3000);
});

document.getElementById('loadTestCrazyCyclesButton').addEventListener('click', function() {
    remainingLoadTestSteps = 100;

    loadTestNextStep(10, 10, 50);
});
// End of testing

// The following code deals with the web SDK integration.
// * It creates a ChannelExpress object upon loading of the page
// * It can join a channel without showing the stream yet on the screen
// * It can show the video on screen upon request
var sdk = window['phenix-web-sdk'];
var isMobileAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

var adminApiProxyClient = new sdk.net.AdminApiProxyClient();

adminApiProxyClient.setBackendUri(backendUri);

// Instantiate the instance of the channel express
var channel = new sdk.express.ChannelExpress({
    treatBackgroundAsOffline: isMobileAppleDevice,
    adminApiProxyClient: adminApiProxyClient
});

var shouldBeJoined = false;
var channelService = null;
var subscriber = null;
var subscriberDisposables = [];

function disposeSubscriberDisposables() {
    for (var i = 0; i < subscriberDisposables.length; i++) {
        subscriberDisposables[i].dispose();
    }

    subscriberDisposables.length = 0;
}

function allowUserToRetryManuallyAfterError() {
    if (!shouldBeJoined) {
        return;
    }

    playButton.addEventListener('click', function retryAfterError() {
        playButton.removeEventListener('click', retryAfterError);

        if (!shouldBeJoined) {
            return;
        }

        setStatusMessage('User triggered play()');
        joinChannel();
        playButton.style.display = 'none';
    });
    playButton.style.display = '';
}

function stopChannel(reason, callback) {
    disposeSubscriberDisposables();

    if (subscriber) {
        subscriber.stop(reason || 'stopped');
        subscriber = null;
    }

    if (channelService) {
        var myChannelService = channelService;

        myChannelService.leaveChannel(function() {
            myChannelService.stop(reason || 'stopped');
            callback && callback();
        });

        channelService = null;
    } else {
        callback && callback();
    }
}

function joinChannel() {
    shouldBeJoined = true;

    stopChannel('stop-before-join', function() {
        channel.joinChannel({
            alias: channelAlias,
            streamSelectionStrategy: 'high-availability'
        }, function joinChannelCallback(error, response) {
            if (error) {
                console.error('Unable to join channel', error);

                setUserMessage('joinChannel()::joinChannelCallback(error, response) returned error=' + error.message);

                // Handle error
                return;
            }

            setUserMessage('joinChannel()::joinChannelCallback(error, response) returned response.status=' + response.status);

            if (response.status !== 'ok') {
                // Handle error
                console.warn('Unable to join room, status: ' + response.status);

                return;
            }

            if (!shouldBeJoined) {
                response.channelService.stop('stopped-before-started');

                return;
            }

            channelService = response.channelService;
        }, function subscriberCallback(error, response) {
            disposeSubscriberDisposables();

            if (subscriber) {
                subscriber.stop('subscriber-callback');
            }

            if (error) {
                console.error('Unable to subscribe to channel', error);

                setUserMessage('joinChannel()::subscriberCallback(error, response) returned error=' + error.message);

                allowUserToRetryManuallyAfterError();

                return;
            }

            setUserMessage('joinChannel()::subscriberCallback(error, response) returned response.status=' + response.status);

            if (response.status === 'no-stream-playing') {
                // Waiting for a stream to start
                return;
            } else if (response.status !== 'ok') {
                allowUserToRetryManuallyAfterError();

                return;
            }

            setUserMessage('joinChannel()::subscriberCallback(error, response) returned response.mediaStream.getStreamId()=' + response.mediaStream.getStreamId());

            subscriber = response.mediaStream;

            setStatusMessage('Stream ID: "' + subscriber.getStreamId() + '"');

            applyLifecycle();
        });
    });
}

function renderVideoInElement(videoElement, subscriber) {
    var renderer = subscriber.createRenderer();

    subscriberDisposables.push(renderer.on('autoMuted', function handleAutoMuted() {
        if (!shouldBeJoined) {
            return;
        }

        // The browser refused to play video with audio therefore the stream was started muted.
        // Handle this case properly in your UI so that the user can unmute its stream

        setStatusMessage('Video was automatically muted');

        // Show button to unmute
        unmuteButton.style.display = '';
    }));

    subscriberDisposables.push(renderer.on('failedToPlay', function handleFailedToPlay(reason) {
        if (!shouldBeJoined) {
            return;
        }

        // The browser refused to play video even with audio muted.
        // Handle this case properly in your UI so that the user can start their stream.

        setStatusMessage('Video failed to play: "' + reason + '"');

        if (isMobileAppleDevice && reason === 'failed-to-play') {
            // IOS battery saver mode requires user interaction with the <video> to play video
            videoElement.addEventListener('play', function mobileApplePlayAfterFailedToPlay() {
                videoElement.removeEventListener('play', mobileApplePlayAfterFailedToPlay);
                setStatusMessage('Video play()');
                renderer.start(videoElement);
            });
        } else {
            playButton.addEventListener('click', function playAfterFailedToPlay() {
                playButton.removeEventListener('click', playAfterFailedToPlay);
                setStatusMessage('User triggered play()');
                renderer.start(videoElement);
                playButton.style.display = 'none';
            });
            playButton.style.display = '';
        }
    }));

    subscriberDisposables.push(renderer.on('ended', function handleEnded(reason) {
        setStatusMessage('Video ended: "' + reason + '"');

        // The video will automatically recover for known situations.
        // Show the control to the user for exceptional situations (e.g. no network connection).
        allowUserToRetryManuallyAfterError();
    }));

    unmuteButton.style.display = 'none';
    playButton.style.display = 'none';

    renderer.start(videoElement);
}

unmuteButton.addEventListener('click', function() {
    videoElement.muted = false;
    unmuteButton.style.display = 'none';
    setStatusMessage('');
});

// Debugging messages for development
var userMessageElement = document.getElementById('userMessage');
var statusMessageElement = document.getElementById('statusMessage');
var videoLifecycleElement = document.getElementById('videoLifecycle');

function setUserMessage(message) {
    userMessageElement.innerText = message;
}

function setStatusMessage(message) {
    statusMessageElement.innerText = message;
}

function recordVideoLifecycleEvent(message) {
    videoLifecycleElement.innerText += new Date().toLocaleTimeString() + ' ' + message + '\n';
}