// Initialize game
let game;

// Global functions
function selectCharacter(type) {
    if (game) {
        game.selectCharacter(type);
    }
}

function throwObject() {
    if (game) {
        game.throw();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentPlayer = 1;
        this.scores = {p1: 0, p2: 0};
        this.gameState = 'selecting'; // selecting, playing, aiming, throwing
        this.projectile = null;
        this.characters = {
            p1: null,
            p2: null
        };
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragCurrent = { x: 0, y: 0 };
        this.maxDragDistance = 150; // Maximum drag distance for power
        this.mousePos = { x: 0, y: 0 }; // Track mouse position for hover effects

        this.init();
    }

    init() {
        this.canvas.width = 800;
        this.canvas.height = 400;
        this.setupEventListeners();
        this.gameLoop();
    }

    setupEventListeners() {
        // Ensure event handlers are bound to the class instance
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    }

    getMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left);
        const mouseY = (e.clientY - rect.top);
        console.log('Mouse coordinates (raw):', mouseX, mouseY); // Debug log

        // Scale mouse coordinates to canvas coordinates
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const canvasX = mouseX * scaleX;
        const canvasY = mouseY * scaleY;
        console.log('Canvas coordinates (scaled):', canvasX, canvasY); // Debug log

        return { x: canvasX, y: canvasY };
    }

    isMouseOverCharacter(x, y, character) {
        if (!character) return false;
        const dx = x - character.x;
        const dy = y - character.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const clickRadius = character.radius * 1.5; // เพิ่มขนาดเล็กน้อยเพื่อความง่ายในการคลิก

        console.log('Click check:', {
            mouseX: x,
            mouseY: y,
            characterX: character.x,
            characterY: character.y,
            distance: distance,
            clickRadius: clickRadius,
            isClicked: distance < clickRadius
        }); // Debug log

        return distance < clickRadius;
    }

    handleMouseDown(e) {
        if (this.gameState !== 'playing') return;

        const mousePos = this.getMousePosition(e);
        const currentChar = this.currentPlayer === 1 ? this.characters.p1 : this.characters.p2;

        console.log('Mouse down:', {
            state: this.gameState,
            player: this.currentPlayer,
            character: currentChar,
            mousePos: mousePos
        }); // Debug log

        if (this.isMouseOverCharacter(mousePos.x, mousePos.y, currentChar)) {
            this.isDragging = true;
            this.dragStart = { x: currentChar.x, y: currentChar.y };
            this.dragCurrent = { x: mousePos.x, y: mousePos.y };
            this.gameState = 'aiming';
            console.log('Started dragging at:', this.dragStart); // Debug log
        }
    }

    handleMouseMove(e) {
        const mousePos = this.getMousePosition(e);
        this.mousePos = mousePos; // Update current mouse position for hover effects

        if (this.isDragging) {
            this.dragCurrent = mousePos;
            console.log('Dragging at:', mousePos); // Debug log
        }
    }

    handleMouseUp() {
        if (!this.isDragging) return;

        this.isDragging = false;
        if (this.gameState === 'aiming') {
            console.log('Throwing from:', this.dragStart, 'to:', this.dragCurrent); // Debug log
            this.throwProjectile();
        }
    }

    throwProjectile() {
        const dx = this.dragStart.x - this.dragCurrent.x; // เปลี่ยนกลับด้าน
        const dy = this.dragStart.y - this.dragCurrent.y; // เปลี่ยนกลับด้าน
        const distance = Math.sqrt(dx * dx + dy * dy);
        const power = Math.min(distance, this.maxDragDistance) * 20; // เพิ่มความแรงประมาณ 5 เท่า

        const angle = Math.atan2(dy, dx) + Math.PI; // แก้ไขเพื่อเปลี่ยนไปในทิศทางตรงข้ามทั้งแนวนอนและแนวตั้ง

        const velocity = power * 0.02; // ปรับลดความเร็วให้ลอยช้า
        const vx = velocity * Math.cos(angle); // คำนวณความเร็วในแนวนอน
        const vy = velocity * Math.sin(angle); // คำนวณความเร็วในแนวดิ่ง

        this.projectile = {
            x: this.dragStart.x,
            y: this.dragStart.y,
            vx: -vx,  // ลบ vx เพื่อทำให้ไปด้านตรงข้าม
            vy: -vy,  // ลบ vy เนื่องจากแกน y จะถูกย้อนกลับใน canvas
            radius: 10
        };

        this.gameState = 'throwing';
    }
    
    selectCharacter(type) {
        if (this.gameState === 'selecting') {
            if (!this.characters.p1) {
                this.characters.p1 = {
                    type,
                    x: 50,
                    y: this.canvas.height - 50,
                    radius: 25
                };
            } else {
                this.characters.p2 = {
                    type,
                    x: this.canvas.width - 50,
                    y: this.canvas.height - 50,
                    radius: 25
                };
                this.gameState = 'playing';
            }
        }
    }

    update() {
        if (this.gameState === 'throwing' && this.projectile) {
            const newPos = Physics.updateProjectile(this.projectile);
            this.projectile.x = newPos.x;
            this.projectile.y = newPos.y;
            this.projectile.vy = newPos.vy;

            // Check collisions
            const target = this.currentPlayer === 1 ?
                this.characters.p2 : this.characters.p1;

            if (Physics.checkCollision(this.projectile, target)) {
                // Score point
                if (this.currentPlayer === 1) {
                    this.scores.p1++;
                } else {
                    this.scores.p2++;
                }

                this.updateScoreDisplay();
                this.resetRound();
            }

            // Check if projectile is out of bounds
            if (this.projectile.y > this.canvas.height ||
                this.projectile.x < 0 ||
                this.projectile.x > this.canvas.width) {
                this.resetRound();
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw characters
        if (this.characters.p1) {
            const isCurrentPlayer = this.currentPlayer === 1;
            const isHovered = this.isMouseOverCharacter(this.mousePos.x, this.mousePos.y, this.characters.p1);
            this.drawCharacter(this.characters.p1, isCurrentPlayer, isHovered);
        }
        if (this.characters.p2) {
            const isCurrentPlayer = this.currentPlayer === 2;
            const isHovered = this.isMouseOverCharacter(this.mousePos.x, this.mousePos.y, this.characters.p2);
            this.drawCharacter(this.characters.p2, isCurrentPlayer, isHovered);
        }

        // Draw projectile
        if (this.projectile) {
            this.ctx.beginPath();
            this.ctx.arc(this.projectile.x, this.projectile.y,
                this.projectile.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'red';
            this.ctx.fill();
            this.ctx.closePath();
        }

        // Draw aiming UI when dragging
        if (this.isDragging && this.gameState === 'aiming') {
            this.drawAimingUI();
        }
    }

    drawAimingUI() {
        const dx = this.dragStart.x - this.dragCurrent.x;
        const dy = this.dragStart.y - this.dragCurrent.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const power = Math.min(distance / this.maxDragDistance, 1);

        // Draw aim line
        this.ctx.beginPath();
        this.ctx.moveTo(this.dragStart.x, this.dragStart.y);
        this.ctx.lineTo(
            this.dragStart.x - Math.cos(angle) * distance,
            this.dragStart.y - Math.sin(angle) * distance
        );
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.lineWidth = 1;

        // Draw power meter
        const meterWidth = 100;
        const meterHeight = 10;
        const meterX = this.dragStart.x - meterWidth / 2;
        const meterY = this.dragStart.y - 50;

        // Draw background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

        // Draw power level
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(meterX, meterY, meterWidth * power, meterHeight);

        // Draw angle indicator
        const angleDeg = (angle * 180 / Math.PI + 360) % 360;
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`${Math.round(angleDeg)}°`, meterX, meterY - 5);
    }

    drawCharacter(character, isCurrentPlayer, isHovered) {
        // Draw highlight for current player or hover
        if (isCurrentPlayer || isHovered) {
            this.ctx.beginPath();
            this.ctx.arc(character.x, character.y, character.radius * 3, 0, Math.PI * 2);
            this.ctx.fillStyle = isCurrentPlayer ?
                'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';
            this.ctx.fill();
            this.ctx.closePath();
        }

        const svg = character.type === 'cat' ? catSVG : dogSVG;
        const img = new Image();
        img.src = 'data:image/svg+xml,' + encodeURIComponent(svg);

        this.ctx.drawImage(img,
            character.x - character.radius,
            character.y - character.radius,
            character.radius * 2,
            character.radius * 2
        );
    }

    resetRound() {
        this.projectile = null;
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.gameState = 'playing';
    }

    updateScoreDisplay() {
        document.getElementById('p1-score').textContent = this.scores.p1;
        document.getElementById('p2-score').textContent = this.scores.p2;
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Create game instance when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});