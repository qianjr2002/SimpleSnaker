(function () {
    // ========== DOM 元素 ==========
    var canvas = document.getElementById('myCanvas');
    var ctx = canvas.getContext('2d');
    var scoreEl = document.getElementById('score');
    var bestScoreEl = document.getElementById('bestScore');
    var livesDisplay = document.getElementById('livesDisplay');
    var finalScoreEl = document.getElementById('finalScore');
    var causeTextEl = document.getElementById('causeText');
    var gameOverOverlay = document.getElementById('gameOverOverlay');
    var startOverlay = document.getElementById('startOverlay');
    var restartBtn = document.getElementById('restartBtn');
    var startBtn = document.getElementById('startBtn');
    var pauseHint = document.getElementById('pauseHint');
    var difficultyBtns = document.querySelectorAll('.difficulty-btn');
    var canvasWrapper = document.querySelector('.canvas-wrapper');

    // ========== 难度配置 ==========
    var DIFFICULTY = {
        easy:   { name: '简单', baseSpeed: 160, speedStep: 4,  minSpeed: 80,  lives: 5 },
        normal: { name: '一般', baseSpeed: 120, speedStep: 6,  minSpeed: 50,  lives: 4 },
        hard:   { name: '困难', baseSpeed: 80,  speedStep: 10, minSpeed: 30,  lives: 3 },
    };

    // ========== 游戏配置 ==========
    var GRID_SIZE = 20;
    var COLS = canvas.width / GRID_SIZE;
    var ROWS = canvas.height / GRID_SIZE;

    // ========== 游戏状态 ==========
    var snake = [];
    var food = { x: 0, y: 0 };
    var direction = { x: 1, y: 0 };
    var nextDirection = { x: 1, y: 0 };
    var score = 0;
    var bestScore = 0;
    var gameLoop = null;
    var isRunning = false;
    var isPaused = false;
    var currentDifficulty = 'normal';
    var speed = DIFFICULTY[currentDifficulty].baseSpeed;
    var lives = DIFFICULTY[currentDifficulty].lives;

    // ========== 加载最高分 ==========
    try {
        bestScore = parseInt(localStorage.getItem('snakeBestScore_normal')) || 0;
        bestScoreEl.textContent = bestScore;
    } catch (e) {
        bestScore = 0;
    }

    // ========== 初始化游戏（仅设置状态和绘制，不启动循环） ==========
    function initGame() {
        var startX = Math.floor(COLS / 2);
        var startY = Math.floor(ROWS / 2);
        snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY },
        ];
        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };
        score = 0;
        speed = DIFFICULTY[currentDifficulty].baseSpeed;
        lives = DIFFICULTY[currentDifficulty].lives;
        isPaused = false;
        pauseHint.style.display = 'none';
        scoreEl.textContent = '0';
        updateLivesDisplay();
        spawnFood();
        draw();
    }

    // ========== 更新生命显示 ==========
    function updateLivesDisplay() {
        var hearts = '';
        for (var i = 0; i < lives; i++) {
            hearts += '❤️';
        }
        livesDisplay.textContent = hearts;
    }

    // ========== 开始游戏 ==========
    function startGame() {
        startOverlay.classList.remove('active');
        gameOverOverlay.classList.remove('active');
        isRunning = true;
        clearInterval(gameLoop);
        gameLoop = setInterval(tick, speed);
    }

    // ========== 生成食物（避开蛇身） ==========
    function spawnFood() {
        var occupied = {};
        snake.forEach(function (s) {
            occupied[s.x + ',' + s.y] = true;
        });
        var available = [];
        for (var x = 0; x < COLS; x++) {
            for (var y = 0; y < ROWS; y++) {
                if (!occupied[x + ',' + y]) {
                    available.push({ x: x, y: y });
                }
            }
        }
        if (available.length > 0) {
            food = available[Math.floor(Math.random() * available.length)];
        } else {
            gameOver('恭喜你！你已经填满了整个棋盘！🎉');
        }
    }

    // ========== 游戏主循环 ==========
    function tick() {
        if (!isRunning || isPaused) return;

        direction = { x: nextDirection.x, y: nextDirection.y };

        var head = snake[0];
        var newHead = {
            x: head.x + direction.x,
            y: head.y + direction.y,
        };

        // 碰墙检测
        if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
            loseLife('撞到墙壁了！');
            return;
        }

        // 撞自己检测
        for (var i = 0; i < snake.length; i++) {
            if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
                loseLife('撞到自己了！');
                return;
            }
        }

        snake.unshift(newHead);

        // 检查是否吃到食物
        if (newHead.x === food.x && newHead.y === food.y) {
            score += 10;
            scoreEl.textContent = score;
            var cfg = DIFFICULTY[currentDifficulty];
            if (score % 50 === 0 && speed > cfg.minSpeed) {
                speed = Math.max(cfg.minSpeed, speed - cfg.speedStep);
                restartInterval();
            }
            spawnFood();
        } else {
            snake.pop();
        }

        draw();
    }

    // ========== 绘制 ==========
    function draw() {
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 网格线
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 0.5;
        for (var x = 0; x <= COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * GRID_SIZE, 0);
            ctx.lineTo(x * GRID_SIZE, canvas.height);
            ctx.stroke();
        }
        for (var y = 0; y <= ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * GRID_SIZE);
            ctx.lineTo(canvas.width, y * GRID_SIZE);
            ctx.stroke();
        }

        // 食物
        var fx = food.x * GRID_SIZE;
        var fy = food.y * GRID_SIZE;
        ctx.fillStyle = '#ff6b6b';
        ctx.shadowColor = '#ff6b6b';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(fx + GRID_SIZE / 2, fy + GRID_SIZE / 2, GRID_SIZE / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 蛇
        snake.forEach(function (seg, index) {
            var sx = seg.x * GRID_SIZE;
            var sy = seg.y * GRID_SIZE;
            var padding = 1;

            if (index === 0) {
                ctx.fillStyle = '#64ffda';
                ctx.shadowColor = '#64ffda';
                ctx.shadowBlur = 8;
            } else {
                var ratio = index / snake.length;
                var r = Math.floor(100 + 100 * (1 - ratio));
                var g = Math.floor(255 * (1 - ratio * 0.5));
                var b = Math.floor(180 + 75 * (1 - ratio));
                ctx.fillStyle = 'rgb(' + r + ', ' + g + ', ' + b + ')';
                ctx.shadowBlur = 0;
            }

            ctx.beginPath();
            ctx.roundRect(
                sx + padding,
                sy + padding,
                GRID_SIZE - padding * 2,
                GRID_SIZE - padding * 2,
                4
            );
            ctx.fill();
        });
        ctx.shadowBlur = 0;
    }

    // ========== 失去生命 ==========
    function loseLife(cause) {
        lives--;
        updateLivesDisplay();

        // 闪烁红色边框
        canvasWrapper.classList.add('hurt');
        setTimeout(function () {
            canvasWrapper.classList.remove('hurt');
        }, 300);

        if (lives <= 0) {
            gameOver(cause);
            return;
        }

        // 还有命：重置蛇的位置，保留分数和食物
        var startX = Math.floor(COLS / 2);
        var startY = Math.floor(ROWS / 2);
        snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY },
        ];
        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };
        draw();
    }

    // ========== 游戏结束 ==========
    function gameOver(cause) {
        isRunning = false;
        clearInterval(gameLoop);
        gameLoop = null;

        if (score > bestScore) {
            bestScore = score;
            bestScoreEl.textContent = bestScore;
            try {
                localStorage.setItem('snakeBestScore_' + currentDifficulty, bestScore);
            } catch (e) { /* ignore */ }
        }

        finalScoreEl.textContent = score;
        causeTextEl.textContent = cause;
        gameOverOverlay.classList.add('active');

        drawDeathFrame();
    }

    function drawDeathFrame() {
        draw();
        if (snake.length > 0) {
            var head = snake[0];
            ctx.fillStyle = '#ff4444';
            ctx.shadowColor = '#ff4444';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.roundRect(
                head.x * GRID_SIZE + 1,
                head.y * GRID_SIZE + 1,
                GRID_SIZE - 2,
                GRID_SIZE - 2,
                4
            );
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    // ========== 难度切换 ==========
    function setDifficulty(level) {
        if (!DIFFICULTY[level] || currentDifficulty === level) return;
        currentDifficulty = level;
        difficultyBtns.forEach(function (btn) {
            if (btn.dataset.level === level) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        try {
            bestScore = parseInt(localStorage.getItem('snakeBestScore_' + level)) || 0;
        } catch (e) { bestScore = 0; }
        bestScoreEl.textContent = bestScore;
        // 未开始时切换难度同步更新生命显示
        if (!isRunning) {
            lives = DIFFICULTY[level].lives;
            updateLivesDisplay();
        }
        if (isRunning) {
            speed = DIFFICULTY[level].baseSpeed;
            restartInterval();
        }
    }

    // ========== 重新开始（跳过开始画面，直接启动） ==========
    function restart() {
        clearInterval(gameLoop);
        gameLoop = null;
        initGame();
        startGame();
    }

    function restartInterval() {
        clearInterval(gameLoop);
        gameLoop = setInterval(tick, speed);
    }

    // ========== 暂停/继续 ==========
    function togglePause() {
        if (!isRunning) return;
        isPaused = !isPaused;
        pauseHint.style.display = isPaused ? 'block' : 'none';
    }

    // ========== 键盘控制 ==========
    document.addEventListener('keydown', function (e) {
        var arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
        if (arrowKeys.indexOf(e.key) !== -1) {
            e.preventDefault();
        }

        var key = e.key.toLowerCase();

        // 空格：未开始时→开始游戏；已开始时→暂停/继续
        if (key === ' ') {
            if (!isRunning) {
                startGame();
            } else {
                togglePause();
            }
            return;
        }

        // 未开始时不响应方向键和 R
        if (!isRunning) return;

        // 方向控制
        if (key === 'arrowup' || key === 'w') {
            if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
        } else if (key === 'arrowdown' || key === 's') {
            if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
        } else if (key === 'arrowleft' || key === 'a') {
            if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
        } else if (key === 'arrowright' || key === 'd') {
            if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
        }

        // 重新开始
        if (key === 'r') restart();
    });

    // ========== 难度按钮事件 ==========
    difficultyBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            setDifficulty(btn.dataset.level);
        });
    });

    // ========== 按钮事件 ==========
    startBtn.addEventListener('click', startGame);

    restartBtn.addEventListener('click', restart);

    gameOverOverlay.addEventListener('click', function (e) {
        if (e.target === gameOverOverlay) restart();
    });

    // 点击开始画面背景也可以开始
    startOverlay.addEventListener('click', function (e) {
        if (e.target === startOverlay) startGame();
    });

    // ========== roundRect polyfill ==========
    if (!ctx.roundRect) {
        ctx.roundRect = function (x, y, w, h, r) {
            if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
            ctx.beginPath();
            ctx.moveTo(x + r.tl, y);
            ctx.lineTo(x + w - r.tr, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
            ctx.lineTo(x + w, y + h - r.br);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
            ctx.lineTo(x + r.bl, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
            ctx.lineTo(x, y + r.tl);
            ctx.quadraticCurveTo(x, y, x + r.tl, y);
            ctx.closePath();
        };
    }

    // ========== 启动：绘制初始画面，等待玩家点击"开始游戏" ==========
    initGame();
    startOverlay.classList.add('active');
})();
