const form = document.querySelector("#betaForm");
const note = document.querySelector("#formNote");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (form && note) {
  const submitButton = form.querySelector("button[type='submit']");

  const submitted = new URLSearchParams(window.location.search).get("submitted");
  if (submitted === "1") {
    note.textContent = "申请已提交，我们会尽快联系你。";
    note.classList.add("is-success");
    form.classList.add("has-sent");
  }

  form.addEventListener("submit", (event) => {
    const data = Object.fromEntries(new FormData(form).entries());
    const leads = JSON.parse(window.localStorage.getItem("whiteMatterLeads") || "[]");
    leads.push({
      ...data,
      createdAt: new Date().toISOString()
    });
    window.localStorage.setItem("whiteMatterLeads", JSON.stringify(leads));
    note.textContent = "正在连接你的问题，请稍等。";
    note.classList.add("is-success");
    form.classList.add("has-sent", "is-submitting");

    if (submitButton) {
      submitButton.textContent = "正在连接你的问题";
      submitButton.disabled = true;
    }
  });
}

const navigationLinks = document.querySelectorAll([
  ".brand[href^='#']",
  ".nav-links a[href^='#']",
  ".nav-cta[href^='#']",
  ".scroll-cue[href^='#']"
].join(","));

let navigationTimer;

navigationLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;

    document.body.classList.add("nav-connecting");
    document.querySelectorAll(".is-section-focus").forEach((element) => {
      element.classList.remove("is-section-focus");
    });
    target.classList.add("is-section-focus");

    window.clearTimeout(navigationTimer);
    navigationTimer = window.setTimeout(() => {
      document.body.classList.remove("nav-connecting");
      target.classList.remove("is-section-focus");
    }, prefersReducedMotion ? 120 : 1100);
  });
});

const revealTargets = document.querySelectorAll([
  ".section-heading",
  ".line-visual",
  ".detail-grid article",
  ".founder-card",
  ".contact-copy",
  ".contact-form"
].join(","));

const makeVisible = (element) => {
  element.classList.add("is-visible");
  const drawing = element.querySelector(".line-art-svg");
  if (drawing) {
    drawing.classList.add("is-drawn");
  }
};

if (revealTargets.length) {
  revealTargets.forEach((element) => {
    element.classList.add("reveal-item");
  });

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach(makeVisible);
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        makeVisible(entry.target);
        revealObserver.unobserve(entry.target);
      });
    }, {
      threshold: 0.2,
      rootMargin: "0px 0px -8% 0px"
    });

    revealTargets.forEach((element) => revealObserver.observe(element));
  }
}

const inlineLineArt = async () => {
  const lineImages = document.querySelectorAll(".line-visual img[src$='.svg'], .contact-visual img[src$='.svg']");

  await Promise.all([...lineImages].map(async (image) => {
    try {
      const response = await fetch(image.currentSrc || image.src);
      if (!response.ok) return;

      const svgText = await response.text();
      const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
      const svg = doc.querySelector("svg");
      if (!svg) return;

      svg.classList.add("line-art-svg");
      svg.setAttribute("aria-label", image.alt || "线稿图");
      svg.removeAttribute("width");
      svg.removeAttribute("height");

      const strokeElements = svg.querySelectorAll("path, line, polyline, polygon");
      strokeElements.forEach((element, index) => {
        if (typeof element.getTotalLength !== "function") return;
        const length = Math.ceil(element.getTotalLength());
        element.classList.add("draw-path");
        element.style.setProperty("--path-length", length);
        element.style.transitionDelay = `${Math.min(index * 70, 560)}ms`;
      });

      svg.querySelectorAll("circle, ellipse").forEach((element, index) => {
        element.classList.add("draw-node");
        element.style.transitionDelay = `${360 + Math.min(index * 85, 680)}ms`;
      });

      image.replaceWith(svg);

      const wrapper = svg.closest(".line-visual, .contact-visual");
      if (wrapper && wrapper.classList.contains("is-visible")) {
        svg.classList.add("is-drawn");
      }
    } catch {
      // Keep the original image when inline SVG loading is blocked, such as file previews.
    }
  }));
};

if (!prefersReducedMotion) {
  inlineLineArt();
}

const homeFiberField = document.querySelector("#homeFiberField");

