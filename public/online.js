const socket = io();

/* -----------------------------
   STATE
----------------------------- */
let board = Array(9).fill("");
let mySymbol = localStorage.getItem("symbol");
let roomCode = localStorage.getItem("roomCode");
let currentTurn = "X";
let gameOver = false;

let score = { X: 0, O: 0 };

/* -----------------------------
   ELEMENTS
----------------------------- */
const cells = document.querySelectorAll(".cell");
const turnText = document.getElementById("turnText");
const playerX = document.getElementById("playerX");
const playerO = document.getElementById("playerO");

const scoreX = document.getElementById("scoreX");
const scoreO = document.getElementById("scoreO");

const modal = document.getElementById("resultModal");
const resultText = document.getElementById("resultText");

/* -----------------------------
   SOUNDS
----------------------------- */
const clickSound = new Audio("sounds/click.mp3");
const winSound = new Audio("sounds/win.mp3");

/* -----------------------------
   INIT
----------------------------- */
cells.forEach((cell, index) => {
  cell.addEventListener("click", () => {
    if (gameOver) return;
    if (currentTurn !== mySymbol) return;
    if (board[index] !== "") return;

    socket.emit("playerMove", { code: roomCode, index });
  });
});

/* -----------------------------
   SOCKET EVENTS
----------------------------- */

socket.on("startOnlineGame", () => {
  console.log("GAME STARTED");
});

socket.on("startOnlineGame", ({ names, turn }) => {
  playerX.innerText = names.X;
  playerO.innerText = names.O;
  document.getElementById("waiting").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  currentTurn = turn;
  updateTurn(turn);
});

socket.on("updateBoard", ({ board: newBoard, turn }) => {
  board = newBoard;
  currentTurn = turn;

  updateUI();
  updateTurn(turn);
});

socket.on("gameOver", ({ board: newBoard, winner, combo }) => {
  board = newBoard;
  gameOver = true;

  updateUI();

  if (combo && combo.length) {
    drawStrike(combo);
  }

  if (winner !== "DRAW") {
    winSound.play();
    score[winner]++;
    document.getElementById("score" + winner).innerText = score[winner];
    resultText.innerText = `${winner} WON 🎉`;
  } else {
    resultText.innerText = "IT'S A DRAW!";
  }

  modal.classList.remove("hidden");
});

socket.on("rematchStarted", ({ board: newBoard, turn }) => {
  board = newBoard;
  currentTurn = turn;
  gameOver = false;

  clearStrike();
  updateUI();
  updateTurn(turn);

  modal.classList.add("hidden");
});

/* -----------------------------
   UI FUNCTIONS
----------------------------- */
function updateUI() {
  cells.forEach((cell, i) => {
    cell.innerText = board[i];
  });
}

function updateTurn(turn) {
  playerX.classList.remove("active");
  playerO.classList.remove("active");

  if (turn === mySymbol) {
    turnText.innerText = "Your Turn";
  } else {
    turnText.innerText = "Opponent Turn";
  }

  document.getElementById("player" + turn).classList.add("active");
}

/* -----------------------------
   STRIKE LINE
----------------------------- */
function drawStrike(combo) {
  const strike = document.createElement("div");
  strike.id = "strike";
  strike.className = "strike";

  const maps = {
    "0,1,2": "row1",
    "3,4,5": "row2",
    "6,7,8": "row3",
    "0,3,6": "col1",
    "1,4,7": "col2",
    "2,5,8": "col3",
    "0,4,8": "diag1",
    "2,4,6": "diag2"
  };

  strike.classList.add(maps[combo.join(",")]);
  document.querySelector(".board").appendChild(strike);
}

function clearStrike() {
  const strike = document.getElementById("strike");
  if (strike) strike.remove();
}

/* -----------------------------
   BUTTON ACTIONS
----------------------------- */
function playAgain() {
  socket.emit("rematch", roomCode);
}

function exitGame() {
  location.href = "friend.html";
}

/* -----------------------------
   EXPOSE FUNCTIONS
----------------------------- */
window.playAgain = playAgain;
window.exitGame = exitGame;

function sendMessage() {
  const input = document.getElementById("chatInput");
  if (!input.value.trim()) return;

  socket.emit("chatMessage", {
  code: roomCode,
  text: input.value,
  sender: playerName
  });

  input.value = "";
}

socket.on("chatMessage", (data) => {
  io.to(data.code).emit("chatMessage", data);
});

socket.on("chatMessage", (msg) => {
  const div = document.createElement("div");
  div.innerHTML = `<strong>${msg.sender}:</strong> ${msg.text}`;
  document.getElementById("messages").appendChild(div);
});

