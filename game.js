
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 480;
canvas.height = 800;

const W = 480, H = 800;
const WHITE = "#f0f5ff";
const BLACK = "#080c1e";
const BLUE = "#419bff";
const RED = "#ff4b5a";
const YELLOW = "#ffdc50";

const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");
const controls = document.querySelector(".controls");
const hint = document.querySelector(".hint");

if (controls) controls.style.display = "none";
if (hint) hint.textContent = "Свайпай для перемещения";

const player = { x: W / 2, y: H - 105, w: 44, h: 44 };
let bullets = [];
let enemies = [];
let stars = Array.from({length: 90}, () => ({
  x: Math.random() * W,
  y: Math.random() * H
}));

let score = 0;
let spawnTimer = 0;
let shotTimer = 0;
let state = "menu";
let lastTime = 0;
let dragging = false;
let pointerX = null;
let pausedFrom = "playing";

function resetGame() {
  player.x = W / 2;
  bullets = [];
  enemies = [];
  score = 0;
  spawnTimer = 0;
  shotTimer = 0;
  scoreElement.textContent = score;
  livesElement.textContent = "∞";
}

function text(msg, size, color, x, y) {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(msg, x, y);
}

function button(msg, y) {
  const r = {x: W / 2 - 120, y: y - 30, w: 240, h: 60};
  ctx.fillStyle = "#234173";
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, 14);
  ctx.fill();
  ctx.stroke();
  text(msg, 25, WHITE, W / 2, y);
  return r;
}

function hitButton(x, y, r) {
  return x >= r.x && x <= r.x + r.w &&
         y >= r.y && y <= r.y + r.h;
}

function drawBackground(dt) {
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#647daF";

  for (const s of stars) {
    ctx.fillRect(s.x, s.y, 2, 2);
    s.y += 2 * dt / 16.67;
    if (s.y >= H) {
      s.y = 0;
      s.x = Math.random() * W;
    }
  }
}

