// Game Configuration
const CONFIG = {
  canvasWidth: 800,
  canvasHeight: 600,
  playerSize: 20,
  playerSpeed: 5,
  dashSpeed: 15,
  dashDuration: 200,
  dashCooldown: 1000,
  fragmentSize: 12,
  glitchMinSize: 30,
  glitchMaxSize: 60,
  initialGlitchSpeed: 2,
  spawnRate: 60,
  fragmentSpawnRate: 90,
  levelUpScore: 500,
  colors: {
    player: '#00ff99',
    playerTrail: '#00ffaa',
    fragment: '#00ccff',
    glitch: '#ff3366',
    background: '#0a0a0a',
    grid: '#1a1a1a'
  }
};

// Game State
const game = {
  canvas: null,
  ctx: null,
  running: false,
  paused: false,
  score: 0,
  level: 1,
  lives: 3,
  frameCount: 0,
  player: null,
  fragments: [],
  glitches: [],
  particles: [],
  keys: {},
  touchDirection: { x: 0, y: 0 },
  audio: {
    music: null,
    collect: null,
    muted: false
  }
};

// Player Class
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = CONFIG.playerSize;
    this.speed = CONFIG.playerSpeed;
    this.dx = 0;
    this.dy = 0;
    this.dashing = false;
    this.dashTime = 0;
    this.dashCooldownTime = 0;
    this.invulnerable = false;
    this.invulnerableTime = 0;
    this.trail = [];
  }

  update() {
    // Handle dash
    const now = Date.now();
    if (this.dashing && now - this.dashTime > CONFIG.dashDuration) {
      this.dashing = false;
    }

    // Movement
    const speed = this.dashing ? CONFIG.dashSpeed : this.speed;
    this.dx = 0;
    this.dy = 0;

    // Keyboard controls
    if (game.keys['ArrowLeft'] || game.keys['a'] || game.keys['A']) this.dx = -1;
    if (game.keys['ArrowRight'] || game.keys['d'] || game.keys['D']) this.dx = 1;
    if (game.keys['ArrowUp'] || game.keys['w'] || game.keys['W']) this.dy = -1;
    if (game.keys['ArrowDown'] || game.keys['s'] || game.keys['S']) this.dy = 1;

    // Touch controls
    if (game.touchDirection.x !== 0 || game.touchDirection.y !== 0) {
      this.dx = game.touchDirection.x;
      this.dy = game.touchDirection.y;
    }

    // Normalize diagonal movement
    if (this.dx !== 0 && this.dy !== 0) {
      this.dx *= 0.707;
      this.dy *= 0.707;
    }

    // Apply movement
    this.x += this.dx * speed;
    this.y += this.dy * speed;

    // Boundary collision
    this.x = Math.max(this.size, Math.min(CONFIG.canvasWidth - this.size, this.x));
    this.y = Math.max(this.size, Math.min(CONFIG.canvasHeight - this.size, this.y));

    // Update trail
    if (this.dashing) {
      this.trail.push({ x: this.x, y: this.y, alpha: 1 });
      if (this.trail.length > 10) this.trail.shift();
    }
    this.trail.forEach(t => t.alpha -= 0.05);
    this.trail = this.trail.filter(t => t.alpha > 0);

    // Update invulnerability
    if (this.invulnerable && now - this.invulnerableTime > 2000) {
      this.invulnerable = false;
    }
  }

  dash() {
    const now = Date.now();
    if (!this.dashing && now - this.dashCooldownTime > CONFIG.dashCooldown) {
      this.dashing = true;
      this.dashTime = now;
      this.dashCooldownTime = now;
    }
  }

  takeDamage() {
    if (!this.invulnerable) {
      game.lives--;
      this.invulnerable = true;
      this.invulnerableTime = Date.now();
      updateUI();

      if (game.lives <= 0) {
        gameOver();
      }
    }
  }

  draw(ctx) {
    // Draw trail
    this.trail.forEach(t => {
      ctx.fillStyle = `rgba(0, 255, 170, ${t.alpha * 0.3})`;
      ctx.fillRect(t.x - this.size/2, t.y - this.size/2, this.size, this.size);
    });

    // Draw player (flashing if invulnerable)
    if (!this.invulnerable || Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.save();
      ctx.fillStyle = CONFIG.colors.player;
      ctx.shadowBlur = 20;
      ctx.shadowColor = CONFIG.colors.player;

      // Rotating square
      ctx.translate(this.x, this.y);
      ctx.rotate(game.frameCount * 0.05);
      ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);

      ctx.restore();
    }

    // Draw dash cooldown indicator
    const cooldownProgress = Math.min(1, (Date.now() - this.dashCooldownTime) / CONFIG.dashCooldown);
    if (cooldownProgress < 1) {
      ctx.strokeStyle = CONFIG.colors.fragment;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 5, -Math.PI/2, -Math.PI/2 + cooldownProgress * Math.PI * 2);
      ctx.stroke();
    }
  }
}

