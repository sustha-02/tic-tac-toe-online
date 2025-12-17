/***********************
 * GLOBAL STATE
 ***********************/
const clickSound = new Audio("sounds/click.mp3");
const winSound = new Audio("sounds/win.mp3");
const drawSound = new Audio("sounds/draw.mp3");

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
  board = Array(9).fill("");
  userTurn = true;
  gameOver = false;

  // ✅ HIDE STRIKE HERE
  const strike = document.getElementById("strike");
  if (strike) {
    strike.classList.add("hidden");
    strike.style.transform = "translate(-50%, -50%) scaleX(0)";
  }

  if (resultModal) resultModal.classList.add("hidden");

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
  clickSound.currentTime = 0;
  clickSound.play();

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
    { combo: [0,1,2], angle: 0, top: "25%" },
    { combo: [3,4,5], angle: 0, top: "50%" },
    { combo: [6,7,8], angle: 0, top: "75%" },

    { combo: [0,3,6], angle: 90, left: "25%" },
    { combo: [1,4,7], angle: 90, left: "50%" },
    { combo: [2,5,8], angle: 90, left: "75%" },

    { combo: [0,4,8], angle: 45 },
    { combo: [2,4,6], angle: -45 }
  ];

  for (let win of wins) {
    if (win.combo.every(i => board[i] === player)) {
      showStrike(win);
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
    drawSound.play();
  } else {
    resultText.innerText = player + " WON 🎉";
    winSound.play();
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

/***********************
 * ANIMATION STRIKE
 ***********************/

function showStrike(win) {
  const strike = document.getElementById("strike");

  strike.classList.remove("hidden");

  // reset animation first
  strike.style.transition = "none";
  strike.style.transform = "translate(-50%, -50%) scaleX(0)";

  if (win.top) strike.style.top = win.top;
  if (win.left) strike.style.left = win.left;

  // allow animation
  setTimeout(() => {
    strike.style.transition = "transform 0.4s ease";
    strike.style.transform =
      `translate(-50%, -50%) rotate(${win.angle || 0}deg) scaleX(1)`;
  }, 50);
}


function clearStrike() {
  const strike = document.getElementById("strike");
  if (strike) strike.remove();
}
