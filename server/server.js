const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Room state storage
// roomCode => { videoId, isPlaying, time, updatedAt, hostSocketId, sockets: Set }
const rooms = new Map();

// Socket to room mapping
const socketToRoom = new Map();

// Generate a random 6-character room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Create a new room
  socket.on('create-room', (callback) => {
    let roomCode = generateRoomCode();
    // Ensure unique room code
    while (rooms.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    const room = {
      videoId: null,
      isPlaying: false,
      time: 0,
      updatedAt: Date.now(),
      hostSocketId: socket.id,
      sockets: new Set([socket.id])
    };

    rooms.set(roomCode, room);
    socketToRoom.set(socket.id, roomCode);
    socket.join(roomCode);

    console.log(`Room created: ${roomCode} by ${socket.id}`);
    callback({ success: true, roomCode, isHost: true, userCount: 1 });
  });

  // Join an existing room
  socket.on('join-room', (roomCode, callback) => {
    const room = rooms.get(roomCode);
    
    if (!room) {
      callback({ success: false, message: 'Room not found' });
      return;
    }

    room.sockets.add(socket.id);
    socketToRoom.set(socket.id, roomCode);
    socket.join(roomCode);

    const isHost = socket.id === room.hostSocketId;
    const userCount = room.sockets.size;

    console.log(`Socket ${socket.id} joined room ${roomCode}. Users: ${userCount}`);

    // Send current state to the joining user
    const currentTime = room.isPlaying 
      ? room.time + (Date.now() - room.updatedAt) / 1000
      : room.time;

    callback({ 
      success: true, 
      roomCode, 
      isHost,
      userCount
    });

    // Send sync state to the joining user
    if (room.videoId) {
      socket.emit('state:sync', {
        videoId: room.videoId,
        isPlaying: room.isPlaying,
        time: currentTime
      });
    }

    // Notify all users in the room about user count update
    io.to(roomCode).emit('user-count', userCount);
  });

  // Host loads a video
  socket.on('host:loadVideo', ({ roomCode, videoId }) => {
    const room = rooms.get(roomCode);
    
    if (!room || room.hostSocketId !== socket.id) {
      console.log(`Unauthorized loadVideo attempt by ${socket.id}`);
      return;
    }

    room.videoId = videoId;
    room.isPlaying = false;
    room.time = 0;
    room.updatedAt = Date.now();

    console.log(`Room ${roomCode}: Video loaded - ${videoId}`);

    // Broadcast to all clients in the room
    io.to(roomCode).emit('state:sync', {
      videoId: room.videoId,
      isPlaying: room.isPlaying,
      time: room.time
    });
  });

  // Host plays video
  socket.on('host:play', ({ roomCode, time }) => {
    const room = rooms.get(roomCode);
    
    if (!room || room.hostSocketId !== socket.id) {
      console.log(`Unauthorized play attempt by ${socket.id}`);
      return;
    }

    room.isPlaying = true;
    room.time = time;
    room.updatedAt = Date.now();

    console.log(`Room ${roomCode}: Play at ${time}s`);

    // Broadcast to all other clients in the room
    socket.to(roomCode).emit('state:play', { time });
  });

  // Host pauses video
  socket.on('host:pause', ({ roomCode, time }) => {
    const room = rooms.get(roomCode);
    
    if (!room || room.hostSocketId !== socket.id) {
      console.log(`Unauthorized pause attempt by ${socket.id}`);
      return;
    }

    room.isPlaying = false;
    room.time = time;
    room.updatedAt = Date.now();

    console.log(`Room ${roomCode}: Pause at ${time}s`);

    // Broadcast to all other clients in the room
    socket.to(roomCode).emit('state:pause', { time });
  });

  // Host seeks video
  socket.on('host:seek', ({ roomCode, time }) => {
    const room = rooms.get(roomCode);
    
    if (!room || room.hostSocketId !== socket.id) {
      console.log(`Unauthorized seek attempt by ${socket.id}`);
      return;
    }

    room.time = time;
    room.updatedAt = Date.now();

    console.log(`Room ${roomCode}: Seek to ${time}s`);

    // Broadcast to all other clients in the room
    socket.to(roomCode).emit('state:seek', { time });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    const roomCode = socketToRoom.get(socket.id);
    if (roomCode) {
      const room = rooms.get(roomCode);
      if (room) {
        room.sockets.delete(socket.id);
        
        // If host disconnects, close the room
        if (socket.id === room.hostSocketId) {
          console.log(`Host left, closing room ${roomCode}`);
          io.to(roomCode).emit('room-closed', { message: 'Host has left the room' });
          rooms.delete(roomCode);
          
          // Clean up all sockets in the room
          room.sockets.forEach(sid => socketToRoom.delete(sid));
        } else {
          // Update user count for remaining users
          const userCount = room.sockets.size;
          io.to(roomCode).emit('user-count', userCount);
          console.log(`User left room ${roomCode}. Users remaining: ${userCount}`);
        }
      }
      socketToRoom.delete(socket.id);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Network: http://<your-ip>:${PORT}`);
  }
});
