const form = document.querySelector("#betaForm");
const note = document.querySelector("#formNote");
const demoTabs = document.querySelectorAll(".demo-tab");
const demoInput = document.querySelector("#demoInput");
const demoStructure = document.querySelector("#demoStructure");
const demoAction = document.querySelector("#demoAction");

const demos = {
  project: {
    input: "我们已经买下 zhisihub.com，今晚要先做一个能展示的官网，后面还要考虑备案、解析、内测入口和产品定位。",
    structure: [
      "主线：官网先上线，备案后正式接入国内服务",
      "定位：AI 思考中枢，不是普通笔记工具",
      "断点：域名解析、表单收集、ICP备案"
    ],
    action: "生成首页、配置临时展示链接、准备备案资料清单。"
  },
  content: {
    input: "我有很多公众号选题、资料链接和模型体验笔记，但不知道怎么组织成一篇有钩子、有证据、有结论的文章。",
    structure: [
      "入口：普通人为什么要知道这件事",
      "证据：官方信息、价格、能力边界、真实体验",
      "收束：给创作者和小团队的使用建议"
    ],
    action: "生成文章结构、配图清单和发布前检查表。"
  },
  research: {
    input: "我读了几篇论文和报告，里面概念很多，结论互相冲突，需要整理出真正可靠的判断和后续检索缺口。",
    structure: [
      "拆分概念定义和证据来源",
      "标出冲突假说、反例和未验证前提",
      "沉淀为可复用的研究笔记"
    ],
    action: "输出研究摘要、关键证据表和下一轮问题列表。"
  }
};

demoTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const demo = demos[tab.dataset.demo];
    if (!demo || !demoInput || !demoStructure || !demoAction) return;
    demoTabs.forEach((item) => item.classList.toggle("is-active", item === tab));
    demoInput.textContent = demo.input;
    demoStructure.innerHTML = demo.structure.map((item) => `<li>${item}</li>`).join("");
    demoAction.textContent = demo.action;
  });
});

if (form && note) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const leads = JSON.parse(window.localStorage.getItem("zhisiHubLeads") || "[]");
    leads.push({
      ...data,
      createdAt: new Date().toISOString()
    });
    window.localStorage.setItem("zhisiHubLeads", JSON.stringify(leads));
    form.reset();
    note.textContent = "已记录申请信息。正式上线后可接入腾讯云表单、飞书多维表或企业微信。";
  });
}
