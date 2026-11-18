'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// Traza el rayo (para el power-up y el HUD)
function boltPath() {
  ctx.beginPath();
  ctx.moveTo( 1.5, -8);
  ctx.lineTo(-4,    1);
  ctx.lineTo(-0.5,  1);
  ctx.lineTo(-1.5,  8);
  ctx.lineTo( 4.5, -1.5);
  ctx.lineTo( 1,   -1.5);
  ctx.closePath();
}

// Traza tres chevrones alineados (para el power-up de triple disparo y el HUD)
function tripleIconPath() {
  ctx.beginPath();
  for (let i = -1; i <= 1; i++) {
    ctx.moveTo(-4, i * 5 - 2.5);
    ctx.lineTo( 4, i * 5);
    ctx.lineTo(-4, i * 5 + 2.5);
    ctx.closePath();
  }
}

// Traza el escudo (para el power-up y el HUD)
function shieldPath() {
  ctx.beginPath();
  ctx.moveTo( 0,    -8.5);
  ctx.lineTo( 7,    -5.5);
  ctx.lineTo( 6.2,   2.5);
  ctx.quadraticCurveTo( 4.5, 7.5, 0, 9.5);
  ctx.quadraticCurveTo(-4.5, 7.5, -6.2, 2.5);
  ctx.lineTo(-7,    -5.5);
  ctx.closePath();
}

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Power-ups ─────────────────────────────────────────────────────────────────
const POWERUP_DROP_CHANCE = 0.15;             // ← único lugar para ajustar la probabilidad
const POWERUP_RADIUS      = 11;
const MAX_POWERUPS        = 2;                // recogibles simultáneos en pantalla
const BOOST_MULT          = 2;                // multiplicador de empuje / velocidad tope
const SHIELD_RECOIL       = 70;               // px/s que retrocede la nave al rebotar
const BOUNCE_BOOST        = 1.1;              // pequeño impulso extra del asteroide
const POWERUP_TYPES = {
  speed:  { duration: 5, color: '#ffe14d', rgb: '255,225,77',  label: 'VELOCIDAD ×2',   icon: boltPath },
  shield: { duration: 5, color: '#4de1ff', rgb: '77,225,255',  label: 'ESCUDO',         icon: shieldPath },
  triple: { duration: 5, color: '#c77dff', rgb: '199,125,255', label: 'TRIPLE DISPARO', icon: tripleIconPath },
};
const POWERUP_TYPE_KEYS = Object.keys(POWERUP_TYPES);
const TRIPLE_SHOTS      = 3;                  // proyectiles por ráfaga
const TRIPLE_SPACING    = 18;                 // separación en px entre proyectiles

