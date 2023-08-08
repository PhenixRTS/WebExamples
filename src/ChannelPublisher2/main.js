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
const phenix = window['phenix'];
const mainContainer = document.getElementById('main');
const videoElement = document.getElementById('myVideoId');
const publishButton = document.getElementById('publishButton');
const stopButton = document.getElementById('stopButton');
const getUserMediaButton = document.getElementById('getUserMediaButton');
const stopUserMediaButton = document.getElementById('stopUserMediaButton');
const controlButtonContainer = document.getElementById('controlButtonContainer');
const audioDeviceSelect = document.getElementById('audioDeviceSelect');
const videoDeviceSelect = document.getElementById('videoDeviceSelect');
const mediaDeviceContainer = document.getElementById('mediaDeviceContainer');
const mediaDeviceSelectors = [audioDeviceSelect, videoDeviceSelect];
const urlSearchParams = new URLSearchParams(location.search);
const token = urlSearchParams.get('token');
const screenName = urlSearchParams.get('screenName') || (Math.random() + 1).toString(36).substring(2);
let publisher;
let publisherStateObservable;
let mediaStream;

function retrieveAndPopulateDeviceLists() {
    return navigator.mediaDevices.enumerateDevices()
        .then(deviceInfos => {
            const audioSelectSelectedValue = audioDeviceSelect.value;
            const videoSelectSelectedValue = videoDeviceSelect.value;

            updateDeviceLists(deviceInfos);

            if (Array.from(audioDeviceSelect.childNodes).some(({value}) => value === audioSelectSelectedValue)) {
                audioDeviceSelect.value = audioSelectSelectedValue;
            }

            if (Array.from(videoDeviceSelect.childNodes).some(({value}) => value === videoSelectSelectedValue)) {
                videoDeviceSelect.value = videoSelectSelectedValue;
            }
        });
}

function updateDeviceLists(deviceInfos) {
    mediaDeviceSelectors.forEach(mediaDeviceSelector => {
        Array.from(mediaDeviceSelector.childNodes).forEach(child => {
            mediaDeviceSelector.removeChild(child);
        });
    });

    deviceInfos.forEach(deviceInfo => {
        const option = document.createElement('option');
        option.value = deviceInfo.deviceId;

        if (deviceInfo.kind === 'audioinput') {
            option.text = deviceInfo.label || `Microphone ${audioDeviceSelect.length + 1}`;
            audioDeviceSelect.appendChild(option);
        } else if (deviceInfo.kind === 'videoinput') {
            option.text = deviceInfo.label || `Camera ${videoDeviceSelect.length + 1}`;
            videoDeviceSelect.appendChild(option);
        } else {
            console.log(`Some other kind of source/device with label [${deviceInfo.label}], deviceId [${deviceInfo.deviceId}] and kind [${deviceInfo.kind}]`);
        }
    });

    const disabledAudioOption = document.createElement('option');
    const disabledVideoOption = document.createElement('option');

    disabledAudioOption.text = 'No Audio';
    disabledAudioOption.value = 'none';
    audioDeviceSelect.appendChild(disabledAudioOption);

    disabledVideoOption.text = 'No Video';
    disabledVideoOption.value = 'none';
    videoDeviceSelect.appendChild(disabledVideoOption);
}

function setMediaStream(stream) {
    mediaStream = stream;
    videoElement.srcObject = stream;
}

function start() {
    if (mediaStream) {
        publish();

        return;
    }

    getUserMedia()
        .then(publish)
        .catch(handleError);
}

function publish() {
    publisher = phenix.Publishers.createPublisher({
        mediaStream,
        name: screenName,
        token
    });

    publisherStateObservable = publisher.state.subscribe(state => {
        setStatusMessage(phenix.PublisherState[state]);
        setStatusClass(phenix.PublisherState[state] || '');
    });
}

// Clean up publisher
function stopPublisher() {
    if (publisher) {
        publisher.stop()
            .then(() => {
                publisher = null;
                publisherStateObservable.dispose();
                publisherStateObservable = null;
            });
    }
}

function stopUserMedia() {
    mediaStream.getTracks()
        .forEach(track => track.stop());
    mediaStream = null;
    videoElement.srcObject = null;
    mediaDeviceContainer.className = 'stopped-user-media';
    controlButtonContainer.className = 'stopped-user-media';
}

function getUserMedia() {
    if (mediaStream) {
        mediaStream.getTracks()
            .forEach(track => track.stop());
        mediaStream = null;
    }

    const audioSource = audioDeviceSelect.value;
    const audioSourceDisabled = audioDeviceSelect.value === 'none';
    const videoSource = videoDeviceSelect.value;
    const videoSourceDisabled = videoDeviceSelect.value === 'none';

    if (audioSourceDisabled && videoSourceDisabled) {
        console.error('No media is available');

        return;
    }

    const constrains = {
        audio: audioSourceDisabled ? false : {deviceId: audioSource ? {exact: audioSource} : undefined},
        video: videoSourceDisabled ? false : {deviceId: videoSource ? {exact: videoSource} : undefined}
    };

    return navigator.mediaDevices.getUserMedia(constrains)
        .then(setMediaStream)
        .then(() => {
            mediaDeviceContainer.className = '';
            controlButtonContainer.className = '';
        })
        .then(retrieveAndPopulateDeviceLists);
}

function setStatusMessage(message) {
    const statusMessageElement = document.getElementById('statusMessage');

    statusMessageElement.innerText = message;
}

function setStatusClass(status) {
    const camelCaseToKebabCase = value => value
        .replace(/([A-Z])/g, (match, group) => `-${group.toLowerCase()}`)
        .replace(/^-/, '');

    mainContainer.className = `publisher-${camelCaseToKebabCase(status)}`;
}

function handleError(error) {
    console.log(`navigator.MediaDevices.getUserMedia error [${error.name}] with message [${error.message}]`);
}

retrieveAndPopulateDeviceLists()
    .catch(handleError);

start();

audioDeviceSelect.onchange = getUserMedia;
videoDeviceSelect.onchange = getUserMedia;
publishButton.onclick = start;
stopButton.onclick = stopPublisher;
getUserMediaButton.onclick = getUserMedia;
stopUserMediaButton.onclick = stopUserMedia;