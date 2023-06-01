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
var isMobileAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
var roomId = 'europe-central#demo#multipartyChatDemoRoom.ZpqbJ4mNkh6u';
var videoOnlyToken = 'DIGEST:eyJhcHBsaWNhdGlvbklkIjoiZGVtbyIsImRpZ2VzdCI6IndIRzFjWDJMK3NST2dtMktyT004S3NJU0IyeVp6eHQ2d3I5dVcrNFlGM3FZUTRSeEliUVFRR0Z2enhWNDVzSDhQZkkxam9qc3FnekNkNUdkamNnY0VRPT0iLCJ0b2tlbiI6IntcImV4cGlyZXNcIjoxOTI5NjA5NjUwOTQxLFwiY2FwYWJpbGl0aWVzXCI6W1widmlkZW8tb25seVwiXSxcInJlcXVpcmVkVGFnXCI6XCJyb29tSWQ6ZXVyb3BlLWNlbnRyYWwjZGVtbyNtdWx0aXBhcnR5Q2hhdERlbW9Sb29tLlpwcWJKNG1Oa2g2dVwifSJ9';
var audioOnlyToken = 'DIGEST:eyJhcHBsaWNhdGlvbklkIjoiZGVtbyIsImRpZ2VzdCI6IjZ3ODQ3S3N2ZFh5WjhRNnlyNWNzMnh0YjMxdFQ0TFR3bHAyeUZyZ0t2K0pDUEJyYkI4Qnd5a3dyT2NIWE52OXQ5eU5qYkFNT2tuQ1N1VnE5eGdBZjdRPT0iLCJ0b2tlbiI6IntcImV4cGlyZXNcIjoxOTI5NjA5NjcwMjI1LFwiY2FwYWJpbGl0aWVzXCI6W1wiYXVkaW8tb25seVwiXSxcInJlcXVpcmVkVGFnXCI6XCJyb29tSWQ6ZXVyb3BlLWNlbnRyYWwjZGVtbyNtdWx0aXBhcnR5Q2hhdERlbW9Sb29tLlpwcWJKNG1Oa2g2dVwifSJ9';
var publishAudioOnlyToken = 'DIGEST:eyJhcHBsaWNhdGlvbklkIjoiZGVtbyIsImRpZ2VzdCI6InUzMXFXbWVmUG14ZWt1ZDhSRERBMXFKOUVNV29IMEJZc3l4OSs1b2hPOUJhOTZmUDl5d3RRMTVjMm95bUk3NURXUG04d29sTnFpNDVaM3dpOGFnRy9BPT0iLCJ0b2tlbiI6IntcImV4cGlyZXNcIjoxOTMzMjM1OTE5Mjk0LFwidHlwZVwiOlwicHVibGlzaFwiLFwiY2FwYWJpbGl0aWVzXCI6W1wiYXVkaW8tb25seVwiLFwibGRcIl0sXCJyZXF1aXJlZFRhZ1wiOlwicm9vbUlkOmV1cm9wZS1jZW50cmFsI2RlbW8jbXVsdGlwYXJ0eUNoYXREZW1vUm9vbS5acHFiSjRtTmtoNnVcIn0ifQ==';
var publishVideoOnlyToken = 'DIGEST:eyJhcHBsaWNhdGlvbklkIjoiZGVtbyIsImRpZ2VzdCI6Ii9WTlBXb0hhOEFENjVrdzl6dzBwK2JmQSswRUZzZE1zbi9JdTcvMmJFcW0zYUYrMUxkQUY0Mm1aM252VnNOQWczckZwOTBFUTRJdnNKT2hrMThUVmRnPT0iLCJ0b2tlbiI6IntcImV4cGlyZXNcIjoxOTMzMjM1ODg1NDQxLFwidHlwZVwiOlwicHVibGlzaFwiLFwiY2FwYWJpbGl0aWVzXCI6W1widmlkZW8tb25seVwiLFwibGRcIl0sXCJyZXF1aXJlZFRhZ1wiOlwicm9vbUlkOmV1cm9wZS1jZW50cmFsI2RlbW8jbXVsdGlwYXJ0eUNoYXREZW1vUm9vbS5acHFiSjRtTmtoNnVcIn0ifQ==';
var publishAndJoinRoomButton = document.getElementById('publishAndJoinRoomButton');
var stopButton = document.getElementById('stopButton');
var muteAudioButton = document.getElementById('muteAudio');
var muteVideoButton = document.getElementById('muteVideo');
var muteAudio = false;
var muteVideo = false;
var screenName = 'ScreenName' + Math.floor(Math.random() * 10000) + 1; // Helpful if unique but we don't enforce this. You might set this to be an email or a nickname, or both. Then parse it when joining the room.
var roomExpress = null;
var roomService = null;
var publisher = null;
var selfVideoList = document.getElementsByClassName('self-container')[0];
var videoList = document.getElementsByClassName('members-container')[0];
var videoSources = null;
var audioSources = null;
var memberRole = 'Participant';
var membersStore = [];
var memberSubscriptions = {};
var memberVideoSubscriptions = {};
var videoSubscribers = 1;
var timeoutId = null;
var maxVideoSubscribers = 8;
var queryParameters = {};

