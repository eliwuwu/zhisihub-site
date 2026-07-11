const initLightweightCursorTrail = () => {
  const canvas = document.querySelector("#splashCursorCanvas");
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  const particles = [];
  const maxParticles = 28;
  const mistSprite = document.createElement("canvas");
  mistSprite.width = 96;
  mistSprite.height = 96;
  const mistContext = mistSprite.getContext("2d");
  const mistGradient = mistContext.createRadialGradient(48, 48, 2, 48, 48, 46);
  mistGradient.addColorStop(0, "rgba(244, 235, 216, 0.5)");
  mistGradient.addColorStop(0.32, "rgba(224, 211, 189, 0.3)");
  mistGradient.addColorStop(0.68, "rgba(197, 188, 205, 0.12)");
  mistGradient.addColorStop(1, "rgba(197, 188, 205, 0)");
  mistContext.fillStyle = mistGradient;
  mistContext.fillRect(0, 0, 96, 96);
  let raf = 0;
  let lastX = 0;
  let lastY = 0;
  let hasPointer = false;
  let paused = false;

  const resize = () => {
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    particles.length = 0;
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.opacity = "0";
  };

  const draw = now => {
    raf = 0;
    if (paused || document.hidden) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    while (particles.length && now - particles[0].born > particles[0].duration) particles.shift();

    if (!particles.length) {
      canvas.style.opacity = "0";
      return;
    }

    context.globalCompositeOperation = "screen";
    particles.forEach(particle => {
      const age = Math.min(1, (now - particle.born) / particle.duration);
      const ease = 1 - Math.pow(1 - age, 2);
      const size = particle.size * (1 + ease * 0.72);
      const x = particle.x + particle.vx * ease * 18 - size * 0.5;
      const y = particle.y + particle.vy * ease * 18 - age * 7 - size * 0.5;
      context.globalAlpha = Math.sin(age * Math.PI) * particle.opacity;
      context.drawImage(mistSprite, x, y, size, size);
    });
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";

    canvas.style.opacity = "1";
    raf = requestAnimationFrame(draw);
  };

  const start = () => {
    if (!paused && !raf) raf = requestAnimationFrame(draw);
  };

  const addPoint = event => {
    if (paused || event.pointerType === "touch") return;
    const x = event.clientX;
    const y = event.clientY;
    const dx = hasPointer ? x - lastX : 0;
    const dy = hasPointer ? y - lastY : 0;
    const distance = Math.hypot(dx, dy);

    if (!hasPointer || distance >= 4) {
      const now = performance.now();
      const count = distance > 24 ? 2 : 1;
      for (let index = 0; index < count; index += 1) {
        const offset = count === 1 ? 0 : index / (count - 1) - 0.5;
        particles.push({
          x: x - dx * offset * 0.55 + (Math.random() - 0.5) * 8,
          y: y - dy * offset * 0.55 + (Math.random() - 0.5) * 8,
          vx: Math.max(-1.8, Math.min(1.8, dx * 0.035)) + (Math.random() - 0.5) * 0.7,
          vy: Math.max(-1.8, Math.min(1.8, dy * 0.035)) + (Math.random() - 0.5) * 0.7,
          size: 42 + Math.random() * 34,
          opacity: 0.5 + Math.random() * 0.22,
          duration: 620 + Math.random() * 260,
          born: now
        });
      }
      if (particles.length > maxParticles) particles.splice(0, particles.length - maxParticles);
    }

    lastX = x;
    lastY = y;
    hasPointer = true;
    start();
  };

  resize();
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", addPoint, { passive: true });
  document.addEventListener("pointerleave", () => {
    hasPointer = false;
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  window.addEventListener("founder:gesture-performance", event => {
    paused = Boolean(event.detail?.active);
    if (paused) stop();
  });
};

initLightweightCursorTrail();
