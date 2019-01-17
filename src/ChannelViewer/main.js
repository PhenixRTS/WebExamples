var sdk = window['phenix-web-sdk'];
var isMobileAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
var isOtherMobile = /Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(navigator.userAgent);

// Video element to view channel with
var videoElement = document.getElementById('myVideoId');

// Alias to be used to publish/create/join channel
var channelAlias = 'MyChannelAlias';

// Authenticate against our demo backend. Not for production use.
// See our admin api for more info how to setup your own backend
// https://phenixrts.com/docs/#admin-api
var backendUri = 'https://phenixrts.com/demo';

var adminApiProxyClient = new sdk.net.AdminApiProxyClient();

adminApiProxyClient.setBackendUri(backendUri);

// Instantiate the instance of the channel express
var channel = new sdk.express.ChannelExpress({
    adminApiProxyClient: adminApiProxyClient,
    authenticationData: {
        userId: 'my-test-user',
        password: 'gYUALIIL8THUNvHi^U^E2f2J'
    }
});

function joinChannel() {
    channel.joinChannel({
        alias: channelAlias,
        features: ['real-time', 'dash', 'hls'], // If WebRTC is not supported then fall back to live streaming (~10 second latency) with DASH/HLS
        videoElement: videoElement
    }, function joinChannelCallback(error, response) {
        if (error) {
            console.error('Unable to join channel', error);

            setUserMessage('joinChannel()::joinChannelCallback(error, response) returned error=' + error.message);

            // Handle error
            return;
        }

        setUserMessage('joinChannel()::joinChannelCallback(error, response) returned response.status=' + response.status);

        if (response.status !== 'ok') {
            // Handle error
            console.warn('Unable to join room, status: ' + response.status);

            return;
        }

        // Successfully joined channel
        if (response.channelService) {
            // Do something with channelService
        }
    }, function subscriberCallback(error, response) {
        if (error) {
            console.error('Unable to subscribe to channel', error);

            setUserMessage('joinChannel()::subscriberCallback(error, response) returned error=' + error.message);

            // Handle error
            return;
        }

        setUserMessage('joinChannel()::subscriberCallback(error, response) returned response.status=' + response.status);

        if (response.status === 'no-stream-playing') {
            // Handle no stream playing in channel - Wait for one to start
            return;
        } else if (response.status !== 'ok') {
            // Handle error
            return;
        }

        // Successfully subscribed to most recent channel presenter
        if (response.mediaStream) {
            // Do something with mediaStream
            setUserMessage('joinChannel()::subscriberCallback(error, response) returned response.mediaStream.getStreamId()=' + response.mediaStream.getStreamId());
        }

        if (response.renderer) {
            response.renderer.on('autoMuted', function handleAutoMuted() {
                // The browser refused to play video with audio therefore the stream was started muted.
                // Handle this case properly in your UI so that the user can unmute its stream

                setStatusMessage('Video was automatically muted');

                // Show button to unmute
                document.getElementById('unmuteButton').style.display = '';
            });

            response.renderer.on('ended', function handleEnded(reason) {
                if (reason === 'failed-to-play') {
                    // Failed to play media stream

                    setStatusMessage('Video failed to play');

                    if (isMobileAppleDevice) {
                        // IOS battery saver mode requires user interaction with the <video> to play video
                        videoElement.onplay = function () {
                            setStatusMessage('Video play()');
                            joinChannel();
                            videoElement.onplay = null;
                        };
                    } else {
                        document.getElementById('playButton').onclick = function () {
                            setStatusMessage('User triggered play()');
                            joinChannel();
                            document.getElementById('playButton').style.display = 'none';
                        };
                        document.getElementById('playButton').style.display = '';
                    }
                }
            });

            response.renderer.on('userActionRequired', function handleUserActionRequired(reason) {
                if (reason === 'app-paused-by-background') {
                    // Unable to resume playback after pause in Safari

                    setStatusMessage('Video was paused by backgrounding');

                    document.getElementById('playButton').onclick = function () {
                        response.renderer.start(videoElement);
                        document.getElementById('playButton').style.display = 'none';
                        setStatusMessage('');
                    };
                    document.getElementById('playButton').style.display = '';
                }
            });
        }
    });
}

function setUserMessage(message) {
    var userMessageElement = document.getElementById('userMessage');

    userMessageElement.innerText = message;
}

function setStatusMessage(message) {
    var statusMessageElement = document.getElementById('statusMessage');

    statusMessageElement.innerText = message;
}

document.getElementById('unmuteButton').onclick = function () {
    document.getElementById('myVideoId').muted = false;
    document.getElementById('unmuteButton').style.display = 'none';
    setStatusMessage('');
};

// Mobile devices only support autoplay with WebRTC. In order to autoplay with 'streaming' (not real-time) you need to mute the video element
if ((isMobileAppleDevice || isOtherMobile) && !sdk.RTC.webrtcSupported) {
    videoElement.muted = true;

    // Show button to unmute
    document.getElementById('unmuteButton').style.display = '';
}

// Join and view the channel
joinChannel();