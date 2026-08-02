let currentMode = 'local';
let aiDifficulty = 'easy';
let boardState = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "O";
let isGameActive = true;

let scoreP1 = 0;
let scoreP2 = 0;
let currentRound = 1;

let peer = null;
let conn = null;
let localSymbol = "O";
let pvpTimer = null;

const winConditions = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const activeScreen = document.getElementById(screenId);
  activeScreen.classList.add('active');
  document.getElementById('backBtn').style.visibility = (screenId === 'menuScreen') ? 'hidden' : 'visible';
}

function goBack() {
  if (pvpTimer) clearTimeout(pvpTimer);
  if (conn) { conn.close(); conn = null; }
  showScreen('menuScreen');
}

function openAIScreen() { showScreen('aiScreen'); }
function openSandboxScreen() { showScreen('sandboxScreen'); }

function openModal(id) {
  const modal = document.getElementById(id);
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
}

function closeModal(id) {
  const modal = document.getElementById(id);
  modal.classList.remove('active');
  setTimeout(() => modal.style.display = 'none', 250);
}

function redirectToGame(url) {
  window.open(url, '_blank');
}

function getUserName() {
  const input = document.getElementById('usernameInput');
  return (input && input.value.trim()) ? input.value.trim() : "PLAYER 1";
}

function startPassAndPlay() {
  currentMode = 'local';
  document.getElementById('p1Name').textContent = "PLAYER 1";
  document.getElementById('p2Name').textContent = "PLAYER 2";
  showScreen('gameScreen');
  resetEntireMatch();
}

function startAIMode(diff) {
  currentMode = 'ai';
  aiDifficulty = diff;
  document.getElementById('p1Name').textContent = "YOU";
  document.getElementById('p2Name').textContent = `AI (${diff.toUpperCase()})`;
  showScreen('gameScreen');
  resetEntireMatch();
}

const cells = document.querySelectorAll('.cell');
cells.forEach(cell => {
  cell.addEventListener('click', () => {
    const index = cell.getAttribute('data-index');
    if (boardState[index] !== "" || !isGameActive) return;

    if (currentMode === 'online') {
      if (currentPlayer !== localSymbol) return;
      makeMove(index, currentPlayer);
      if (conn && conn.open) conn.send({ type: 'move', index: index, symbol: currentPlayer });
    } else {
      makeMove(index, currentPlayer);
      if (currentMode === 'ai' && isGameActive && currentPlayer === "X") {
        setTimeout(triggerAIMove, 400);
      }
    }
  });
});

function makeMove(index, symbol) {
  if (boardState[index] !== "") return;

  boardState[index] = symbol;
  const cell = cells[index];
  cell.textContent = symbol;
  cell.classList.add(symbol === "O" ? "cell-o" : "cell-x");

  if (checkWin()) {
    isGameActive = false;
    if (symbol === "O") scoreP1++;
    else scoreP2++;

    updateScoreboard();

    if (scoreP1 === 2 || scoreP2 === 2) {
      const matchWinner = scoreP1 === 2 ? document.getElementById('p1Name').textContent : document.getElementById('p2Name').textContent;
      setTimeout(() => showMatchWinner(matchWinner), 400);
    } else {
      currentRound++;
      setTimeout(() => resetRound(`ROUND ${currentRound}`), 1000);
    }
    return;
  }

  if (!boardState.includes("")) {
    isGameActive = false;
    setTimeout(() => resetRound(`DRAW! REPLAYING ROUND ${currentRound}`), 1000);
    return;
  }

  currentPlayer = currentPlayer === "O" ? "X" : "O";
  updateTurnUI();
}

function updateTurnUI() {
  const p1Box = document.getElementById('p1Box');
  const p2Box = document.getElementById('p2Box');
  if (currentPlayer === "O") {
    p1Box.classList.add('active');
    p2Box.classList.remove('active');
  } else {
    p2Box.classList.add('active');
    p1Box.classList.remove('active');
  }
}

function updateScoreboard() {
  document.getElementById('p1Score').textContent = scoreP1;
  document.getElementById('p2Score').textContent = scoreP2;
}

function resetRound(bannerMsg) {
  boardState = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "O";
  isGameActive = true;
  cells.forEach(cell => {
    cell.textContent = "";
    cell.classList.remove('cell-o', 'cell-x');
  });
  document.getElementById('roundBanner').textContent = bannerMsg || `BEST OF 3 - ROUND ${currentRound}`;
  updateTurnUI();
}

function resetEntireMatch() {
  scoreP1 = 0;
  scoreP2 = 0;
  currentRound = 1;
  updateScoreboard();
  resetRound(`BEST OF 3 - ROUND 1`);
}

function showMatchWinner(winnerName) {
  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  document.getElementById('winnerTitle').textContent = "MATCH WINNER!";
  document.getElementById('winnerSubtext').textContent = `🎉 ${winnerName} HAS WON THE MATCH!`;
  openModal('winnerModal');
}

function closeWinnerModal() {
  closeModal('winnerModal');
  resetEntireMatch();
}

function checkWin() {
  return winConditions.some(condition => {
    const [a, b, c] = condition;
    return boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c];
  });
}

