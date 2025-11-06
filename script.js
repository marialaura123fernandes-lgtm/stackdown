const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const gameArea = document.querySelector('.game-area');
const gameContainer = document.querySelector('.game-container'); 
const gamePlayerNameElement = document.getElementById('gamePlayerName');
const gameHighScoreNameElement = document.getElementById('gameHighScoreName');
const gameHighScoreElement = document.getElementById('gameHighScore');
const startScreen = document.getElementById('startScreen');
const startScreenNameInput = document.getElementById('startScreenNameInput');
const startScreenButton = document.getElementById('startScreenButton');
const startScreenHighScoreName = document.getElementById('startScreenHighScoreName');
const startScreenHighScore = document.getElementById('startScreenHighScore');
const instructionsModal = document.getElementById('instructionsModal');
const closeModalButton = document.getElementById('closeModalButton');
const pauseButton = document.getElementById('pauseButton');
const pauseOverlay = document.getElementById('pauseOverlay');
const resumeButton = document.getElementById('resumeButton');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const gameOverTitle = document.getElementById('gameOverTitle');
const gameOverPlayerName = document.getElementById('gameOverPlayerName');
const gameOverScore = document.getElementById('gameOverScore');
const gameOverHighScoreName = document.getElementById('gameOverHighScoreName');
const gameOverHighScore = document.getElementById('gameOverHighScore');
const gameOverButton = document.getElementById('gameOverButton');
const backgroundMusic = document.getElementById('backgroundMusic');
backgroundMusic.volume = 0.3;
const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsButton = document.getElementById('closeSettingsButton');
const volumeSlider = document.getElementById('volumeSlider');
const muteButton = document.getElementById('muteButton');

const HIGH_SCORE_KEY = 'meuTetrisHighScore';
const HIGH_SCORE_NAME_KEY = 'meuTetrisHighScoreName';
const LAST_PLAYER_NAME_KEY = 'meuTetrisLastPlayer';
const VOLUME_KEY = 'stackDownVolume';
const MUTE_KEY = 'stackDownMuted';
const COLS = 10;
const ROWS = 20;

// BLOCK_SIZE será definido dentro de startGame()
let BLOCK_SIZE; 

let isMatrixMode = false;

// Cores
const COLORS = [null, '#FF007F', '#00E5FF', '#FFD600', '#AD00FF', '#00FF9E', '#FF5733', '#FFFFFF'];
// Peças
const SHAPES = {'O1':{rotations:[[[1]]],colorIndex:1},'I2':{rotations:[[[2,2]],[[2],[2]]],colorIndex:2},'L3':{rotations:[[[3,0],[3,0],[3,3]],[[3,3,3],[3,0,0]],[[3,3],[0,3],[0,3]],[[0,0,3],[3,3,3]]],colorIndex:3},'T4':{rotations:[[[0,7,0],[7,7,7]],[[7,0],[7,7],[7,0]],[[7,7,7],[0,7,0]],[[0,7],[7,7],[0,7]]],colorIndex:7},'L5':{rotations:[[[5,0,0,0],[5,5,5,5]],[[5,5],[5,0],[5,0],[5,0]],[[5,5,5,5],[0,0,0,5]],[[0,5],[0,5],[0,5],[5,5]]],colorIndex:5},'I6':{rotations:[[[6,6,6,6,6,6]],[[6],[6],[6],[6],[6],[6]]],colorIndex:6}};
const PIECE_NAMES = Object.keys(SHAPES);

// --- Variáveis de Estado do Jogo ---
let grid;
let currentPiece;
let score;
let isGameOver;
let dropCounter;
let dropInterval;
let gameTimerInterval;
let startTime;
let lastTime = 0;

// Variáveis de Pausa
let isPaused = false;
let animationFrameId;

// Recorde e Jogador
let currentHighScore = 0;
let currentHighScoreName = 'Ninguém';
let currentPlayerName = '';

// ==================== CONFIGURAÇÕES DE ÁUDIO ====================

