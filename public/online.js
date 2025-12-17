/*************************
 * SOCKET INIT
 *************************/
const socket = io();

/*************************
 * GLOBAL STATE
 *************************/
let roomCode = localStorage.getItem("roomCode");
let playerName = localStorage.getItem("playerName");

let board = Array(9).fill("");
let mySymbol = "X";
let myTurn = false;
let gameOver = false;

let scoreX = 0;
let scoreO = 0;

/*************************
 * ELEMENTS
 *************************/
const boardDiv = document.getElementById("board");
const statusText = document.getElementById("status");
const messagesDiv = document.getElementById("messages");
const chatInput = document.getElementById("chatInput");

/*************************
 * INIT
 *************************/
createBoard();
showWaiting();

/*************************
 * SOCKET EVENTS
 *************************/

// GAME START
socket.on("startOnlineGame", () => {
  console.log("ONLINE GAME STARTED");

  document.getElementById("waiting").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  statusText.innerText = "Game started!";
  resetBoard();
});

// PLAYER MOVE FROM OPPONENT
socket.on("playerMove", ({ index, symbol }) => {
  board[index] = symbol;
  updateUI();

  if (checkWin(symbol)) return;

  myTurn = true;
  statusText.innerText = "Your turn";
});

// CHAT MESSAGE
socket.on("chatMessage", ({ sender, text }) => {
  const div = document.createElement("div");
  div.innerHTML = `<strong>${sender}:</strong> ${text}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// REMATCH
socket.on("rematch", () => {
  resetBoard();
  statusText.innerText = myTurn ? "Your turn" : "Opponent's turn";
});

// OPPONENT LEFT
socket.on("opponentLeft", () => {
  statusText.innerText = "Opponent left the game";
  gameOver = true;
});

/*************************
 * ROOM ACTIONS
 *************************/
function createRoom() {
  const name = document.getElementById("nameInput").value.trim();
  if (!name) return alert("Enter your name");

  playerName = name;
  localStorage.setItem("playerName", name);

  socket.emit("createRoom", { name }, ({ code }) => {
    roomCode = code;
    localStorage.setItem("roomCode", code);

    document.getElementById("roomCode").innerText = code;
    showWaiting();
  });
}

function joinRoom() {
  const name = document.getElementById("nameInput").value.trim();
  const code = document.getElementById("roomInput").value.trim();

  if (!name || !code) return alert("Enter name and room code");

  playerName = name;
  roomCode = code;

  localStorage.setItem("playerName", name);
  localStorage.setItem("roomCode", code);

  socket.emit("joinRoom", { code, name }, (res) => {
    if (res?.error) {
      alert(res.error);
      return;
    }

    mySymbol = "O";
    myTurn = false;
    showWaiting();
  });
}

/*************************
 * GAME LOGIC
 *************************/
function createBoard() {
  boardDiv.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.onclick = () => handleMove(i);
    boardDiv.appendChild(cell);
  }
}

function handleMove(index) {
  if (!myTurn || gameOver || board[index] !== "") return;

  board[index] = mySymbol;
  updateUI();

  socket.emit("playerMove", {
    code: roomCode,
    index,
    symbol: mySymbol
  });

  if (checkWin(mySymbol)) return;

  myTurn = false;
  statusText.innerText = "Opponent's turn";
}

function updateUI() {
  document.querySelectorAll(".cell").forEach((cell, i) => {
    cell.innerText = board[i];
    cell.className = `cell ${board[i]}`;
  });
}

function resetBoard() {
  board = Array(9).fill("");
  gameOver = false;
  clearStrike();
  updateUI();

  myTurn = mySymbol === "X";
  statusText.innerText = myTurn ? "Your turn" : "Opponent's turn";
}

/*************************
 * WIN CHECK
 *************************/
function checkWin(player) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (let combo of wins) {
    if (combo.every(i => board[i] === player)) {
      gameOver = true;
      drawStrike(combo);

      if (player === "X") scoreX++;
      if (player === "O") scoreO++;

      updateScore();
      statusText.innerText = player === mySymbol ? "You won 🎉" : "You lost 😢";
      return true;
    }
  }

  if (!board.includes("")) {
    gameOver = true;
    statusText.innerText = "It's a draw!";
    return true;
  }

  return false;
}

/*************************
 * STRIKE LINE
 *************************/
function drawStrike(combo) {
  const strike = document.getElementById("strike");
  strike.classList.remove("hidden");

  if (combo.toString() === "0,1,2") strike.style.top = "25%";
  else if (combo.toString() === "3,4,5") strike.style.top = "50%";
  else if (combo.toString() === "6,7,8") strike.style.top = "75%";
  else if (combo.toString() === "0,3,6") strike.style.left = "25%";
  else if (combo.toString() === "1,4,7") strike.style.left = "50%";
  else if (combo.toString() === "2,5,8") strike.style.left = "75%";
}

function clearStrike() {
  const strike = document.getElementById("strike");
  strike.classList.add("hidden");
}

/*************************
 * CHAT
 *************************/
function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  socket.emit("chatMessage", {
    code: roomCode,
    text,
    sender: playerName
  });

  chatInput.value = "";
}

/*************************
 * UI HELPERS
 *************************/
function showWaiting() {
  document.getElementById("waiting").classList.remove("hidden");
  document.getElementById("game").classList.add("hidden");
  statusText.innerText = "Waiting for opponent...";
}

function updateScore() {
  document.getElementById("scoreX").innerText = scoreX;
  document.getElementById("scoreO").innerText = scoreO;
}

function requestRematch() {
  socket.emit("rematch", { code: roomCode });
}