function triggerAIMove() {
  let moveIndex;
  const emptyMoves = boardState.map((v, i) => v === "" ? i : null).filter(v => v !== null);
  if (emptyMoves.length === 0) return;

  if (aiDifficulty === 'easy') {
    moveIndex = emptyMoves[Math.floor(Math.random() * emptyMoves.length)];
  } else if (aiDifficulty === 'medium') {
    moveIndex = Math.random() > 0.5 ? getBestMoveMinimax() : emptyMoves[Math.floor(Math.random() * emptyMoves.length)];
  } else if (aiDifficulty === 'hard') {
    moveIndex = findWinOrBlock() ?? emptyMoves[Math.floor(Math.random() * emptyMoves.length)];
  } else if (aiDifficulty === 'extreme') {
    moveIndex = getBestMoveMinimax();
  }

  makeMove(moveIndex, "X");
}

function findWinOrBlock() {
  for (let sym of ["X", "O"]) {
    for (let cond of winConditions) {
      const [a, b, c] = cond;
      const vals = [boardState[a], boardState[b], boardState[c]];
      if (vals.filter(v => v === sym).length === 2 && vals.includes("")) {
        return cond[vals.indexOf("")];
      }
    }
  }
  return null;
}

function getBestMoveMinimax() {
  let bestScore = -Infinity;
  let bestMove;
  for (let i = 0; i < 9; i++) {
    if (boardState[i] === "") {
      boardState[i] = "X";
      let score = minimax(boardState, 0, false);
      boardState[i] = "";
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

function minimax(board, depth, isMax) {
  if (checkWinState(board, "X")) return 10 - depth;
  if (checkWinState(board, "O")) return depth - 10;
  if (!board.includes("")) return 0;

  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === "") {
        board[i] = "X";
        best = Math.max(best, minimax(board, depth + 1, false));
        board[i] = "";
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === "") {
        board[i] = "O";
        best = Math.min(best, minimax(board, depth + 1, true));
        board[i] = "";
      }
    }
    return best;
  }
}

function checkWinState(board, sym) {
  return winConditions.some(c => board[c[0]] === sym && board[c[1]] === sym && board[c[2]] === sym);
}

function startOnlinePVP() {
  showScreen('pvpScreen');
  const spinner = document.getElementById('pvpStatusSpinner');
  const title = document.getElementById('pvpStatusText');
  const detail = document.getElementById('pvpStatusDetail');

  spinner.style.display = 'block';
  title.textContent = "SEARCHING MATCH...";
  title.style.color = "#2b8067";
  detail.textContent = "Connecting to online matchmaking servers";

  if (pvpTimer) clearTimeout(pvpTimer);

  pvpTimer = setTimeout(() => {
    spinner.style.display = 'none';
    title.textContent = "SERVER UNREACHABLE";
    title.style.color = "#c0392b";
    detail.textContent = "Please try again later";
  }, 10000);
}

function cancelPVP() {
  if (pvpTimer) clearTimeout(pvpTimer);
  showScreen('menuScreen');
}

function initPeer(cb) {
  if (peer && !peer.destroyed) {
    if (peer.id) cb(peer.id);
    else peer.once('open', id => cb(id));
    return;
  }

  peer = new Peer();
  peer.on('open', id => cb(id));
  peer.on('connection', c => {
    conn = c;
    setupConn(false);
  });
  peer.on('error', err => {
    closeModal('waitingModal');
    alert("Connection Error: Room Code sahi se check karein!");
  });
}

function createCustomRoom() {
  currentMode = 'online';
  document.getElementById('modalTitle').textContent = "ROOM CREATED!";
  document.getElementById('modalCodeDisplay').textContent = "LOADING...";
  openModal('waitingModal');

  initPeer(id => {
    const code = id.substring(0, 5).toUpperCase();
    document.getElementById('modalCodeDisplay').textContent = code;
  });
}

function joinCustomRoom() {
  const codeInput = document.getElementById('roomCodeInput');
  const code = codeInput ? codeInput.value.trim().toLowerCase() : "";
  if (!code) return alert("Kripya Room Code enter karein!");

  currentMode = 'online';
  document.getElementById('modalTitle').textContent = "JOINING ROOM...";
  document.getElementById('modalCodeDisplay').textContent = "";
  openModal('waitingModal');

  initPeer(() => {
    conn = peer.connect(code);
    setupConn(true);
  });
}

function setupConn(isHost) {
  conn.on('open', () => {
    closeModal('waitingModal');
    showScreen('gameScreen');
    localSymbol = isHost ? "X" : "O";
    conn.send({ type: 'name', name: getUserName() });
  });

  conn.on('data', data => {
    if (data.type === 'name') {
      if (isHost) {
        document.getElementById('p1Name').textContent = getUserName();
        document.getElementById('p2Name').textContent = data.name;
      } else {
        document.getElementById('p1Name').textContent = data.name;
        document.getElementById('p2Name').textContent = getUserName();
      }
      resetEntireMatch();
    } else if (data.type === 'move') {
      makeMove(data.index, data.symbol);
    }
  });

  conn.on('close', () => {
    alert("Opponent disconnected!");
    showScreen('menuScreen');
  });
}
