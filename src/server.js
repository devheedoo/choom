import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));
app.get('/', (req, res) => res.render('home'));
app.get('/*', (req, res) => res.redirect('/'));

const httpServer = http.createServer(app);
const io = new Server(httpServer);

io.on('connection', (socket) => {
  socket.onAny((e) => console.log(`io event: ${e}`));

  // request: { roomId: string; }
  socket.on('join_room', (request, callback) => {
    const { roomId } = request;
    socket.join(roomId);
    callback();
    // Emit to room members including sender
    // io.sockets.to(roomId).emit('joined_room');
    // Emit to room members but sender
    socket.to(roomId).emit('joined_room');
  });

  // request: { roomId: string, text: string; }
  socket.on('client_send_message', (request, callback) => {
    const { roomId, text } = request;
    callback();
    socket.to(roomId).emit('server_send_message', { text });
  });
});

httpServer.listen(3000, () =>
  console.log('Listening on http://localhost:3000 and ws://localhost:3000')
);
