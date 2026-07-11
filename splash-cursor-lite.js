const initLightweightCursorTrail = () => {
  const canvas = document.querySelector("#splashCursorCanvas");
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  const points = [];
  const maxPoints = 22;
  const trailDuration = 520;
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
    points.length = 0;
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.opacity = "0";
  };

  const draw = now => {
    raf = 0;
    if (paused || document.hidden) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    while (points.length && now - points[0].born > trailDuration) points.shift();

    if (!points.length) {
      canvas.style.opacity = "0";
      return;
    }

    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    points.forEach((point, index) => {
      const age = Math.min(1, (now - point.born) / trailDuration);
      const drift = age * age * 5;
      const x = point.x + point.vx * age * 7;
      const y = point.y + point.vy * age * 7 + drift;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });

    const newest = points[points.length - 1];
    const newestAge = Math.min(1, (now - newest.born) / trailDuration);
    const alpha = Math.max(0, 1 - newestAge);
    context.strokeStyle = `rgba(221, 199, 151, ${0.12 * alpha})`;
    context.lineWidth = 12;
    context.stroke();
    context.strokeStyle = `rgba(238, 220, 179, ${0.42 * alpha})`;
    context.lineWidth = 2;
    context.stroke();

    context.beginPath();
    context.arc(newest.x, newest.y, 2.4 + alpha * 1.8, 0, Math.PI * 2);
    context.fillStyle = `rgba(244, 228, 190, ${0.64 * alpha})`;
    context.fill();

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

    if (!hasPointer || distance >= 3) {
      points.push({
        x,
        y,
        vx: Math.max(-2, Math.min(2, dx * 0.08)),
        vy: Math.max(-2, Math.min(2, dy * 0.08)),
        born: performance.now()
      });
      if (points.length > maxPoints) points.splice(0, points.length - maxPoints);
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
