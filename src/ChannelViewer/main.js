/**
 * Copyright 2023 Phenix Real Time Solutions, Inc. All Rights Reserved.
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

var sdk = window['phenix-web-sdk'];
var isMobileAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
var isOtherMobile = /Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(navigator.userAgent);

// Video element to view channel with
var videoElement = document.getElementById('myVideoId');

var channelExpressOptions = {};

var joinChannelOptions = {
    videoElement: videoElement,
    // Select the most recent publisher in the channel
    streamSelectionStrategy: 'most-recent'
    // Alternatively, select one of multiple High-Availability publishers in the channel
    // streamSelectionStrategy: 'high-availability'
};

// Support customizations
try {
    var params = window.location.search.substring(1).split('&');

    for (var i = 0; i < params.length; i++) {
        if (params[i] === 'treatBackgroundAsOffline') {
            channelExpressOptions.treatBackgroundAsOffline = true;
        }

        if (params[i].indexOf('token=') === 0) {
            var token = params[i].substring('token='.length);

            channelExpressOptions.authToken = token;
            joinChannelOptions.streamToken = token;
        }

        if (params[i] === 'shaka') {
            channelExpressOptions.shakaLoader = function(callback) {
                var script = document.createElement('script');
                script.onload = function() {
                    callback(window.shaka);
                };
                script.src = 'https://ajax.googleapis.com/ajax/libs/shaka-player/2.5.14/shaka-player.compiled.js';

                document.head.appendChild(script);
            };
        }

        if (params[i] === 'webPlayer') {
            channelExpressOptions.webPlayerLoader = function(callback) {
                var script = document.createElement('script');
                script.onload = function() {
                    callback(window['phenix-web-player']);
                };
                script.src = 'https://dl.phenixrts.com/WebPlayer/2020.0.latest/phenix-web-player-bundled.min.js';

                document.head.appendChild(script);
            };
        }
    }
} catch (e) {
    console.error(e);
}

// Instantiate the instance of the ChannelExpress
// IMPORTANT: This should happen at the earliest possible time after the app is started.
var channel = new sdk.express.ChannelExpress(channelExpressOptions);

var disposables = [];
function joinChannel() {
    channel.joinChannel(joinChannelOptions, function joinChannelCallback(error, response) {
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

        // Successfully joined channel
        if (response.channelService) {
            // Do something with channelService
        }
    }, function subscriberCallback(error, response) {
        for (var i = 0; i < disposables.length; i++) {
            disposables[i].dispose();
        }

        disposables.length = 0;

        if (error) {
            console.error('Unable to subscribe to channel', error);

            setUserMessage('joinChannel()::subscriberCallback(error, response) returned error=' + error.message);

            // Handle error
            return;
        }

        setUserMessage('joinChannel()::subscriberCallback(error, response) returned response.status=' + response.status);

        if (response.status === 'no-stream-playing') {
            // Handle no stream playing in channel - Wait for one to start
            return;
        } else if (response.status !== 'ok') {
            // Handle error
            return;
        }

        // Successfully subscribed to most recent channel presenter
        if (response.mediaStream) {
            // Do something with mediaStream
            setUserMessage('joinChannel()::subscriberCallback(error, response) returned response.mediaStream.getStreamId()=' + response.mediaStream.getStreamId());
        }

        if (response.renderer) {
            setStatusMessage('Subscribed');

            disposables.push(response.renderer.on('autoMuted', function handleAutoMuted() {
                // The browser refused to play video with audio therefore the stream was started muted.
                // Handle this case properly in your UI so that the user can unmute its stream

                setStatusMessage('Video was automatically muted');

                // Show button to unmute
                document.getElementById('unmuteButton').style.display = '';
            }));

            disposables.push(response.renderer.on('failedToPlay', function handleFailedToPlay(reason) {
                // The browser refused to play video even with audio muted.
                // Handle this case properly in your UI so that the user can start their stream.

                setStatusMessage('Video failed to play: "' + reason + '"');

                if (isMobileAppleDevice && reason === 'failed-to-play') {
                    // IOS battery saver mode requires user interaction with the <video> to play video
                    videoElement.onplay = function() {
                        setStatusMessage('Video play()');
                        response.renderer.start(videoElement);
                        videoElement.onplay = null;
                    };
                } else {
                    document.getElementById('playButton').onclick = function() {
                        setStatusMessage('User triggered play()');
                        response.renderer.start(videoElement);
                        document.getElementById('playButton').style.display = 'none';
                    };
                    document.getElementById('playButton').style.display = '';
                }
            }));

            disposables.push(response.renderer.on('ended', function handleEnded(reason) {
                setStatusMessage('Video ended: "' + reason + '"');

                document.getElementById('playButton').onclick = function() {
                    setStatusMessage('User triggered play()');
                    joinChannel();
                    document.getElementById('playButton').style.display = 'none';
                };
                document.getElementById('playButton').style.display = '';
            }));
        }
    });
}

function setUserMessage(message) {
    var userMessageElement = document.getElementById('userMessage');

    userMessageElement.innerText = message;
}

function setStatusMessage(message) {
    var statusMessageElement = document.getElementById('statusMessage');

    statusMessageElement.innerText = message;
}

document.getElementById('unmuteButton').onclick = function() {
    document.getElementById('myVideoId').muted = false;
    document.getElementById('unmuteButton').style.display = 'none';
    setStatusMessage('');
};

// Mobile devices only support autoplay with WebRTC. In order to autoplay with 'streaming' (not real-time) you need to mute the video element
if ((isMobileAppleDevice || isOtherMobile) && !sdk.RTC.webrtcSupported) {
    videoElement.muted = true;

    // Show button to unmute
    document.getElementById('unmuteButton').style.display = '';
}

// Join and view the channel
joinChannel();