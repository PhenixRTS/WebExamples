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
var sdk = window['phenix-web-sdk'];
var isMobileAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
var isOtherMobile = /Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(navigator.userAgent);

// Video element to view channel with
var videoElement = document.getElementById('myVideoId');

// Alias to be used to publish/create/join channel
var channelAlias = 'MyChannelAlias';

// Authenticate against our demo backend. Not for production use.
// See our admin api for more info how to setup your own backend
// https://phenixrts.com/docs/#admin-api
var backendUri = 'https://phenixrts.com/demo';

// Features to use with channel
// If WebRTC is not supported then fall back to live streaming (~10 second latency) with DASH/HLS
var features = ['real-time', 'dash', 'hls'];

var adminApiProxyClient = new sdk.net.AdminApiProxyClient();

adminApiProxyClient.setBackendUri(backendUri);
adminApiProxyClient.setAuthenticationData({
    userId: 'my-test-user',
    password: 'gYUALIIL8THUNvHi^U^E2f2J'
});

try {
    var params = window.location.search.substring(1).split('&');

    for (var i = 0; i < params.length; i++) {
        if (params[i].indexOf('features=') === 0) {
            features = params[i].substring('features='.length).split(',');
        }
    }
} catch (e) {
    console.error(e);
}

// Instantiate the instance of the channel express
var channel = new sdk.express.ChannelExpress({
    features: features,
    adminApiProxyClient: adminApiProxyClient
});

var disposables = [];
function joinChannel() {
    channel.joinChannel({
        alias: channelAlias,
        videoElement: videoElement
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
                // The browser refused to play video with audio therefore the stream was started muted.
                // Handle this case properly in your UI so that the user can unmute its stream

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
