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
let isExplicitlyLeaving = false; // Track karega ki user ne khud game chhoda hai ya nahi

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

function showTemporaryBanner(message, duration = 3000) {
  let banner = document.getElementById('tempLeftBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'tempLeftBanner';
    banner.style.position = 'fixed';
    banner.style.top = '15px';
    banner.style.left = '50%';
    banner.style.transform = 'translateX(-50%)';
    banner.style.backgroundColor = '#c0392b';
    banner.style.color = '#fff';
    banner.style.padding = '8px 16px';
    banner.style.borderRadius = '20px';
    banner.style.fontSize = '0.9rem';
    banner.style.fontWeight = 'bold';
    banner.style.zIndex = '99999';
    banner.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
    document.body.appendChild(banner);
  }
  banner.textContent = message;
  banner.style.display = 'block';

  setTimeout(() => {
    banner.style.display = 'none';
  }, duration);
}

function goBack() {
  isExplicitlyLeaving = true;
  if (pvpTimer) clearTimeout(pvpTimer);
  if (conn) { 
    conn.close(); 
    conn = null; 
  }
  showTemporaryBanner("You left the match", 3000);
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

function showGameAlert(title, message, btnText = "OK") {
  const modal = document.getElementById('waitingModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalCodeDisplay = document.getElementById('modalCodeDisplay');

  modalTitle.textContent = title;
  modalTitle.style.color = "#c0392b";
  modalCodeDisplay.style.fontSize = "1.2rem";
  modalCodeDisplay.style.color = "#52473b";
  modalCodeDisplay.textContent = message;

  const btn = modal.querySelector('button');
  if (btn) {
    btn.textContent = btnText;
    btn.onclick = () => {
      closeModal('waitingModal');
      showScreen('menuScreen');
    };
  }

  openModal('waitingModal');
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
  localSymbol = "O";
  isExplicitlyLeaving = false;
  document.getElementById('p1Name').textContent = "PLAYER 1";
  document.getElementById('p2Name').textContent = "PLAYER 2";
  showScreen('gameScreen');
  resetEntireMatch();
}

function startAIMode(diff) {
  currentMode = 'ai';
  aiDifficulty = diff;
  localSymbol = "O";
  isExplicitlyLeaving = false;
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
      makeMove(index, localSymbol);
      if (conn && conn.open) {
        conn.send({ type: 'move', index: index, symbol: localSymbol });
      }
    } else {
      makeMove(index, currentPlayer);
      if (currentMode === 'ai' && isGameActive && currentPlayer === "X") {
        setTimeout(triggerAIMove, 400);
      }
    }
  });
});

