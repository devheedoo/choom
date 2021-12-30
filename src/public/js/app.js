const socket = io(); // from socket.io

const h2Title = document.querySelector('h2');
const ulChat = document.querySelector('#chat');

const divWelcome = document.querySelector('#welcome');
const formRoom = divWelcome.querySelector('#formRoom');
const inputRoomId = formRoom.querySelector('input');
const formName = divWelcome.querySelector('#formName');
const inputName = formName.querySelector('input');
const ulRooms = divWelcome.querySelector('ul');

const divRoom = document.querySelector('#room');
const formMessage = divRoom.querySelector('#formMessage');
const inputMessage = formMessage.querySelector('input');
const buttonLeaveRoom = divRoom.querySelector('#buttonLeaveRoom');
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
  h2Title.innerHTML = currentRoomId;
  ulChat.innerHTML = '';
}

function addMessageToUlRoom(message) {
  const li = document.createElement('li');
  li.innerHTML = message;
  ulChat.append(li);
}

socket.on('joined_room', (name) => {
  addMessageToUlRoom(`${name} joined this room.`);
});

formName.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = inputName.value;
  socket.emit('client_save_name', name, () => {
    addMessageToUlRoom(`Now your name is ${name}`);
  });
  inputName.value = '';
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
  // response: { name: string; text: string;}
  const { name, text } = response;
  addMessageToUlRoom(`${name}: ${text}`);
});

socket.on('server_change_rooms', (roomIds) => {
  ulRooms.innerHTML = '';
  roomIds.forEach((roomId) => {
    const li = document.createElement('li');
    li.innerHTML = roomId;
    ulRooms.append(li);
  });
});

socket.on('disconnecting', (name) => {
  addMessageToUlRoom(`${name}: leaved this room.`);
});

buttonLeaveRoom.addEventListener('click', () => {
  socket.emit('client_leave_room', currentRoomId, handleLeaveRoom);
});

function handleLeaveRoom() {
  divWelcome.hidden = false;
  divRoom.hidden = true;
  h2Title.innerHTML = 'Lobby';
  ulChat.innerHTML = '';
}
