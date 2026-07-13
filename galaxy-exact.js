const initExactGalaxy = () => {
  const container = document.querySelector("#siteGalaxy");
  if (!container) return;

  container.dataset.galaxyExact = "true";
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  container.replaceChildren(canvas);

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false
  });

  if (!gl) {
    container.classList.add("is-static");
    return;
  }

  const vertexShaderSource = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;
  const fragmentShaderSource = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;

varying vec2 vUv;

#define NUM_LAYER 2.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) {
  return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare) {
  float d = length(uv);
  float m = (0.05 * uGlowIntensity) / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uGlowIntensity;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uGlowIntensity;
  m *= smoothstep(1.0, 0.2, d);
  return m;
}

vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0);

  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + vec2(float(x), float(y));
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;

      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
      float grn = min(red, blu) * seed;
      vec3 base = vec3(red, grn, blu);

      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + uHueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));

      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;

      float star = Star(gv - offset - pad, flareSize);
      vec3 color = base;

      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      star *= twinkle;

      col += star * size * color;
    }
  }

  return col;
}

void main() {
  vec2 focalPx = uFocal * uResolution.xy;
  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;

  vec2 mouseNorm = uMouse - vec2(0.5);

  if (uAutoCenterRepulsion > 0.0) {
    vec2 centerUV = vec2(0.0, 0.0);
    float centerDist = length(uv - centerUV);
    vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));
    uv += repulsion * 0.05;
  } else if (uMouseRepulsion) {
    vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
    float mouseDist = length(uv - mousePosUV);
    vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));
    uv += repulsion * 0.05 * uMouseActiveFactor;
  } else {
    vec2 mouseOffset = mouseNorm * 0.1 * uMouseActiveFactor;
    uv += mouseOffset;
  }

  float autoRotAngle = uTime * uRotationSpeed;
  mat2 autoRot = mat2(cos(autoRotAngle), -sin(autoRotAngle), sin(autoRotAngle), cos(autoRotAngle));
  uv = autoRot * uv;

  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;

  vec3 col = vec3(0.0);

  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
    float depth = fract(i + uStarSpeed * uSpeed);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    col += StarLayer(uv * scale + i * 453.32) * fade;
  }

  float luminance = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = luminance * vec3(0.96, 0.975, 1.0);

  if (uTransparent) {
    float alpha = length(col);
    alpha = smoothstep(0.0, 0.3, alpha);
    alpha = min(alpha, 1.0);
    gl_FragColor = vec4(col, alpha);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}
