/***********************
 * GLOBAL STATE
 ***********************/
let board = Array(9).fill("");
let userTurn = true;
let gameOver = false;

const mode = localStorage.getItem("mode");         // "computer" or "friend"
const difficulty = localStorage.getItem("difficulty"); // easy / medium / hard

const boardDiv = document.getElementById("board");
const resultModal = document.getElementById("resultModal");
const resultText = document.getElementById("resultText");

/***********************
 * INIT
 ***********************/
createBoard();

/***********************
 * BOARD CREATION / RESET
 ***********************/
function createBoard() {
  // reset game state
  board = Array(9).fill("");
  userTurn = true;
  gameOver = false;

  // hide modal safely
  if (resultModal) resultModal.classList.add("hidden");

  // clear board UI
  boardDiv.innerHTML = "";

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.onclick = () => userMove(i);
    boardDiv.appendChild(cell);
  }
}

/***********************
 * USER MOVE
 ***********************/
function userMove(index) {
  if (gameOver) return;
  if (!userTurn) return;
  if (board[index] !== "") return;

  board[index] = "X";
  updateUI();

  if (checkWin("X")) return;

  userTurn = false;

  if (mode === "computer") {
    setTimeout(computerMove, 500);
  }
}

/***********************
 * COMPUTER MOVE
 ***********************/
function computerMove() {
  if (gameOver) return;

  let emptyCells = board
    .map((v, i) => (v === "" ? i : null))
    .filter(v => v !== null);

  if (emptyCells.length === 0) return;

  let move;

  if (difficulty === "easy") {
    move = randomMove(emptyCells);
  } else if (difficulty === "medium") {
    move = smartOrRandom(emptyCells);
  } else {
    move = bestMove(); // hard
  }

  board[move] = "O";
  updateUI();

  if (!checkWin("O")) {
    userTurn = true;
  }
}

/***********************
 * AI HELPERS
 ***********************/
function randomMove(empty) {
  return empty[Math.floor(Math.random() * empty.length)];
}

function smartOrRandom(empty) {
  // 50% smart, 50% random
  return Math.random() < 0.5 ? randomMove(empty) : bestMove();
}

function bestMove() {
  // simple unbeatable logic (not full minimax, but strong)
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  // try to win
  for (let pattern of winPatterns) {
    const [a,b,c] = pattern;
    const line = [board[a], board[b], board[c]];
    if (line.filter(v => v === "O").length === 2 && line.includes("")) {
      return pattern[line.indexOf("")];
    }
  }

  // try to block user
  for (let pattern of winPatterns) {
    const [a,b,c] = pattern;
    const line = [board[a], board[b], board[c]];
    if (line.filter(v => v === "X").length === 2 && line.includes("")) {
      return pattern[line.indexOf("")];
    }
  }

  // center
  if (board[4] === "") return 4;

  // corners
  const corners = [0,2,6,8].filter(i => board[i] === "");
  if (corners.length > 0) return randomMove(corners);

  // fallback
  return randomMove(board.map((v,i)=>v===""?i:null).filter(v=>v!==null));
}

/***********************
 * UI UPDATE
 ***********************/
function updateUI() {
  document.querySelectorAll(".cell").forEach((cell, i) => {
    cell.innerText = board[i];
    cell.className = "cell " + board[i];
  });
}

/***********************
 * WIN CHECK
 ***********************/
function checkWin(player) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (let combo of wins) {
    if (combo.every(i => board[i] === player)) {
      showWinner(player);
      return true;
    }
  }

  if (!board.includes("")) {
    showWinner("DRAW");
    return true;
  }

  return false;
}

/***********************
 * RESULT MODAL
 ***********************/
function showWinner(player) {
  gameOver = true;

  if (player === "DRAW") {
    resultText.innerText = "IT'S A DRAW!";
  } else {
    resultText.innerText = player + " WON 🎉";
  }

  resultModal.classList.remove("hidden");
}

function restartGame() {
  createBoard();
}

function exitGame() {
  location.href = "start.html";
}

/***********************
 * THEME TOGGLE
 ***********************/
function toggleTheme() {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
}
