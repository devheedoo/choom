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

function getPublicRoomIds() {
  const { sids, rooms } = io.sockets.adapter;
  const publicRoomIds = [];
  rooms.forEach((value, key) => {
    if (sids.get(key) === undefined) {
      publicRoomIds.push(key);
    }
  });
  return publicRoomIds;
}

io.on('connection', (socket) => {
  socket['name'] = 'user-' + socket.id.slice(0, 5);
  io.sockets.emit('server_change_rooms', getPublicRoomIds());
  socket.onAny((e) => console.log(`io event: ${e}`));

  // request: { roomId: string; }
  socket.on('join_room', (request, callback) => {
    const { roomId } = request;
    socket.join(roomId);
    callback();
    // Emit to room members including sender
    // io.sockets.to(roomId).emit('joined_room');
    // Emit to room members but sender
    socket.to(roomId).emit('joined_room', socket['name']);
    io.sockets.emit('server_change_rooms', getPublicRoomIds());
  });

  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) => {
      socket.to(room).emit('leaved_room', socket['name']);
    });
  });

  socket.on('disconnect', () => {
    io.sockets.emit('server_change_rooms', getPublicRoomIds());
  });

  socket.on('client_save_name', (name, callback) => {
    socket['name'] = name;
    callback();
  });

  // request: { roomId: string, text: string; }
  socket.on('client_send_message', (request, callback) => {
    const { roomId, text } = request;
    callback();
    socket
      .to(roomId)
      .emit('server_send_message', { name: socket['name'], text });
  });

  socket.on('client_leave_room', (roomId, callback) => {
    socket.leave(roomId);
    callback();
    io.sockets.emit('server_change_rooms', getPublicRoomIds());
  });
});

httpServer.listen(3000, () =>
  console.log('Listening on http://localhost:3000 and ws://localhost:3000')
);
