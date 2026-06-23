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
    "rgba(246, 251, 255, 0.92)",
    "rgba(159, 221, 234, 0.88)",
    "rgba(116, 100, 216, 0.82)",
    "rgba(63, 112, 215, 0.72)"
  ];

  const random = (index, salt = 0) => {
    const value = Math.sin(index * 89.17 + salt * 193.31) * 10000;
    return value - Math.floor(value);
  };

  const makePathData = (index) => {
    const y = 315 + (random(index, 1) - 0.5) * 185;
    const x1 = -90 - random(index, 2) * 70;
    const c1x = 155 + random(index, 3) * 140;
    const c1y = y + (random(index, 4) - 0.5) * 190;
    const c2x = 560 + random(index, 5) * 220;
    const c2y = 300 + (random(index, 6) - 0.5) * 130;
    const x2 = 1320 + random(index, 7) * 120;
    const y2 = 304 + (random(index, 8) - 0.5) * 105;
    return `M ${x1.toFixed(1)} ${y.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
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

  for (let index = 0; index < 116; index += 1) {
    if (index % 3 === 0) {
      appendFiberPath("home-fiber-soft", index, {
        opacity: String(0.09 + random(index, 10) * 0.075),
        width: String(4.2 + random(index, 11) * 5.6)
      });
    }

    appendFiberPath(index % 2 === 0 ? "home-fiber-core" : "home-fiber-thread", index, {
      opacity: String(0.26 + random(index, 12) * 0.32),
      width: String(0.32 + random(index, 13) * 0.72)
    });

    if (index % 4 === 0) {
      appendFiberPath("home-fiber-signal", index, {
        opacity: String(0.68 + random(index, 14) * 0.24),
        width: String(1.35 + random(index, 15) * 1.25),
        delay: `${-(random(index, 16) * 4.8).toFixed(2)}s`,
        duration: `${(3.6 + random(index, 17) * 2.6).toFixed(2)}s`
      });
    }
  }
}
