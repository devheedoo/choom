const socket = io(); // from socket.io

// Room
const divRoom = document.getElementById('divRoom');
const formCreateRoom = document.getElementById('formCreateRoom');
const formJoinRoom = document.getElementById('formJoinRoom');
const inputRoomId = document.getElementById('inputRoomId');
const buttonJoinRoom = document.getElementById('buttonJoinRoom');
let currentRoomId = 'no_public_room_id';

// Mirror
const divMirror = document.getElementById('divMirror');
const spanMirrorRoomId = document.getElementById('spanMirrorRoomId');
const videoMirror = document.getElementById('videoMirror');

const divButtons = document.getElementById('divButtons');
const buttonPreAudioOnOff = document.getElementById('buttonPreAudioOnOff');
const buttonPreVideoOnOff = document.getElementById('buttonPreVideoOnOff');
const buttonEnterRoom = document.getElementById('buttonEnterRoom');
const buttonLeaveRoom = document.getElementById('buttonLeaveRoom');

// Call
const divCall = document.getElementById('divCall');
const spanCallRoomId = document.getElementById('spanCallRoomId');
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

async function readyToJoin() {
  console.log('readyToJoin');
  divRoom.style.display = 'none';
  divMirror.style.display = 'flex';
  divButtons.style.display = 'flex';
  spanMirrorRoomId.innerHTML = currentRoomId;
  spanCallRoomId.innerHTML = currentRoomId;
  await getMirror();
}

async function initCall() {
  divMirror.style.display = 'none';
  divCall.style.display = 'flex';
  buttonEnterRoom.style.display = 'none';
  buttonLeaveRoom.style.display = 'block';
  await getMyStream();
  makeConnection();
}

async function getMirror() {
  try {
    myStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: true,
    });
    videoMirror.srcObject = myStream;
    getCameras();
  } catch (e) {
    console.log(e);
  }
}

async function getMyStream() {
  try {
    videoMyStream.srcObject = myStream;
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
    videoMirror.srcObject = myStream;
  } catch (e) {
    console.log(e);
  }
}

formCreateRoom.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('fromCreateRoom SUBMIT');
  const UPPERCASE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomRoomId = '';
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * UPPERCASE_ALPHABET.length);
    randomRoomId += UPPERCASE_ALPHABET[randomIndex];
  }
  currentRoomId = randomRoomId;
  readyToJoin();
  inputRoomId.value = '';
});

formJoinRoom.addEventListener('submit', async (e) => {
  e.preventDefault();
  currentRoomId = inputRoomId.value;
  readyToJoin();
  inputRoomId.value = '';
});

buttonPreAudioOnOff.addEventListener('click', (e) => {
  e.preventDefault();
  if (isAudioOff) {
    buttonPreAudioOnOff.classList.remove('buttonOff');
    buttonPreAudioOnOff.classList.add('buttonOn');
    buttonPreAudioOnOff.innerHTML = '<i class="fas fa-microphone"></i>';
  } else {
    buttonPreAudioOnOff.classList.remove('buttonOn');
    buttonPreAudioOnOff.classList.add('buttonOff');
    buttonPreAudioOnOff.innerHTML = '<i class="fas fa-microphone-slash"></i>';
  }
  isAudioOff = !isAudioOff;
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
});

buttonPreVideoOnOff.addEventListener('click', (e) => {
  e.preventDefault();
  if (isVideoOff) {
    buttonPreVideoOnOff.classList.remove('buttonOff');
    buttonPreVideoOnOff.classList.add('buttonOn');
    buttonPreVideoOnOff.innerHTML = '<i class="fas fa-video"></i>';
  } else {
    buttonPreVideoOnOff.classList.remove('buttonOn');
    buttonPreVideoOnOff.classList.add('buttonOff');
    buttonPreVideoOnOff.innerHTML = '<i class="fas fa-video-slash"></i>';
  }
  isVideoOff = !isVideoOff;
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
});

buttonEnterRoom.addEventListener('click', async (e) => {
  e.preventDefault();
  await initCall();
  socket.emit('join_room', currentRoomId);
});

buttonLeaveRoom.addEventListener('click', (e) => {
  e.preventDefault();
  location.reload();
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
