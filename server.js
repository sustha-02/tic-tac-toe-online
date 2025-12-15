const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/start.html");
});

const rooms = {};

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on("connection", (socket) => {
  console.log("CONNECTED:", socket.id);

  socket.onAny((event, data) => {
    console.log("EVENT RECEIVED:", event, data);
  });

  socket.on("createRoom", (username) => {
    console.log("createRoom called with:", username);

    const code = generateCode();

    rooms[code] = {
      board: Array(9).fill(""),
      turn: "X",
      players: { X: socket.id, O: null },
      names: { X: username, O: "" },
      gameOver: false
    };

    socket.join(code);

    socket.emit("roomCreated", {
      code,
      symbol: "X"
    });
  });

  socket.on("joinRoom", ({ code, username }) => {
    console.log("joinRoom:", code, username);

    const room = rooms[code];
    if (!room || room.players.O) {
      socket.emit("invalidRoom");
      return;
    }

    room.players.O = socket.id;
    room.names.O = username;

    socket.join(code);

    io.to(code).emit("startOnlineGame", {
      names: room.names,
      turn: room.turn
    });
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
