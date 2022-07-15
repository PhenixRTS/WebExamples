/**
 * Copyright 2021 Phenix Real Time Solutions, Inc. All Rights Reserved.
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
var authToken = '';
var publishToken = '';

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
        if (params[i].indexOf('authToken=') === 0) {
            authToken = params[i].substring('authToken='.length);
        }

        if (params[i].indexOf('publishToken=') === 0) {
            publishToken = params[i].substring('publishToken='.length);
        }

        if (params[i].indexOf('width=') === 0) {
            mediaConstraints.video.width = parseInt(params[i].substring('width='.length), 10);
        }

        if (params[i].indexOf('height=') === 0) {
            mediaConstraints.video.height = parseInt(params[i].substring('height='.length), 10);
        }
    }
} catch (e) {
    console.error(e);
}

// Instantiate the instance of the channel express
var channel = new sdk.express.ChannelExpress({authToken: authToken});

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
        publishToken: publishToken,
        room: {},
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