function drawPlayer() {
  const x = player.x, y = player.y;
  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.moveTo(x, y - 29);
  ctx.lineTo(x - 23, y + 22);
  ctx.lineTo(x, y + 12);
  ctx.lineTo(x + 23, y + 22);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.moveTo(x, y - 15);
  ctx.lineTo(x - 7, y + 5);
  ctx.lineTo(x + 7, y + 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = YELLOW;
  ctx.beginPath();
  ctx.arc(x, y + 25, 5, 0, Math.PI * 2);
  ctx.fill();
}

function spawnEnemy() {
  const x = 25 + Math.random() * (W - 50);
  enemies.push({
    x, baseX: x, y: -25,
    speed: 2 + Math.random() * 2,
    phase: Math.random() * Math.PI * 2,
    moving: Math.random() < 0.55
  });
}

function drawEnemy(e) {
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.moveTo(e.x, e.y + 19);
  ctx.lineTo(e.x - 19, e.y - 11);
  ctx.lineTo(e.x, e.y - 19);
  ctx.lineTo(e.x + 19, e.y - 11);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = YELLOW;
  ctx.beginPath();
  ctx.arc(e.x - 7, e.y, 3, 0, Math.PI * 2);
  ctx.arc(e.x + 7, e.y, 3, 0, Math.PI * 2);
  ctx.fill();
}

function pauseGame() {
  if (state === "playing") {
    pausedFrom = "playing";
    state = "paused";
  }
}

function update(dt) {
  spawnTimer += dt;
  shotTimer += dt;

  if (pointerX !== null && dragging) {
    player.x += (pointerX - player.x) * Math.min(1, dt / 35);
  }
  player.x = Math.max(24, Math.min(W - 24, player.x));

  if (spawnTimer > 700) {
    spawnEnemy();
    spawnTimer = 0;
  }

  if (shotTimer > 260) {
    bullets.push({x: player.x, y: player.y - 35});
    shotTimer = 0;
  }

  for (const b of bullets) b.y -= 10 * dt / 16.67;
  bullets = bullets.filter(b => b.y > -20);

  for (const e of enemies) {
    e.y += e.speed * dt / 16.67;
    if (e.moving) {
      e.phase += 0.055 * dt / 16.67;
      e.x = e.baseX + 55 * Math.sin(e.phase);
      e.x = Math.max(19, Math.min(W - 19, e.x));
    }

    if (Math.abs(e.x - player.x) < 37 &&
        Math.abs(e.y - player.y) < 37) {
      state = "gameover";
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];

    if (e.y > H + 25) {
      enemies.splice(i, 1);
      continue;
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (Math.abs(e.x - b.x) < 20 &&
          Math.abs(e.y - b.y) < 23) {
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        score++;
        scoreElement.textContent = score;
        break;
      }
    }
  }
}

function drawPlaying() {
  for (const b of bullets) {
    ctx.fillStyle = YELLOW;
    ctx.beginPath();
    ctx.roundRect(b.x - 3, b.y - 9, 6, 18, 3);
    ctx.fill();
  }

  for (const e of enemies) drawEnemy(e);
  drawPlayer();

  text("Score: " + score, 30, WHITE, 80, 32);

  ctx.fillStyle = "#234173";
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(W - 75, 10, 65, 44, 10);
  ctx.fill();
  ctx.stroke();
  text("Ⅱ", 30, WHITE, W - 42, 32);
}

function drawMenu() {
  text("SPACE", 58, WHITE, W / 2, H / 2 - 110);
  text("DEFENDER", 58, BLUE, W / 2, H / 2 - 55);
  button("START", H / 2 + 55);
  text("Свайпай для перемещения", 28, WHITE, W / 2, H / 2 + 130);
}

function drawPaused() {
  text("PAUSED", 54, WHITE, W / 2, H / 2 - 100);
  button("CONTINUE", H / 2);
  button("MAIN MENU", H / 2 + 85);
}

function drawGameOver() {
  text("GAME OVER", 48, RED, W / 2, H / 2 - 100);
  text("Score: " + score, 34, WHITE, W / 2, H / 2 - 45);
  button("RESTART", H / 2 + 30);
  button("MAIN MENU", H / 2 + 105);
}

function frame(now) {
  const dt = Math.min(now - (lastTime || now), 40);
  lastTime = now;

  drawBackground(dt);

  if (state === "playing") {
    update(dt);
    drawPlaying();
  } else if (state === "menu") {
    drawMenu();
  } else if (state === "paused") {
    drawPaused();
  } else {
    drawGameOver();
  }

  requestAnimationFrame(frame);
}

function canvasPoint(event) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - r.left) * W / r.width,
    y: (event.clientY - r.top) * H / r.height
  };
}

canvas.addEventListener("pointerdown", event => {
  event.preventDefault();
  const p = canvasPoint(event);

  if (state === "playing") {
    if (p.y < 65 && p.x > W - 90) {
      pauseGame();
      return;
    }
    dragging = true;
    pointerX = p.x;
    try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
    return;
  }

  if (state === "menu") {
    if (hitButton(p.x, p.y, {
      x: W / 2 - 120, y: H / 2 + 25, w: 240, h: 60
    })) {
      resetGame();
      state = "playing";
    }
  } else if (state === "paused") {
    if (hitButton(p.x, p.y, {
      x: W / 2 - 120, y: H / 2 - 30, w: 240, h: 60
    })) {
      state = "playing";
    } else if (hitButton(p.x, p.y, {
      x: W / 2 - 120, y: H / 2 + 55, w: 240, h: 60
    })) {
      state = "menu";
    }
  } else if (state === "gameover") {
    if (hitButton(p.x, p.y, {
      x: W / 2 - 120, y: H / 2, w: 240, h: 60
    })) {
      resetGame();
      state = "playing";
    } else if (hitButton(p.x, p.y, {
      x: W / 2 - 120, y: H / 2 + 75, w: 240, h: 60
    })) {
      state = "menu";
    }
  }
});

canvas.addEventListener("pointermove", event => {
  if (!dragging) return;
  pointerX = canvasPoint(event).x;
});
function stopDrag() {
  dragging = false;
  pointerX = null;
}
canvas.addEventListener("pointerup", stopDrag);
canvas.addEventListener("pointercancel", stopDrag);
canvas.addEventListener("lostpointercapture", stopDrag);

window.addEventListener("keydown", event => {
  if (event.code === "Escape" || event.code === "Space") {
    if (state === "playing") state = "paused";
    else if (state === "paused") state = "playing";
  }
});

livesElement.textContent = "∞";
requestAnimationFrame(frame);

