class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.gameStatusElement = document.getElementById('gameStatus');
        this.levelElement = document.getElementById('level');
        this.foodCountElement = document.getElementById('foodCount');
        this.levelCompleteModal = document.getElementById('levelCompleteModal');
        this.levelCompleteText = document.getElementById('levelCompleteText');
        this.continueBtn = document.getElementById('continueBtn');
        this.quitBtn = document.getElementById('quitBtn');
        
        // 游戏设置
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // 游戏状态
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.level = 1;
        this.foodEaten = 0;
        this.baseSpeed = 150;
        this.currentSpeed = 150;
        
        // 蛇的初始状态
        this.snake = [
            { x: 10, y: 10 }
        ];
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        
        // 食物
        this.food = { x: 15, y: 15 };
        
        this.init();
    }
    
    init() {
        this.updateHighScoreDisplay();
        this.updateLevelDisplay();
        this.updateFoodCountDisplay();
        this.setupModalEvents();
        this.setupEventListeners();
        this.generateFood();
        this.draw();
    }
    
    setupEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning && e.code === 'Space') {
                this.startGame();
                return;
            }
            
            if (this.gameRunning) {
                switch(e.code) {
                    case 'ArrowUp':
                    case 'KeyW':
                        if (this.direction.y !== 1) {
                            this.nextDirection = { x: 0, y: -1 };
                        }
                        break;
                    case 'ArrowDown':
                    case 'KeyS':
                        if (this.direction.y !== -1) {
                            this.nextDirection = { x: 0, y: 1 };
                        }
                        break;
                    case 'ArrowLeft':
                    case 'KeyA':
                        if (this.direction.x !== 1) {
                            this.nextDirection = { x: -1, y: 0 };
                        }
                        break;
                    case 'ArrowRight':
                    case 'KeyD':
                        if (this.direction.x !== -1) {
                            this.nextDirection = { x: 1, y: 0 };
                        }
                        break;
                    case 'Space':
                        this.togglePause();
                        break;
                }
            }
            e.preventDefault();
        });
        
        // 按钮控制
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    startGame() {
        if (!this.gameRunning) {
            this.gameRunning = true;
            this.gamePaused = false;
            this.direction = { x: 1, y: 0 };
            this.nextDirection = { x: 1, y: 0 };
            this.updateGameStatus('游戏进行中 - 按空格键暂停');
            this.gameLoop();
        }
    }
    
    togglePause() {
        if (this.gameRunning) {
            this.gamePaused = !this.gamePaused;
            if (this.gamePaused) {
                this.updateGameStatus('游戏已暂停 - 按空格键继续');
            } else {
                this.updateGameStatus('游戏进行中 - 按空格键暂停');
                this.gameLoop();
            }
        }
    }
    
    restartGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.level = 1;
        this.foodEaten = 0;
        this.currentSpeed = this.baseSpeed;
        this.snake = [{ x: 10, y: 10 }];
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.generateFood();
        this.updateScore();
        this.updateLevelDisplay();
        this.updateFoodCountDisplay();
        this.updateGameStatus('按空格键开始游戏');
        this.draw();
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        setTimeout(() => {
            this.update();
            this.draw();
            
            if (this.gameRunning && !this.gamePaused) {
                this.gameLoop();
            }
        }, this.currentSpeed);
    }
    
    update() {
        // 更新方向
        this.direction = { ...this.nextDirection };
        
        // 移动蛇头
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // 检查墙壁碰撞
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // 检查自身碰撞
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }
        
        this.snake.unshift(head);
        
        // 检查食物碰撞
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.foodEaten++;
            this.updateScore();
            this.updateFoodCountDisplay();
            this.generateFood();
            this.animateScore();
            
            // 检查是否通过关卡
            if (this.foodEaten >= 12) {
                this.levelUp();
            }
        } else {
            this.snake.pop();
        }
    }
    
    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        
        this.food = newFood;
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#1a202c';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制蛇
        this.drawSnake();
        
        // 绘制食物
        this.drawFood();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#2d3748';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // 蛇头
                this.ctx.fillStyle = '#48bb78';
                this.ctx.fillRect(
                    segment.x * this.gridSize + 1,
                    segment.y * this.gridSize + 1,
                    this.gridSize - 2,
                    this.gridSize - 2
                );
                
                // 蛇头眼睛
                this.ctx.fillStyle = '#1a202c';
                const eyeSize = 3;
                const eyeOffset = 5;
                this.ctx.fillRect(
                    segment.x * this.gridSize + eyeOffset,
                    segment.y * this.gridSize + eyeOffset,
                    eyeSize,
                    eyeSize
                );
                this.ctx.fillRect(
                    segment.x * this.gridSize + this.gridSize - eyeOffset - eyeSize,
                    segment.y * this.gridSize + eyeOffset,
                    eyeSize,
                    eyeSize
                );
            } else {
                // 蛇身
                this.ctx.fillStyle = '#68d391';
                this.ctx.fillRect(
                    segment.x * this.gridSize + 2,
                    segment.y * this.gridSize + 2,
                    this.gridSize - 4,
                    this.gridSize - 4
                );
            }
        });
    }
    
    drawFood() {
        this.ctx.fillStyle = '#e53e3e';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            2 * Math.PI
        );
        this.ctx.fill();
        
        // 食物高光
        this.ctx.fillStyle = '#fc8181';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2 - 3,
            this.food.y * this.gridSize + this.gridSize / 2 - 3,
            3,
            0,
            2 * Math.PI
        );
        this.ctx.fill();
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.updateHighScoreDisplay();
        }
    }
    
    updateHighScoreDisplay() {
        this.highScoreElement.textContent = this.highScore;
    }
    
    updateGameStatus(message) {
        this.gameStatusElement.textContent = message;
    }
    
    animateScore() {
        this.scoreElement.classList.add('score-animation');
        setTimeout(() => {
            this.scoreElement.classList.remove('score-animation');
        }, 500);
    }
    
    levelUp() {
        this.level++;
        this.foodEaten = 0;
        this.currentSpeed = Math.max(50, this.baseSpeed - (this.level - 1) * 15);
        this.updateLevelDisplay();
        this.updateFoodCountDisplay();
        
        // 显示关卡通过提示
        this.showLevelUpMessage();
    }
    
    updateLevelDisplay() {
        this.levelElement.textContent = this.level;
    }
    
    updateFoodCountDisplay() {
        this.foodCountElement.textContent = this.foodEaten;
        // 添加食物计数动画
        this.foodCountElement.classList.add('food-count-animation');
        setTimeout(() => {
            this.foodCountElement.classList.remove('food-count-animation');
        }, 300);
    }
    
    setupModalEvents() {
        // 继续按钮事件
        this.continueBtn.addEventListener('click', () => {
            this.hideModal();
            this.startNewLevel();
        });
        
        // 放弃按钮事件
        this.quitBtn.addEventListener('click', () => {
            this.hideModal();
            this.gameOver();
        });
    }
    
    hideModal() {
        this.levelCompleteModal.style.display = 'none';
    }
    
    startNewLevel() {
        // 重置蛇的长度为1
        this.snake = [{x: 200, y: 200}];
        
        // 重置食物计数
        this.foodEaten = 0;
        this.updateFoodCountDisplay();
        
        // 生成新食物
        this.generateFood();
        
        // 更新游戏状态
        this.updateGameStatus('游戏进行中 - 按空格键暂停');
        
        // 重新开始游戏
        this.gameRunning = true;
        this.gameLoop();
    }
    
    showLevelUpMessage() {
        // 暂停游戏
        this.gameRunning = false;
        
        // 更新弹窗文本
        this.levelCompleteText.textContent = `您已成功通过第${this.level - 1}关！`;
        
        // 显示弹窗
        this.levelCompleteModal.style.display = 'block';
        
        // 添加关卡升级动画
        this.levelElement.classList.add('level-up-animation');
        
        // 2秒后移除动画类
        setTimeout(() => {
            this.levelElement.classList.remove('level-up-animation');
        }, 2000);
    }
    
    gameOver() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.updateGameStatus(`游戏结束！得分: ${this.score} - 按空格键重新开始`);
        
        // 游戏结束动画
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏结束!', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`最终得分: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
        this.ctx.fillText('按空格键重新开始', this.canvas.width / 2, this.canvas.height / 2 + 35);
        
        // 重置游戏状态以便重新开始
        setTimeout(() => {
            this.restartGame();
        }, 100);
    }
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});

// 防止页面滚动
window.addEventListener('keydown', (e) => {
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);