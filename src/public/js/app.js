const socket = io(); // from socket.io

const divWelcome = document.querySelector('#welcome');
const formRoom = divWelcome.querySelector('#formRoom');
const inputRoomId = formRoom.querySelector('input');

const divRoom = document.querySelector('#room');
const h3Room = divRoom.querySelector('h3');
const ulRoom = divRoom.querySelector('ul');
const formMessage = divRoom.querySelector('#formMessage');
const inputMessage = formMessage.querySelector('input');
let currentRoomId = 'no_room_name';

formRoom.addEventListener('submit', (e) => {
  e.preventDefault();
  socket.emit('join_room', { roomId: inputRoomId.value }, handleJoinRoom);
  currentRoomId = inputRoomId.value;
  inputRoomId.value = '';
});

function handleJoinRoom() {
  divWelcome.hidden = true;
  divRoom.hidden = false;
  h3Room.innerHTML = currentRoomId;
}

function addMessageToUlRoom(message) {
  const li = document.createElement('li');
  li.innerHTML = message;
  ulRoom.append(li);
}

socket.on('joined_room', () => {
  addMessageToUlRoom('someone joined this room');
});

formMessage.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = inputMessage.value;
  socket.emit('client_send_message', { roomId: currentRoomId, text }, () =>
    handleClientSendMessage(text)
  );
  inputMessage.value = '';
});

function handleClientSendMessage(text) {
  addMessageToUlRoom(`You: ${text}`);
}

socket.on('server_send_message', (response) => {
  // response: { text: string;}
  addMessageToUlRoom(response.text);
});