function loadSettings() {
    const savedVolume = localStorage.getItem(VOLUME_KEY);
    const savedMuted = localStorage.getItem(MUTE_KEY);

    if (savedVolume !== null) {
        backgroundMusic.volume = savedVolume;
        volumeSlider.value = savedVolume;
    } else {
        backgroundMusic.volume = 0.3;
        volumeSlider.value = 0.3;
    }
    backgroundMusic.volume = volumeSlider.value;

    if (savedMuted === 'true') {
        backgroundMusic.muted = true;
        muteButton.textContent = 'Ligar Som';
        muteButton.classList.add('muted');
    } else {
        backgroundMusic.muted = false;
        muteButton.textContent = 'Desligar Som';
        muteButton.classList.remove('muted');
    }
}

function saveSettings() {
    localStorage.setItem(VOLUME_KEY, backgroundMusic.volume);
    localStorage.setItem(MUTE_KEY, backgroundMusic.muted);
}

function handleVolumeChange() {
    backgroundMusic.volume = volumeSlider.value;
    if (backgroundMusic.volume > 0) {
        backgroundMusic.muted = false;
        muteButton.textContent = 'Desligar Som';
        muteButton.classList.remove('muted');
    }
}

function toggleMute() {
    backgroundMusic.muted = !backgroundMusic.muted;
    if (backgroundMusic.muted) {
        muteButton.textContent = 'Ligar Som';
        muteButton.classList.add('muted');
    } else {
        muteButton.textContent = 'Desligar Som';
        muteButton.classList.remove('muted');
    }
}

// ==================== RECORDES E GRID ====================

function loadHighScore() {
    currentHighScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
    currentHighScoreName = localStorage.getItem(HIGH_SCORE_NAME_KEY) || 'Ninguém';
    startScreenHighScore.textContent = currentHighScore;
    startScreenHighScoreName.textContent = currentHighScoreName;
    const lastPlayerName = localStorage.getItem(LAST_PLAYER_NAME_KEY) || '';
    startScreenNameInput.value = lastPlayerName;
}

function checkAndSaveHighScore() {
    const playerName = currentPlayerName;
    let newRecord = false;
    backgroundMusic.pause();

    if (score > currentHighScore) {
        currentHighScore = score;
        currentHighScoreName = playerName;
        localStorage.setItem(HIGH_SCORE_KEY, currentHighScore);
        localStorage.setItem(HIGH_SCORE_NAME_KEY, currentHighScoreName);
        newRecord = true;
    }

    gameOverPlayerName.textContent = playerName;
    gameOverScore.textContent = score;
    gameOverHighScoreName.textContent = currentHighScoreName;
    gameOverHighScore.textContent = currentHighScore;

    if (newRecord) {
        gameOverTitle.textContent = "Novo Recorde!";
        gameOverTitle.classList.add('new-record');
    } else {
        gameOverTitle.textContent = "Fim de Jogo!";
        gameOverTitle.classList.remove('new-record');
    }

    gameArea.classList.add('hidden');
    pauseButton.disabled = true;
    pauseButton.textContent = 'Pausar';
    gameOverOverlay.classList.remove('hidden');
}

function createGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

// ==================== MECÂNICA DO JOGO ====================

function spawnNewPiece() {
    const randomName = PIECE_NAMES[Math.floor(Math.random() * PIECE_NAMES.length)];
    const definition = SHAPES[randomName];
    const shape = definition.rotations[0];

    currentPiece = {
        name: randomName,
        definition: definition,
        rotationIndex: 0,
        shape: shape,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };

    if (checkCollision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        isGameOver = true;
        cancelAnimationFrame(animationFrameId);
        clearInterval(gameTimerInterval);
        checkAndSaveHighScore();
    }
}

function checkCollision(x, y, shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] !== 0) {
                let newX = x + col;
                let newY = y + row;
                if (newX < 0 || newX >= COLS || newY >= ROWS || (grid[newY] && grid[newY][newX] !== 0)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function lockPiece() {
    const { x, y, shape } = currentPiece;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] !== 0) {
                grid[y + row][x + col] = shape[row][col];
            }
        }
    }
}