if (window.location && window.location.search) {
    var params = window.location.search.substring(1).split('&');
    for (var i = 0; i < params.length; i++) {
        if (params[i].includes('=')) {
            var splitedParameters = params[i].split('=');
            queryParameters[splitedParameters[0]] = splitedParameters[1];
        }
    }
}

if (queryParameters['maxVideoSubscribers']) {
    document.getElementById('numberOfVideos').value = queryParameters['maxVideoSubscribers'];
}

if (queryParameters['screenName']) {
    document.getElementById('screenName').value = queryParameters['screenName'];
}

var init = function() {
    function createRoomExpress() {
        roomExpress = new sdk.express.RoomExpress({
            treatBackgroundAsOffline: isMobileAppleDevice,
            authToken: audioOnlyToken
            // The `uri` option can be used to set the environment when it is not set in the edge auth token. It also can be used to override the default one.
            // uri: 'https://pcast.phenixrts.com'
        });
    }

    createRoomExpress();

    sdk.utils.rtc.getSources(function(sources) {
        videoSources = sources.filter(function(source) {
            return source.kind === 'video';
        });
        audioSources = sources.filter(function(source) {
            return source.kind === 'audio';
        });
    });

    function publishVideoAndCameraAtTwoQualitiesAndJoinRoom() {
        muteAudio = false;
        muteVideo = false;

        var name = document.getElementById('screenName').value;

        if (!name) {
            name = 'screenName' + '-' + Math.floor(Math.random() * 10000) + 1;
        }

        screenName = name + '.' + Math.floor(Math.random() * 10000) + 1;

        joinRoom(function() {
            publishAudio(() => publishVideo());
        });
    }

    function publishAudio(callback) {
        if (audioSources.length === 0) {
            return console.error('Sources not available yet');
        }

        if (!roomExpress) {
            createRoomExpress();
        }

        var videoElement = createVideo();
        var publishOptions = {
            enableWildcardCapability: false,
            mediaConstraints: {audio: {deviceId: audioSources[0].id}}, // Use the same deviceIds for both
            token: publishAudioOnlyToken,
            screenName: screenName,
            streamType: 'User',
            memberRole: memberRole
        };

        var options = Object.assign({}, publishOptions, {
            videoElement: videoElement, // Bind local user media to this element (no delay)
            resolution: 180,
            frameRate: 15,
            streamInfo: {quality: '180p'} // Pass custom info here
        });

        videoElement.setAttribute('muted', true); // Don't want to hear yourself
        videoElement.setAttribute('class', 'self-audio');
        videoElement.muted = true;

        return roomExpressPublishToRoomAndHandleErrors(options, function(response) {
            publisher = publisher || {};
            publisher['audioPublisher'] = response.publisher;
            publisher['audioElement'] = videoElement;

            selfVideoList.append(videoElement);

            if (!publisher.videoPublisher) {
                callback();
            }
        });
    }

    function publishVideo() {
        if (videoSources.length === 0) {
            return console.error('Sources not available yet');
        }

        if (!roomExpress) {
            createRoomExpress();
        }

        var videoElement = createVideo();
        var publishOptions = {
            enableWildcardCapability: false,
            mediaConstraints: {video: {deviceId: videoSources[0].id}}, // Use the same deviceIds for both
            token: publishVideoOnlyToken,
            screenName: screenName,
            streamType: 'User',
            memberRole: memberRole
        };

        var options = Object.assign({}, publishOptions, {
            videoElement: videoElement, // Bind local user media to this element (no delay)
            resolution: 180,
            frameRate: 15,
            streamInfo: {quality: '180p'} // Pass custom info here
        });

        videoElement.setAttribute('muted', true); // Don't want to hear yourself
        videoElement.setAttribute('class', 'self-video');

        videoElement.muted = true;

        return roomExpressPublishToRoomAndHandleErrors(options, function(response) {
            publisher = publisher || {};
            publisher['videoPublisher'] = response.publisher;
            publisher['videoElement'] = videoElement;

            selfVideoList.append(videoElement);
        });
    }

    function roomExpressPublishToRoomAndHandleErrors(options, callback) {
        return roomExpress.publishToRoom(options, function(error, response) {
            if (error) {
                console.log('Unable to publish to Room: ' + error);

                return;
            }

            if (response.status === 'client-side-failure') {
                reconnect();
            }

            if (response.status !== 'ok' && response.status !== 'ended' && response.status !== 'stream-ended') {
                console.error('New Status: ' + response.status);
            }

            if (response.status === 'ok') {
                console.log('Online & Publishing');

                callback(response);
            }
        });
    }

    function joinRoom(callback) {
        maxVideoSubscribers = document.getElementById('numberOfVideos').value;
        roomExpress.joinRoom({
            token: audioOnlyToken,
            role: 'Participant', // Set your role for yourself. Participant will view and interact with other members (must have streams)
            screenName: screenName
        }, function joinRoomCallback(error, response) {
            if (error) {
                console.error('Unable to join room: ' + error.message);
                leaveRoomAndStopPublisher();

                throw error;
            }

            if (response.status !== 'ok' && response.status !== 'ended') {
                console.error('New Status: ' + response.status);

                throw new Error(response.status);
            }

            roomService = response.roomService;
            callback();
        }, function membersChangedCallback(members) { // This is triggered every time a member joins or leaves
            console.log('Members updated, count=[' + members.length + ']', members);

            removeOldMembers(members);
            addNewMembers(members);
        });
    }

    function removeOldMembers(members) {
        var membersThatLeft = membersStore.filter(function(member) {
            return !members.includes(member);
        });

        membersThatLeft.forEach(function(memberThatLeft) {
            var memberSubscription = memberSubscriptions[memberThatLeft.getSessionId()];
            var memberVidoeSubscription = memberVideoSubscriptions[memberThatLeft.getSessionId()];

            if (memberVidoeSubscription) {
                memberVidoeSubscription.forEach(function(subscription) {
                    removeVideoMemberStream(subscription.memberStream, memberThatLeft.getSessionId());
                });
            }

            if (memberSubscription) {
                memberSubscription.forEach(function(subscription) {
                    removeMemberStream(subscription.memberStream, memberThatLeft.getSessionId());
                });
            }

            delete memberSubscriptions[memberThatLeft.getSessionId()];
            delete memberVideoSubscriptions[memberThatLeft.getSessionId()];
        });

        membersStore = membersStore.filter(function(member) {
            return !membersThatLeft.includes(member);
        });
    }

    function removeMemberStream(memberStream, memberSessionId) {
        if (!memberSubscriptions[memberSessionId].length) {
            return false;
        }

        memberSubscriptions[memberSessionId].forEach(function(memberSubscriptionToRemove) {
            if (memberSubscriptionToRemove) {
                memberSubscriptionToRemove.mediaStream.stop();
                memberSubscriptionToRemove.videoElement.remove();

                if (memberSubscriptionToRemove.container) {
                    memberSubscriptionToRemove.container.remove();
                }
            }
        });

        if (memberSubscriptions[memberSessionId].length > 0) {
            memberSubscriptions[memberSessionId].length = 0;
        }

        return true;
    }

    function removeVideoMemberStream(memberStream, memberSessionId) {
        if (!memberVideoSubscriptions[memberSessionId].length) {
            return false;
        }

        memberVideoSubscriptions[memberSessionId].forEach(function(memberSubscriptionToRemove) {
            if (memberSubscriptionToRemove) {
                videoSubscribers--;
                memberSubscriptionToRemove.mediaStream.stop();
                memberSubscriptionToRemove.videoElement.remove();

                if (memberSubscriptionToRemove.container) {
                    memberSubscriptionToRemove.container.remove();
                }

                return true;
            }

            if (memberVideoSubscriptions[memberSessionId].length > 0) {
                memberVideoSubscriptions[memberSessionId].length = 0;
            }

            return false;
        });
    }

    function addNewMembers(members) {
        var membersThatJoined = members.filter(function(member) {
            return !membersStore.includes(member);
        });

        membersThatJoined.forEach(function(newMember) {
            var memberSessionId = newMember.getSessionId();
            var memberScreenName = newMember.getObservableScreenName().getValue();

            memberSubscriptions[memberSessionId] = [];
            memberVideoSubscriptions[memberSessionId] = [];

            // Listen for changes to member streams. This will happen when the publisher fails and it recovers, or when adding or removing a screen share
            var memberStreamSubscription = newMember.getObservableStreams().subscribe(function(memberStreams) {
                if (!memberSubscriptions[memberSessionId] && !memberVideoSubscriptions[memberSessionId]) {
                    return memberStreamSubscription.dispose();
                }

                // Remove old streams
                memberSubscriptions[memberSessionId].forEach(function(memberSubscription) {
                    var shouldRemoveMember = !memberStreams.find(function(stream) {
                        return stream.getPCastStreamId() === memberSubscription.memberStream.getPCastStreamId();
                    });

                    if (shouldRemoveMember) {
                        removeMemberStream(memberSubscription.memberStream, memberSessionId);
                    }
                });

                memberVideoSubscriptions[memberSessionId].forEach(function(memberSubscription) {
                    var shouldRemoveMember = !memberStreams.find(function(stream) {
                        return stream.getPCastStreamId() === memberSubscription.memberStream.getPCastStreamId();
                    });

                    if (shouldRemoveMember) {
                        removeVideoMemberStream(memberSubscription.memberStream, memberSessionId);
                    }
                });

                // Subscribe to new streams
                var streams = newMember.getObservableStreams().getValue();

                var videoOnlyStream, audioOnlyStream;

                streams.forEach(function(memberStream) {
                    if(memberStream.getInfo().capabilities.includes('video-only')) {
                        videoOnlyStream = memberStream;
                    }

                    if(memberStream.getInfo().capabilities.includes('audio-only')) {
                        audioOnlyStream = memberStream;
                    }
                });

                if (audioOnlyStream) {
                    subscribeToMemberStream(audioOnlyStream, memberSessionId, memberScreenName, function() {
                        if (videoOnlyStream && videoSubscribers <= maxVideoSubscribers) {
                            videoSubscribers++;
                            subscribeVideoOnly.call(this, videoOnlyStream, memberSessionId, memberScreenName);
                        }
                    });
                }
            });

            var streams = newMember.getObservableStreams().getValue();
            var videoOnlyStream, audioOnlyStream;

            streams.forEach(function(memberStream) {
                if(memberStream.getInfo().capabilities.includes('video-only')) {
                    videoOnlyStream = memberStream;
                }

                if(memberStream.getInfo().capabilities.includes('audio-only')) {
                    audioOnlyStream = memberStream;
                }
            });

            if (audioOnlyStream) {
                subscribeToMemberStream(audioOnlyStream, memberSessionId, memberScreenName, function() {
                    if (videoOnlyStream && videoSubscribers <= maxVideoSubscribers) {
                        videoSubscribers++;
                        subscribeVideoOnly(videoOnlyStream, memberSessionId, memberScreenName);
                    }
                });
            }
        });

        membersStore = members;
    }

    function onMonitorEvent(error, response) {
        if (error) {
            return; // May want to display something indicating failure for member
        }

        if (response.status !== 'ok') {
            console.log('Member stream subscription failed [%s]', response.status); // May want to display something indicating failure for member
        }

        if (response.status === 'client-side-failure') {
            // You may have the option to automatically retry
            if (roomExpress.getPCastExpress().getPCast().getStatus() === 'online' && response.retry) {
                console.log('Attempting to redo member stream subscription after failure'); // May want to display something indicating failure for member

                response.retry();

                return;
            }

            reconnect();

            return;
        }

        // You may have the option to automatically retry
        if (roomExpress.getPCastExpress().getPCast().getStatus() === 'online' && response.retry) {
            console.log('Attempting to redo member stream subscription after failure'); // May want to display something indicating failure for member

            response.retry();
        }
    }

    function subscribeToMemberStream(memberStream, sessionId, memberScreenName, callback) {
        var videoElement = createVideo();
        var container = document.createElement('div');

        container.classList = 'client-container ' + sessionId;

        var nameContainer = document.createElement('div');
        var name = document.createElement('div');
        var action = document.createElement('div');
        nameContainer.classList = 'client-name-container ' + sessionId;
        name.classList = 'name-container';
        action.classList = 'action-container';
        name.innerHTML = memberScreenName.split('.')[0];
        action.innerHTML = 'Make Video Member';
        nameContainer.append(name);
        nameContainer.append(action);
        nameContainer.onclick = function() {
            handleAudioMemberClick(sessionId);
        };
        container.append(nameContainer);

        var isSelf = sessionId === roomService.getSelf().getSessionId(); // Check if is yourself!

        if (isSelf) {
            return; // Ignore self
        }

        var subscribeOptions = {
            videoElement: videoElement,
            monitor: {callback: onMonitorEvent}
        };

        var handleSubscribe = function(error, response) {
            if (!response || !response.mediaStream) {
                return;
            }

            // Make sure we don't end up with 2 streams due to auto recovery
            var removed = removeMemberStream(memberStream, sessionId);
            memberSubscriptions[sessionId].push({
                mediaStream: response.mediaStream,
                videoElement: videoElement,
                container: container,
                isSelf: isSelf,
                isAudio: true,
                memberStream: memberStream,
                memberScreenName: memberScreenName
            });

            container.classList = 'client-container audio-only-member ' + sessionId;
            container.append(videoElement);
            videoList.prepend(container);

            if (removed) {
                console.log('Replaced member subscription for session ID [' + sessionId + ']');
            }

            setTimeout(function() {
                if (videoElement.muted) {
                    unMuteAudio(videoElement);
                }

                console.log('subscribeToMemberStream');
                callback();
            }, 10);
        };

        subscribeOptions.token = audioOnlyToken;
        roomExpress.subscribeToMemberStream(memberStream, subscribeOptions, handleSubscribe);
    }

    function subscribeVideoOnly(memberStream, sessionId, memberScreenName) {
        var videoElement = createVideo();
        var isSelf = sessionId === roomService.getSelf().getSessionId(); // Check if is yourself!

        if (isSelf) {
            return; // Ignore self
        }

        var subscribeOptions = {
            videoElement: videoElement,
            monitor: {callback: onMonitorEvent}
        };
        var handleSubscribe = function(error, response) {
            if (!response || !response.mediaStream) {
                return;
            }

            const container = memberSubscriptions[sessionId][memberSubscriptions[sessionId].length - 1].container;

            // RemoveVideoMemberStream
            // Make sure we don't end up with 2 streams due to auto recovery
            var removed = removeVideoMemberStream(memberStream, sessionId);

            memberVideoSubscriptions[sessionId].push({
                mediaStream: response.mediaStream,
                videoElement: videoElement,
                container: container,
                isSelf: isSelf,
                isVideo: true,
                memberStream: memberStream,
                memberScreenName: memberScreenName
            });

            container.classList = 'client-container ' + sessionId;

            container.append(videoElement);

            if (removed) {
                console.log('Replaced member subscription for session ID [' + sessionId + ']');
            }
        };

        subscribeOptions.token = videoOnlyToken;
        roomExpress.subscribeToMemberStream(memberStream, subscribeOptions, handleSubscribe);
    }

    function unMuteAudio(videoElement) {
        videoElement.muted = false;
        videoElement.setAttribute('muted', false);
    }

    function createVideo() {
        var videoElement = document.createElement('video');

        videoElement.setAttribute('playsinline', ''); // For Safari and IOS
        videoElement.setAttribute('autoplay', ''); // For Safari and IOS + Mobile

        // To resolve unintended pauses
        videoElement.onpause = function() {
            setTimeout(function() {
                videoElement.play();
            }, 10);
        };

        return videoElement;
    }

    function handleAudioMemberClick(sessionId) {
        if (memberVideoSubscriptions[sessionId].length) {
            return;
        }

        membersStore.forEach(memeber => {
            if(memeber.getSessionId() === sessionId) {
                var memberScreenName = memeber.getObservableScreenName().getValue();
                memeber.getObservableStreams().getValue().forEach(function(memberStream) {
                    var isVideoOnly = memberStream.getInfo().capabilities.includes('video-only');

                    if (isVideoOnly) {
                        var realMemberVideoSubscriptions = [];
                        var keys = Object.keys(memberVideoSubscriptions);

                        keys.forEach(function(key) {
                            if (memberVideoSubscriptions[key].length) {
                                realMemberVideoSubscriptions.push(key);
                            }
                        });

                        if (!realMemberVideoSubscriptions.length) {
                            return;
                        }

                        var randomSessionId = realMemberVideoSubscriptions[Math.floor(Math.random() * realMemberVideoSubscriptions.length)];
                        var memberSubscriptionToRemove = memberVideoSubscriptions[randomSessionId][0];

                        videoSubscribers--;
                        memberSubscriptionToRemove.container.classList = 'client-container audio-only-member';
                        memberSubscriptionToRemove.mediaStream.stop();
                        memberSubscriptionToRemove.videoElement.remove();
                        memberVideoSubscriptions[randomSessionId] = [];

                        videoSubscribers++;
                        subscribeVideoOnly(memberStream, sessionId, memberScreenName);
                    }
                });
            }
        });
    }

    function reconnect() {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        if (publisher) {
            if(publisher.videoPublisher) {
                publisher.videoPublisher.stop();
                publisher.videoElement.remove();
            }

            publisher.audioPublisher.stop();
            publisher.audioElement.remove();

            publisher = null;
        }

        if (roomService) {
            roomService.leaveRoom(function() {
                videoSubscribers = 1;
                roomService = null;
            });
        }

        if (roomExpress.getPCastExpress().getPCast() && roomExpress.getPCastExpress().getPCast().getStatus() === 'online') {
            publishVideoAndCameraAtTwoQualitiesAndJoinRoom();
        } else {
            timeoutId = setTimeout(function() {
                reconnect();
            }, 200);
        }
    }

    function leaveRoomAndStopPublisher() {
        if (publisher) {
            if(publisher.videoPublisher && publisher.videoPublisher.isActive()) {
                publisher.videoPublisher.stop();
                publisher.videoElement.remove();
            }

            if(publisher.audioPublisher && publisher.audioPublisher.isActive()) {
                publisher.audioPublisher.stop();
                publisher.audioElement.remove();
            }

            publisher = null;
        }

        if (roomService) {
            roomService.leaveRoom(function() {
                videoSubscribers = 1;
                roomService = null;
            });
        }
    }

    function onMuteAudioClick() {
        muteAudio = !muteAudio;

        if (publisher && publisher.audioPublisher) {
            if (muteAudio) {
                muteAudioButton.textContent = 'Unmute Audio';
                publisher.audioPublisher.disableAudio();
            } else {
                muteAudioButton.textContent = 'Mute Audio';
                publisher.audioPublisher.enableAudio();
            }
        }
    }

    function onMuteVideoClick() {
        muteVideo = !muteVideo;

        if (publisher && publisher.audioPublisher) {
            if (muteVideo) {
                muteVideoButton.textContent = 'Unmute Video';

                if(publisher.videoPublisher && publisher.videoPublisher.isActive()) {
                    publisher.videoPublisher.stop();
                    publisher.videoElement.remove();
                }

                delete publisher.videoPublisher;
                delete publisher.videoElement;
            } else {
                muteVideoButton.textContent = 'Mute Video';
                publishVideo();
            }
        }
    }

    muteAudioButton.onclick = onMuteAudioClick;
    muteVideoButton.onclick = onMuteVideoClick;

    publishAndJoinRoomButton.onclick = publishVideoAndCameraAtTwoQualitiesAndJoinRoom;
    stopButton.onclick = leaveRoomAndStopPublisher;
};

init();