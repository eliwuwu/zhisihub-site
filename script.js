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

    if (!form.action) {
      event.preventDefault();
      form.reset();
      note.textContent = "已记录加入申请。正式上线后可接入飞书多维表、腾讯云表单、企业微信或自有后端。";
      note.classList.add("is-success");
      form.classList.add("has-sent");
      return;
    }

    note.textContent = "正在连接你的问题，请稍等。";
    note.classList.add("is-success");
    form.classList.add("has-sent", "is-submitting");

    if (submitButton) {
      submitButton.textContent = "正在连接你的问题";
      submitButton.disabled = true;
    }
  });
}

const homeFiberField = document.querySelector("#homeFiberField");

if (homeFiberField) {
  const namespace = "http://www.w3.org/2000/svg";
  const palette = [
    "rgba(48, 49, 47, 0.62)",
    "rgba(90, 88, 72, 0.52)",
    "rgba(122, 111, 67, 0.42)",
    "rgba(154, 138, 82, 0.34)",
    "rgba(42, 42, 39, 0.3)"
  ];

  const random = (index, salt = 0) => {
    const value = Math.sin(index * 89.17 + salt * 193.31) * 10000;
    return value - Math.floor(value);
  };

  const makePathData = (index) => {
    const leftLanes = [266, 302, 336, 372, 408, 444];
    const lane = leftLanes[index % leftLanes.length] + (random(index, 21) - 0.5) * 10;
    const neckX = 258 + (random(index, 22) - 0.5) * 22;
    const neckY = 350 + (random(index, 23) - 0.5) * 54;
    const rightX = 1330 + random(index, 2) * 140;
    const fanY = 112 + random(index, 1) * 492;
    const c1x = 1020 + (random(index, 3) - 0.5) * 170;
    const c1y = fanY + (random(index, 4) - 0.5) * 150;
    const c2x = 540 + random(index, 5) * 180;
    const c2y = neckY + (fanY - neckY) * (0.18 + random(index, 6) * 0.22);
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

    if (options.opacity) {
      path.style.opacity = options.opacity;
    }
    if (options.width) {
      path.style.strokeWidth = options.width;
    }
    if (options.delay) {
      path.style.setProperty("--signal-delay", options.delay);
    }
    if (options.duration) {
      path.style.setProperty("--signal-duration", options.duration);
    }

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
    circle.style.opacity = String(0.18 + random(index, 33) * 0.34);
    homeFiberField.appendChild(circle);
  };

  for (let index = 0; index < 118; index += 1) {
    if (index % 4 === 0) {
      appendFiberPath("home-fiber-soft", index, {
        opacity: String(0.04 + random(index, 10) * 0.045),
        width: String(0.9 + random(index, 11) * 1.6)
      });
    }

    appendFiberPath(index % 2 === 0 ? "home-fiber-core" : "home-fiber-thread", index, {
      opacity: String(0.2 + random(index, 12) * 0.17),
      width: String(0.2 + random(index, 13) * 0.5)
    });

    if (index < 16) {
      appendFiberPath("home-fiber-spine", index + 540, {
        opacity: String(0.24 + random(index, 24) * 0.16),
        width: String(0.66 + random(index, 25) * 1.08)
      });
    }

  }

  for (let index = 0; index < 18; index += 1) {
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

  /* ---- 活体神经场:思维信号 + 自发放电 + 鼠标激活 ---- */
  if (!prefersReducedMotion) {
    const fiberPaths = Array.from(homeFiberField.querySelectorAll("path"));
    const fiberNodes = Array.from(
      homeFiberField.querySelectorAll(".home-fiber-node, .home-fiber-neck")
    );

    // 缓存可取长度的纤维,避免每帧重复 getTotalLength
    const usablePaths = [];
    fiberPaths.forEach((p) => {
      try {
        const len = p.getTotalLength();
        if (len > 0) usablePaths.push({ el: p, length: len });
      } catch (e) { /* skip unreadable path */ }
    });

    const isMobile = window.matchMedia("(max-width: 760px)").matches;
    const SIGNAL_COUNT = isMobile ? 6 : 11;

    // 信号粒子:沿随机纤维流动,到达后跳到另一条(思维在不同神经间跳跃)
    const spawnSignal = () => {
      const seg = usablePaths[Math.floor(Math.random() * usablePaths.length)] || usablePaths[0];
      const circle = document.createElementNS(namespace, "circle");
      circle.setAttribute("r", (1.1 + Math.random() * 1.7).toFixed(2));
      circle.setAttribute("class", "fiber-signal");
      homeFiberField.appendChild(circle);
      return {
        el: circle,
        seg,
        t: Math.random(),
        speed: 0.0045 + Math.random() * 0.0075,
        dir: Math.random() < 0.5 ? 1 : -1
      };
    };

    const signals = [];
    for (let i = 0; i < SIGNAL_COUNT && usablePaths.length; i += 1) {
      signals.push(spawnSignal());
    }

    // 鼠标进入 hero 时整体提速,离开后回落到闲适节奏
    let boost = 1;
    let boostTarget = 1;

    const tick = () => {
      boost += (boostTarget - boost) * 0.05;
      for (let i = 0; i < signals.length; i += 1) {
        const s = signals[i];
        s.t += s.speed * boost;
        if (s.t >= 1) {
          s.seg = usablePaths[Math.floor(Math.random() * usablePaths.length)];
          s.t = 0;
          s.dir = Math.random() < 0.5 ? 1 : -1;
          s.speed = 0.0045 + Math.random() * 0.0075;
        }
        try {
          const pos = s.dir > 0 ? s.t * s.seg.length : (1 - s.t) * s.seg.length;
          const pt = s.seg.el.getPointAtLength(pos);
          s.el.setAttribute("cx", pt.x.toFixed(1));
          s.el.setAttribute("cy", pt.y.toFixed(1));
        } catch (e) { /* skip */ }
      }
      requestAnimationFrame(tick);
    };
    if (signals.length) requestAnimationFrame(tick);

    // 节点放电涟漪:从一点向外扩散后消散
    const fireRipple = (x, y) => {
      const ripple = document.createElementNS(namespace, "circle");
      ripple.setAttribute("cx", x);
      ripple.setAttribute("cy", y);
      ripple.setAttribute("r", "2");
      ripple.setAttribute("class", "fiber-ripple");
      homeFiberField.appendChild(ripple);
      const start = performance.now();
      const duration = 720;
      const step = () => {
        const k = (performance.now() - start) / duration;
        if (k >= 1) { ripple.remove(); return; }
        ripple.setAttribute("r", (2 + k * 30).toFixed(1));
        ripple.style.opacity = (1 - k).toFixed(2);
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    // 空闲自发放电:像大脑默认网络在活动
    const spontaneous = () => {
      if (fiberNodes.length) {
        const node = fiberNodes[Math.floor(Math.random() * fiberNodes.length)];
        node.classList.add("is-firing");
        fireRipple(node.getAttribute("cx"), node.getAttribute("cy"));
        window.setTimeout(() => node.classList.remove("is-firing"), 520);
      }
      window.setTimeout(spontaneous, 1200 + Math.random() * 1600);
    };
    window.setTimeout(spontaneous, 1400);

    // 鼠标坐标 → SVG 坐标(自动处理 viewBox / 拉伸 / transform)
    const toSvgPoint = (clientX, clientY) => {
      const ctm = homeFiberField.getScreenCTM();
      if (!ctm) return null;
      const pt = homeFiberField.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      return pt.matrixTransform(ctm.inverse());
    };

    const hero = document.querySelector(".community-hero");
    const activeSet = new Set();
    const ACTIVATE_R2 = (isMobile ? 70 : 95) * (isMobile ? 70 : 95);

    const setActive = (nextSet) => {
      fiberNodes.forEach((node) => {
        if (nextSet.has(node) && !activeSet.has(node)) {
          node.classList.add("is-active");
          fireRipple(node.getAttribute("cx"), node.getAttribute("cy"));
        } else if (!nextSet.has(node) && activeSet.has(node)) {
          node.classList.remove("is-active");
        }
      });
      activeSet.clear();
      nextSet.forEach((n) => activeSet.add(n));
    };

    let lastMove = 0;
    if (hero) {
      hero.addEventListener("mousemove", (event) => {
        const now = performance.now();
        if (now - lastMove < 45) return;
        lastMove = now;
        boostTarget = 2.6;
        const p = toSvgPoint(event.clientX, event.clientY);
        if (!p) return;
        const next = new Set();
        fiberNodes.forEach((node) => {
          const dx = +node.getAttribute("cx") - p.x;
          const dy = +node.getAttribute("cy") - p.y;
          if (dx * dx + dy * dy < ACTIVATE_R2) next.add(node);
        });
        setActive(next);
      });
      hero.addEventListener("mouseleave", () => {
        boostTarget = 1;
        setActive(new Set());
      });
    }
  }
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

/* ---- slogan 文字解构:散落 → 聚拢(把“散落思绪变成连续路径”演出来)---- */
const heroHeading = document.querySelector(".community-hero h1");
if (heroHeading && !prefersReducedMotion) {
  const spans = heroHeading.querySelectorAll("span");
  let charIndex = 0;
  spans.forEach((span) => {
    const text = span.textContent;
    span.textContent = "";
    Array.from(text).forEach((ch) => {
      const wrap = document.createElement("span");
      wrap.className = "zm-char";
      wrap.textContent = ch;
      const dx = (Math.random() - 0.5) * 70;
      const dy = (Math.random() - 0.5) * 90 + 20;
      const rot = (Math.random() - 0.5) * 26;
      const delay = charIndex * 80 + Math.random() * 50;
      wrap.style.setProperty("--zm-x", dx.toFixed(1) + "px");
      wrap.style.setProperty("--zm-y", dy.toFixed(1) + "px");
      wrap.style.setProperty("--zm-r", rot.toFixed(1) + "deg");
      wrap.style.setProperty("--zm-d", delay.toFixed(0) + "ms");
      span.appendChild(wrap);
      charIndex += 1;
    });
  });
  // 下一帧触发聚拢,让“散落 → 连续”被看见
  window.requestAnimationFrame(() => {
    window.setTimeout(() => heroHeading.classList.add("is-assembled"), 180);
  });
}