function clearLines() {
    let linesCleared = 0;
    for (let row = ROWS - 1; row >= 0; row--) {
        if (grid[row].every(cell => cell !== 0)) {
            grid.splice(row, 1);
            grid.unshift(Array(COLS).fill(0));
            linesCleared++;
            row++;
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 100 * (linesCleared > 1 ? linesCleared : 1);
        scoreElement.textContent = score;
    }
}

function movePiece(dx, dy) {
    if (!checkCollision(currentPiece.x + dx, currentPiece.y + dy, currentPiece.shape)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        return true;
    }
    return false;
}

function rotatePiece() {
    const { definition } = currentPiece;
    let nextRotationIndex = (currentPiece.rotationIndex + 1) % definition.rotations.length;
    let nextShape = definition.rotations[nextRotationIndex];
    if (!checkCollision(currentPiece.x, currentPiece.y, nextShape)) {
        currentPiece.rotationIndex = nextRotationIndex;
        currentPiece.shape = nextShape;
    } else if (!checkCollision(currentPiece.x + 1, currentPiece.y, nextShape)) {
        currentPiece.x++;
        currentPiece.rotationIndex = nextRotationIndex;
        currentPiece.shape = nextShape;
    } else if (!checkCollision(currentPiece.x - 1, currentPiece.y, nextShape)) {
        currentPiece.x--;
        currentPiece.rotationIndex = nextRotationIndex;
        currentPiece.shape = nextShape;
    }
}

function drop() {
    if (!movePiece(0, 1)) {
        lockPiece();
        clearLines();
        spawnNewPiece();
    }
}

// ==================== DESENHO ====================

function draw() {
    if (isMatrixMode) {
        context.fillStyle = 'rgba(0, 0, 0, 0.1)';
        context.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);
    }
    drawGrid();
    if (currentPiece) drawPiece(currentPiece);
}

function drawGrid() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (grid[row][col] !== 0) {
                drawBlock(col, row, grid[row][col]);
            }
        }
    }
}

function drawPiece(piece) {
    const { x, y, shape } = piece;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] !== 0) {
                drawBlock(x + col, y + row, shape[row][col]);
            }
        }
    }
}

function drawBlock(x, y, colorIndex) {
    // BLOCK_SIZE é calculado em startGame(), por isso as funções de desenho funcionam
    if (isMatrixMode) {
        const chars = '01abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const char = chars[Math.floor(Math.random() * chars.length)];
        context.fillStyle = '#00FF00';
        context.font = `${BLOCK_SIZE}px monospace`;
        context.fillText(char, x * BLOCK_SIZE + 4, (y + 1) * BLOCK_SIZE - 4);
    } else {
        context.fillStyle = COLORS[colorIndex];
        context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }
}

// ==================== EFEITO DE PULSO (EASTER EGG) ====================

function triggerDropEffect() {
    if (!gameContainer) return; 
    gameContainer.classList.add('pulse-down');
    setTimeout(() => {
        gameContainer.classList.remove('pulse-down');
    }, 300);
}

// ==================== LOOP E CONTROLES ====================

