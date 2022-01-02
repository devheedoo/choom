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
const videoMyStream = divMyStream.querySelector('video');
const buttonAudioOnOff = document.getElementById('buttonAudioOnOff');
const buttonVideoOnOff = document.getElementById('buttonVideoOnOff');
const selectCameras = document.getElementById('selectCameras');

/** @type {MediaStream} */
let myStream;

let cameras = [];

/** @type {RTCPeerConnection} */
let myPeerConnection;

let isAudioOff = false;
let isVideoOff = false;

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
  socket.emit('client_join_room', currentRoomId);
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
});

// Socket
socket.on('server_joined_room', async () => {
  console.log('someone joined room.');
  const myOffer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(myOffer);
  socket.emit('client_send_offer', currentRoomId, myOffer);
});

socket.on('server_offer', (offer) => {
  console.log(offer);
});

// RTC
function makeConnection() {
  myPeerConnection = new RTCPeerConnection();
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}
