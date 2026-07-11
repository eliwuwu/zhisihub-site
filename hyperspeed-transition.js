const initHyperspeedTransition = () => {
  const canvas = document.querySelector("#hyperspeedTransition");
  if (!canvas) return;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    window.setTimeout(() => window.location.replace("./thanks.html"), 5000);
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const palette = [
    [239, 222, 183],
    [208, 190, 151],
    [190, 179, 207],
    [246, 237, 216]
  ];
  const streaks = Array.from({ length: window.innerWidth < 760 ? 24 : 42 }, (_, index) => ({
    side: index % 2 === 0 ? -1 : 1,
    lane: 0.7 + ((index * 47) % 100) / 120,
    offset: ((index * 73) % 101) / 101,
    speed: 0.72 + ((index * 29) % 70) / 100,
    width: 0.7 + ((index * 17) % 9) / 10,
    color: palette[index % palette.length]
  }));

  let width = 1;
  let height = 1;
  let renderScale = 0.68;
  let animationFrame = 0;
  let lastFrame = performance.now();
  let travel = 0;
  const startedAt = lastFrame;

  const resize = () => {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight - document.querySelector(".site-header").offsetHeight);
    renderScale = width < 760 ? 0.48 : 0.68;
    canvas.width = Math.max(1, Math.round(width * renderScale));
    canvas.height = Math.max(1, Math.round(height * renderScale));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  };

  const smoothstep = (from, to, value) => {
    const progress = Math.max(0, Math.min(1, (value - from) / (to - from)));
    return progress * progress * (3 - 2 * progress);
  };

  const project = (progress, lateral, curve = 0) => {
    const depth = progress * progress;
    const horizonY = height * 0.38;
    const spread = width * (0.035 + depth * 0.54);
    return {
      x: width * 0.5 + lateral * spread + curve * width * depth,
      y: horizonY + depth * (height - horizonY + 36)
    };
  };

  const drawSegment = (from, to, color, alpha, lineWidth) => {
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
    context.lineWidth = lineWidth;
    context.stroke();
  };

  const drawRoad = () => {
    const horizonY = height * 0.38;
    const floorGradient = context.createLinearGradient(0, horizonY, 0, height);
    floorGradient.addColorStop(0, "rgba(7, 8, 15, 0)");
    floorGradient.addColorStop(1, "rgba(4, 5, 10, 0.88)");
    context.fillStyle = floorGradient;
    context.fillRect(0, horizonY, width, height - horizonY);

    [-1.15, -0.08, 0.08, 1.15].forEach((lateral, index) => {
      const from = project(0.03, lateral);
      const to = project(1.02, lateral);
      drawSegment(from, to, index === 0 || index === 3 ? palette[1] : palette[2], 0.12, 0.8);
    });

    for (let index = 0; index < 15; index += 1) {
      const progress = (index / 15 + travel * 0.46) % 1;
      const endProgress = Math.min(1.04, progress + 0.035 + progress * 0.035);
      [-0.08, 0.08].forEach(lateral => {
        const from = project(progress, lateral);
        const to = project(endProgress, lateral);
        drawSegment(from, to, palette[3], 0.08 + progress * 0.28, 0.6 + progress * 1.8);
      });
    }
  };

  const drawStreaks = elapsed => {
    const curveAmount = Math.sin(elapsed * 0.48) * 0.018;
    context.globalCompositeOperation = "lighter";

    streaks.forEach(streak => {
      const progress = (streak.offset + travel * streak.speed) % 1;
      const tail = Math.max(0, progress - (0.02 + progress * 0.08));
      const lateral = streak.side * streak.lane;
      const from = project(tail, lateral, curveAmount * streak.side);
      const to = project(progress, lateral, curveAmount * streak.side);
      const alpha = Math.sin(progress * Math.PI) * (0.18 + progress * 0.56);

      drawSegment(from, to, streak.color, alpha * 0.2, streak.width * (5 + progress * 9));
      drawSegment(from, to, streak.color, alpha, streak.width * (0.7 + progress * 2.2));
    });

    context.globalCompositeOperation = "source-over";
  };

  const render = now => {
    animationFrame = 0;
    const elapsed = (now - startedAt) / 1000;
    const delta = Math.min(0.034, (now - lastFrame) / 1000);
    lastFrame = now;
    const acceleration = smoothstep(3.65, 4.75, elapsed);
    travel += delta * (0.28 + acceleration * 1.06);

    context.clearRect(0, 0, width, height);
    drawRoad();
    drawStreaks(elapsed);

    if (elapsed >= 4.35) document.documentElement.classList.add("thinking-is-leaving");
    if (!reducedMotion && elapsed < 5.05 && !document.hidden) {
      animationFrame = requestAnimationFrame(render);
    }
  };

  resize();
  window.addEventListener("resize", resize, { passive: true });
  if (reducedMotion) render(startedAt + 1200);
  else animationFrame = requestAnimationFrame(render);

  window.setTimeout(() => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    window.location.replace("./thanks.html");
  }, 5000);
};

initHyperspeedTransition();
