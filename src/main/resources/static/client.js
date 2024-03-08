//connecting to our signaling server 
var conn = new WebSocket('ws://localhost:8080/socket');
// var conn = new WebSocket('ws://10.0.0.21:8080/socket');


conn.onopen = function() {
    console.log("client.js accessed!!!!!");
    console.log("Connected to the signaling server");
    initialize();
};

conn.onmessage = function(msg) {
    console.log("Got message", msg.data);
    var content = JSON.parse(msg.data);
    var data = content.data;
    switch (content.event) {
    // when somebody wants to call us
    case "offer":
        handleOffer(data);
        break;
    case "answer":
        handleAnswer(data);
        break;
    // when a remote peer sends an ice candidate to us
    case "candidate":
        handleCandidate(data);
        break;
    default:
        break;
    }
};

function send(message) {
    conn.send(JSON.stringify(message));
}

var peerConnection;
var dataChannel;
var input = document.getElementById("messageInput");



function initialize() {
    // var configuration = null;
    var configuration = {
        // Use Google's STUN server
        iceServers: [{urls: "stun:stun2.1.google.com:19302"}]
    };

    peerConnection = new RTCPeerConnection(configuration);

    // Setup ice handling
    peerConnection.onicecandidate = function(event) {
        if (event.candidate) {
            send({
                event : "candidate",
                data : event.candidate
            });
        }
    };

    // creating data channel
    dataChannel = peerConnection.createDataChannel("dataChannel", {
        reliable : true
    });

    dataChannel.onerror = function(error) {
        console.log("Error occured on datachannel:", error);
    };

    // when we receive a message from the other peer, printing it on the console
    dataChannel.onmessage = function(event) {
        console.log("message:", event.data);
    };

    dataChannel.onclose = function() {
        console.log("data channel is closed");
    };
  
  	peerConnection.ondatachannel = function (event) {
        dataChannel = event.channel;
  	};

    peerConnection.ontrack = function(event) {
        document.getElementById('remoteVideo').srcObject = event.streams[0];
        // document.getElementById('remoteVideo').srcObject = null;
        // videoElement.srcObject = event.stream;
    };

    var constraints = {
        video : {
            frameRate : {
                ideal : 10,
                max : 15
            },
            width : 1280,
            height : 720,
            facingMode : "user"
        }
    };

    // navigator.mediaDevices.getUserMedia(constraints).
    // then(function(stream) { /* use the stream */
    //     peerConnection.addStream(stream);})
    //     .catch(function(err) { /* handle the error */ });
    // Replace the data channel setup with video stream acquisition
    // navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    //     .then(function(stream) {
    //         // Display your local video
    //         document.getElementById('localVideo').srcObject = stream;
    //         console.log("!!!! ------ local video got it !!!!!!");
    //
    //         // Add your stream to the connection to be sent to the remote peer
    //         stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    //     })
    //     .catch(function(err) {
    //         console.log("!!!! ------ local video failed to get !!!!!!");
    //         console.error('Failed to get local stream', err);
    //     });
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Use navigator.mediaDevices.getUserMedia
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(function(stream) {
                // Use the stream
                document.getElementById('localVideo').srcObject = stream;

                // Add your stream to the connection to be sent to the remote peer
                stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
            })
            .catch(function(err) {
                console.error("Failed to get local stream", err);
            });
    } else {
        alert('Your browser does not support mediaDevices.getUserMedia');
    }
    
}

function createOffer() {
    peerConnection.createOffer(function(offer) {
        send({
            event : "offer",
            data : offer
        });
        peerConnection.setLocalDescription(offer);
    }, function(error) {
        alert("Error creating an offer");
    });
}

function handleOffer(offer) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    // create and send an answer to an offer
    peerConnection.createAnswer(function(answer) {
        peerConnection.setLocalDescription(answer);
        send({
            event : "answer",
            data : answer
        });
    }, function(error) {
        alert("Error creating an answer");
    });

};

function handleCandidate(candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

function handleAnswer(answer) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    console.log("connection established successfully!!");
};

function sendMessage() {
    dataChannel.send(input.value);
    input.value = "";
}
