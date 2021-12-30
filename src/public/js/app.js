const socket = io(); // from socket.io

const divWelcome = document.querySelector('#welcome');
const formRoom = divWelcome.querySelector('#formRoom');
const inputRoomId = formRoom.querySelector('input');

const divRoom = document.querySelector('#room');
const h3Room = divRoom.querySelector('h3');
const ulRoom = divRoom.querySelector('ul');
const formMessage = divRoom.querySelector('#formMessage');
const inputMessage = formMessage.querySelector('input');
let currentRoomName = 'no_room_name';

formRoom.addEventListener('submit', (e) => {
  e.preventDefault();
  socket.emit('join_room', { roomId: inputRoomId.value }, handleJoinRoom);
  currentRoomName = inputRoomId.value;
  inputRoomId.value = '';
});

function handleJoinRoom() {
  divWelcome.hidden = true;
  divRoom.hidden = false;
  h3Room.innerHTML = currentRoomName;
}

function addMessageToUlRoom(message) {
  const li = document.createElement('li');
  li.innerHTML = message;
  ulRoom.append(li);
}

socket.on('joined_room', () => {
  addMessageToUlRoom('someone joined this room');
});
