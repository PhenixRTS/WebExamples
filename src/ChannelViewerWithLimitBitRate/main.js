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

const phenix = window['phenix'];
const isMobileAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const urlSearchParams = new URLSearchParams(location.search);
const token = urlSearchParams.get('token') || 'DIGEST:eyJhcHBsaWNhdGlvbklkIjoiZGVtbyIsImRpZ2VzdCI6IjlDQis2TzNpWUJMWVkydUtaaUJnRjRPaGY1OW9nZkt2R1lwTkc5TlhkeEl3eFRRc0NhalZFMWRQMXRQOWVkaWRCRUdUM2dkdk91WWJiSjVsZ2dWeFF3PT0iLCJ0b2tlbiI6IntcImV4cGlyZXNcIjoxOTI1OTg4ODg0MzkzLFwicmVxdWlyZWRUYWdcIjpcImNoYW5uZWxJZDp1cy1ub3J0aGVhc3QjZGVtbyNwaGVuaXhXZWJzaXRlRGVtb1wifSJ9';
let bitrateLimitInBitsPerSecond = urlSearchParams.get('bitrateLimitInBitsPerSecond') || 500000;
let timeoutId;
const bitrateLimitInBitsPerSecondInput = document.getElementById('bitrateLimitInBitsPerSecond');
const bitrateLimitInBitsPerSecondButton = document.getElementById('bitrateLimitInBitsPerSecondButton');

bitrateLimitInBitsPerSecondInput.value = bitrateLimitInBitsPerSecond;

bitrateLimitInBitsPerSecondButton.onclick = () => {
    if (bitrateLimitInBitsPerSecondInput.value) {
        bitrateLimitInBitsPerSecond = +bitrateLimitInBitsPerSecondInput.value;
    }

    if (timeoutId) {
        clearTimeout(timeoutId);
    }

    startBitrateLimitWorkflow();
};

const startBitrateLimitWorkflow = () => {
    timeoutId = setTimeout(() => {
        setUserMessage(`Set bitrate limit to: ${bitrateLimitInBitsPerSecond} bps`);

        channel.setBitrateLimit(bitrateLimitInBitsPerSecond);
        timeoutId = setTimeout(() => {
            setUserMessage('Clear bitrate limit');

            channel.clearBitrateLimit();
            timeoutId = setTimeout(() => {
                setUserMessage(`Set bitrate limit to: ${bitrateLimitInBitsPerSecond} bps`);

                channel.setBitrateLimit(bitrateLimitInBitsPerSecond);
                timeoutId = setTimeout(() => {
                    setUserMessage('Clear bitrate limit');

                    channel.clearBitrateLimit();
                }, 20000);
            }, 15000);
        }, 10000);
    }, 5000);
};

const videoElement = document.getElementsByTagName('video')[0];
const channel = phenix.Channels.createChannel({
    videoElement,
    token
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