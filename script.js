const form = document.querySelector("#betaForm");
const note = document.querySelector("#formNote");
const panelButtons = document.querySelectorAll("[data-panel-target]");
const panels = document.querySelectorAll("[data-panel]");

function activatePanel(panelId, options = {}) {
  const targetPanel = document.querySelector(`[data-panel="${panelId}"]`);
  if (!targetPanel) {
    return false;
  }

  panels.forEach((panel) => {
    const isActive = panel === targetPanel;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  });

  panelButtons.forEach((button) => {
    const isActive = button.dataset.panelTarget === panelId;
    button.classList.toggle("is-active", isActive);
    if (button.getAttribute("role") === "tab") {
      button.setAttribute("aria-selected", String(isActive));
    }
  });

  if (options.updateHash !== false) {
    window.history.replaceState(null, "", `#branch-${panelId}`);
  }

  if (options.scrollToBranches) {
    document.querySelector("#branches")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return true;
}

function activateFromHash() {
  const rawHash = window.location.hash.replace("#", "");
  const panelId = rawHash.startsWith("branch-") ? rawHash.replace("branch-", "") : rawHash;
  return activatePanel(panelId, { updateHash: false });
}

panelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activatePanel(button.dataset.panelTarget, {
      scrollToBranches: Boolean(button.dataset.scrollTarget)
    });
  });
});

if (!activateFromHash()) {
  activatePanel("work", { updateHash: false });
}

window.addEventListener("hashchange", activateFromHash);

if (form && note) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const leads = JSON.parse(window.localStorage.getItem("whiteMatterLeads") || "[]");
    leads.push({
      ...data,
      createdAt: new Date().toISOString()
    });
    window.localStorage.setItem("whiteMatterLeads", JSON.stringify(leads));
    form.reset();
    note.textContent = "已记录合作意向。正式上线后可接入飞书多维表、腾讯云表单、企业微信或自有后端。";
  });
}
