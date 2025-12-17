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

/* -----------------------------
   ROOM STORAGE (IN-MEMORY)
----------------------------- */
const rooms = {};

/* -----------------------------
   UTILS
----------------------------- */
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function checkWinner(board) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (let combo of wins) {
    const [a,b,c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], combo };
    }
  }

  if (!board.includes("")) {
    return { winner: "DRAW" };
  }

  return null;
}

/* -----------------------------
   SOCKET.IO
----------------------------- */
io.on("connection", (socket) => {
  console.log("CONNECTED:", socket.id);
  
  socket.on("chatMessage", ({ code, text }) => {
  const room = rooms[code];
  if (!room) return;

  const symbol =
    socket.id === room.players.X ? "X" : "O";

  const player = room.playersData[symbol];

  io.to(code).emit("chatMessage", {
    name: player.name,
    avatar: player.avatar,
    text
  });
});


  /* CREATE ROOM */
  socket.on("createRoom", (username) => {
    const code = generateCode();

    rooms[code] = {
      board: Array(9).fill(""),
      turn: "X",
      players: {
        X: socket.id,
        O: null
      },
      names: {
        X: username,
        O: ""
      },
      gameOver: false
    };

    socket.join(code);

    socket.emit("roomCreated", {
      code,
      symbol: "X"
    });

    console.log(`Room ${code} created by ${username}`);
  });

  /* JOIN ROOM */
  socket.on("joinRoom", ({ code, username }) => {
    const room = rooms[code];

    if (room.players.length === 2) {
      io.to(code).emit("startOnlineGame");
    }


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

    console.log(`${username} joined room ${code}`);
  });

  /* PLAYER MOVE */
  socket.on("playerMove", ({ code, index }) => {
    const room = rooms[code];
    if (!room || room.gameOver) return;

    const symbol =
      socket.id === room.players.X ? "X" :
      socket.id === room.players.O ? "O" : null;

    if (!symbol) return;
    if (room.turn !== symbol) return;
    if (room.board[index] !== "") return;

    room.board[index] = symbol;
    room.turn = symbol === "X" ? "O" : "X";

    const result = checkWinner(room.board);

    if (result) {
      room.gameOver = true;

      io.to(code).emit("gameOver", {
        board: room.board,
        winner: result.winner,
        combo: result.combo || []
      });

      console.log(`Game over in room ${code}:`, result.winner);
    } else {
      io.to(code).emit("updateBoard", {
        board: room.board,
        turn: room.turn
      });
    }
  });

  /* REMATCH */
  socket.on("rematch", (code) => {
    const room = rooms[code];
    if (!room) return;

    room.board = Array(9).fill("");
    room.turn = "X";
    room.gameOver = false;

    io.to(code).emit("rematchStarted", {
      board: room.board,
      turn: room.turn
    });

    console.log(`Rematch started in room ${code}`);
  });

  /* DISCONNECT */
  socket.on("disconnect", () => {
    console.log("DISCONNECTED:", socket.id);
  });
});

/* -----------------------------
   START SERVER (RENDER READY)
----------------------------- */
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
