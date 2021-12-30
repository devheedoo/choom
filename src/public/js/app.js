const socket = io(); // from socket.io

const formRoom = document.querySelector('#roomForm');
const inputRoomId = formRoom.querySelector('input');

formRoom.addEventListener('submit', (e) => {
  e.preventDefault();
  socket.emit('enter_room', { roomId: inputRoomId.value }, () =>
    console.log('enter_room server response is done')
  );
  inputRoomId.value = '';
});