function gameLoop(timestamp = 0) {
    if (isGameOver) return;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        drop();
        dropCounter = 0;
    }
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function updateTimer() {
    if (isGameOver || isPaused) return;
    const elapsedTime = Date.now() - startTime;
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ==================== INÍCIO DO JOGO ====================

function startGame() {
    // === MUDANÇA PRINCIPAL (CORRIGIDA) ===
    // O CSS define a altura do canvas como 75vh.
    // Vamos calcular o valor em pixels baseado na altura da janela (window.innerHeight).
    const vh = window.innerHeight / 100;
    const canvasHeight = 75 * vh; // 75vh

    // BLOCK_SIZE é definido aqui (sem let ou const para ser global)
    BLOCK_SIZE = canvasHeight / ROWS; 

    // Agora definimos o tamanho exato do canvas em pixels
    canvas.width = BLOCK_SIZE * COLS;
    canvas.height = canvasHeight; 
    // =========================

    currentPlayerName = startScreenNameInput.value.trim() || 'Anônimo';
    localStorage.setItem(LAST_PLAYER_NAME_KEY, currentPlayerName);
    gamePlayerNameElement.textContent = currentPlayerName;

    const lower = currentPlayerName.toLowerCase();
    isMatrixMode = ['matrix', 'neo', 'hacker'].includes(lower);

    if (isMatrixMode) {
        document.body.classList.add('matrix-mode');
    } else {
        document.body.classList.remove('matrix-mode');
    }

    startScreen.classList.add('hidden');
    gameArea.classList.remove('hidden');

    grid = createGrid();
    score = 0;
    scoreElement.textContent = score;
    isGameOver = false;
    dropCounter = 0;
    dropInterval = 1000;

    gameHighScoreElement.textContent = currentHighScore;
    gameHighScoreNameElement.textContent = currentHighScoreName;

    isPaused = false;
    pauseOverlay.classList.add('hidden');
    pauseButton.disabled = false;
    pauseButton.textContent = 'Pausar';

    timerElement.textContent = '00:00';
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    startTime = Date.now();
    gameTimerInterval = setInterval(updateTimer, 1000);

    lastTime = performance.now();
    spawnNewPiece();
    animationFrameId = requestAnimationFrame(gameLoop);
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();
}

// ==================== PAUSA ====================

function pauseGame() {
    if (isGameOver || isPaused) return;
    isPaused = true;
    cancelAnimationFrame(animationFrameId);
    clearInterval(gameTimerInterval);
    pauseOverlay.classList.remove('hidden');
    pauseButton.textContent = 'Continuar';
    backgroundMusic.pause();
}

function resumeGame() {
    if (isGameOver || !isPaused) return;
    isPaused = false;
    pauseOverlay.classList.add('hidden');
    pauseButton.textContent = 'Pausar';
    gameTimerInterval = setInterval(updateTimer, 1000);
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
    backgroundMusic.play();
}

// ==================== EVENTOS ====================

document.addEventListener('keydown', (e) => {
    if (isGameOver || !currentPiece || isPaused) return;
    switch (e.key) {
        case 'ArrowLeft': movePiece(-1, 0); break;
        case 'ArrowRight': movePiece(1, 0); break;
        case 'ArrowDown':
            drop();
            dropCounter = 0;
            triggerDropEffect(); 
            break;
        case 'ArrowUp': rotatePiece(); break;
        case ' ':
            e.preventDefault();
            while (movePiece(0, 1)) {}
            lockPiece();
            clearLines();
            spawnNewPiece();
            triggerDropEffect(); 
            break;
    }
    draw();
});

document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'p' && !gameArea.classList.contains('hidden') && instructionsModal.classList.contains('hidden')) {
        if (isPaused) resumeGame(); else pauseGame();
    }
});

// ==================== NOVO: GATILHO DO MODO MATRIX POR TECLA ====================
document.addEventListener('keydown', (e) => {
    // Impede a ativação se estiver digitando o nome no input
    if (e.target === startScreenNameInput) {
        return;
    }

    const key = e.key.toLowerCase();

    // Verifica as teclas N, H, ou Shift
    if (key === 'n' || key === 'h' || e.key === 'Shift') {
        // Inverte o estado atual do Modo Matrix
        isMatrixMode = !isMatrixMode;

        // Aplica ou remove a classe CSS do body
        if (isMatrixMode) {
            document.body.classList.add('matrix-mode');
        } else {
            document.body.classList.remove('matrix-mode');
        }

        // Se o jogo estiver rodando (não pausado, nem game over),
        // força um redesenho imediato para aplicar o efeito.
        if (!gameArea.classList.contains('hidden') && !isGameOver && !isPaused) {
            draw();
        }
    }
});

// ==================== MODAIS E BOTÕES ====================

function closeModal() {
    instructionsModal.classList.add('hidden');
    startScreen.classList.remove('hidden'); 
}

closeModalButton.addEventListener('click', closeModal);
instructionsModal.addEventListener('click', (e) => {
    if (e.target === instructionsModal) closeModal();
});

startScreenButton.addEventListener('click', startGame);
gameOverButton.addEventListener('click', () => {
    gameOverOverlay.classList.add('hidden');
    startScreen.classList.remove('hidden');
    loadHighScore();
    document.body.classList.remove('matrix-mode'); 
});

pauseButton.addEventListener('click', () => {
    if (isPaused) resumeGame(); else pauseGame();
});

resumeButton.addEventListener('click', resumeGame);

settingsButton.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
});

closeSettingsButton.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
    saveSettings();
});

volumeSlider.addEventListener('input', handleVolumeChange);
muteButton.addEventListener('click', toggleMute);

// ==================== INICIALIZAÇÃO ====================
loadSettings();
loadHighScore();
