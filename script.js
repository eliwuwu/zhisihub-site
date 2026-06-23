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
    "rgba(255, 255, 255, 0.98)",
    "rgba(237, 226, 255, 0.96)",
    "rgba(213, 178, 255, 0.94)",
    "rgba(180, 111, 255, 0.92)",
    "rgba(137, 82, 255, 0.86)",
    "rgba(96, 73, 240, 0.78)"
  ];

  const random = (index, salt = 0) => {
    const value = Math.sin(index * 89.17 + salt * 193.31) * 10000;
    return value - Math.floor(value);
  };

  const makePathData = (index) => {
    const leftLanes = [266, 302, 336, 372, 408, 444];
    const lane = leftLanes[index % leftLanes.length] + (random(index, 21) - 0.5) * 10;
    const neckX = 270 + (random(index, 22) - 0.5) * 18;
    const neckY = 350 + (random(index, 23) - 0.5) * 44;
    const rightX = 1250 + random(index, 2) * 280;
    const fanSpread = 68 + Math.pow(random(index, 1), 0.72) * 540;
    const fanY = Math.max(54, Math.min(626, neckY + (random(index, 19) > 0.48 ? 1 : -1) * fanSpread + (random(index, 20) - 0.5) * 110));
    const c1x = 990 + (random(index, 3) - 0.5) * 260;
    const c1y = fanY + (random(index, 4) - 0.5) * 190;
    const c2x = 455 + random(index, 5) * 270;
    const c2y = neckY + (fanY - neckY) * (0.09 + random(index, 6) * 0.22);
    const leftX = -132 - random(index, 7) * 120;
    const leftControlX = 150 + random(index, 8) * 74;
    return [
      `M ${rightX.toFixed(1)} ${fanY.toFixed(1)}`,
      `C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${neckX.toFixed(1)} ${neckY.toFixed(1)}`,
      `C ${leftControlX.toFixed(1)} ${lane.toFixed(1)}, ${(leftControlX - 118).toFixed(1)} ${lane.toFixed(1)}, ${leftX.toFixed(1)} ${lane.toFixed(1)}`
    ].join(" ");
  };

  const appendFiberPath = (className, index, options = {}) => {
    const path = document.createElementNS(namespace, "path");
    path.setAttribute("d", makePathData(index));
    path.setAttribute("pathLength", "760");
    path.setAttribute("class", className);
    path.setAttribute("stroke", palette[index % palette.length]);

    if (options.opacity) path.style.opacity = options.opacity;
    if (options.width) path.style.strokeWidth = options.width;
    if (options.delay) path.style.animationDelay = options.delay;
    if (options.duration) path.style.animationDuration = options.duration;

    homeFiberField.appendChild(path);
  };

  const appendFiberNode = (index) => {
    const circle = document.createElementNS(namespace, "circle");
    const cx = 650 + random(index, 30) * 560;
    const cy = 126 + random(index, 31) * 428;
    const radius = 0.8 + random(index, 32) * 3.4;
    circle.setAttribute("cx", cx.toFixed(1));
    circle.setAttribute("cy", cy.toFixed(1));
    circle.setAttribute("r", radius.toFixed(1));
    circle.setAttribute("class", "home-fiber-node");
    circle.style.opacity = String(0.28 + random(index, 33) * 0.52);
    homeFiberField.appendChild(circle);
  };

  for (let index = 0; index < 278; index += 1) {
    if (index % 2 === 0) {
      appendFiberPath("home-fiber-soft", index, {
        opacity: String(0.1 + random(index, 10) * 0.16),
        width: String(5.2 + random(index, 11) * 9.6)
      });
    }

    appendFiberPath(index % 2 === 0 ? "home-fiber-core" : "home-fiber-thread", index, {
      opacity: String(0.38 + random(index, 12) * 0.48),
      width: String(0.4 + random(index, 13) * 1.06)
    });

    if (index < 58) {
      appendFiberPath("home-fiber-spine", index + 540, {
        opacity: String(0.46 + random(index, 24) * 0.42),
        width: String(2.1 + random(index, 25) * 4.8)
      });
    }

    if (index % 2 === 0) {
      appendFiberPath("home-fiber-signal", index, {
        opacity: String(0.76 + random(index, 14) * 0.22),
        width: String(1.35 + random(index, 15) * 2.15),
        delay: `${-(random(index, 16) * 3.2).toFixed(2)}s`,
        duration: `${(2.15 + random(index, 17) * 1.65).toFixed(2)}s`
      });
    }
  }

  for (let index = 0; index < 96; index += 1) {
    appendFiberNode(index);
  }

  [266, 302, 336, 372, 408, 444].forEach((cy, index) => {
    const circle = document.createElementNS(namespace, "circle");
    circle.setAttribute("cx", String(248 + index * 2.4));
    circle.setAttribute("cy", String(cy));
    circle.setAttribute("r", String(index === 2 ? 5.8 : 3.2));
    circle.setAttribute("class", "home-fiber-neck");
    homeFiberField.appendChild(circle);
  });
}
