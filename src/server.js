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
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('join_room');
  });

  socket.on('offer', (roomId, offer) => {
    socket.to(roomId).emit('offer', offer);
  });

  socket.on('answer', (roomId, answer) => {
    socket.to(roomId).emit('answer', answer);
  });

  socket.on('ice', (roomId, ice) => {
    socket.to(roomId).emit('ice', ice);
  });
});

httpServer.listen(3000, () =>
  console.log('Listening on http://localhost:3000 and ws://localhost:3000')
);
