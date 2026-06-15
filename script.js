const form = document.querySelector("#betaForm");
const note = document.querySelector("#formNote");

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
