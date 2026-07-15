const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mix = (from, to, amount) => from + (to - from) * amount;

const initHeroPrism = () => {
  const container = document.querySelector("#heroPrism");
  if (!container) return;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  container.appendChild(canvas);

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true
  });

  if (!gl) {
    container.classList.add("is-static");
    return;
  }

  const vertexSource = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision highp float;

    uniform vec2 uResolution;
    uniform vec2 uOffset;
    uniform float uTime;
    uniform float uScale;

    vec4 tanh4(vec4 value) {
      vec4 e2x = exp(2.0 * value);
      return (e2x - 1.0) / (e2x + 1.0);
    }

    float hash(vec2 point) {
      return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float prismDistance(vec3 point) {
      const float baseHalf = 2.75;
      const float prismHeight = 3.5;
      vec3 q = vec3(
        abs(point.x) / baseHalf,
        abs(point.y) / prismHeight,
        abs(point.z) / baseHalf
      );
      float octahedron = (q.x + q.y + q.z - 1.0) * 1.5877;
      return max(octahedron, -point.y);
    }

    void main() {
      vec2 field = (gl_FragCoord.xy - 0.5 * uResolution - uOffset)
        / (uResolution.y * 0.09 * uScale);

      float z = 5.0;
      vec4 light = vec4(0.0);
      vec3 point = vec3(0.0);
      float time = uTime * 0.5;
      mat2 wobble = mat2(
        cos(time), cos(time + 33.0),
        cos(time + 11.0), cos(time)
      );

      const int steps = 76;
      for (int i = 0; i < steps; i++) {
        point = vec3(field, z);
        point.xz = point.xz * wobble;
        vec3 shifted = point;
        shifted.y += 0.875;
        float distanceStep = 0.1 + 0.2 * abs(prismDistance(shifted));
        z -= distanceStep;
        light += (sin((point.y + z) + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0)
          / distanceStep;
      }

      light = tanh4(light * light * 0.0000072);
      float energy = clamp(max(light.r, max(light.g, light.b)), 0.0, 1.0);
      float luminance = dot(light.rgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 color = mix(vec3(luminance), light.rgb, 0.96);
      color *= vec3(0.96, 1.0, 1.04);
      color *= energy * mix(0.72, 0.92, energy);

      float neutralLight = min(light.r, min(light.g, light.b));
      float bottomZone = 1.0 - smoothstep(0.08, 0.38, gl_FragCoord.y / uResolution.y);
      float whiteBase = smoothstep(0.52, 0.9, neutralLight) * bottomZone;
      float floorEnergy = smoothstep(0.22, 0.86, energy) * bottomZone;
      color = mix(color, color * vec3(0.78, 0.94, 1.06), whiteBase * 0.6);
      color *= mix(1.0, 0.55, whiteBase);
      color *= mix(1.0, 0.72, floorEnergy);

      float grain = hash(gl_FragCoord.xy + vec2(uTime * 0.07));
      color += (grain - 0.5) * 0.014 * energy;
      float alpha = smoothstep(0.04, 0.55, energy) * 0.72;
      alpha *= mix(1.0, 0.55, whiteBase);
      alpha *= mix(1.0, 0.68, floorEnergy);

      vec2 screenUv = gl_FragCoord.xy / uResolution.xy;
      float shoulderDistance = abs(screenUv.x - 0.68);
      float upperShoulders = smoothstep(0.055, 0.14, shoulderDistance)
        * (1.0 - smoothstep(0.36, 0.48, shoulderDistance))
        * smoothstep(0.42, 0.72, screenUv.y);
      color *= 1.0 + upperShoulders * 0.2;
      alpha *= 1.0 + upperShoulders * 0.124;

      gl_FragColor = vec4(clamp(color, 0.0, 1.0), alpha);
    }
  `;

  const compileShader = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) {
    container.classList.add("is-static");
    canvas.remove();
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    container.classList.add("is-static");
    canvas.remove();
    return;
  }

  const triangle = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );

  gl.useProgram(program);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.BLEND);

  const resolutionUniform = gl.getUniformLocation(program, "uResolution");
  const offsetUniform = gl.getUniformLocation(program, "uOffset");
  const timeUniform = gl.getUniformLocation(program, "uTime");
  const scaleUniform = gl.getUniformLocation(program, "uScale");

  let width = 1;
  let height = 1;
  let dpr = 1;
  let raf = 0;
  let visible = true;
  let lastRenderAt = 0;
  const startTime = performance.now();

  const resize = () => {
    const rect = container.getBoundingClientRect();
    dpr = 0.6;
    width = Math.max(1, Math.round(rect.width * dpr));
    height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  };

  const render = (now) => {
    raf = 0;
    if (!motionQuery.matches && now - lastRenderAt < 42) {
      if (visible && !document.hidden) raf = requestAnimationFrame(render);
      return;
    }
    lastRenderAt = now;
    resize();
    const mobile = container.clientWidth < 760;
    const elapsed = motionQuery.matches ? 0.7 : (now - startTime) * 0.001;
    gl.useProgram(program);
    gl.uniform2f(resolutionUniform, width, height);
    gl.uniform2f(
      offsetUniform,
      width * (mobile ? 0.08 : 0.18),
      height * (mobile ? 0.015 : 0.045)
    );
    gl.uniform1f(timeUniform, elapsed);
    gl.uniform1f(scaleUniform, mobile ? 2.15 : 2.55);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (visible && !motionQuery.matches && !document.hidden) {
      raf = requestAnimationFrame(render);
    }
  };

  const start = () => {
    if (!raf) raf = requestAnimationFrame(render);
  };

  const observer = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
    if (visible) start();
    else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }, { threshold: 0.04 });

  observer.observe(container);
  new ResizeObserver(start).observe(container);
  document.addEventListener("visibilitychange", start);
  start();
};

const initFounderLightRays = () => {
  const section = document.querySelector("#founders");
  const cards = Array.from(document.querySelectorAll("#founders .founder-card"));
  if (!section || !cards.length) return;

  const colors = [
    [201, 170, 120],
    [141, 184, 201],
    [155, 139, 197],
    [152, 188, 168],
    [197, 143, 141]
  ];

  const states = cards.map((card, index) => {
    const canvas = document.createElement("canvas");
    canvas.className = "founder-rays-canvas";
    canvas.setAttribute("aria-hidden", "true");
    card.prepend(canvas);

    const state = {
      card,
      canvas,
      context: canvas.getContext("2d"),
      color: colors[index],
      width: 1,
      height: 1,
      dpr: 1,
      pointerX: 0.5,
      pointerY: 0.42,
      smoothX: 0.5,
      smoothY: 0.42,
      intensity: 0.22,
      active: false
    };

    const setPointer = (event) => {
      const rect = card.getBoundingClientRect();
      state.pointerX = clamp((event.clientX - rect.left) / rect.width, 0.08, 0.92);
      state.pointerY = clamp((event.clientY - rect.top) / rect.height, 0.08, 0.92);
    };

    card.addEventListener("pointerenter", (event) => {
      state.active = true;
      setPointer(event);
      card.classList.add("is-ray-active");
    });
    card.addEventListener("pointermove", setPointer, { passive: true });
    card.addEventListener("pointerleave", () => {
      state.active = false;
      state.pointerX = 0.5;
      state.pointerY = 0.42;
      card.classList.remove("is-ray-active");
    });
    card.addEventListener("focusin", () => {
      state.active = true;
      card.classList.add("is-ray-active");
    });
    card.addEventListener("focusout", () => {
      state.active = false;
      card.classList.remove("is-ray-active");
    });

    return state;
  });

  let visible = false;
  let raf = 0;
  let lastRenderAt = 0;
  const startTime = performance.now();

  const resizeState = (state) => {
    const rect = state.card.getBoundingClientRect();
    state.dpr = 0.75;
    state.width = Math.max(1, Math.round(rect.width * state.dpr));
    state.height = Math.max(1, Math.round(rect.height * state.dpr));
    if (state.canvas.width !== state.width || state.canvas.height !== state.height) {
      state.canvas.width = state.width;
      state.canvas.height = state.height;
    }
  };

  const drawRays = (state, now) => {
    const { context: ctx, width, height, color } = state;
    if (!ctx) return;

    state.smoothX = mix(state.smoothX, state.pointerX, state.active ? 0.12 : 0.045);
    state.smoothY = mix(state.smoothY, state.pointerY, state.active ? 0.12 : 0.045);
    const activeIntensity = 0.92 + state.pointerY * 0.48;
    state.intensity = mix(state.intensity, state.active ? activeIntensity : 0.22, 0.08);

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.filter = `blur(${Math.max(5, width * 0.025)}px)`;

    const anchorX = state.smoothX * width;
    const anchorY = height * 1.1;
    const targetX = state.smoothX * width;
    const targetY = height * 0.36;
    const baseAngle = Math.atan2(targetY - anchorY, targetX - anchorX);
    const time = motionQuery.matches ? 0.8 : (now - startTime) * 0.00032;

    for (let ray = 0; ray < 5; ray += 1) {
      const spread = (ray - 2) * 0.095 + Math.sin(time + ray * 1.7) * 0.016;
      const angle = baseAngle + spread;
      const length = height * (1.08 + ray * 0.035);
      const endX = anchorX + Math.cos(angle) * length;
      const endY = anchorY + Math.sin(angle) * length;
      const halfWidth = width * (0.08 + ray * 0.012);
      const normalX = Math.cos(angle + Math.PI * 0.5) * halfWidth;
      const normalY = Math.sin(angle + Math.PI * 0.5) * halfWidth;
      const alpha = (0.028 + ray * 0.007) * state.intensity;
      const gradient = ctx.createLinearGradient(anchorX, anchorY, endX, endY);
      gradient.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha * 1.8})`);
      gradient.addColorStop(0.48, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`);
      gradient.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(anchorX, anchorY);
      ctx.lineTo(endX + normalX, endY + normalY);
      ctx.lineTo(endX - normalX, endY - normalY);
      ctx.closePath();
      ctx.fill();
    }

    const spotlight = ctx.createRadialGradient(
      targetX,
      targetY,
      0,
      targetX,
      targetY,
      Math.max(width, height) * 0.62
    );
    spotlight.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${0.28 * state.intensity})`);
    spotlight.addColorStop(0.42, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${0.09 * state.intensity})`);
    spotlight.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);
    ctx.fillStyle = spotlight;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  };

  const render = (now) => {
    raf = 0;
    if (document.documentElement.classList.contains("gesture-performance-mode")) return;
    const hasActiveCard = states.some((state) => state.active);
    const frameInterval = hasActiveCard ? 33 : 100;
    if (!motionQuery.matches && now - lastRenderAt < frameInterval) {
      if (visible && !document.hidden) raf = requestAnimationFrame(render);
      return;
    }
    lastRenderAt = now;
    states.forEach((state) => {
      resizeState(state);
      drawRays(state, now);
    });
    if (visible && !motionQuery.matches && !document.hidden) {
      raf = requestAnimationFrame(render);
    }
  };

  const start = () => {
    if (!raf) raf = requestAnimationFrame(render);
  };

  const observer = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? false;
    if (visible) start();
    else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }, { threshold: 0.06 });

  observer.observe(section);
  new ResizeObserver(start).observe(section);
  document.addEventListener("visibilitychange", start);
  window.addEventListener("founder:gesture-performance", (event) => {
    if (event.detail?.active) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else if (visible) {
      start();
    }
  });
  start();
};

const initSiteGalaxy = () => {
  const container = document.querySelector("#siteGalaxy");
  if (!container || container.dataset.galaxyExact === "true") return;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  container.appendChild(canvas);

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false
  });

  if (!gl) {
    container.classList.add("is-static");
    return;
  }

  const vertexSource = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision highp float;

    uniform vec2 uResolution;
    uniform vec2 uMouse;
    uniform float uMouseActive;
    uniform float uTime;

    #define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)

    float hash21(vec2 point) {
      point = fract(point * vec2(123.34, 456.21));
      point += dot(point, point + 45.32);
      return fract(point.x * point.y);
    }

    float starShape(vec2 uv, float flare) {
      float distanceToStar = max(0.001, length(uv));
      float star = 0.014 / distanceToStar;
      float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1050.0));
      star += rays * flare * 0.22;
      uv *= MAT45;
      rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1050.0));
      star += rays * flare * 0.075;
      return star * smoothstep(1.0, 0.18, distanceToStar);
    }

    vec3 starLayer(vec2 uv, float layerTime) {
      vec3 color = vec3(0.0);
      vec2 grid = fract(uv) - 0.5;
      vec2 cell = floor(uv);

      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 offset = vec2(float(x), float(y));
          vec2 starId = cell + offset;
          float seed = hash21(starId);
          float size = fract(seed * 345.32);
          float flare = smoothstep(0.92, 1.0, size);
          vec2 drift = vec2(
            sin(seed * 34.0 + layerTime * 0.18),
            cos(seed * 38.0 + layerTime * 0.13)
          ) * 0.1;
          float star = starShape(grid - offset - drift, flare);
          float twinkle = 0.88 + 0.12 * sin(layerTime * 0.42 + seed * 6.2831);

          vec3 violet = vec3(0.65, 0.59, 0.86);
          vec3 gold = vec3(0.88, 0.72, 0.47);
          vec3 pearl = vec3(0.86, 0.9, 1.0);
          vec3 base = mix(violet, gold, smoothstep(0.36, 0.82, seed));
          base = mix(base, pearl, smoothstep(0.92, 1.0, size) * 0.32);
          color += star * size * twinkle * base;
        }
      }

      return color;
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
      vec2 mouseUv = (uMouse * uResolution - 0.5 * uResolution) / uResolution.y;
      vec2 away = uv - mouseUv + vec2(0.0001);
      float mouseDistance = length(away);
      uv += normalize(away) * (0.038 / (mouseDistance + 0.18)) * uMouseActive;

      float rotation = uTime * 0.011;
      mat2 rotationMatrix = mat2(
        cos(rotation), -sin(rotation),
        sin(rotation), cos(rotation)
      );
      uv = rotationMatrix * uv;

      vec3 color = vec3(0.0);
      for (int layer = 0; layer < 4; layer++) {
        float layerIndex = float(layer) / 4.0;
        float depth = fract(layerIndex + uTime * 0.014);
        float scale = mix(20.0, 0.72, depth);
        float fade = depth * smoothstep(1.0, 0.86, depth);
        color += starLayer(uv * scale + layerIndex * 453.32, uTime) * fade;
      }

      float alpha = smoothstep(0.0, 0.24, length(color));
      gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.84));
    }
  `;

  const compileShader = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) {
    container.classList.add("is-static");
    canvas.remove();
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    container.classList.add("is-static");
    canvas.remove();
    return;
  }

  const triangle = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );

  gl.useProgram(program);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  const resolutionUniform = gl.getUniformLocation(program, "uResolution");
  const mouseUniform = gl.getUniformLocation(program, "uMouse");
  const mouseActiveUniform = gl.getUniformLocation(program, "uMouseActive");
  const timeUniform = gl.getUniformLocation(program, "uTime");

  let width = 1;
  let height = 1;
  let raf = 0;
  let mouseX = 0.5;
  let mouseY = 0.5;
  let targetMouseX = 0.5;
  let targetMouseY = 0.5;
  let mouseActive = 0;
  let targetMouseActive = 0;
  const startTime = performance.now();

  const resize = () => {
    const rect = container.getBoundingClientRect();
    const mobile = rect.width < 760;
    const dpr = Math.min(mobile ? 1.05 : 1.25, window.devicePixelRatio || 1);
    width = Math.max(1, Math.round(rect.width * dpr));
    height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  };

  const render = (now) => {
    raf = 0;
    resize();
    mouseX = mix(mouseX, targetMouseX, 0.045);
    mouseY = mix(mouseY, targetMouseY, 0.045);
    mouseActive = mix(mouseActive, targetMouseActive, 0.045);
    const elapsed = motionQuery.matches ? 4.2 : (now - startTime) * 0.001;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniform2f(resolutionUniform, width, height);
    gl.uniform2f(mouseUniform, mouseX, mouseY);
    gl.uniform1f(mouseActiveUniform, mouseActive);
    gl.uniform1f(timeUniform, elapsed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!motionQuery.matches && !document.hidden) {
      raf = requestAnimationFrame(render);
    }
  };

  const start = () => {
    if (!raf) raf = requestAnimationFrame(render);
  };

  document.addEventListener("pointermove", (event) => {
    const rect = container.getBoundingClientRect();
    if (event.clientY < rect.top) {
      targetMouseActive = 0;
      return;
    }
    targetMouseX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    targetMouseY = clamp(1 - (event.clientY - rect.top) / rect.height, 0, 1);
    targetMouseActive = 1;
    start();
  }, { passive: true });

  document.addEventListener("pointerleave", () => {
    targetMouseActive = 0;
  });
  window.addEventListener("resize", start);
  document.addEventListener("visibilitychange", start);
  start();
};