// Fragment Class (Collectible)
class Fragment {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = CONFIG.fragmentSize;
    this.angle = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.pulseOffset = Math.random() * Math.PI * 2;
  }

  update() {
    this.angle += this.rotationSpeed;
  }

  draw(ctx) {
    const pulse = Math.sin(game.frameCount * 0.05 + this.pulseOffset) * 0.3 + 1;
    ctx.save();
    ctx.fillStyle = CONFIG.colors.fragment;
    ctx.shadowBlur = 15;
    ctx.shadowColor = CONFIG.colors.fragment;

    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(pulse, pulse);

    // Draw diamond shape
    ctx.beginPath();
    ctx.moveTo(0, -this.size);
    ctx.lineTo(this.size, 0);
    ctx.lineTo(0, this.size);
    ctx.lineTo(-this.size, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

// Glitch Class (Enemy)
class Glitch {
  constructor() {
    this.size = CONFIG.glitchMinSize + Math.random() * (CONFIG.glitchMaxSize - CONFIG.glitchMinSize);
    this.x = Math.random() * CONFIG.canvasWidth;
    this.y = -this.size;
    this.speed = CONFIG.initialGlitchSpeed + (game.level - 1) * 0.5;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    this.angle = Math.random() * Math.PI * 2;
    this.glitchOffset = Math.random() * 10 - 5;
  }

  update() {
    this.y += this.speed;
    this.angle += this.rotationSpeed;

    // Random glitch movement
    if (Math.random() < 0.05) {
      this.glitchOffset = Math.random() * 10 - 5;
    }
    this.x += this.glitchOffset * 0.1;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Glitch effect
    const glitchAmount = Math.random() < 0.1 ? Math.random() * 5 : 0;
    ctx.translate(glitchAmount, 0);

    // Draw corrupted rectangle
    ctx.fillStyle = CONFIG.colors.glitch;
    ctx.shadowBlur = 15;
    ctx.shadowColor = CONFIG.colors.glitch;
    ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);

    // Random glitch lines
    if (Math.random() < 0.3) {
      ctx.strokeStyle = '#ff6699';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-this.size/2, Math.random() * this.size - this.size/2);
      ctx.lineTo(this.size/2, Math.random() * this.size - this.size/2);
      ctx.stroke();
    }

    ctx.restore();
  }

  isOffScreen() {
    return this.y > CONFIG.canvasHeight + this.size;
  }
}

// Particle Class
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4;
    this.size = Math.random() * 4 + 2;
    this.color = color;
    this.life = 1;
    this.decay = 0.02;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.life;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.globalAlpha = 1;
  }

  isDead() {
    return this.life <= 0;
  }
}

// Collision Detection
function checkCollision(obj1, obj2) {
  const dx = obj1.x - obj2.x;
  const dy = obj1.y - obj2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (obj1.size + obj2.size);
}

// Initialize Game
function init() {
  game.canvas = document.getElementById('gameCanvas');
  game.ctx = game.canvas.getContext('2d');
  game.canvas.width = CONFIG.canvasWidth;
  game.canvas.height = CONFIG.canvasHeight;

  // Initialize audio
  game.audio.music = document.getElementById('bgMusic');
  game.audio.collect = document.getElementById('collectSound');

  // Set audio volumes
  if (game.audio.music) game.audio.music.volume = 0.3;
  if (game.audio.collect) game.audio.collect.volume = 0.5;

  // Setup event listeners
  setupEventListeners();

  // Show start screen
  showScreen('startScreen');
}

// Setup Event Listeners
function setupEventListeners() {
  // Keyboard
  document.addEventListener('keydown', (e) => {
    game.keys[e.key] = true;

    if (e.key === ' ' && game.running && !game.paused) {
      e.preventDefault();
      game.player.dash();
    }

    if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && game.running) {
      e.preventDefault();
      togglePause();
    }
  });

  document.addEventListener('keyup', (e) => {
    game.keys[e.key] = false;
  });

  // Touch controls
  const dpadButtons = document.querySelectorAll('.dpad-btn');
  dpadButtons.forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const dir = btn.dataset.direction;
      switch(dir) {
        case 'up': game.touchDirection.y = -1; break;
        case 'down': game.touchDirection.y = 1; break;
        case 'left': game.touchDirection.x = -1; break;
        case 'right': game.touchDirection.x = 1; break;
      }
    });

    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      const dir = btn.dataset.direction;
      switch(dir) {
        case 'up':
        case 'down': game.touchDirection.y = 0; break;
        case 'left':
        case 'right': game.touchDirection.x = 0; break;
      }
    });
  });

  document.getElementById('dashButton').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (game.running && !game.paused) {
      game.player.dash();
    }
  });

  // UI Buttons
  document.getElementById('startButton').addEventListener('click', startGame);
  document.getElementById('resumeButton').addEventListener('click', togglePause);
  document.getElementById('restartButton').addEventListener('click', () => {
    hideScreen('pauseScreen');
    startGame();
  });
  document.getElementById('playAgainButton').addEventListener('click', startGame);

  // Audio Toggle
  document.getElementById('audioToggle').addEventListener('click', toggleAudio);
}

// Show/Hide Screens
function showScreen(screenId) {
  document.getElementById(screenId).classList.remove('hidden');
}

