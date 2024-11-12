const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: "*", // Allow requests from any origin (adjust for security)
      methods: ["GET", "POST"]
    }
  });
  
// Serve static files (HTML, CSS, JS) from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  socket.on('join_room', (roomID) => {
    socket.join(roomID);
    const roomSize = io.sockets.adapter.rooms.get(roomID).size;

    if (roomSize === 1) {
      socket.emit('waiting_for_partner');
    } else if (roomSize === 2) {
      io.to(roomID).emit('partner_found');
    } else {
      socket.emit('room_full');
      socket.leave(roomID);
    }
  });

  socket.on('offer', (data) => socket.to(data.roomID).emit('offer', data.offer));
  socket.on('answer', (data) => socket.to(data.roomID).emit('answer', data.answer));
  socket.on('candidate', (data) => socket.to(data.roomID).emit('candidate', data.candidate));
});

// Catch-all route for production build (if using frameworks like React or Vue)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server on port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
