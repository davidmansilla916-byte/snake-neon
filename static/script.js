const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const restartBtn = document.getElementById('restart-btn');
const bgMusic = document.getElementById('bg-music');
const muteBtn = document.getElementById('mute-btn');
const muteIcon = document.getElementById('mute-icon');
const leaderboardList = document.getElementById('leaderboard-list');
const nameModal = document.getElementById('name-modal');
const playerNameInput = document.getElementById('player-name-input');
const submitScoreBtn = document.getElementById('submit-score-btn');

// Game settings
const gridSize = 20;
const tileCount = canvas.width / gridSize;
let speed = 100; // ms
let gameInterval;
let isGameRunning = false;
let isGameOver = false;
let isMuted = false;

// Theme Colors (Match CSS)
const THEME = {
    bg: '#0a0a14',
    snakeHead: '#00ffcc',
    snakeBody: '#00ccaa',
    food: '#ff00ff',
    shadowHead: '#00ffcc',
    shadowFood: '#ff00ff'
};

// Game State
let snake = [];
let food = { x: 10, y: 10 };
let velocity = { x: 0, y: 0 };
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;

highScoreElement.textContent = highScore;

// Initialize Game
function initGame() {
    snake = [{ x: 10, y: 10 }];
    food = generateFood();
    velocity = { x: 0, y: 0 };
    score = 0;
    scoreElement.textContent = score;
    isGameOver = false;
    isGameRunning = false;

    // Clear previous interval if exists
    if (gameInterval) clearInterval(gameInterval);

    // UI Updates
    gameOverScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');

    render();
}

function startGame() {
    if (isGameRunning) return;
    isGameRunning = true;
    startScreen.classList.add('hidden');
    velocity = { x: 1, y: 0 }; // Start moving right

    // Play music on start
    if (!isMuted) {
        bgMusic.play().catch(e => console.log("Audio play failed:", e));
    }

    gameInterval = setInterval(gameLoop, speed);
}

// Mute Functionality
muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    bgMusic.muted = isMuted;

    if (isMuted) {
        muteIcon.textContent = '🔇';
        muteBtn.classList.add('muted');
        bgMusic.pause();
    } else {
        muteIcon.textContent = '🔊';
        muteBtn.classList.remove('muted');
        if (isGameRunning) {
            bgMusic.play().catch(e => console.log("Audio play failed:", e));
        }
    }
});

function gameLoop() {
    if (isGameOver) return;
    update();
    render();
}

function update() {
    const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

    // Wall Collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Self Collision
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head); // Add new head

    // Check if ate food
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        food = generateFood();
        // Optional: Speed up slightly?
        // if (speed > 50) speed -= 1; 
    } else {
        snake.pop(); // Remove tail
    }
}

function generateFood() {
    let newFood;
    while (true) {
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        // Check if food spawns on snake
        let onSnake = false;
        for (let part of snake) {
            if (part.x === newFood.x && part.y === newFood.y) {
                onSnake = true;
                break;
            }
        }
        if (!onSnake) break;
    }
    return newFood;
}

function gameOver() {
    isGameOver = true;
    isGameRunning = false;
    clearInterval(gameInterval);

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
    }

    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');

    // Show name modal if score > 0
    if (score > 0) {
        setTimeout(() => {
            nameModal.classList.remove('hidden');
            playerNameInput.focus();
        }, 1000); // Wait a bit before showing modal
    }
}

// Leaderboard API functions
async function updateLeaderboard() {
    try {
        const response = await fetch('/api/scores');
        const scores = await response.json();

        leaderboardList.innerHTML = scores.map((s, index) => `
            <li>
                <span class="name">${index + 1}. ${s.name}</span>
                <span class="points">${s.score}</span>
            </li>
        `).join('') || '<li>Sin récords aún</li>';
    } catch (e) {
        console.error("Error al cargar leaderboard:", e);
        leaderboardList.innerHTML = '<li>Error al cargar</li>';
    }
}

async function submitScore() {
    const name = playerNameInput.value.trim() || "Anónimo";
    submitScoreBtn.disabled = true;
    submitScoreBtn.textContent = "GUARDANDO...";

    try {
        const response = await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, score })
        });

        if (response.ok) {
            nameModal.classList.add('hidden');
            await updateLeaderboard();
        }
    } catch (e) {
        console.error("Error al enviar puntaje:", e);
    } finally {
        submitScoreBtn.disabled = false;
        submitScoreBtn.textContent = "GUARDAR";
        playerNameInput.value = "";
    }
}

submitScoreBtn.addEventListener('click', submitScore);
playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitScore();
});

function render() {
    // Clear canvas
    ctx.fillStyle = THEME.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Food
    drawRect(food.x, food.y, THEME.food, true);

    // Draw Snake
    snake.forEach((part, index) => {
        if (index === 0) {
            // Head
            drawRect(part.x, part.y, THEME.snakeHead, true);
        } else {
            // Body
            drawRect(part.x, part.y, THEME.snakeBody, false);
        }
    });
}

function drawRect(x, y, color, glow) {
    ctx.fillStyle = color;
    if (glow) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
    } else {
        ctx.shadowBlur = 0;
    }
    ctx.fillRect(x * gridSize, y * gridSize, gridSize - 2, gridSize - 2);
    ctx.shadowBlur = 0; // Reset
}

// Input Handling
document.addEventListener('keydown', (e) => {
    // Si el modal de nombre está abierto, no procesar estas teclas para el juego
    if (!nameModal.classList.contains('hidden')) return;

    // Reiniciar o Empezar juego
    if (!isGameRunning && !['F5', 'F12'].includes(e.key)) {
        // Si estamos en Game Over, cualquier tecla reinicia (si el modal está cerrado)
        if (isGameOver) {
            initGame();
        }

        // Prevenir scroll
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
            e.preventDefault();
        }

        startGame();
        return;
    }

    // Prevenir scroll durante el juego
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
    }

    // Direction handling
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (velocity.y === 1) break;
            velocity = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (velocity.y === -1) break;
            velocity = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (velocity.x === 1) break;
            velocity = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (velocity.x === -1) break;
            velocity = { x: 1, y: 0 };
            break;
    }
});

restartBtn.addEventListener('click', initGame);

// Initial Render
initGame();
updateLeaderboard();
