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

if (!phenix) {
    throw new Error('Phenix Library not loaded');
}

const isMobileAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const token = new URLSearchParams(location.search).get('token') || '';
const videoElement = document.getElementById('my-video');
const unmuteButtonElement = document.getElementById('unmute-button');
const playButtonElement = document.getElementById('play-button');
const userMessageDisplayElement = document.getElementById('user-message');
const channelStatusMessageDisplayElement = document.getElementById('channel-status-message');
const playerStatusMessageDisplayElement = document.getElementById('player-status-message');
const setUserMessageDisplay = (message) => userMessageDisplayElement.innerText = message;
const setChannelStatusDisplay = (message) => channelStatusMessageDisplayElement.innerText = message;
const setPlayerStatusDisplay = (message) => playerStatusMessageDisplayElement.innerText = message;

if (!token) {
    setUserMessageDisplay('No token provided. Please provide a token in the URL query parameter "token"');
}

const protectedChannel = phenix.ProtectedChannels.createProtectedChannel({
    videoElement,
    token
});

protectedChannel.state.subscribe(state => {
    setChannelStatusDisplay(phenix.ChannelState[state]);
});

protectedChannel.playerState.subscribe(state => {
    setPlayerStatusDisplay(phenix.IsoBmffPlayerState[state]);
});

protectedChannel.autoMuted.subscribe(autoMuted => {
    if (!autoMuted) {
        return;
    }

    setUserMessageDisplay('VideoElement was automatically muted by the browser');
    unmuteButtonElement.classList.remove('hidden');
});

protectedChannel.autoPaused.subscribe(autoPaused => {
    if (!autoPaused) {
        return;
    }

    setUserMessageDisplay('Video was automatically paused');

    if (isMobileAppleDevice) {
        handleMobileAppleDevice(videoElement);

        return;
    }

    playButtonElement.classList.add('hidden');
});

unmuteButtonElement.onclick = () => {
    protectedChannel.unmute();
    unmuteButtonElement.classList.add('hidden');
    setUserMessageDisplay('');
};

playButtonElement.onclick = () => {
    setUserMessageDisplay('User triggered play()');
    protectedChannel.play();
    playButtonElement.classList.add('hidden');
};

function handleMobileAppleDevice(videoElement) {
    // IOS battery saver mode requires user interaction with the <video> to play video
    setUserMessageDisplay('iOS requires user interaction to play video. Tap the play button.');
    videoElement.controls = true;
    videoElement.onplay = () => {
        setUserMessageDisplay('');
        protectedChannel.play();
        videoElement.onplay = null;
        videoElement.controls = false;
    };
}