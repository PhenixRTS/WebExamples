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
const isMobileAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const token = new URLSearchParams(location.search).get('token') || 'DIGEST:eyJhcHBsaWNhdGlvbklkIjoiZGVtbyIsImRpZ2VzdCI6IjlDQis2TzNpWUJMWVkydUtaaUJnRjRPaGY1OW9nZkt2R1lwTkc5TlhkeEl3eFRRc0NhalZFMWRQMXRQOWVkaWRCRUdUM2dkdk91WWJiSjVsZ2dWeFF3PT0iLCJ0b2tlbiI6IntcImV4cGlyZXNcIjoxOTI1OTg4ODg0MzkzLFwicmVxdWlyZWRUYWdcIjpcImNoYW5uZWxJZDp1cy1ub3J0aGVhc3QjZGVtbyNwaGVuaXhXZWJzaXRlRGVtb1wifSJ9';
const videoElement = document.getElementsByTagName('video')[0];
const channel = phenix.Channels.createChannel({
    videoElement: videoElement,
    token: token
});

document.getElementById('unmuteButton').onclick = () => {
    channel.unmute();
    document.getElementById('unmuteButton').style.display = 'none';
    setUserMessage('');
};

document.getElementById('playButton').onclick = () => {
    setUserMessage('User triggered play()');
    channel.play();
    document.getElementById('playButton').style.display = 'none';
};

function setUserMessage(message) {
    const statusMessageElement = document.getElementById('userMessage');

    statusMessageElement.innerText = message;
}

function setStatusMessage(message) {
    const statusMessageElement = document.getElementById('statusMessage');

    statusMessageElement.innerText = message;
}

channel.state.subscribe(state => {
    setStatusMessage(phenix.ChannelState[state]);
});

channel.autoMuted.subscribe(autoMuted => {
    if (autoMuted) {
        setUserMessage('Video was automatically muted');

        // Show button to unmute
        document.getElementById('unmuteButton').style.display = '';
    }
});

channel.autoPaused.subscribe(autoPaused => {
    if (autoPaused) {
        setUserMessage('Video was automatically paused');

        if (isMobileAppleDevice) {
            // IOS battery saver mode requires user interaction with the <video> to play video
            videoElement.controls = true;
            videoElement.onplay = () => {
                setUserMessage('Video play()');
                channel.play();
                videoElement.onplay = null;
                videoElement.controls = false;
            };
        } else {
            document.getElementById('playButton').style.display = '';
        }
    }
});