function makeMove(index, symbol) {
  if (boardState[index] !== "" || !isGameActive) return;

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
      const matchWinnerSymbol = scoreP1 === 2 ? "O" : "X";
      let matchWinnerName = "PLAYER 1";
      
      if (currentMode === 'online') {
        const p1Raw = document.getElementById('p1Name').getAttribute('data-realname') || "PLAYER 1";
        const p2Raw = document.getElementById('p2Name').getAttribute('data-realname') || "PLAYER 2";
        const p1Sym = document.getElementById('p1Name').textContent.includes('[X]') ? 'X' : 'O';
        matchWinnerName = (p1Sym === matchWinnerSymbol) ? p1Raw : p2Raw;
      } else if (currentMode === 'ai') {
        matchWinnerName = matchWinnerSymbol === "O" ? "YOU" : document.getElementById('p2Name').textContent;
      } else {
        matchWinnerName = matchWinnerSymbol === "O" ? "PLAYER 1" : "PLAYER 2";
      }

      setTimeout(() => showMatchWinner(matchWinnerName, matchWinnerSymbol), 400);
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

  const roundBanner = document.getElementById('roundBanner');
  if (currentMode === 'online') {
    if (currentPlayer === localSymbol) {
      roundBanner.textContent = `YOUR TURN (${localSymbol})`;
      roundBanner.style.color = "#2b8067";
    } else {
      roundBanner.textContent = `OPPONENT'S TURN (${localSymbol === 'O' ? 'X' : 'O'})`;
      roundBanner.style.color = "#c0392b";
    }
  } else {
    const p1NameText = document.getElementById('p1Name').textContent;
    const p2NameText = document.getElementById('p2Name').textContent;
    roundBanner.textContent = currentPlayer === "O" ? `${p1NameText.split(' [')[0]}'S TURN (O)` : `${p2NameText.split(' [')[0]}'S TURN (X)`;
    roundBanner.style.color = "#c0392b";
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
  updateTurnUI();
  if (bannerMsg) {
    document.getElementById('roundBanner').textContent = bannerMsg;
  }
}

function resetEntireMatch() {
  scoreP1 = 0;
  scoreP2 = 0;
  currentRound = 1;
  updateScoreboard();
  resetRound();
}

function showMatchWinner(winnerName, winnerSymbol) {
  const titleEl = document.getElementById('winnerTitle');
  const subtextEl = document.getElementById('winnerSubtext');

  let isWinner = false;

  if (currentMode === 'online') {
    if (winnerSymbol === localSymbol) {
      isWinner = true;
      titleEl.textContent = "CONGRATULATIONS!";
      subtextEl.textContent = "🎉 YOU WIN THE MATCH!";
    } else {
      titleEl.textContent = "YOU LOSE!";
      subtextEl.textContent = "😢 Better luck next time!";
    }
  } else if (currentMode === 'ai') {
    if (winnerSymbol === "O") {
      isWinner = true;
      titleEl.textContent = "CONGRATULATIONS!";
      subtextEl.textContent = "🎉 YOU WIN THE MATCH!";
    } else {
      titleEl.textContent = "YOU LOSE!";
      subtextEl.textContent = "😢 Better luck next time!";
    }
  } else {
    isWinner = true;
    titleEl.textContent = "MATCH WINNER!";
    subtextEl.textContent = `🎉 ${winnerName} HAS WON THE MATCH!`;
  }

  if (isWinner && typeof confetti === 'function') {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }

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

function generateCustomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'ttt-';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function initPeer(customId, cb) {
  if (peer && !peer.destroyed) {
    peer.destroy();
  }

  peer = new Peer(customId);

  peer.on('open', id => cb(id));
  peer.on('connection', c => {
    conn = c;
    setupConn(true);
  });
  
  peer.on('error', err => {
    closeModal('waitingModal');
    if (err.type === 'peer-unavailable') {
      showGameAlert("CODE GALAT HAI", "Kripya Room Code sahi se check karke enter karein.");
    } else {
      showGameAlert("CONNECTION LOST", "Server ya network connection Lost ho gaya hai.");
    }
  });
}

function createCustomRoom() {
  currentMode = 'online';
  isExplicitlyLeaving = false;
  
  const modalTitle = document.getElementById('modalTitle');
  modalTitle.textContent = "ROOM CREATED!";
  modalTitle.style.color = "#2b8067";
  
  const modalCodeDisplay = document.getElementById('modalCodeDisplay');
  modalCodeDisplay.style.fontSize = "2.5rem";
  modalCodeDisplay.style.color = "#c0392b";
  modalCodeDisplay.textContent = "LOADING...";
  
  const btn = document.getElementById('waitingModal').querySelector('button');
  if (btn) {
    btn.textContent = "CANCEL";
    btn.onclick = () => closeModal('waitingModal');
  }

  openModal('waitingModal');

  const customId = generateCustomCode();

  initPeer(customId, id => {
    const displayCode = id.replace('ttt-', '').toUpperCase();
    document.getElementById('modalCodeDisplay').textContent = displayCode;
  });
}

function joinCustomRoom() {
  const codeInput = document.getElementById('roomCodeInput');
  let rawCode = codeInput ? codeInput.value.trim() : "";
  
  if (!rawCode) {
    return showGameAlert("CODE MISSING", "Kripya Room Code enter karein!");
  }

  rawCode = rawCode.replace(/^ttt-/i, '').toUpperCase();
  rawCode = 'ttt-' + rawCode;

  currentMode = 'online';
  isExplicitlyLeaving = false;

  const modalTitle = document.getElementById('modalTitle');
  modalTitle.textContent = "JOINING ROOM...";
  modalTitle.style.color = "#2b8067";

  const modalCodeDisplay = document.getElementById('modalCodeDisplay');
  modalCodeDisplay.style.fontSize = "2.5rem";
  modalCodeDisplay.style.color = "#c0392b";
  modalCodeDisplay.textContent = rawCode.replace('ttt-', '').toUpperCase();

  const btn = document.getElementById('waitingModal').querySelector('button');
  if (btn) {
    btn.textContent = "CANCEL";
    btn.onclick = () => closeModal('waitingModal');
  }

  openModal('waitingModal');

  initPeer(null, () => {
    conn = peer.connect(rawCode);
    setupConn(false);
  });
}

function setupConn(isHost) {
  conn.on('open', () => {
    closeModal('waitingModal');
    showScreen('gameScreen');

    if (isHost) {
      localSymbol = Math.random() < 0.5 ? "O" : "X";
      const joinerSymbol = localSymbol === "O" ? "X" : "O";

      conn.send({ 
        type: 'init', 
        name: getUserName(), 
        hostSymbol: localSymbol, 
        joinerSymbol: joinerSymbol 
      });

      setupPlayerUI(getUserName(), localSymbol, "PLAYER 2", joinerSymbol);
      resetEntireMatch();
    } else {
      conn.send({ type: 'joiner_name', name: getUserName() });
    }
  });

  conn.on('data', data => {
    if (data.type === 'init') {
      localSymbol = data.joinerSymbol;
      setupPlayerUI(data.name, data.hostSymbol, getUserName(), data.joinerSymbol);
      resetEntireMatch();
    } else if (data.type === 'joiner_name') {
      const joinerSymbol = localSymbol === "O" ? "X" : "O";
      setupPlayerUI(getUserName(), localSymbol, data.name, joinerSymbol);
    } else if (data.type === 'move') {
      makeMove(data.index, data.symbol);
    }
  });

  conn.on('close', () => {
    // Agar user ne khud game nahi chhoda, tabhi doosre player ko winner banayenge
    if (isGameActive && !isExplicitlyLeaving) {
      isGameActive = false;
      const myName = getUserName();
      showMatchWinner(myName, localSymbol);
    }
  });
}

function setupPlayerUI(p1Name, p1Sym, p2Name, p2Sym) {
  const p1El = document.getElementById('p1Name');
  const p2El = document.getElementById('p2Name');

  p1El.setAttribute('data-realname', p1Name);
  p2El.setAttribute('data-realname', p2Name);

  p1El.textContent = `${p1Name} [${p1Sym}]`;
  p2El.textContent = `${p2Name} [${p2Sym}]`;
}
