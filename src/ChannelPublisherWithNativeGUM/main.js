/**
 * Copyright 2019 Phenix Real Time Solutions, Inc. All Rights Reserved.
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
var videoElement = document.getElementById('myVideoId');
var publishButton = document.getElementById('publishButton');
var stopButton = document.getElementById('stopButton');
var publisher = null;

// Alias to be used to publish/create/join channel
var channelAlias = 'MyChannelAlias';

// Name that will be seen by all that join
var channelName = 'Channel Name';

// Authenticate against our demo backend. Not for production use.
// See our admin api for more info how to setup your own backend
// https://phenixrts.com/docs/#admin-api
var backendUri = 'https://demo-integration.phenixrts.com/pcast';

// Include all of the features you would like the stream to have
// Real-time is always included. For more info see https://phenixrts.com/docs/#supported-stream-capabilities
// E.g. 'streaming': Live streaming (8+ seconds of latency).
var publishCapabilities = [
    'hd', // Quality
    'multi-bitrate' // ABR for the clients.
];

// Local media to publish (camera and microphone)
var mediaConstraints = {
    video: {
        resizeMode: "crop-and-scale",
        width: 480,
        height: 720
    },
    audio: true
};

// Support customizations
try {
    var params = window.location.search.substring(1).split('&');

    for (var i = 0; i < params.length; i++) {
        if (params[i].indexOf('channelAlias=') === 0) {
            channelAlias = params[i].substring('channelAlias='.length);
        }

        if (params[i].indexOf('backendUri=') === 0) {
            backendUri = params[i].substring('backendUri='.length);
        }

        if (params[i].indexOf('capabilities=') === 0) {
            publishCapabilities = params[i].substring('capabilities='.length).split(',');
        }

        if (params[i].indexOf('width=') === 0) {
            mediaConstraints.video.width = parseInt(params[i].substring('width='.length), 10);
        }

        if (params[i].indexOf('height=') === 0) {
            mediaConstraints.video.width = parseInt(params[i].substring('height='.length), 10);
        }

        if (params[i] === 'streaming') {
            publishCapabilities.push('streaming');
        }
    }
} catch (e) {
    console.error(e);
}

var adminApiProxyClient = new sdk.net.AdminApiProxyClient();

adminApiProxyClient.setBackendUri(backendUri);
adminApiProxyClient.setAuthenticationData({
    userId: 'my-user-id-that-is-NOT-related-to-application-id',
    password: 'my-password-that-is-NOT-related-to-secret'
});

// Instantiate the instance of the channel express
var channel = new sdk.express.ChannelExpress({adminApiProxyClient: adminApiProxyClient});

// Capture local media
function capture() {
    navigator.mediaDevices.getUserMedia(mediaConstraints)
        .then(function(stream) {
            setUserMessage('Got user media');

            publish(stream);
        })
        .catch(function(err) {
            setUserMessage('Failed to get media stream: ' + err.message);
        });
}

// Publish local media to room
function publish(userMediaStream) {
    var publishOptions = {
        capabilities: publishCapabilities,
        room: {
            alias: channelAlias,
            name: channelName
        },
        userMediaStream: userMediaStream,
        videoElement: videoElement
    };

    hideElement(publishButton);
    displayElement(stopButton);

    channel.publishToChannel(publishOptions, function subscriberCallback(error, response) {
        if (error) {
            setUserMessage('publishToChannel()::subscriberCallback(error, response) returned error=' + error.message);
            stopPublisher();

            throw error;
        }

        setUserMessage('publishToChannel()::subscriberCallback(error, response) returned response.status=' + response.status);

        if (response.status !== 'ok' && response.status !== 'ended' && response.status !== 'stream-ended') {
            stopPublisher();

            throw new Error(response.status);
        }

        if (response.status === 'ok') {
            publisher = response.publisher;
        }
    });
}

// Clean up publisher
function stopPublisher() {
    if (publisher) {
        publisher.stop();

        publisher = null;
    }

    hideElement(stopButton);
    displayElement(publishButton);
}

function setUserMessage(message) {
    var userMessageElement = document.getElementById('userMessage');

    userMessageElement.innerText = message;
}

function displayElement(element) {
    element.className = element.className.substring(0, element.className.indexOf(' hide'));
}

function hideElement(element) {
    if (element.className.indexOf('hide') === -1) {
        element.className += ' hide';
    }
}

publishButton.onclick = capture;
stopButton.onclick = stopPublisher;