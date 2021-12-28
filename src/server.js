import express from 'express';
import WebSocket from 'ws';
import http from 'http';

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));
app.get('/', (req, res) => res.render('home'));
app.get('/*', (req, res) => res.redirect('/'));

const httpServer = http.createServer(app);
const websocketServer = new WebSocket.Server({ server: httpServer });

httpServer.listen(3000, () =>
  console.log('Listening on http://localhost:3000 and ws://localhost:3000')
);

const websockets = [];

websocketServer.on('connection', (websocket) => {
  websockets.push(websocket);
  websocket.send('I AM THE SERVER');
  websocket.on('message', (message) => {
    console.log(message.toString());
    websockets.forEach((ws) => {
      ws.send(message.toString());
    });
  });
  websocket.on('close', () => {
    console.log('🚨 client disconnected');
  });
});