`;

  const compileShader = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn("Galaxy shader compilation failed:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vertex = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
  const fragment = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vertex || !fragment) {
    container.classList.add("is-static");
    canvas.remove();
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("Galaxy program linking failed:", gl.getProgramInfoLog(program));
    container.classList.add("is-static");
    canvas.remove();
    return;
  }

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 2, 0, 0, 2]), gl.STATIC_DRAW);
  const uv = gl.getAttribLocation(program, "uv");
  gl.enableVertexAttribArray(uv);
  gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 0, 0);

  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  const uniforms = {
    time: gl.getUniformLocation(program, "uTime"),
    resolution: gl.getUniformLocation(program, "uResolution"),
    focal: gl.getUniformLocation(program, "uFocal"),
    rotation: gl.getUniformLocation(program, "uRotation"),
    starSpeed: gl.getUniformLocation(program, "uStarSpeed"),
    density: gl.getUniformLocation(program, "uDensity"),
    hueShift: gl.getUniformLocation(program, "uHueShift"),
    speed: gl.getUniformLocation(program, "uSpeed"),
    mouse: gl.getUniformLocation(program, "uMouse"),
    glowIntensity: gl.getUniformLocation(program, "uGlowIntensity"),
    saturation: gl.getUniformLocation(program, "uSaturation"),
    mouseRepulsion: gl.getUniformLocation(program, "uMouseRepulsion"),
    twinkleIntensity: gl.getUniformLocation(program, "uTwinkleIntensity"),
    rotationSpeed: gl.getUniformLocation(program, "uRotationSpeed"),
    repulsionStrength: gl.getUniformLocation(program, "uRepulsionStrength"),
    mouseActive: gl.getUniformLocation(program, "uMouseActiveFactor"),
    autoCenterRepulsion: gl.getUniformLocation(program, "uAutoCenterRepulsion"),
    transparent: gl.getUniformLocation(program, "uTransparent")
  };

  let width = 1;
  let height = 1;
  let raf = 0;
  let targetMouseX = 0.5;
  let targetMouseY = 0.5;
  let mouseX = 0.5;
  let mouseY = 0.5;
  let targetMouseActive = 0;
  let mouseActive = 0;
  let lastDrawAt = 0;
  let lastPointerAt = 0;
  let gesturePaused = false;
  const frameInterval = 1000 / 60;
  const startedAt = performance.now();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const resize = () => {
    const rect = container.getBoundingClientRect();
    const renderScale = rect.width < 760 ? 0.3 : 0.36;
    const nextWidth = Math.max(1, Math.round(rect.width * renderScale));
    const nextHeight = Math.max(1, Math.round(rect.height * renderScale));
    if (nextWidth !== width || nextHeight !== height) {
      width = nextWidth;
      height = nextHeight;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  };

  const draw = (now) => {
    raf = 0;
    if (gesturePaused) return;
    const pointerIsMoving = now - lastPointerAt < 220;
    if (now - lastDrawAt < frameInterval) {
      raf = requestAnimationFrame(draw);
      return;
    }
    lastDrawAt = now;
    resize();
    if (!pointerIsMoving) targetMouseActive = 0;
    const mouseEase = pointerIsMoving ? 0.12 : 0.06;
    mouseX += (targetMouseX - mouseX) * mouseEase;
    mouseY += (targetMouseY - mouseY) * mouseEase;
    mouseActive += (targetMouseActive - mouseActive) * (pointerIsMoving ? 0.14 : 0.08);

    const elapsed = reduceMotion.matches ? 5 : (now - startedAt) * 0.001;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniform1f(uniforms.time, elapsed);
    gl.uniform3f(uniforms.resolution, width, height, width / height);
    gl.uniform2f(uniforms.focal, 0.5, 0.5);
    gl.uniform2f(uniforms.rotation, 1.0, 0.0);
    gl.uniform1f(uniforms.starSpeed, elapsed * 0.05);
    gl.uniform1f(uniforms.density, 0.62);
    gl.uniform1f(uniforms.hueShift, 240);
    gl.uniform1f(uniforms.speed, 0.5);
    gl.uniform2f(uniforms.mouse, mouseX, mouseY);
    gl.uniform1f(uniforms.glowIntensity, 0.31);
    gl.uniform1f(uniforms.saturation, 0.02);
    gl.uniform1i(uniforms.mouseRepulsion, 1);
    gl.uniform1f(uniforms.twinkleIntensity, 0.16);
    gl.uniform1f(uniforms.rotationSpeed, 0.035);
    gl.uniform1f(uniforms.repulsionStrength, 2.8);
    gl.uniform1f(uniforms.mouseActive, mouseActive);
    gl.uniform1f(uniforms.autoCenterRepulsion, 0);
    gl.uniform1i(uniforms.transparent, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!reduceMotion.matches && !document.hidden) {
      raf = requestAnimationFrame(draw);
    }
  };

  const start = () => {
    if (!raf) raf = requestAnimationFrame(draw);
  };

  window.addEventListener("pointermove", (event) => {
    const rect = container.getBoundingClientRect();
    if (event.clientY < rect.top) {
      targetMouseActive = 0;
      return;
    }
    targetMouseX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    targetMouseY = Math.min(1, Math.max(0, 1 - (event.clientY - rect.top) / rect.height));
    targetMouseActive = 1;
    lastPointerAt = performance.now();
    start();
  }, { passive: true });

  document.addEventListener("pointerleave", () => {
    targetMouseActive = 0;
  });
  window.addEventListener("founder:gesture-performance", (event) => {
    gesturePaused = Boolean(event.detail?.active);
    if (gesturePaused) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else {
      lastDrawAt = 0;
      start();
    }
  });
  window.addEventListener("resize", start);
  document.addEventListener("visibilitychange", start);
  start();
};

initExactGalaxy();
