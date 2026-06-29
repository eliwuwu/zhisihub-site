const form = document.querySelector("#betaForm");
const note = document.querySelector("#formNote");

if (form && note) {
  const submitButton = form.querySelector("button[type='submit']");
  const submitted = new URLSearchParams(window.location.search).get("submitted");

  if (submitted === "1") {
    note.textContent = "申请已提交，我们会尽快联系你。";
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
      return;
    }

    note.textContent = "正在提交，请稍等。";

    if (submitButton) {
      submitButton.textContent = "正在提交";
      submitButton.disabled = true;
    }
  });
}

const homeFiberField = document.querySelector("#homeFiberField");

if (homeFiberField) {
  const namespace = "http://www.w3.org/2000/svg";
  const palette = [
    "rgba(22, 24, 25, 0.9)",
    "rgba(70, 70, 62, 0.8)",
    "rgba(103, 96, 61, 0.68)",
    "rgba(143, 128, 74, 0.58)",
    "rgba(16, 16, 16, 0.54)"
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

  for (let index = 0; index < 190; index += 1) {
    if (index % 3 === 0) {
      appendFiberPath("home-fiber-soft", index, {
        opacity: String(0.06 + random(index, 10) * 0.07),
        width: String(1.2 + random(index, 11) * 2.1)
      });
    }

    appendFiberPath(index % 2 === 0 ? "home-fiber-core" : "home-fiber-thread", index, {
      opacity: String(0.34 + random(index, 12) * 0.22),
      width: String(0.32 + random(index, 13) * 0.72)
    });

    if (index < 30) {
      appendFiberPath("home-fiber-spine", index + 540, {
        opacity: String(0.34 + random(index, 24) * 0.22),
        width: String(0.88 + random(index, 25) * 1.44)
      });
    }

  }

  for (let index = 0; index < 28; index += 1) {
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
