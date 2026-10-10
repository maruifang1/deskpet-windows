(function () {
  "use strict";

  const canvas = document.getElementById("fx");
  const ctx = canvas ? canvas.getContext("2d") : null;
  let particles = [];
  let ambient = null;
  let raf = 0;
  let lastTime = 0;

  function resize() {
    if (!canvas) return;
    canvas.width = canvas.clientWidth || window.innerWidth;
    canvas.height = canvas.clientHeight || window.innerHeight;
  }

  function spawnHeart() {
    particles.push({
      kind: "heart",
      x: Math.random() * canvas.width,
      y: canvas.height * (0.55 + Math.random() * 0.25),
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(0.2 + Math.random() * 0.35),
      size: 7 + Math.random() * 5,
      life: 140 + Math.random() * 80,
      maxLife: 0,
    });
  }

  function spawnRain() {
    particles.push({
      kind: "rain",
      x: Math.random() * canvas.width,
      y: -8,
      vy: 3.5 + Math.random() * 2.5,
      length: 7 + Math.random() * 6,
      life: 120,
      maxLife: 120,
    });
  }

  function spawnSnow() {
    particles.push({
      kind: "snow",
      x: Math.random() * canvas.width,
      y: -4,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 0.7 + Math.random() * 0.6,
      size: 1.5 + Math.random() * 1.5,
      life: 240 + Math.random() * 120,
      maxLife: 0,
    });
  }

  function spawnStar() {
    particles.push({
      kind: "star",
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.7,
      phase: Math.random() * Math.PI * 2,
      size: 1 + Math.random() * 1.5,
      life: 120 + Math.random() * 120,
      maxLife: 0,
    });
  }

  function updateParticle(p, dt) {
    p.life -= dt;
    if (p.kind === "heart") {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 0.0003 * dt;
    } else if (p.kind === "rain") {
      p.y += p.vy * dt;
    } else if (p.kind === "snow") {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    } else if (p.kind === "star") {
      p.phase += 0.02 * dt;
    }
  }

  function drawHeart(p, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(244, 154, 180, 0.9)";
    ctx.translate(p.x, p.y);
    ctx.scale(p.size / 16, p.size / 16);
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.bezierCurveTo(-8, -2, -6, -9, 0, -2);
    ctx.bezierCurveTo(6, -9, 8, -2, 0, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawParticle(p) {
    if (p.life <= 0) return;
    const alpha = Math.max(0, Math.min(1, p.life / 40));
    if (p.kind === "heart") {
      drawHeart(p, alpha);
    } else if (p.kind === "rain") {
      ctx.strokeStyle = `rgba(185, 205, 225, ${alpha * 0.55})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 1, p.y + p.length);
      ctx.stroke();
    } else if (p.kind === "snow") {
      ctx.fillStyle = `rgba(230, 235, 240, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "star") {
      const twinkle = 0.5 + 0.5 * Math.sin(p.phase);
      const radius = p.size * 3;
      ctx.strokeStyle = `rgba(220, 228, 240, ${alpha * 0.8 * twinkle})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x - radius, p.y);
      ctx.lineTo(p.x + radius, p.y);
      ctx.moveTo(p.x, p.y - radius);
      ctx.lineTo(p.x, p.y + radius);
      ctx.stroke();
    }
  }

  function loop(time) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(50, time - lastTime);
    lastTime = time;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (ambient === "rain" && Math.random() < 0.3) spawnRain();
    else if (ambient === "snow" && Math.random() < 0.1) spawnSnow();
    else if (ambient === "stars" && Math.random() < 0.03) spawnStar();
    for (const p of particles) updateParticle(p, dt);
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) drawParticle(p);
    if (!particles.length && !ambient) stop();
  }

  function start() {
    if (raf || !ctx) return;
    lastTime = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function burst(kind) {
    if (!ctx) return;
    if (kind === "hearts") {
      for (let i = 0; i < 10; i += 1) spawnHeart();
    }
    start();
  }

  function setAmbient(kind) {
    if (ambient === kind) return;
    ambient = kind;
    if (kind) start();
    else if (!particles.length) stop();
  }

  window.addEventListener("resize", resize);
  resize();

  window.PetFx = {
    burst,
    setAmbient,
  };
})();