const initFounderTarot = () => {
  const cards = Array.from(document.querySelectorAll("#founders .founder-card[data-founder-key]"));
  const resetButton = document.querySelector("#founderGestureReset");
  if (!cards.length) return;

  const coverAll = () => {
    cards.forEach((card) => {
      card.classList.remove("is-flipped", "is-gesture-target");
      card.setAttribute("aria-pressed", "false");
    });
  };

  try {
    window.localStorage.removeItem("whiteMatterRevealedFounders");
  } catch (error) {
    // Storage may be unavailable in private browsing; cards still start covered.
  }

  coverAll();

  const reveal = (card) => {
    const key = card.dataset.founderKey;
    if (!key || card.classList.contains("is-flipped")) return;
    card.classList.add("is-flipped");
    card.setAttribute("aria-pressed", "true");
  };

  const hoverTimers = new WeakMap();

  cards.forEach((card) => {
    card.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch" || card.classList.contains("is-flipped")) return;
      const timer = window.setTimeout(() => reveal(card), 420);
      hoverTimers.set(card, timer);
    });
    card.addEventListener("pointerleave", () => {
      const timer = hoverTimers.get(card);
      if (timer) window.clearTimeout(timer);
      hoverTimers.delete(card);
    });
    card.addEventListener("pointerdown", () => reveal(card));
    card.addEventListener("founder:gesture-reveal", () => reveal(card));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        reveal(card);
      }
    });
  });

  resetButton?.addEventListener("click", () => {
    coverAll();
  });

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) coverAll();
  });
};