class PowerUp {
  constructor(x, y, type = 'speed') {
    this.x = x;
    this.y = y;
    this.type = type;
    const cfg = POWERUP_TYPES[type];
    this.color = cfg.color;
    this.rgb   = cfg.rgb;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 40);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = POWERUP_RADIUS;
    this.phase  = rand(0, Math.PI * 2);
    this.dead   = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.phase += dt * 3;
  }

  draw() {
    const pulse = 0.85 + Math.sin(this.phase) * 0.15;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(pulse, pulse);

    // Aro
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.rgb}, 0.12)`;
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Icono
    POWERUP_TYPES[this.type].icon();
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

// ── Rebote del escudo ─────────────────────────────────────────────────────────
function bounceAsteroid(a) {
  let dx = a.x - ship.x;
  let dy = a.y - ship.y;
  let d  = Math.hypot(dx, dy);
  if (d < 0.001) {
    const angle = rand(0, Math.PI * 2);
    dx = Math.cos(angle);
    dy = Math.sin(angle);
    d  = 1;
  }
  const nx = dx / d;
  const ny = dy / d;

  // Separar el asteroide para que no vuelva a solaparse en el siguiente frame
  const minDist = ship.radius + a.radius * 0.82 + 2;
  a.x = wrap(ship.x + nx * minDist, W);
  a.y = wrap(ship.y + ny * minDist, H);

  // Reflejar su velocidad si venía hacia la nave
  const vn = a.vx * nx + a.vy * ny;
  if (vn < 0) {
    a.vx = (a.vx - 2 * vn * nx) * BOUNCE_BOOST;
    a.vy = (a.vy - 2 * vn * ny) * BOUNCE_BOOST;
  }

  // Pequeño retroceso de la nave en sentido contrario
  ship.vx -= nx * SHIELD_RECOIL;
  ship.vy -= ny * SHIELD_RECOIL;
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.boost         = 0;
    this.shield        = 0;
    this.shieldHit     = 0;
    this.shieldPhase   = 0;
    this.triple        = 0;
    this.pickupFlash   = 0;
    this.pickupText    = '';
    this.pickupColor   = '#fff';
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.boost         > 0) this.boost         -= dt;
    if (this.shield        > 0) this.shield        -= dt;
    if (this.shieldHit     > 0) this.shieldHit     -= dt;
    if (this.triple        > 0) this.triple        -= dt;
    if (this.pickupFlash   > 0) this.pickupFlash   -= dt;
    this.shieldPhase += dt * 4;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;
    const boostMult = this.boost > 0 ? BOOST_MULT : 1;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * boostMult * dt;
      this.vy += Math.sin(this.angle) * THRUST * boostMult * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE  = 21;
    const shots = this.triple > 0 ? TRIPLE_SHOTS : 1;
    const out   = [];
    for (let i = 0; i < shots; i++) {
      const d = NOSE + i * TRIPLE_SPACING;
      out.push(new Bullet(
        wrap(this.x + Math.cos(this.angle) * d, W),
        wrap(this.y + Math.sin(this.angle) * d, H),
        this.angle
      ));
    }
    return out;
  }

  draw() {
    if (this.dead) return;

    // Aviso flotante al recoger un power-up
    if (this.pickupFlash > 0) {
      const alpha = Math.min(1, this.pickupFlash / 0.35);
      const rise  = (0.9 - this.pickupFlash) * 24;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = this.pickupColor;
      ctx.font        = 'bold 14px monospace';
      ctx.textAlign   = 'center';
      ctx.fillText(this.pickupText, this.x, this.y - 28 - rise);
      ctx.restore();
    }

    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const boosted = this.boost > 0;
    const tripled = this.triple > 0;
    const shipColor = boosted
      ? POWERUP_TYPES.speed.color
      : tripled ? POWERUP_TYPES.triple.color : '#fff';
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = shipColor;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo( 20,  0);   // nariz
    ctx.lineTo(-12, -9);   // ala izquierda
    ctx.lineTo( -7,  0);   // muesca trasera
    ctx.lineTo(-12,  9);   // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(boosted ? 12 : 6, boosted ? 24 : 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = boosted
        ? 'rgba(255, 225, 77, 0.9)'
        : 'rgba(255, 130, 0, 0.85)';
      ctx.stroke();
    }

    ctx.restore();

    // Escudo activo
    if (this.shield > 0) {
      const blink = this.shield < 2 && Math.floor(this.shield * 8) % 2 === 0;
      const pulse = 19 + Math.sin(this.shieldPhase) * 1.5;
      ctx.save();
      ctx.globalAlpha = blink ? 0.3 : 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${POWERUP_TYPES.shield.rgb}, 0.08)`;
      ctx.fill();
      ctx.strokeStyle = POWERUP_TYPES.shield.color;
      ctx.lineWidth   = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // Onda al romperse el escudo
    if (this.shieldHit > 0) {
      const t = 1 - this.shieldHit / 0.35;
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 20 + t * 18, 0, Math.PI * 2);
      ctx.strokeStyle = POWERUP_TYPES.shield.color;
      ctx.lineWidth   = 2;
      ctx.stroke();
      ctx.restore();
    }
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color = '255,255,255') {
    this.x  = x;
    this.y  = y;
    this.color = color;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(${this.color},${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8, color) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead        = true;
  ship.boost       = 0;
  ship.shield      = 0;
  ship.shieldHit   = 0;
  ship.triple      = 0;
  ship.pickupFlash = 0;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    powerups.forEach(p => p.update(dt));
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  powerups.forEach(p => p.update(dt));
  particles.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        if (powerups.length < MAX_POWERUPS && Math.random() < POWERUP_DROP_CHANCE) {
          const type = POWERUP_TYPE_KEYS[randInt(0, POWERUP_TYPE_KEYS.length - 1)];
          powerups.push(new PowerUp(a.x, a.y, type));
        }
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (ship.shield > 0) {
          bounceAsteroid(a);
          ship.shield    = 0;   // el escudo se consume al instante
          ship.shieldHit = 0.35;
          explode((ship.x + a.x) / 2, (ship.y + a.y) / 2, 8, POWERUP_TYPES.shield.rgb);
        } else {
          killShip();
        }
        break;
      }
    }
  }

  // Nave vs power-up
  if (!ship.dead) {
    for (const p of powerups) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        const cfg = POWERUP_TYPES[p.type];
        if (p.type === 'speed')       ship.boost  += cfg.duration;
        else if (p.type === 'shield') ship.shield += cfg.duration;
        else                          ship.triple += cfg.duration;
        ship.pickupFlash = 0.9;
        ship.pickupText  = `+${cfg.duration}s`;
        ship.pickupColor = cfg.color;
        explode(p.x, p.y, 6, cfg.rgb);
      }
    }
  }
  powerups = powerups.filter(p => !p.dead);

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawPowerUpStatus(y, iconPath, color, label, timeLeft) {
  const blink = timeLeft < 2 && Math.floor(timeLeft * 8) % 2 === 0;
  ctx.save();
  ctx.globalAlpha = blink ? 0.35 : 1;
  ctx.fillStyle   = color;

  ctx.save();
  ctx.translate(22, y - 5);
  ctx.scale(0.85, 0.85);
  iconPath();
  ctx.fill();
  ctx.restore();

  ctx.font      = '15px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`${label}  ${timeLeft.toFixed(1)}s`, 34, y);
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Indicadores de power-ups activos (se apilan si coinciden)
  let statusY = 48;
  if (ship.boost > 0) {
    drawPowerUpStatus(statusY, POWERUP_TYPES.speed.icon, POWERUP_TYPES.speed.color,
                      POWERUP_TYPES.speed.label, ship.boost);
    statusY += 19;
  }
  if (ship.shield > 0) {
    drawPowerUpStatus(statusY, POWERUP_TYPES.shield.icon, POWERUP_TYPES.shield.color,
                      POWERUP_TYPES.shield.label, ship.shield);
    statusY += 19;
  }
  if (ship.triple > 0) {
    drawPowerUpStatus(statusY, POWERUP_TYPES.triple.icon, POWERUP_TYPES.triple.color,
                      POWERUP_TYPES.triple.label, ship.triple);
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerups.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
