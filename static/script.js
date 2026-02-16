const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const restartBtn = document.getElementById('restart-btn');

// Game settings
const gridSize = 20;
const tileCount = canvas.width / gridSize;
let speed = 100; // ms
let gameInterval;
let isGameRunning = false;
let isGameOver = false;

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
    gameInterval = setInterval(gameLoop, speed);
}

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
}

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
    // Start game on any key if not running
    if (!isGameRunning && !isGameOver && !['F5', 'F12'].includes(e.key)) {
        // Prevent default only for arrow keys / space / WASD to avoid blocking browser shortcuts
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
            e.preventDefault();
        }
        startGame();
        // Allow the first move to register immediately if it's a direction
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
