const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 4000;

/*************************
 * STATIC FILES
 *************************/
app.use(express.static(path.join(__dirname, "public")));

/*************************
 * GAME ROOMS
 *************************/
const rooms = {}; 
// rooms = {
//   ABC123: {
//     players: [socketId1, socketId2],
//     names: {}
//   }
// }

/*************************
 * SOCKET LOGIC
 *************************/
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  /******** CREATE ROOM ********/
  socket.on("createRoom", ({ name }, callback) => {
    const code = generateRoomCode();

    rooms[code] = {
      players: [socket.id],
      names: { [socket.id]: name }
    };

    socket.join(code);

    console.log(`Room ${code} created by ${name}`);

    callback({ code });
  });

  /******** JOIN ROOM ********/
  socket.on("joinRoom", ({ code, name }, callback) => {
    const room = rooms[code];

    if (!room) {
      callback({ error: "Room not found" });
      return;
    }

    if (room.players.length >= 2) {
      callback({ error: "Room is full" });
      return;
    }

    room.players.push(socket.id);
    room.names[socket.id] = name;
    socket.join(code);

    console.log(`${name} joined room ${code}`);
    console.log("Players in room:", room.players.length);

    // Notify both players
    io.to(code).emit("playerJoined", {
      players: room.players.length
    });

    // START GAME WHEN 2 PLAYERS
    if (room.players.length === 2) {
      io.to(code).emit("startOnlineGame");
      console.log(`Game started in room ${code}`);
    }

    callback({ success: true });
  });

  /******** CHAT ********/
  socket.on("chatMessage", ({ code, text, sender }) => {
    if (!rooms[code]) return;

    io.to(code).emit("chatMessage", {
      sender,
      text
    });
  });

  /******** PLAYER MOVE ********/
  socket.on("playerMove", ({ code, index, symbol }) => {
    if (!rooms[code]) return;

    socket.to(code).emit("playerMove", {
      index,
      symbol
    });
  });

  /******** REMATCH ********/
  socket.on("rematch", ({ code }) => {
    if (!rooms[code]) return;

    io.to(code).emit("rematch");
  });

  /******** DISCONNECT ********/
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const code in rooms) {
      const room = rooms[code];

      if (room.players.includes(socket.id)) {
        room.players = room.players.filter(id => id !== socket.id);
        delete room.names[socket.id];

        io.to(code).emit("opponentLeft");

        if (room.players.length === 0) {
          delete rooms[code];
        }

        break;
      }
    }
  });
});

/*************************
 * UTIL
 *************************/
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/*************************
 * START SERVER
 *************************/
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
