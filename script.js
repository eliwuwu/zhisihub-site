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
