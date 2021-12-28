const websocket = new WebSocket(`ws://${window.location.host}`);

websocket.addEventListener('open', () => {
  console.log('✅ websocket server opened');
});

websocket.addEventListener('close', () => {
  console.log('🚨 websocket server closed');
});

const messagesUl = document.querySelector('ul');
const nicknameForm = document.querySelector('#nickname');
const messageForm = document.querySelector('#message');

websocket.addEventListener('message', ({ data }) => {
  console.log('💌 message from server:', data);
  const li = document.createElement('li');
  li.innerHTML = data;
  messagesUl.append(li);
});

function makeMessage(type, payload) {
  const message = { type, payload };
  return JSON.stringify(message);
}

nicknameForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = nicknameForm.querySelector('input');
  websocket.send(makeMessage('nickname', input.value));
  input.value = '';
});

messageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = messageForm.querySelector('input');
  websocket.send(makeMessage('message', input.value));
  input.value = '';
});
