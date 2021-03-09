/**
 * Copyright 2021 Phenix Real Time Solutions, Inc. All Rights Reserved.
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
var roomId = 'europe-central#demo#multipartyChatDemoRoom.ZpqbJ4mNkh6u';
var videoOnlyToken = 'DIGEST:eyJhcHBsaWNhdGlvbklkIjoiZGVtbyIsImRpZ2VzdCI6IndIRzFjWDJMK3NST2dtMktyT004S3NJU0IyeVp6eHQ2d3I5dVcrNFlGM3FZUTRSeEliUVFRR0Z2enhWNDVzSDhQZkkxam9qc3FnekNkNUdkamNnY0VRPT0iLCJ0b2tlbiI6IntcImV4cGlyZXNcIjoxOTI5NjA5NjUwOTQxLFwiY2FwYWJpbGl0aWVzXCI6W1widmlkZW8tb25seVwiXSxcInJlcXVpcmVkVGFnXCI6XCJyb29tSWQ6ZXVyb3BlLWNlbnRyYWwjZGVtbyNtdWx0aXBhcnR5Q2hhdERlbW9Sb29tLlpwcWJKNG1Oa2g2dVwifSJ9';
var audioOnlyToken = 'DIGEST:eyJhcHBsaWNhdGlvbklkIjoiZGVtbyIsImRpZ2VzdCI6IjZ3ODQ3S3N2ZFh5WjhRNnlyNWNzMnh0YjMxdFQ0TFR3bHAyeUZyZ0t2K0pDUEJyYkI4Qnd5a3dyT2NIWE52OXQ5eU5qYkFNT2tuQ1N1VnE5eGdBZjdRPT0iLCJ0b2tlbiI6IntcImV4cGlyZXNcIjoxOTI5NjA5NjcwMjI1LFwiY2FwYWJpbGl0aWVzXCI6W1wiYXVkaW8tb25seVwiXSxcInJlcXVpcmVkVGFnXCI6XCJyb29tSWQ6ZXVyb3BlLWNlbnRyYWwjZGVtbyNtdWx0aXBhcnR5Q2hhdERlbW9Sb29tLlpwcWJKNG1Oa2g2dVwifSJ9';
var publishOnlyToken = 'DIGEST:eyJhcHBsaWNhdGlvbklkIjoiZGVtbyIsImRpZ2VzdCI6IkljTzd5ZDVWL0ZldnMwZzNUak11b2lWRWpwTDduRktQYm02cEpaMjVteGd2OUhPU0NlMmM2clJjUE1zWGFaUTJoRStEWEtnbG9XUXpoalBabWQ4VVJRPT0iLCJ0b2tlbiI6IntcImV4cGlyZXNcIjoxOTI5NjExNTc3NjAzLFwidHlwZVwiOlwicHVibGlzaFwiLFwiY2FwYWJpbGl0aWVzXCI6W1wibGRcIl0sXCJyZXF1aXJlZFRhZ1wiOlwicm9vbUlkOmV1cm9wZS1jZW50cmFsI2RlbW8jbXVsdGlwYXJ0eUNoYXREZW1vUm9vbS5acHFiSjRtTmtoNnVcIn0ifQ==';
var publishAndJoinRoomButton = document.getElementById('publishAndJoinRoomButton');
var stopButton = document.getElementById('stopButton');
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
        var adminApiProxyClient = new sdk.net.AdminApiProxyClient();

        adminApiProxyClient.setRequestHandler(function handleRequestCallback(requestType, data, callback) {
            // The SDK made a request for a token b/c using of edge token failed.
            // The default behavior is to return 'unauthorized' which results in the stream being offline.
            // This should trigger the customer's custom authentication workflow.
            return callback(null, {status: 'unauthorized'});
        });

        roomExpress = new sdk.express.RoomExpress({
            adminApiProxyClient: adminApiProxyClient,
            authToken: audioOnlyToken,
            uri: 'https://pcast.phenixrts.com'
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
        var name = document.getElementById('screenName').value;

        if (!name) {
            name = 'screenName' + '-' + Math.floor(Math.random() * 10000) + 1;
        }

        screenName = name + '.' + Math.floor(Math.random() * 10000) + 1;
        joinRoom(function() {
            if (videoSources.length === 0 || audioSources.length === 0) {
                return console.error('Sources not available yet');
            }

            if (!roomExpress) {
                createRoomExpress();
            }

            var videoElement = createVideo();
            var publishOptions = {
                enableWildcardCapability: false,
                capabilities: [],
                room: {
                    roomId: roomId,
                    type: 'MultiPartyChat'
                },
                mediaConstraints: {
                    audio: {deviceId: audioSources[0].id},
                    video: {deviceId: videoSources[0].id}
                }, // Use the same deviceIds for both
                streamToken: publishOnlyToken,
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
            videoElement.muted = true;

            return publishAndHandleErrors(options, function(response) {
                publisher = {
                    publisher: response.publisher,
                    videoElement: videoElement
                };

                selfVideoList.append(videoElement);
            });
        });
    }

    function publishAndHandleErrors(options, callback) {
        return roomExpress.publishToRoom(options, function(error, response) {
            if (error) {
                console.error('Unable to publish to Room: ' + error.message);

                throw error;
            }

            if (response.status !== 'ok' && response.status !== 'ended') {
                console.error('New Status: ' + response.status);

                throw new Error(response.status);
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
            roomId: 'europe-central#demo#multipartyChatDemoRoom.ZpqbJ4mNkh6u',
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
        var memberSubscriptionToRemove = memberSubscriptions[memberSessionId].find(function(memberSubscription) {
            return memberStream.getPCastStreamId() === memberSubscription.memberStream.getPCastStreamId();
        });

        memberSubscriptions[memberSessionId] = memberSubscriptions[memberSessionId].filter(function(memberSubscription) {
            return memberStream.getPCastStreamId() !== memberSubscription.memberStream.getPCastStreamId();
        });

        if (memberSubscriptionToRemove) {
            memberSubscriptionToRemove.mediaStream.stop();
            memberSubscriptionToRemove.videoElement.remove();

            if (memberSubscriptionToRemove.container) {
                memberSubscriptionToRemove.container.remove();
            }

            return true;
        }

        return false;
    }

    function removeVideoMemberStream(memberStream, memberSessionId) {
        var memberSubscriptionToRemove = memberVideoSubscriptions[memberSessionId].find(function(memberSubscription) {
            return memberStream.getPCastStreamId() === memberSubscription.memberStream.getPCastStreamId();
        });

        memberVideoSubscriptions[memberSessionId] = memberVideoSubscriptions[memberSessionId].filter(function(memberSubscription) {
            return memberStream.getPCastStreamId() !== memberSubscription.memberStream.getPCastStreamId();
        });

        if (memberSubscriptionToRemove) {
            videoSubscribers--;
            memberSubscriptionToRemove.mediaStream.stop();
            memberSubscriptionToRemove.videoElement.remove();

            if (memberSubscriptionToRemove.container) {
                memberSubscriptionToRemove.container.remove();
            }

            return true;
        }

        return false;
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
                if (!memberSubscriptions[memberSessionId]) {
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
                memberStreams.filter(function(memberStream) {
                    return !memberSubscriptions[memberSessionId].find(function(memberSubscription) {
                        return memberStream.getPCastStreamId() === memberSubscription.memberStream.getPCastStreamId();
                    });
                }).forEach(function(memberStream) {
                    subscribeToMemberStream(memberStream, memberSessionId, memberScreenName);
                });
            });

            newMember.getObservableStreams().getValue().forEach(function(memberStream) {
                subscribeToMemberStream(memberStream, memberSessionId, memberScreenName);
            });
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

        // You may have the option to automatically retry
        if (response.retry) {
            console.log('Attempting to redo member stream subscription after failure'); // May want to display something indicating failure for member

            response.retry();
        }
    }

    function subscribeToMemberStream(memberStream, sessionId, memberScreenName) {
        var videoElement = createVideo();
        var container = document.createElement('div');

        container.classList = 'client-container';

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

            if (videoSubscribers <= maxVideoSubscribers) {
                videoSubscribers++;
                subscribeVideoOnly(memberStream, sessionId, videoElement, container, memberScreenName);
            } else {
                container.classList = 'client-container audio-only-member';
                container.append(videoElement);
                videoList.prepend(container);
            }

            setTimeout(function() {
                if (videoElement.muted) {
                    unMuteAudio(videoElement);
                }
            }, 10);

            if (removed) {
                console.log('Replaced member subscription for session ID [' + sessionId + ']');
            }
        };

        subscribeOptions.streamToken = audioOnlyToken;
        roomExpress.subscribeToMemberStream(memberStream, subscribeOptions, handleSubscribe);
    }

    function subscribeVideoOnly(memberStream, sessionId, audioElement, container, memberScreenName) {
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

            container.append(audioElement);
            container.append(videoElement);
            videoList.prepend(container);

            if (removed) {
                console.log('Replaced member subscription for session ID [' + sessionId + ']');
            }
        };

        subscribeOptions.streamToken = videoOnlyToken;
        roomExpress.subscribeToMemberStream(memberStream, subscribeOptions, handleSubscribe);
    }

    function unMuteAudio(videoElement) {
        videoElement.muted = false;
        videoElement.setAttribute('muted', false);
    }

    function createVideo() {
        var videoElement = document.createElement('video');

        videoElement.setAttribute('playsline', ''); // For Safari and IOS
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

        var newVideoMemeber = memberSubscriptions[sessionId][0];
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

            newVideoMemeber.container.classList = 'client-container';
            memberVideoSubscriptions[sessionId].push({
                mediaStream: response.mediaStream,
                videoElement: videoElement,
                container: newVideoMemeber.container,
                isSelf: isSelf,
                isVideo: true,
                memberStream: newVideoMemeber.memberStream,
                memberScreenName: newVideoMemeber.memberScreenName
            });

            newVideoMemeber.container.append(videoElement);
        };

        subscribeOptions.streamToken = videoOnlyToken;
        roomExpress.subscribeToMemberStream(newVideoMemeber.memberStream, subscribeOptions, handleSubscribe);
    }

    function leaveRoomAndStopPublisher() {
        if (publisher) {
            publisher.publisher.stop();
            publisher.videoElement.remove();

            publisher = null;
        }

        if (roomService) {
            roomService.leaveRoom(function(error, response) {
                roomService = null;

                if (error) {
                    throw error;
                }

                if (response.status !== 'ok') {
                    throw new Error(response.status);
                }
            });
        }
    }

    publishAndJoinRoomButton.onclick = publishVideoAndCameraAtTwoQualitiesAndJoinRoom;
    stopButton.onclick = leaveRoomAndStopPublisher;
};

init();