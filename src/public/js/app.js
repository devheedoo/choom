const socket = io(); // from socket.io

const divMyStream = document.getElementById('divMyStream');
const videoMyStream = divMyStream.querySelector('video');

async function getMyStream() {
  try {
    const myStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    videoMyStream.srcObject = myStream;
  } catch (e) {
    console.log(e);
  }
}

getMyStream();
