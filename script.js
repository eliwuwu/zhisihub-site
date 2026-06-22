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

const sections = document.querySelectorAll("main section[id]");
const navAnchors = document.querySelectorAll(".nav-links a[href^='#']");

const setActiveSection = (sectionId) => {
  const navSectionId = sectionId === "courses" ? "mission" : sectionId;

  navAnchors.forEach((anchor) => {
    const isActive = anchor.getAttribute("href") === `#${navSectionId}`;
    anchor.classList.toggle("is-active", isActive);
    if (isActive) {
      anchor.setAttribute("aria-current", "true");
    } else {
      anchor.removeAttribute("aria-current");
    }
  });
};

if (sections.length && navAnchors.length) {
  setActiveSection(sections[0].id);

  let sectionFrame = 0;
  const updateActiveSectionFromScroll = () => {
    const marker = window.innerHeight * 0.38;
    let activeId = sections[0].id;

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= marker && rect.bottom > 96) {
        activeId = section.id;
      }
    });

    setActiveSection(activeId);
  };

  const requestActiveSectionUpdate = () => {
    window.cancelAnimationFrame(sectionFrame);
    sectionFrame = window.requestAnimationFrame(updateActiveSectionFromScroll);
  };

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        requestActiveSectionUpdate();
      }
    }, {
      threshold: [0.32, 0.48, 0.64],
      rootMargin: "-22% 0px -45% 0px"
    });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  window.addEventListener("scroll", requestActiveSectionUpdate, { passive: true });
  window.addEventListener("hashchange", () => {
    window.setTimeout(requestActiveSectionUpdate, 80);
    window.setTimeout(requestActiveSectionUpdate, 260);
  });
  window.setTimeout(requestActiveSectionUpdate, 80);
}

const hero = document.querySelector(".community-hero");

if (hero && !prefersReducedMotion) {
  let heroFrame = 0;

  const setHeroMotion = (event) => {
    window.cancelAnimationFrame(heroFrame);
    heroFrame = window.requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      const xRatio = (event.clientX - rect.left) / rect.width - 0.5;
      const yRatio = (event.clientY - rect.top) / rect.height - 0.5;

      hero.style.setProperty("--neural-x", `${(xRatio * 18).toFixed(2)}px`);
      hero.style.setProperty("--neural-y", `${(yRatio * 14).toFixed(2)}px`);
      hero.style.setProperty("--field-x", `${((xRatio + 0.5) * 100).toFixed(1)}%`);
      hero.style.setProperty("--field-y", `${((yRatio + 0.5) * 100).toFixed(1)}%`);
    });
  };

  const resetHeroMotion = () => {
    hero.style.setProperty("--neural-x", "0px");
    hero.style.setProperty("--neural-y", "0px");
    hero.style.setProperty("--field-x", "72%");
    hero.style.setProperty("--field-y", "42%");
  };

  const setHeroScroll = () => {
    const rect = hero.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1)));
    hero.style.setProperty("--neural-scroll", `${(progress * 18).toFixed(2)}px`);
  };

  hero.addEventListener("pointermove", setHeroMotion);
  hero.addEventListener("pointerleave", resetHeroMotion);
  window.addEventListener("scroll", setHeroScroll, { passive: true });
  resetHeroMotion();
  setHeroScroll();
}

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
