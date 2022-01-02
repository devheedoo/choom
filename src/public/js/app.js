const socket = io(); // from socket.io

const divMyStream = document.getElementById('divMyStream');
const videoMyStream = divMyStream.querySelector('video');
const buttonAudioOnOff = document.getElementById('buttonAudioOnOff');
const buttonVideoOnOff = document.getElementById('buttonVideoOnOff');
const selectCameras = document.getElementById('cameras');

/** @type {MediaStream} */
let myStream;
let cameras = [];

async function getMyStream() {
  try {
    myStream = await navigator.mediaDevices.getUserMedia({
      video: true,
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

getMyStream();

let isAudioOff = false;
let isVideoOff = false;

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