const initFounderGestureControl = () => {
  const section = document.querySelector("#founders");
  const layout = section?.querySelector(".founder-layout");
  const cards = Array.from(section?.querySelectorAll(".founder-card[data-founder-key]") || []);
  const toggle = document.querySelector("#founderGestureToggle");
  const toggleLabel = toggle?.querySelector(".gesture-toggle-label");
  const status = document.querySelector("#founderGestureStatus");
  const panel = document.querySelector("#founderGesturePanel");
  const video = document.querySelector("#founderGestureVideo");
  const cursor = document.querySelector("#founderGestureCursor");

  if (!section || !layout || !cards.length || !toggle || !toggleLabel || !status || !panel || !video || !cursor) {
    return;
  }

  const visionModuleUrl = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/+esm";
  const wasmRoot = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
  const modelUrl = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
  const dwellDuration = 450;
  const targetLockDuration = 180;
  const detectionInterval = 1000 / 15;

  let stream = null;
  let handLandmarker = null;
  let running = false;
  let animationFrame = 0;
  let lastDetectionAt = 0;
  let lastVideoTime = -1;
  let activeCard = null;
  let candidateCard = null;
  let candidateStartedAt = 0;
  let dwellStartedAt = 0;
  let wasPinching = false;
  let sectionVisible = true;
  let smoothedX = null;
  let smoothedY = null;

  const setPerformanceMode = (active) => {
    document.documentElement.classList.toggle("gesture-performance-mode", active);
    window.dispatchEvent(new CustomEvent("founder:gesture-performance", {
      detail: { active }
    }));
  };

  const setStatus = (message, state = "") => {
    status.textContent = message;
    if (state) status.dataset.state = state;
    else delete status.dataset.state;
  };

  const clearTarget = () => {
    cards.forEach((card) => card.classList.remove("is-gesture-target"));
    activeCard = null;
    candidateCard = null;
    candidateStartedAt = 0;
    dwellStartedAt = 0;
    smoothedX = null;
    smoothedY = null;
    cursor.style.setProperty("--gesture-progress", "0deg");
  };

  const stopGestureMode = () => {
    running = false;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    clearTarget();
    cursor.hidden = true;
    cursor.classList.remove("is-visible", "is-pinching");
    panel.hidden = true;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    video.srcObject = null;

    if (handLandmarker?.close) handLandmarker.close();
    handLandmarker = null;
    toggle.disabled = false;
    toggle.setAttribute("aria-pressed", "false");
    toggleLabel.textContent = "开启手势翻牌";
    setPerformanceMode(false);
    setStatus("摄像头仅在本机识别，不展示画面，不会上传");
  };

  const revealCard = (card) => {
    if (!card || card.classList.contains("is-flipped")) return;
    card.dispatchEvent(new CustomEvent("founder:gesture-reveal"));
    setStatus(`${card.getAttribute("aria-label") || "Founder"} 已翻开`, "active");
    clearTarget();
  };

  const updateFromLandmarks = (landmarks, now) => {
    const hand = landmarks?.[0];
    if (!hand) {
      cursor.classList.remove("is-visible", "is-pinching");
      clearTarget();
      setStatus("没有检测到手，请把手放进镜头", "active");
      wasPinching = false;
      return;
    }

    const indexTip = hand[8];
    const thumbTip = hand[4];
    const rect = layout.getBoundingClientRect();
    const normalizedX = clamp(((1 - indexTip.x) - 0.06) / 0.88, 0, 1);
    const normalizedY = clamp((indexTip.y - 0.08) / 0.84, 0, 1);
    const rawX = rect.left + normalizedX * rect.width;
    const rawY = rect.top + normalizedY * rect.height;
    smoothedX = smoothedX === null ? rawX : mix(smoothedX, rawX, 0.34);
    smoothedY = smoothedY === null ? rawY : mix(smoothedY, rawY, 0.34);

    const pinchDistance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
    const isPinching = wasPinching ? pinchDistance < 0.078 : pinchDistance < 0.052;

    cursor.hidden = !sectionVisible;
    cursor.classList.toggle("is-visible", sectionVisible);
    cursor.classList.toggle("is-pinching", isPinching);
    cursor.style.transform = `translate3d(${smoothedX}px, ${smoothedY}px, 0)`;

    const nextCard = cards.reduce((best, card) => {
      if (card.classList.contains("is-flipped")) return best;
      const cardRect = card.getBoundingClientRect();
      const centerX = cardRect.left + cardRect.width * 0.5;
      const centerY = cardRect.top + cardRect.height * 0.5;
      const dx = (smoothedX - centerX) / Math.max(1, cardRect.width * 0.72);
      const dy = (smoothedY - centerY) / Math.max(1, cardRect.height * 0.78);
      const score = dx * dx + dy * dy;
      if (score > 1.18 || (best && best.score <= score)) return best;
      return { card, score };
    }, null)?.card || null;

    if (nextCard !== candidateCard) {
      cards.forEach((card) => card.classList.remove("is-gesture-target"));
      activeCard = null;
      dwellStartedAt = 0;
      candidateCard = nextCard;
      candidateStartedAt = now;
      cursor.style.setProperty("--gesture-progress", "0deg");
    }

    if (!activeCard && candidateCard && now - candidateStartedAt >= targetLockDuration) {
      activeCard = candidateCard;
      dwellStartedAt = now;
      activeCard.classList.add("is-gesture-target");
    }

    if (!activeCard || activeCard.classList.contains("is-flipped")) {
      cursor.style.setProperty("--gesture-progress", "0deg");
      wasPinching = isPinching;
      return;
    }

    const dwellProgress = Math.min(1, (now - dwellStartedAt) / dwellDuration);
    cursor.style.setProperty("--gesture-progress", `${dwellProgress * 360}deg`);

    if ((isPinching && !wasPinching) || dwellProgress >= 1) {
      revealCard(activeCard);
    } else {
      setStatus("移动食指选择牌；稳定停留或捏合即可翻开", "active");
    }
    wasPinching = isPinching;
  };

  const detectLoop = (now) => {
    animationFrame = 0;
    if (!running) return;

    if (
      sectionVisible &&
      !document.hidden &&
      video.readyState >= 2 &&
      handLandmarker &&
      now - lastDetectionAt >= detectionInterval &&
      video.currentTime !== lastVideoTime
    ) {
      lastDetectionAt = now;
      lastVideoTime = video.currentTime;
      try {
        const result = handLandmarker.detectForVideo(video, now);
        updateFromLandmarks(result.landmarks, now);
      } catch (error) {
        setStatus("手势识别暂时中断，请关闭后重试", "error");
      }
    }

    animationFrame = requestAnimationFrame(detectLoop);
  };

  const createHandLandmarker = async () => {
    const { FilesetResolver, HandLandmarker } = await import(visionModuleUrl);
    const vision = await FilesetResolver.forVisionTasks(wasmRoot);
    const options = {
      baseOptions: {
        modelAssetPath: modelUrl,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.55,
      minHandPresenceConfidence: 0.52,
      minTrackingConfidence: 0.52
    };

    try {
      return await HandLandmarker.createFromOptions(vision, options);
    } catch (error) {
      options.baseOptions = { modelAssetPath: modelUrl };
      return HandLandmarker.createFromOptions(vision, options);
    }
  };

  const startGestureMode = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("当前浏览器不支持摄像头，请使用点击翻牌", "error");
      return;
    }

    toggle.disabled = true;
    toggleLabel.textContent = "正在启动…";
    setPerformanceMode(true);
    setStatus("正在请求摄像头并加载手势模型（首次约 20MB）");

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 24, max: 30 }
        }
      });
      video.srcObject = stream;
      await video.play();
      panel.hidden = false;

      handLandmarker = await createHandLandmarker();
      running = true;
      toggle.disabled = false;
      toggle.setAttribute("aria-pressed", "true");
      toggleLabel.textContent = "关闭手势翻牌";
      cursor.hidden = false;
      setStatus("识别已开启：直接在牌面上移动食指，停留或捏合翻牌", "active");
      animationFrame = requestAnimationFrame(detectLoop);
    } catch (error) {
      if (stream) stream.getTracks().forEach((track) => track.stop());
      stream = null;
      video.srcObject = null;
      panel.hidden = true;
      cursor.hidden = true;
      toggle.disabled = false;
      toggle.setAttribute("aria-pressed", "false");
      toggleLabel.textContent = "重新开启手势翻牌";
      setPerformanceMode(false);

      const denied = error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError";
      setStatus(
        denied ? "未获得摄像头权限，请允许后重试" : "手势模型加载失败，请使用点击翻牌",
        "error"
      );
    }
  };

  toggle.addEventListener("click", () => {
    if (running) stopGestureMode();
    else startGestureMode();
  });

  const sectionObserver = new IntersectionObserver((entries) => {
    sectionVisible = entries[0]?.isIntersecting ?? true;
    if (!sectionVisible) {
      cursor.classList.remove("is-visible", "is-pinching");
      clearTarget();
    }
  }, { threshold: 0.08 });

  sectionObserver.observe(section);
  window.addEventListener("pagehide", stopGestureMode, { once: true });
};

initHeroPrism();
initSiteGalaxy();
initFounderTarot();
initFounderGestureControl();
initFounderLightRays();
