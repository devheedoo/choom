const websocket = new WebSocket(`ws://${window.location.host}`);

websocket.addEventListener('open', () => {
  console.log('✅ websocket server opened');
});

websocket.addEventListener('message', ({ data }) => {
  console.log('💌 message from server:', data);
});

websocket.addEventListener('close', () => {
  console.log('🚨 websocket server closed');
});

setTimeout(() => {
  websocket.send('I AM THE CLIENT');
}, 5000);
