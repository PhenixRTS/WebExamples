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
var phenix = window['phenix'];
var videoElement = document.getElementById('myVideoId');
var publishButton = document.getElementById('publishButton');
var stopButton = document.getElementById('stopButton');
var getUserMediaButton = document.getElementById('getUserMediaButton');
var stopUserMediaButton = document.getElementById('stopUserMediaButton');
var statusBar = document.getElementById('statusBar');
var token = new URLSearchParams(location.search).get('token');
var screenName = new URLSearchParams(location.search).get('screenName') || (Math.random() + 1).toString(36).substring(2);
var publisher;
var publisherStateObservable;
var mediaStream;

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(mediaStream_ => {
    mediaStream = mediaStream_;
    videoElement.srcObject = mediaStream;
});

function publish() {
    hideElement(publishButton);
    hideElement(stopUserMediaButton);
    displayElement(stopButton);
    displayElement(statusBar);

    publisher = phenix.Publishers.createPublisher({
        mediaStream,
        name: screenName,
        token
    });

    publisherStateObservable = publisher.state.subscribe(function(state) {
        setStatusMessage(phenix.PublisherState[state]);

        switch (state) {
        case phenix.PublisherState.Publishing:
            videoElement.className = 'publisher-online';

            break;
        case phenix.PublisherState.Starting:
            videoElement.className = 'publisher-starting';

            break;
        case phenix.PublisherState.Recovering:
        case phenix.PublisherState.Reconnecting:
            videoElement.className = 'publisher-recovering';

            break;
        case phenix.PublisherState.Unauthorized:
        case phenix.PublisherState.GeoRestricted:
        case phenix.PublisherState.GeoBlocked:
        case phenix.PublisherState.UnsupportedFeature:
        case phenix.PublisherState.NotFound:
        case phenix.PublisherState.Error:
            videoElement.className = 'publisher-offline';

            break;
        default:
            videoElement.className = '';
        }
    });
}

// Clean up publisher
function stopPublisher() {
    if (publisher) {
        publisher.stop().then(() => {
            publisher = null;
            publisherStateObservable.dispose();
            publisherStateObservable = null;
        });
    }

    hideElement(stopButton);
    displayElement(publishButton);
    displayElement(stopUserMediaButton);
}

function stopUserMedia() {
    mediaStream.getTracks()
        .forEach(track => track.stop());
    mediaStream = null;
    videoElement.srcObject = null;

    hideElement(publishButton);
    hideElement(stopUserMediaButton);
    displayElement(getUserMediaButton);
}

function getUserMedia() {
    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    }).then(mediaStream_ => {
        mediaStream = mediaStream_;
        videoElement.srcObject = mediaStream;

        hideElement(getUserMediaButton);
        displayElement(publishButton);
    });
}

function setStatusMessage(message) {
    var statusMessageElement = document.getElementById('statusMessage');

    statusMessageElement.innerText = message;
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
getUserMediaButton.onclick = getUserMedia;
stopUserMediaButton.onclick = stopUserMedia;
