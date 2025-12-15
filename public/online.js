const socket = io();

const boardDiv = document.getElementById("board");
const turnText = document.getElementById("turnText");

const roomCode = localStorage.getItem("roomCode");
const mySymbol = localStorage.getItem("symbol");

let board = Array(9).fill("");
let currentTurn = "X";

createBoard();

function createBoard() {
  boardDiv.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.onclick = () => makeMove(i);
    boardDiv.appendChild(cell);
  }
}

function makeMove(index) {
  if (currentTurn !== mySymbol) return;
  socket.emit("playerMove", { code: roomCode, index });
}

socket.on("updateBoard", ({ board: newBoard, turn }) => {
  board = newBoard;
  currentTurn = turn;
  updateUI();
  turnText.innerText = "Turn: " + turn;
});

function updateUI() {
  document.querySelectorAll(".cell").forEach((cell, i) => {
    cell.innerText = board[i];
    cell.className = "cell " + board[i];
  });
}