function hideScreen(screenId) {
  document.getElementById(screenId).classList.add('hidden');
}

// Start Game
function startGame() {
  hideScreen('startScreen');
  hideScreen('gameOverScreen');
  hideScreen('pauseScreen');

  // Reset game state
  game.running = true;
  game.paused = false;
  game.score = 0;
  game.level = 1;
  game.lives = 3;
  game.frameCount = 0;
  game.fragments = [];
  game.glitches = [];
  game.particles = [];

  // Create player
  game.player = new Player(CONFIG.canvasWidth / 2, CONFIG.canvasHeight - 100);

  // Update UI
  updateUI();

  // Play music
  if (game.audio.music && !game.audio.muted) {
    game.audio.music.play().catch(() => {});
  }

  // Start game loop
  gameLoop();
}

// Toggle Pause
function togglePause() {
  game.paused = !game.paused;
  if (game.paused) {
    showScreen('pauseScreen');
    if (game.audio.music) game.audio.music.pause();
  } else {
    hideScreen('pauseScreen');
    if (game.audio.music && !game.audio.muted) game.audio.music.play().catch(() => {});
    requestAnimationFrame(gameLoop);
  }
}

// Game Over
function gameOver() {
  game.running = false;
  document.getElementById('finalScore').textContent = game.score;
  document.getElementById('finalLevel').textContent = game.level;
  showScreen('gameOverScreen');
  if (game.audio.music) game.audio.music.pause();
}

// Toggle Audio
function toggleAudio() {
  game.audio.muted = !game.audio.muted;
  const btn = document.getElementById('audioToggle');

  if (game.audio.muted) {
    btn.textContent = '🔇';
    btn.classList.add('muted');
    if (game.audio.music) game.audio.music.pause();
  } else {
    btn.textContent = '🔊';
    btn.classList.remove('muted');
    if (game.audio.music && game.running) game.audio.music.play().catch(() => {});
  }
}

// Update UI
function updateUI() {
  document.getElementById('score').textContent = game.score;
  document.getElementById('level').textContent = game.level;
  document.getElementById('lives').textContent = game.lives;
}

// Spawn Entities
function spawnFragment() {
  const x = Math.random() * (CONFIG.canvasWidth - 40) + 20;
  const y = Math.random() * (CONFIG.canvasHeight - 40) + 20;
  game.fragments.push(new Fragment(x, y));
}

function spawnGlitch() {
  game.glitches.push(new Glitch());
}

// Create Particle Explosion
function createExplosion(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    game.particles.push(new Particle(x, y, color));
  }
}

// Draw Background Grid
function drawBackground(ctx) {
  ctx.fillStyle = CONFIG.colors.background;
  ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

  // Animated grid
  ctx.strokeStyle = CONFIG.colors.grid;
  ctx.lineWidth = 1;
  const gridSize = 40;
  const offset = (game.frameCount % gridSize);

  for (let x = -offset; x < CONFIG.canvasWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CONFIG.canvasHeight);
    ctx.stroke();
  }

  for (let y = -offset; y < CONFIG.canvasHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CONFIG.canvasWidth, y);
    ctx.stroke();
  }
}

// Game Loop
function gameLoop() {
  if (!game.running || game.paused) return;

  game.frameCount++;

  // Spawn entities
  if (game.frameCount % CONFIG.spawnRate === 0) {
    spawnGlitch();
  }

  if (game.frameCount % CONFIG.fragmentSpawnRate === 0) {
    spawnFragment();
  }

  // Update
  game.player.update();

  game.fragments.forEach(fragment => fragment.update());

  game.glitches.forEach(glitch => glitch.update());
  game.glitches = game.glitches.filter(glitch => !glitch.isOffScreen());

  game.particles.forEach(particle => particle.update());
  game.particles = game.particles.filter(particle => !particle.isDead());

  // Check collisions - Fragments
  game.fragments.forEach((fragment, index) => {
    if (checkCollision(game.player, fragment)) {
      game.fragments.splice(index, 1);
      game.score += 50 + (game.level - 1) * 10;
      updateUI();
      createExplosion(fragment.x, fragment.y, CONFIG.colors.fragment, 6);

      // Play collect sound
      if (game.audio.collect && !game.audio.muted) {
        game.audio.collect.currentTime = 0;
        game.audio.collect.play().catch(() => {});
      }

      // Level up check
      if (game.score >= game.level * CONFIG.levelUpScore) {
        game.level++;
        updateUI();
      }
    }
  });

  // Check collisions - Glitches
  game.glitches.forEach(glitch => {
    if (checkCollision(game.player, glitch)) {
      game.player.takeDamage();
      createExplosion(glitch.x, glitch.y, CONFIG.colors.glitch, 10);
    }
  });

  // Draw
  drawBackground(game.ctx);

  game.fragments.forEach(fragment => fragment.draw(game.ctx));
  game.glitches.forEach(glitch => glitch.draw(game.ctx));
  game.particles.forEach(particle => particle.draw(game.ctx));
  game.player.draw(game.ctx);

  // Continue loop
  requestAnimationFrame(gameLoop);
}

// Start the game when page loads
window.addEventListener('load', init);
