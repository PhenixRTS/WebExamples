/**
 * Copyright 2025 Phenix Real Time Solutions, Inc. All Rights Reserved.
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

// URL parameters
const token = new URLSearchParams(location.search).get('token');
// Video element to view channel with
const videoElement = document.getElementById('myVideoId');
// Video controls
const playButton = document.getElementById('playButton');
const unmuteButton = document.getElementById('unmuteButton');

// Start with everything hidden
videoElement.style.display = 'none';
playButton.style.display = 'none';
unmuteButton.style.display = 'none';

// The following code block deals with the Nielsen integration.
//
// Nielsen: Begin setup
/* global NOLBUNDLE */
const staticTrackerId = 'STATIC-ID';
const videoTrackerId = 'VIDEO-ID';
const nielsenMetadata = {
    type: 'static',
    assetid: 'phenixgame',
    section: 'phenixrts',
    segB: 'phenixgame'
};
const contentMetadataObject = {
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
const nSdkInstanceStatic = NOLBUNDLE.nlsQ(staticTrackerId, 'nlsnInstanceStatic', {
    nol_sdkDebug: 'debug',
    outout: 'false'
});

// Needs to be on every page
nSdkInstanceStatic.ggPM('staticstart', nielsenMetadata);

// Video
const nSdkInstanceVideo = NOLBUNDLE.nlsQ(videoTrackerId, 'nlsnInstanceVideo', {
    nol_sdkDebug: 'debug',
    outout: 'false'
});
const oneSecond = 1000;
let reportPlayheadPositionIntervalId;

function currentUnixTimestamp() {
    return Math.floor(Date.now() / 1000);
}

window.addEventListener('beforeunload', () => {
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

    reportPlayheadPositionIntervalId = setInterval(() => {
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
const publisherId = '123456789';
const customerC2 = '010101010';
ns_.comScore.setAppContext();
ns_.comScore.setCustomerC2(customerC2);

const streamingAnalytics = new ns_.ReducedRequirementsStreamingAnalytics({publisherId: publisherId});
const metadata = {
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
let provisioned = false;

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
                stopChannel('should-be-stopped', () => {
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
document.getElementById('stopVideoButton').addEventListener('click', setTimeout.bind(null, stopVideo.bind(null, () => {}), 1));
// End of Lifecycle Management

// Testing

let remainingLoadTestSteps = 0;

function loadTestNextStep(provisionDelay, startDelay, stopDelay) {
    if (remainingLoadTestSteps <= 0) {
        return;
    }

    remainingLoadTestSteps--;

    setTimeout(() => {
        provisionVideo();

        setTimeout(() => {
            startVideo();

            setTimeout(() => {
                stopVideo(() => {
                    loadTestNextStep(provisionDelay, startDelay, stopDelay);
                });
            }, stopDelay);
        }, startDelay);
    }, provisionDelay);
}

document.getElementById('loadTestNormalCyclesButton').addEventListener('click', () => {
    remainingLoadTestSteps = 20;

    loadTestNextStep(600000, 30000, 240000);
});

document.getElementById('loadTestFastCyclesButton').addEventListener('click', () => {
    remainingLoadTestSteps = 50;

    loadTestNextStep(3000, 3000, 3000);
});

document.getElementById('loadTestCrazyCyclesButton').addEventListener('click', () => {
    remainingLoadTestSteps = 100;

    loadTestNextStep(10, 10, 50);
});
// End of testing

// The following code deals with the web SDK integration.
// * It creates a ChannelExpress object upon loading of the page
// * It can join a channel without showing the stream yet on the screen
// * It can show the video on screen upon request
const sdk = window['phenix-web-sdk'];
const isMobileAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
// Instantiate the instance of the channel express
const channel = new sdk.express.ChannelExpress({
    authToken: token,
    treatBackgroundAsOffline: isMobileAppleDevice
});
let shouldBeJoined = false;
let channelService = null;
let subscriber = null;
const subscriberDisposables = [];

function disposeSubscriberDisposables() {
    for (let i = 0; i < subscriberDisposables.length; i++) {
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
        const myChannelService = channelService;

        myChannelService.leaveChannel(() => {
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

    stopChannel('stop-before-join', () => {
        channel.joinChannel({
            token,
            streamSelectionStrategy: 'high-availability'
        }, (error, response) => {
            if (error) {
                console.error('Unable to join channel', error);

                setUserMessage(`joinChannel()::joinChannelCallback(error, response) returned error=${error.message}`);

                // Handle error
                return;
            }

            setUserMessage(`joinChannel()::joinChannelCallback(error, response) returned response.status=${response.status}`);

            if (response.status !== 'ok') {
                // Handle error
                console.warn(`Unable to join room, status: ${response.status}`);

                return;
            }

            if (!shouldBeJoined) {
                response.channelService.stop('stopped-before-started');

                return;
            }

            channelService = response.channelService;
        }, (error, response) => {
            disposeSubscriberDisposables();

            if (subscriber) {
                subscriber.stop('subscriber-callback');
            }

            if (error) {
                console.error('Unable to subscribe to channel', error);

                setUserMessage(`joinChannel()::subscriberCallback(error, response) returned error=${error.message}`);

                allowUserToRetryManuallyAfterError();

                return;
            }

            setUserMessage(`joinChannel()::subscriberCallback(error, response) returned response.status=${response.status}`);

            if (response.status === 'no-stream-playing') {
                // Waiting for a stream to start
                return;
            } else if (response.status !== 'ok') {
                allowUserToRetryManuallyAfterError();

                return;
            }

            setUserMessage(`joinChannel()::subscriberCallback(error, response) returned response.mediaStream.getStreamId()=${response.mediaStream.getStreamId()}`);

            subscriber = response.mediaStream;

            setStatusMessage(`Stream ID: "${subscriber.getStreamId()}"`);

            applyLifecycle();
        });
    });
}

function renderVideoInElement(videoElement, subscriber) {
    const renderer = subscriber.createRenderer();

    subscriberDisposables.push(renderer.on('autoMuted', () => {
        if (!shouldBeJoined) {
            return;
        }

        // The browser refused to play video with audio therefore the stream was started muted.
        // Handle this case properly in your UI so that the user can unmute its stream

        setStatusMessage('Video was automatically muted');

        // Show button to unmute
        unmuteButton.style.display = '';
    }));

    subscriberDisposables.push(renderer.on('failedToPlay', reason => {
        if (!shouldBeJoined) {
            return;
        }

        // The browser refused to play video even with audio muted.
        // Handle this case properly in your UI so that the user can start their stream.

        setStatusMessage(`Video failed to play: "${reason}"`);

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

    subscriberDisposables.push(renderer.on('ended', reason => {
        setStatusMessage(`Video ended: "${reason}"`);

        // The video will automatically recover for known situations.
        // Show the control to the user for exceptional situations (e.g. no network connection).
        allowUserToRetryManuallyAfterError();
    }));

    unmuteButton.style.display = 'none';
    playButton.style.display = 'none';

    renderer.start(videoElement);
}

unmuteButton.addEventListener('click', () => {
    videoElement.muted = false;
    unmuteButton.style.display = 'none';
    setStatusMessage('');
});

// Debugging messages for development
const userMessageElement = document.getElementById('userMessage');
const statusMessageElement = document.getElementById('statusMessage');
const videoLifecycleElement = document.getElementById('videoLifecycle');

function setUserMessage(message) {
    userMessageElement.innerText = message;
}

function setStatusMessage(message) {
    statusMessageElement.innerText = message;
}

function recordVideoLifecycleEvent(message) {
    videoLifecycleElement.innerText += new Date().toLocaleTimeString() + ' ' + message + '\n';
}