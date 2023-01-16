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
var videoElement = document.getElementById('myVideoId');
var publishButton = document.getElementById('publishButton');
var stopButton = document.getElementById('stopButton');
var publisher = null;

// Local media to publish (camera and microphone)
var mediaConstraints = {
    video: true, // Include camera
    audio: true // Include microphone
};

var channelExpressOptions = {};

var publishOptions = {
    room: {},
    mediaConstraints: mediaConstraints,
    videoElement: videoElement
};

// Support customizations
try {
    var params = window.location.search.substring(1).split('&');

    for (var i = 0; i < params.length; i++) {
        if (params[i].indexOf('authToken=') === 0) {
            var authToken = params[i].substring('authToken='.length);

            channelExpressOptions.authToken = authToken;
        }

        if (params[i].indexOf('publishToken=') === 0) {
            var publishToken = params[i].substring('publishToken='.length);

            publishOptions.publishToken = publishToken;
        }
    }
} catch (e) {
    console.error(e);
}

// Instantiate the instance of the channel express
var channel = new sdk.express.ChannelExpress(channelExpressOptions);

// Publish local media to room
function publish() {
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

publishButton.onclick = publish;
stopButton.onclick = stopPublisher;