if (homeFiberField) {
  const namespace = "http://www.w3.org/2000/svg";
  const palette = [
    "rgba(211, 190, 255, 0.6)",
    "rgba(187, 145, 255, 0.66)",
    "rgba(158, 102, 255, 0.64)",
    "rgba(123, 76, 239, 0.54)",
    "rgba(86, 72, 196, 0.38)",
    "rgba(226, 218, 255, 0.26)"
  ];
  const curtainPalette = [
    "rgba(204, 175, 255, 0.58)",
    "rgba(181, 130, 255, 0.58)",
    "rgba(147, 88, 255, 0.54)",
    "rgba(111, 80, 218, 0.48)",
    "rgba(218, 205, 255, 0.34)"
  ];

  const random = (index, salt = 0) => {
    const value = Math.sin(index * 89.17 + salt * 193.31) * 10000;
    return value - Math.floor(value);
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const defs = document.createElementNS(namespace, "defs");
  const addLinearGradient = (id, stops) => {
    const gradient = document.createElementNS(namespace, "linearGradient");
    gradient.setAttribute("id", id);
    gradient.setAttribute("gradientUnits", "userSpaceOnUse");
    gradient.setAttribute("x1", "54");
    gradient.setAttribute("y1", "386");
    gradient.setAttribute("x2", "1120");
    gradient.setAttribute("y2", "386");
    stops.forEach(({ offset, color, opacity }) => {
      const stop = document.createElementNS(namespace, "stop");
      stop.setAttribute("offset", offset);
      stop.setAttribute("stop-color", color);
      stop.setAttribute("stop-opacity", opacity);
      gradient.appendChild(stop);
    });
    defs.appendChild(gradient);
  };

  addLinearGradient("fiberSilkViolet", [
    { offset: "0%", color: "#5d37c8", opacity: "0" },
    { offset: "8%", color: "#7e55ff", opacity: "0.2" },
    { offset: "19%", color: "#b58aff", opacity: "0.78" },
    { offset: "42%", color: "#e6d8ff", opacity: "0.72" },
    { offset: "68%", color: "#8d63ff", opacity: "0.52" },
    { offset: "100%", color: "#4b28b8", opacity: "0.13" }
  ]);
  addLinearGradient("fiberSilkPurple", [
    { offset: "0%", color: "#4322a8", opacity: "0" },
    { offset: "9%", color: "#6d3df2", opacity: "0.18" },
    { offset: "23%", color: "#a66cff", opacity: "0.8" },
    { offset: "52%", color: "#dcc8ff", opacity: "0.58" },
    { offset: "82%", color: "#7f55ff", opacity: "0.44" },
    { offset: "100%", color: "#4421a8", opacity: "0.12" }
  ]);
  addLinearGradient("fiberSilkSilver", [
    { offset: "0%", color: "#8971ff", opacity: "0" },
    { offset: "10%", color: "#a77dff", opacity: "0.1" },
    { offset: "28%", color: "#eee8ff", opacity: "0.82" },
    { offset: "54%", color: "#fbf8ff", opacity: "0.76" },
    { offset: "76%", color: "#a478ff", opacity: "0.42" },
    { offset: "100%", color: "#6f42e8", opacity: "0.14" }
  ]);
  homeFiberField.appendChild(defs);

  const silkStrokes = [
    "url(#fiberSilkViolet)",
    "url(#fiberSilkPurple)",
    "url(#fiberSilkViolet)",
    "url(#fiberSilkSilver)"
  ];

  const makePathData = (index, variant = "thread") => {
    const neckX = 68 + (random(index, 22) - 0.5) * 22;
    const neckY = 386 + (random(index, 23) - 0.5) * 18;
    const direction = random(index, 2) > 0.49 ? 1 : -1;
    if (variant === "curtain") {
      const upper = index % 2 === 0 ? -1 : 1;
      const fanY = clamp(neckY + upper * (128 + Math.pow(random(index, 1), 0.58) * 348) + (random(index, 20) - 0.5) * 30, 36, 644);
      const midX = 210 + random(index, 3) * 150;
      const endX = 610 + random(index, 4) * 360;
      const endY = neckY + upper * (138 + random(index, 5) * 310);
      return [
        `M ${neckX.toFixed(1)} ${neckY.toFixed(1)}`,
        `C ${(112 + random(index, 6) * 42).toFixed(1)} ${(neckY + upper * 18).toFixed(1)}, ${midX.toFixed(1)} ${fanY.toFixed(1)}, ${endX.toFixed(1)} ${clamp(endY, 40, 640).toFixed(1)}`
      ].join(" ");
    }
    if (variant === "lowerSilk") {
      const depth = Math.pow(random(index, 1), 0.7);
      const fanY = clamp(414 + depth * 226 + (random(index, 20) - 0.5) * 54, 404, 650);
      const rightX = 620 + random(index, 3) * 610;
      const bend = 20 + random(index, 4) * 72;
      const c1x = 126 + random(index, 5) * 86;
      const c1y = neckY + 28 + random(index, 6) * 42;
      const c2x = 330 + random(index, 7) * 430;
      const c2y = fanY - bend + (random(index, 8) - 0.5) * 46;
      return [
        `M ${neckX.toFixed(1)} ${neckY.toFixed(1)}`,
        `C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${rightX.toFixed(1)} ${fanY.toFixed(1)}`
      ].join(" ");
    }
    if (variant === "middleSilk") {
      const depth = Math.pow(random(index, 1), 0.82);
      const fanY = clamp(382 + depth * 164 + (random(index, 20) - 0.5) * 42, 370, 552);
      const rightX = 600 + random(index, 3) * 620;
      const c1x = 124 + random(index, 5) * 92;
      const c1y = neckY + 8 + random(index, 6) * 30;
      const c2x = 326 + random(index, 7) * 480;
      const c2y = fanY - 24 + (random(index, 8) - 0.5) * 48;
      return [
        `M ${neckX.toFixed(1)} ${neckY.toFixed(1)}`,
        `C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${rightX.toFixed(1)} ${fanY.toFixed(1)}`
      ].join(" ");
    }
    if (variant === "bridgeSilk") {
      const fanY = clamp(330 + Math.pow(random(index, 1), 0.78) * 178 + (random(index, 20) - 0.5) * 34, 324, 516);
      const rightX = 560 + random(index, 3) * 650;
      const c1x = 118 + random(index, 5) * 92;
      const c1y = neckY + (fanY - neckY) * 0.18 + (random(index, 6) - 0.5) * 18;
      const c2x = 300 + random(index, 7) * 520;
      const c2y = fanY + (random(index, 8) - 0.5) * 34;
      return [
        `M ${neckX.toFixed(1)} ${neckY.toFixed(1)}`,
        `C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${rightX.toFixed(1)} ${fanY.toFixed(1)}`
      ].join(" ");
    }
    if (variant === "centerSilk") {
      const fanY = clamp(304 + Math.pow(random(index, 1), 0.86) * 254 + (random(index, 20) - 0.5) * 44, 296, 566);
      const rightX = 680 + random(index, 3) * 560;
      const c1x = 116 + random(index, 5) * 92;
      const c1y = neckY + (fanY - neckY) * 0.08 + (random(index, 6) - 0.5) * 18;
      const c2x = 410 + random(index, 7) * 520;
      const c2y = fanY + (random(index, 8) - 0.5) * 30;
      return [
        `M ${neckX.toFixed(1)} ${neckY.toFixed(1)}`,
        `C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${rightX.toFixed(1)} ${fanY.toFixed(1)}`
      ].join(" ");
    }
    const spreadPower = variant === "spine" || variant === "ribbon" ? 0.54 : 0.78;
    const spreadLimit = variant === "signal" ? 360 : variant === "ribbon" ? 520 : 455;
    const spread = 32 + Math.pow(random(index, 1), spreadPower) * spreadLimit;
    const fanY = clamp(neckY + direction * spread + (random(index, 20) - 0.5) * 66, 42, 636);
    const rightX = variant === "ribbon" ? 610 + random(index, 3) * 520 : 1050 + random(index, 3) * 230;
    const bend = (random(index, 4) - 0.5) * (variant === "ribbon" ? 48 : 92);
    const c1x = 136 + random(index, 5) * (variant === "ribbon" ? 56 : 86);
    const c1y = neckY + (fanY - neckY) * (variant === "ribbon" ? 0.025 : variant === "spine" ? 0.035 : 0.055) + bend * 0.18;
    const c2x = variant === "ribbon" ? 286 + random(index, 6) * 180 : 426 + random(index, 6) * (variant === "signal" ? 500 : 374);
    const c2y = neckY + (fanY - neckY) * (variant === "ribbon" ? 0.98 : variant === "spine" ? 0.9 : 0.7) + bend;
    return [
      `M ${neckX.toFixed(1)} ${neckY.toFixed(1)}`,
      `C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${rightX.toFixed(1)} ${fanY.toFixed(1)}`
    ].join(" ");
  };

  const appendFiberPath = (className, index, options = {}, variant = "thread") => {
    const path = document.createElementNS(namespace, "path");
    path.setAttribute("d", makePathData(index, variant));
    path.setAttribute("pathLength", "760");
    path.setAttribute("class", className);
    path.setAttribute("stroke", options.stroke || silkStrokes[index % silkStrokes.length]);

    if (options.opacity) path.style.opacity = options.opacity;
    if (options.width) path.style.strokeWidth = options.width;
    if (options.delay) path.style.animationDelay = options.delay;
    if (options.duration) path.style.animationDuration = options.duration;

    homeFiberField.appendChild(path);
  };

  const appendFiberNode = (index) => {
    const circle = document.createElementNS(namespace, "circle");
    const cx = 510 + random(index, 30) * 660;
    const cy = 72 + random(index, 31) * 512;
    const radius = 0.55 + random(index, 32) * 1.65;
    circle.setAttribute("cx", cx.toFixed(1));
    circle.setAttribute("cy", cy.toFixed(1));
    circle.setAttribute("r", radius.toFixed(1));
    circle.setAttribute("class", "home-fiber-node");
    circle.style.opacity = String(0.28 + random(index, 33) * 0.52);
    homeFiberField.appendChild(circle);
  };

  for (let index = 0; index < 132; index += 1) {
    appendFiberPath(index % 2 === 0 ? "home-fiber-core" : "home-fiber-thread", index, {
      opacity: String(0.34 + random(index, 12) * 0.26),
      width: String(0.3 + random(index, 13) * 0.44)
    });
  }

  for (let index = 0; index < 178; index += 1) {
    appendFiberPath("home-fiber-curtain", index + 980, {
      opacity: String(0.46 + random(index, 26) * 0.32),
      width: String(0.34 + random(index, 27) * 0.82),
      stroke: index % 5 === 0 ? "url(#fiberSilkSilver)" : silkStrokes[index % 3]
    }, "curtain");
  }

  for (let index = 0; index < 94; index += 1) {
    appendFiberPath(index % 5 === 0 ? "home-fiber-lower-silk home-fiber-lower-bright" : "home-fiber-lower-silk", index + 1460, {
      opacity: String(0.52 + random(index, 36) * 0.32),
      width: String(0.34 + random(index, 37) * 0.7),
      stroke: index % 4 === 0 ? "url(#fiberSilkSilver)" : silkStrokes[(index + 1) % silkStrokes.length],
      delay: `${-(random(index, 38) * 7.2).toFixed(2)}s`,
      duration: `${(7.6 + random(index, 39) * 3.4).toFixed(2)}s`
    }, "lowerSilk");
  }

  for (let index = 0; index < 66; index += 1) {
    appendFiberPath(index % 4 === 0 ? "home-fiber-middle-silk home-fiber-lower-bright" : "home-fiber-middle-silk", index + 1910, {
      opacity: String(0.56 + random(index, 44) * 0.28),
      width: String(0.34 + random(index, 45) * 0.66),
      stroke: index % 4 === 0 ? "url(#fiberSilkSilver)" : silkStrokes[(index + 2) % silkStrokes.length],
      delay: `${-(random(index, 46) * 7.8).toFixed(2)}s`,
      duration: `${(8.2 + random(index, 47) * 3.2).toFixed(2)}s`
    }, "middleSilk");
  }

  for (let index = 0; index < 104; index += 1) {
    appendFiberPath(index % 6 === 0 ? "home-fiber-bridge-silk home-fiber-lower-bright" : "home-fiber-bridge-silk", index + 2100, {
      opacity: String(0.58 + random(index, 48) * 0.3),
      width: String(0.38 + random(index, 49) * 0.72),
      stroke: index % 3 === 0 ? "url(#fiberSilkSilver)" : silkStrokes[(index + 3) % silkStrokes.length],
      delay: `${-(random(index, 50) * 7.4).toFixed(2)}s`,
      duration: `${(7.8 + random(index, 51) * 3.1).toFixed(2)}s`
    }, "bridgeSilk");
  }

  for (let index = 0; index < 52; index += 1) {
    appendFiberPath(index % 5 === 0 ? "home-fiber-center-silk home-fiber-lower-bright" : "home-fiber-center-silk", index + 2380, {
      opacity: String(0.58 + random(index, 52) * 0.28),
      width: String(0.32 + random(index, 53) * 0.62),
      stroke: index % 4 === 0 ? "url(#fiberSilkSilver)" : silkStrokes[(index + 1) % silkStrokes.length],
      delay: `${-(random(index, 54) * 7.6).toFixed(2)}s`,
      duration: `${(7.4 + random(index, 55) * 3.4).toFixed(2)}s`
    }, "centerSilk");
  }

  for (let index = 0; index < 10; index += 1) {
    appendFiberPath("home-fiber-lower-flow", index + 1740, {
      opacity: String(0.3 + random(index, 40) * 0.18),
      width: String(0.42 + random(index, 41) * 0.42),
      stroke: index % 3 === 0 ? "url(#fiberSilkSilver)" : "url(#fiberSilkPurple)",
      delay: `${-(random(index, 42) * 5.8).toFixed(2)}s`,
      duration: `${(4.6 + random(index, 43) * 2.4).toFixed(2)}s`
    }, "lowerSilk");
  }

  for (let index = 0; index < 18; index += 1) {
    appendFiberPath("home-fiber-highlight", index + 1220, {
      opacity: String(0.46 + random(index, 28) * 0.22),
      width: String(0.22 + random(index, 29) * 0.36),
      stroke: "url(#fiberSilkSilver)"
    }, index % 3 === 0 ? "curtain" : "thread");
  }

  for (let index = 0; index < 18; index += 1) {
    appendFiberPath("home-fiber-ribbon", index + 180, {
      opacity: String(0.04 + random(index, 18) * 0.05),
      width: String(2.2 + random(index, 19) * 2.9)
    }, "ribbon");
  }

  for (let index = 0; index < 24; index += 1) {
    appendFiberPath("home-fiber-soft", index + 320, {
      opacity: String(0.04 + random(index, 10) * 0.06),
      width: String(0.72 + random(index, 11) * 0.98)
    }, "spine");
  }

  for (let index = 0; index < 28; index += 1) {
    appendFiberPath("home-fiber-spine", index + 520, {
      opacity: String(0.38 + random(index, 24) * 0.22),
      width: String(0.52 + random(index, 25) * 0.86)
    }, "spine");
  }

  for (let index = 0; index < 14; index += 1) {
    appendFiberPath("home-fiber-signal", index + 760, {
      opacity: String(0.46 + random(index, 14) * 0.22),
      width: String(0.48 + random(index, 15) * 0.62),
      delay: `${-(random(index, 16) * 4.2).toFixed(2)}s`,
      duration: `${(3.2 + random(index, 17) * 2.2).toFixed(2)}s`
    }, "signal");
  }

  for (let index = 0; index < 12; index += 1) {
    appendFiberNode(index);
  }

  [380, 384, 388, 392].forEach((cy, index) => {
    const circle = document.createElementNS(namespace, "circle");
    circle.setAttribute("cx", String(68 + index * 1.2));
    circle.setAttribute("cy", String(cy));
    circle.setAttribute("r", String(index === 1 ? 1.7 : 1.05));
    circle.setAttribute("class", "home-fiber-neck");
    homeFiberField.appendChild(circle);
  });

  [342, 386, 430].forEach((cy, index) => {
    const line = document.createElementNS(namespace, "path");
    line.setAttribute("d", `M -60 ${cy} C 4 ${cy}, 28 ${386 + (cy - 386) * 0.2}, 70 386`);
    line.setAttribute("class", index === 1 ? "home-fiber-spine" : "home-fiber-soft");
    line.setAttribute("stroke", palette[index]);
    line.style.opacity = index === 1 ? "0.22" : "0.045";
    line.style.strokeWidth = index === 1 ? "0.54" : "0.72";
    homeFiberField.appendChild(line);
  });
}
