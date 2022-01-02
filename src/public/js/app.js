const socket = io(); // from socket.io

// Room
const divRoom = document.getElementById('divRoom');
const formRoom = document.getElementById('formRoom');
const inputRoomId = document.getElementById('inputRoomId');
const buttonJoinRoom = document.getElementById('buttonJoinRoom');
let currentRoomId = 'no_public_room_id';

// Call
const divCall = document.getElementById('divCall');
const divMyStream = document.getElementById('divMyStream');
const videoMyStream = document.getElementById('videoMyStream');
const buttonAudioOnOff = document.getElementById('buttonAudioOnOff');
const buttonVideoOnOff = document.getElementById('buttonVideoOnOff');
const selectCameras = document.getElementById('selectCameras');
const videoPeerStream = document.getElementById('videoPeerStream');

/** @type {MediaStream} */
let myStream;

let cameras = [];

/** @type {RTCPeerConnection} */
let myPeerConnection;

let isAudioOff = false;
let isVideoOff = false;

/** @type {RTCDataChannel} */
let myDataChannel;

async function initCall() {
  divRoom.hidden = true;
  divCall.hidden = false;
  await getMyStream();
  makeConnection();
}

async function getMyStream() {
  try {
    myStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: true,
    });
    videoMyStream.srcObject = myStream;
    getCameras();
  } catch (e) {
    console.log(e);
  }
}

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((d) => d.kind === 'videoinput');
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((c) => {
      const option = document.createElement('option');
      option.value = c.deviceId;
      option.innerText = c.label;
      if (currentCamera.id === c.id) {
        option.selected = true;
      }
      selectCameras.append(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function changeCamera(cameraDeviceId) {
  try {
    myStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: cameraDeviceId } },
      audio: true,
    });
    videoMyStream.srcObject = myStream;
  } catch (e) {
    console.log(e);
  }
}

formRoom.addEventListener('submit', async (e) => {
  e.preventDefault();
  currentRoomId = inputRoomId.value;
  await initCall();
  socket.emit('join_room', currentRoomId);
  inputRoomId.value = '';
});

buttonAudioOnOff.addEventListener('click', () => {
  buttonAudioOnOff.innerHTML = isAudioOff ? 'Audio ON' : 'Audio OFF';
  isAudioOff = !isAudioOff;
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
});

buttonVideoOnOff.addEventListener('click', () => {
  buttonVideoOnOff.innerHTML = isVideoOff ? 'Video ON' : 'Video OFF';
  isVideoOff = !isVideoOff;
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
});

selectCameras.addEventListener('input', () => {
  changeCamera(selectCameras.value);
  const myVideoTrack = myStream.getVideoTracks()[0];
  if (myPeerConnection) {
    const videoSender = myPeerConnection
      .getSenders()
      .filter((s) => s.track.kind === 'video');
    videoSender.replaceTrack(myVideoTrack);
  }
});

// Socket
socket.on('join_room', async () => {
  console.log('someone joined room.');
  myDataChannel = myPeerConnection.createDataChannel('chat');
  myDataChannel.addEventListener('message', (event) => console.log(event.data));
  const myOffer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(myOffer);
  socket.emit('offer', currentRoomId, myOffer);
});

socket.on('offer', async (offer) => {
  myPeerConnection.addEventListener('datachannel', (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener('message', (event) =>
      console.log(event.data)
    );
  });
  myPeerConnection.setRemoteDescription(offer);
  const myAnswer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(myAnswer);
  socket.emit('answer', currentRoomId, myAnswer);
});

socket.on('answer', (answer) => {
  console.log(answer);
  myPeerConnection.setRemoteDescription(answer);
});

socket.on('ice', (ice) => {
  myPeerConnection.addIceCandidate(ice);
});

// RTC
function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
          'stun:stun3.l.google.com:19302',
          'stun:stun4.l.google.com:19302',
        ],
      },
    ],
  });
  myPeerConnection.addEventListener('icecandidate', (data) => {
    console.log('icecandidate:', data);
    socket.emit('ice', currentRoomId, data.candidate);
  });
  myPeerConnection.addEventListener('addstream', (data) => {
    console.log('addstream:', data);
    videoPeerStream.srcObject = data.stream;
  });
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}
