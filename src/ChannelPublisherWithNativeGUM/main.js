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

const sdk = window['phenix-web-sdk'];
const videoElement = document.getElementById('myVideoId');
const publishButton = document.getElementById('publishButton');
const stopButton = document.getElementById('stopButton');
let publisher = null;
const urlSearchParams = new URLSearchParams(location.search);
const authToken = urlSearchParams.get('authToken') || '';
const publishToken = urlSearchParams.get('publishToken') || '';
// Local media to publish (camera and microphone)
const mediaConstraints = {
    video: {
        resizeMode: "crop-and-scale",
        width: Number(urlSearchParams.get('width')) || 480,
        height: Number(urlSearchParams.get('height')) || 720
    },
    audio: true
};
// Instantiate the instance of the channel express
const channel = new sdk.express.ChannelExpress({authToken: authToken});

// Capture local media
function capture() {
    navigator.mediaDevices.getUserMedia(mediaConstraints)
        .then(stream => {
            setUserMessage('Got user media');

            publish(stream);
        })
        .catch(e => {
            setUserMessage(`Failed to get media stream: ${e.message}`);
        });
}

// Publish local media to room
function publish(userMediaStream) {
    const publishOptions = {
        token: publishToken,
        userMediaStream: userMediaStream,
        videoElement: videoElement
    };

    hideElement(publishButton);
    displayElement(stopButton);

    channel.publishToChannel(publishOptions, (error, response) => {
        if (error) {
            setUserMessage(`publishToChannel()::subscriberCallback(error, response) returned error=${error.message}`);
            stopPublisher();

            throw error;
        }

        setUserMessage(`publishToChannel()::subscriberCallback(error, response) returned response.status=${response.status}`);

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
    const userMessageElement = document.getElementById('userMessage');

    userMessageElement.innerText = message;
}

function displayElement(element) {
    element.className = element.className.substring(0, element.className.indexOf(' hide'));
}

function hideElement(element) {
    if (!element.className.includes('hide')) {
        element.className += ' hide';
    }
}

publishButton.onclick = capture;
stopButton.onclick = stopPublisher;