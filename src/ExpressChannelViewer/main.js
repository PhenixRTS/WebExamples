var sdk = window['phenix-web-sdk'];
var isMobileAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
var isOtherMobile = /Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(navigator.userAgent);

// Video element to view channel with
var videoElement = document.getElementById('myVideoId');

// Alias to be used to publish/create/join channel
var channelAlias = 'MyChannelAlias';

// Authenticate against our demo backend. Not for production scale.
// See our admin api for more info https://phenixrts.com/docs/#admin-api
var backendUri = 'https://phenixrts.com/demo';

// Instantiate the instance of the room express
var expressRoom = new sdk.express.RoomExpress({
    backendUri: backendUri,
    authenticationData: {
        userId: 'test-user',
        password: 'gYUALIIL8THUNvHi^U^E2f2J'
    }
});

// Join and view the channel
expressRoom.joinChannel({
    alias: channelAlias,
    capabilities: [sdk.RTC.webrtcSupported ? 'real-time' : 'streaming'], // If WebRTC is not supported then fall back to live streaming (~10 second latency)
    videoElement: videoElement
}, function joinChannelCallback(error, response) {
    if (error) {
        // Handle error
        console.error('Unable to join channel', error);
    }

    if (response.status === 'room-not-found') {
        // Handle room not found - Create a Channel Or Publish to a Channel
        setUserMessage('Room Does Not Exist - Please publish first or manually create the channel');
    } else if (response.status !== 'ok') {
        // Handle error
        console.warn('Unable to join room, status: ' + response.status);
    }

    // Successfully joined channel
    if (response.status === 'ok' && response.roomService) {
        // Do something with roomService
        setUserMessage('Joined Channel');
    }
}, function subscriberCallback(error, response) {
    if (error) {
        // Handle error
        console.error('Unable to join channel', error);
    }

    if (response.status === 'no-stream-playing') {
        // Handle no stream playing in channel - Wait for one to start
        setUserMessage('No Stream Playing In Channel - Waiting for one to start');
    } else if (response.status !== 'ok') {
        // Handle error
        console.warn('New Status: ' + response.status);
    }

    // Successfully subscribed to most recent channel presenter
    if (response.status === 'ok' && response.mediaStream) {
        // Do something with mediaStream
        setUserMessage('Viewing stream: ' + response.mediaStream.getStreamId());
    }
});

function setUserMessage(message) {
    var userMessageElement = document.getElementById('userMessage');

    userMessageElement.innerText = message;
}

// Mobile devices only support autoplay with WebRTC. In order to autoplay with 'streaming' (not real-time) you need to mute the video element
if ((isMobileAppleDevice || isOtherMobile) && !sdk.RTC.webrtcSupported) {
    videoElement.muted = true;

    // Show button to unmute
}