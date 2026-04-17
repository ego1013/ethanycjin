/**
 * 🎮 玩出来 - Peekaboo App Logic
 */

// === 初始化 ===
document.addEventListener("DOMContentLoaded", () => {
  // 归档当前周（如果尚未归档）
  Peekaboo.weeklyPlans.ensureCurrentWeekArchived();

  renderWeekday();
  renderWeekend();
  renderFeedbackHistory();
  initFeedbackForm();
});

// === 页面路由 ===
function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById("page-" + page).classList.add("active");
  document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
  document.querySelector(`.nav-tab[data-page="${page}"]`).classList.add("active");
  window.scrollTo(0, 0);

  if (page === "admin") {
    renderFeedbackHistory();
    renderSuggestionHistory();
    renderStats();
  }
  if (page === "archive") {
    renderArchivePage();
  }
}

// === 渲染 Hero ===
function renderHero(containerId) {
  const age = Peekaboo.calcAge();
  const weekRange = Peekaboo.getWeekRange();
  const weekNum = Peekaboo.getWeekNumber();

  const el = document.getElementById(containerId);
  el.innerHTML = `
    <div class="hero-label">👶 宝宝发展档案 · 第${weekNum}周</div>
    <div class="hero-age">校正月龄 ${age.displayCorrected}</div>
    <div class="hero-age-sub">实际月龄 ${age.displayActual}</div>
    <span class="hero-stage">📍 ${age.stage.name}（${age.stage.range}）</span>
    <div class="hero-focus">${age.stage.focus}</div>
  `;
}

// === 工作日版渲染 ===
function renderWeekday() {
  const age = Peekaboo.calcAge();
  const games = Peekaboo.getCurrentWeekGames();
  if (!games) return;

  renderHero("hero-weekday");

  // 本周日期范围
  const weekRange = Peekaboo.getWeekRange();
  document.getElementById("week-range-display").textContent = weekRange.display;

  // 模块一: 发展焦点
  const themes = getWeeklyTheme(age);
  document.getElementById("focus-card").innerHTML = `
    <div style="margin-bottom:10px;">
      <span class="domain-tag si">🌀 ${age.stage.name}</span>
      <span style="font-size:13px;color:var(--text-light);">校正 ${age.displayCorrected}</span>
    </div>
    <div style="font-size:15px;font-weight:600;margin-bottom:6px;">🎯 本周主题：「${themes.theme}」</div>
    <div style="font-size:13px;color:var(--text-light);margin-bottom:10px;">${themes.description}</div>
    <div class="info-block warm">
      <div class="info-block-label">👨 父亲角色提示</div>
      ${themes.fatherTip}
    </div>
  `;

  // 模块二: 晨间仪式
  const ritual = games.morningRitual;
  document.getElementById("ritual-card").innerHTML = `
    <div class="ritual-step">
      <div class="ritual-icon" style="background:#E8F5E9;">🌅</div>
      <div class="ritual-content">
        <h4>到床边问候</h4>
        <p>${ritual.greeting}</p>
      </div>
    </div>
    <div class="ritual-step">
      <div class="ritual-icon" style="background:#FFF8E1;">🤸</div>
      <div class="ritual-content">
        <h4>身体接触游戏</h4>
        <p>${ritual.bodyGame}</p>
      </div>
    </div>
    <div class="ritual-step">
      <div class="ritual-icon" style="background:#F3E5F5;">👋</div>
      <div class="ritual-content">
        <h4>告别仪式</h4>
        <p>${ritual.farewell}</p>
      </div>
    </div>
    <div class="info-block premature" style="margin-top:12px;">
      <div class="info-block-label">💡 为何重复仪式对早产儿特别重要</div>
      ${ritual.whyRepeat}
    </div>
  `;

  // 模块三: 每日游戏
  const dayNames = { MON: "周一", TUE: "周二", WED: "周三", THU: "周四", FRI: "周五" };
  const dayFocus = { MON: "感知觉", TUE: "运动", WED: "认知", THU: "语言", FRI: "社会情感" };
  const dayKeys = ["MON", "TUE", "WED", "THU", "FRI"];
  let gamesHTML = "";

  dayKeys.forEach((key, idx) => {
    const dayGames = games.weekday[key];
    if (!dayGames || dayGames.length === 0) return;
    const game = dayGames[0]; // 每天一个主游戏

    const domainsHTML = game.domains.map(d => {
      const dom = Peekaboo.domains[d];
      return `<span class="domain-tag ${d.toLowerCase()}">${dom.emoji} ${dom.name}</span>`;
    }).join("");

    gamesHTML += `
      <div class="game-card" id="game-${key}">
        <div class="game-card-head" onclick="toggleGameCard('game-${key}')">
          <div>
            <div class="game-card-day">${dayNames[key]} · ${dayFocus[key]}日</div>
            <div class="game-card-name">🎮 ${game.name}</div>
            <div class="game-card-meta">
              <span>⏱️ ${game.duration}</span>
              <span>📍 ${game.scene}</span>
            </div>
            <div style="margin-top:8px;">${domainsHTML}</div>
          </div>
          <button class="game-card-toggle">▼</button>
        </div>
        <div class="game-card-body">
          <div style="margin-bottom:12px;">
            <div style="font-size:13px;font-weight:600;color:var(--text-light);margin-bottom:6px;">🧸 所需材料</div>
            <div class="materials-list">
              ${game.materials.map(m => `<span class="material-chip">${m}</span>`).join("")}
            </div>
          </div>

          <div style="font-size:13px;font-weight:600;color:var(--text-light);margin-bottom:4px;">🎮 游戏步骤</div>
          <div class="game-steps">
            ${game.steps.map(s => `<div class="game-step"><p>${s}</p></div>`).join("")}
          </div>

          <div class="info-block interact">
            <div class="info-block-label">💡 互动要点 · Serve & Return</div>
            ${game.interaction}
          </div>

          <div class="info-block upgrade">
            <div class="info-block-label">🔁 变式升级</div>
            ${game.upgrade}
          </div>

          ${game.prematureNote ? `
          <div class="info-block premature">
            <div class="info-block-label">⚡ 早产儿适配提示</div>
            ${game.prematureNote}
          </div>` : ""}

          <div style="margin-top:12px;text-align:right;">
            <button class="btn btn-secondary" onclick="quickFeedback('${game.name}', '${key}')">
              💬 记录反馈
            </button>
          </div>
        </div>
      </div>
    `;
  });
  document.getElementById("weekday-games").innerHTML = gamesHTML;

  // Serve & Return
  renderServeReturn("sr-card-weekday");

  // 模块四: 观察记录
  const obs = games.observationPrompts || [];
  document.getElementById("observation-card").innerHTML = `
    ${obs.map(o => `
      <div class="obs-item">
        <div class="obs-dot"></div>
        <div>${o}</div>
      </div>
    `).join("")}
    <div class="info-block warm" style="margin-top:12px;">
      <div class="info-block-label">📱 记录方式</div>
      30秒手机视频 = 最好的发展档案。不需要完美，拍到就好。这些记录会帮助我调整下周的游戏推荐。
    </div>
  `;

  // 领域覆盖矩阵
  renderCoverageMatrix(games);

  // 给父亲的话
  document.getElementById("father-note-weekday").innerHTML = getFatherNote();

  // 免责声明
  document.getElementById("disclaimer").innerHTML = getDisclaimer();
}

// === 周末版渲染 ===
function renderWeekend() {
  const age = Peekaboo.calcAge();
  const games = Peekaboo.getCurrentWeekGames();
  if (!games || !games.weekend) return;

  renderHero("hero-weekend");

  const wk = games.weekend;

  // 周末主题
  const themes = getWeekendTheme(age);
  document.getElementById("weekend-theme").innerHTML = `
    <div style="font-size:15px;font-weight:600;margin-bottom:6px;">🎯 本周末聚焦：「${themes.theme}」</div>
    <div style="font-size:13px;color:var(--text-light);margin-bottom:10px;">${themes.description}</div>
    <div class="info-block warm">
      <div class="info-block-label">👨 父亲周末游戏的特殊价值</div>
      ${themes.fatherValue}
    </div>
  `;

  // === 周六 ===
  // 上午主游戏
  const sat = wk.saturday;
  if (sat.morning) {
    const main = sat.morning.main;
    const aux = sat.morning.aux;

    let morningHTML = renderFullGame(main, "周六上午 · 主游戏");

    if (aux) {
      morningHTML += `
        <div style="margin-top:12px;">
          <div style="font-size:14px;font-weight:600;margin-bottom:8px;">🎈 辅助游戏（10分钟）</div>
          ${renderFullGame(aux, "辅助游戏")}
        </div>
      `;
    }

    morningHTML += `
      <div class="info-block warm" style="margin-top:12px;">
        <div class="info-block-label">🧘 游戏间隙</div>
        RIE 理念提醒：游戏之间给宝宝自由探索的时间。当她专注于某样东西时——不打扰。这段"无所事事"的时间，大脑正在拼命工作。
      </div>
    `;

    document.getElementById("sat-morning").innerHTML = morningHTML;
  }

  // 下午：户外/室内
  if (sat.afternoon) {
    const outdoor = sat.afternoon.outdoor;
    const indoor = sat.afternoon.indoor;

    let afternoonHTML = `
      <div class="tab-row">
        <button class="tab-item active" onclick="toggleAfternoon('outdoor', this)">🌳 天气好 · 户外</button>
        <button class="tab-item" onclick="toggleAfternoon('indoor', this)">🏠 天气差 · 室内</button>
      </div>
      <div id="afternoon-outdoor">${renderSimpleGame(outdoor)}</div>
      <div id="afternoon-indoor" style="display:none;">${renderSimpleGame(indoor)}</div>
      <div class="info-block premature" style="margin-top:12px;">
        <div class="info-block-label">⚡ 前庭觉重点提示</div>
        早产儿前庭发育需特别关注。轻柔的摇晃、俯卧飞机姿势是安全的前庭激活方式。避免突然快速的上下或旋转动作。观察宝宝的耐受信号：如果她变得安静且僵硬，说明刺激过强。
      </div>
    `;
    document.getElementById("sat-afternoon").innerHTML = afternoonHTML;
  }

  // 亲子共读
  if (sat.reading) {
    const read = sat.reading;
    document.getElementById("sat-reading").innerHTML = `
      <div class="weekend-reading" style="border-radius:var(--radius);padding:20px;">
        <div style="font-size:16px;font-weight:700;margin-bottom:8px;">📖 ${read.book}</div>
        <div style="font-size:13px;color:var(--text-light);margin-bottom:10px;">${read.why}</div>
        <div class="info-block interact">
          <div class="info-block-label">📖 阅读方式指导</div>
          ${read.howTo}
        </div>
        <div style="margin-top:12px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:6px;">💬 互动话术示例：</div>
          <ul class="reading-script">
            ${read.script.map(s => `<li>${s}</li>`).join("")}
          </ul>
        </div>
      </div>
    `;
  }

  // === 周日 ===
  if (wk.sunday) {
    const sun = wk.sunday;

    // 上午：重复+微创新
    if (sun.morning) {
      document.getElementById("sun-morning").innerHTML = `
        <div class="card">
          <div style="font-size:14px;font-weight:600;margin-bottom:8px;">🔄 ${sun.morning.name}</div>
          <div style="font-size:13px;color:var(--text-light);margin-bottom:12px;">${sun.morning.note}</div>
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;">✨ 微创新建议：</div>
          ${sun.morning.variations.map(v => `<div class="variation-item">${v}</div>`).join("")}
        </div>
      `;
    }

    // 下午：日常照料变游戏
    if (sun.afternoon) {
      document.getElementById("sun-afternoon").innerHTML = `
        <div class="card">
          <div style="font-size:14px;font-weight:600;margin-bottom:12px;">🏠 ${sun.afternoon.name}</div>
          ${sun.afternoon.scenes.map(s => `
            <div class="care-scene">
              <div class="care-scene-title">
                ${s.scene === "换尿布时" ? "🧷" : s.scene === "洗澡时" ? "🛁" : "🍼"} ${s.scene}
                <span class="domain-tag" style="font-size:10px;padding:1px 6px;background:#f0f0f0;color:#666;">${s.domain}</span>
              </div>
              <p>${s.script}</p>
            </div>
          `).join("")}
        </div>
      `;
    }

    // 本周复盘
    document.getElementById("week-review").innerHTML = `
      <div class="card">
        <div style="font-size:14px;margin-bottom:10px;">
          <strong>🌟 本周发展亮点</strong><br>
          <span style="font-size:13px;color:var(--text-light);">
            ${getWeekHighlight(age)}
          </span>
        </div>
        <div style="font-size:14px;margin-bottom:10px;">
          <strong>🔮 下周预告</strong><br>
          <span style="font-size:13px;color:var(--text-light);">
            ${getNextWeekPreview(age)}
          </span>
        </div>
        <div class="info-block warm">
          <div class="info-block-label">💪 给忙碌的爸爸</div>
          ${getBusyDadNote()}
        </div>
      </div>
    `;
  }

  // Serve & Return
  renderServeReturn("sr-card-weekend");

  // 给父亲的话
  document.getElementById("father-note-weekend").innerHTML = getFatherNote();
  document.getElementById("disclaimer-weekend").innerHTML = getDisclaimer();
}

// === 渲染完整游戏卡 ===
function renderFullGame(game, label) {
  const domainsHTML = game.domains.map(d => {
    const dom = Peekaboo.domains[d];
    return `<span class="domain-tag ${d.toLowerCase()}">${dom.emoji} ${dom.name}</span>`;
  }).join("");

  return `
    <div class="game-card open">
      <div class="game-card-head">
        <div>
          <div class="game-card-day">${label}</div>
          <div class="game-card-name">🎮 ${game.name}</div>
          <div class="game-card-meta">
            <span>⏱️ ${game.duration}</span>
            <span>📍 ${game.scene || ""}</span>
          </div>
          <div style="margin-top:8px;">${domainsHTML}</div>
        </div>
      </div>
      <div class="game-card-body" style="display:block;">
        <div style="margin-bottom:12px;">
          <div style="font-size:13px;font-weight:600;color:var(--text-light);margin-bottom:6px;">🧸 所需材料</div>
          <div class="materials-list">
            ${game.materials.map(m => `<span class="material-chip">${m}</span>`).join("")}
          </div>
        </div>
        <div style="font-size:13px;font-weight:600;color:var(--text-light);margin-bottom:4px;">🎮 游戏步骤</div>
        <div class="game-steps">
          ${game.steps.map(s => `<div class="game-step"><p>${s}</p></div>`).join("")}
        </div>
        ${game.interaction ? `
        <div class="info-block interact">
          <div class="info-block-label">💡 互动要点</div>
          ${game.interaction}
        </div>` : ""}
        ${game.upgrade ? `
        <div class="info-block upgrade">
          <div class="info-block-label">🔁 变式升级</div>
          ${game.upgrade}
        </div>` : ""}
        ${game.prematureNote ? `
        <div class="info-block premature">
          <div class="info-block-label">⚡ 早产儿适配</div>
          ${game.prematureNote}
        </div>` : ""}
      </div>
    </div>
  `;
}

// === 渲染简化游戏卡 ===
function renderSimpleGame(game) {
  const domainsHTML = game.domains ? game.domains.map(d => {
    const dom = Peekaboo.domains[d];
    return `<span class="domain-tag ${d.toLowerCase()}">${dom.emoji} ${dom.name}</span>`;
  }).join("") : "";

  return `
    <div class="card">
      <div style="font-size:16px;font-weight:700;margin-bottom:4px;">🎮 ${game.name}</div>
      <div style="margin:6px 0;">${domainsHTML}</div>
      ${game.duration ? `<div style="font-size:12px;color:var(--text-light);margin-bottom:10px;">⏱️ ${game.duration}</div>` : ""}
      ${game.materials ? `
      <div class="materials-list" style="margin-bottom:10px;">
        ${game.materials.map(m => `<span class="material-chip">${m}</span>`).join("")}
      </div>` : ""}
      <div class="game-steps">
        ${game.steps.map(s => `<div class="game-step"><p>${s}</p></div>`).join("")}
      </div>
      ${game.interaction ? `
      <div class="info-block interact">
        <div class="info-block-label">💡 互动要点</div>
        ${game.interaction}
      </div>` : ""}
      ${game.prematureNote ? `
      <div class="info-block premature">
        <div class="info-block-label">⚡ 早产儿适配</div>
        ${game.prematureNote}
      </div>` : ""}
    </div>
  `;
}

// === Serve & Return ===
function renderServeReturn(containerId) {
  const tip = Peekaboo.getServeReturnTip();
  document.getElementById(containerId).innerHTML = `
    <div class="sr-card">
      <div style="font-size:14px;font-weight:600;margin-bottom:10px;">🏓 本周 Serve & Return 练习</div>
      <div class="sr-flow">
        <div class="sr-bubble sr-serve">
          <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:4px;">S · 宝宝发出信号</div>
          ${tip.serve}
        </div>
        <div class="sr-arrow">→</div>
        <div class="sr-bubble sr-return">
          <div style="font-size:11px;font-weight:600;color:var(--accent);margin-bottom:4px;">R · 爸爸热情回应</div>
          ${tip.ret}
        </div>
      </div>
      <div class="sr-principle">💡 ${tip.principle}</div>
    </div>
  `;
}

// === 领域覆盖矩阵 ===
function renderCoverageMatrix(games) {
  const dayKeys = ["MON", "TUE", "WED", "THU", "FRI"];
  const domainKeys = ["GM", "FM", "COG", "LANG", "SE", "SI"];
  const dayNames = { MON: "一", TUE: "二", WED: "三", THU: "四", FRI: "五" };

  // 计算覆盖
  const coverage = {};
  domainKeys.forEach(d => { coverage[d] = {}; dayKeys.forEach(day => { coverage[d][day] = false; }); });

  dayKeys.forEach(day => {
    const dayGames = games.weekday[day];
    if (dayGames) {
      dayGames.forEach(g => {
        g.domains.forEach(d => { coverage[d][day] = true; });
      });
    }
  });

  // 统计每个领域的覆盖天数
  let matrixHTML = '<div style="overflow-x:auto;">';
  matrixHTML += '<table style="width:100%;font-size:12px;border-collapse:collapse;">';
  matrixHTML += '<thead><tr><th style="text-align:left;padding:6px;"></th>';
  dayKeys.forEach(d => { matrixHTML += `<th style="padding:6px;text-align:center;">周${dayNames[d]}</th>`; });
  matrixHTML += '<th style="padding:6px;text-align:center;">次数</th></tr></thead><tbody>';

  domainKeys.forEach(dk => {
    const dom = Peekaboo.domains[dk];
    let count = 0;
    matrixHTML += `<tr><td style="padding:6px;font-weight:600;">${dom.emoji} ${dom.name}</td>`;
    dayKeys.forEach(day => {
      if (coverage[dk][day]) {
        count++;
        matrixHTML += `<td style="padding:6px;text-align:center;"><span style="display:inline-block;width:20px;height:20px;border-radius:6px;background:${dom.color};opacity:0.8;"></span></td>`;
      } else {
        matrixHTML += `<td style="padding:6px;text-align:center;"><span style="display:inline-block;width:20px;height:20px;border-radius:6px;background:#eee;"></span></td>`;
      }
    });
    const status = count >= 2 ? "✅" : "⚠️";
    matrixHTML += `<td style="padding:6px;text-align:center;font-weight:600;">${count}/5 ${status}</td>`;
    matrixHTML += '</tr>';
  });

  matrixHTML += '</tbody></table></div>';
  matrixHTML += '<div style="font-size:11px;color:var(--text-muted);margin-top:8px;">✅ 每周各领域至少出现2次 | ⚠️ 周末方案补充覆盖</div>';

  document.getElementById("coverage-card").innerHTML = matrixHTML;
}

// === 游戏卡展开/收起 ===
function toggleGameCard(id) {
  const card = document.getElementById(id);
  card.classList.toggle("open");
}

// === 周末日切换 ===
function showWeekendDay(day) {
  document.getElementById("weekend-sat").style.display = day === "sat" ? "block" : "none";
  document.getElementById("weekend-sun").style.display = day === "sun" ? "block" : "none";
  document.querySelectorAll("#weekend-tabs .tab-item").forEach(t => t.classList.remove("active"));
  event.target.classList.add("active");
}

// === 下午户外/室内切换 ===
function toggleAfternoon(type, btn) {
  document.getElementById("afternoon-outdoor").style.display = type === "outdoor" ? "block" : "none";
  document.getElementById("afternoon-indoor").style.display = type === "indoor" ? "block" : "none";
  btn.parentElement.querySelectorAll(".tab-item").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
}

// === 反馈系统 ===
function initFeedbackForm() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("fb-date").value = today;
}

function selectEmoji(btn, groupId) {
  const group = document.getElementById(groupId);
  group.querySelectorAll(".emoji-btn").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
}

function toggleDomain(btn) {
  btn.classList.toggle("selected");
  if (btn.classList.contains("selected")) {
    btn.style.background = "var(--accent-soft)";
    btn.style.borderColor = "var(--accent)";
  } else {
    btn.style.background = "";
    btn.style.borderColor = "";
  }
}

function submitFeedback() {
  const date = document.getElementById("fb-date").value;
  const game = document.getElementById("fb-game").value;
  const enjoyBtn = document.querySelector("#fb-enjoy .emoji-btn.selected");
  const enjoy = enjoyBtn ? parseInt(enjoyBtn.dataset.value) : 0;
  const duration = document.getElementById("fb-duration").value;
  const domains = Array.from(document.querySelectorAll("#fb-domains .selected")).map(b => b.dataset.domain);
  const observation = document.getElementById("fb-observation").value;
  const highlight = document.getElementById("fb-highlight").value;
  const suggestion = document.getElementById("fb-suggestion").value;

  if (!game) { showToast("请填写游戏名称"); return; }
  if (!enjoy) { showToast("请选择宝宝享受程度"); return; }

  const data = {
    date, game, enjoy, duration: parseInt(duration) || 0,
    domains, observation, highlight, suggestion,
    weekNumber: Peekaboo.getWeekNumber(new Date(date)),
    correctedAge: Peekaboo.calcAge(new Date(date)).displayCorrected,
  };

  Peekaboo.feedback.save(data);
  showToast("✅ 反馈已保存！感谢你的记录");
  clearFeedbackForm();
}

function clearFeedbackForm() {
  document.getElementById("fb-game").value = "";
  document.getElementById("fb-duration").value = "";
  document.getElementById("fb-observation").value = "";
  document.getElementById("fb-highlight").value = "";
  document.getElementById("fb-suggestion").value = "";
  document.querySelectorAll("#fb-enjoy .emoji-btn").forEach(b => b.classList.remove("selected"));
  document.querySelectorAll("#fb-domains .domain-select").forEach(b => {
    b.classList.remove("selected");
    b.style.background = "";
    b.style.borderColor = "";
  });
}

function quickFeedback(gameName, day) {
  showPage("feedback");
  document.getElementById("fb-game").value = gameName;
  document.getElementById("fb-game").focus();
}

// === 产品建议 ===
function submitSuggestion() {
  const type = document.getElementById("sug-type").value;
  const content = document.getElementById("sug-content").value;
  if (!content) { showToast("请填写建议内容"); return; }

  Peekaboo.suggestions.save({ type, content });
  showToast("✅ 建议已保存！感谢你的反馈");
  document.getElementById("sug-content").value = "";
}

// === 管理后台渲染 ===
function showAdminTab(tab) {
  document.querySelectorAll(".admin-tab-content").forEach(t => t.style.display = "none");
  document.getElementById("admin-" + tab).style.display = "block";
  event.target.parentElement.querySelectorAll(".tab-item").forEach(t => t.classList.remove("active"));
  event.target.classList.add("active");

  if (tab === "feedbacks") renderFeedbackHistory();
  if (tab === "suggestions") renderSuggestionHistory();
  if (tab === "stats") renderStats();
}

// === 数据导出/导入 ===
function exportAllData() {
  const data = {
    exportedAt: new Date().toISOString(),
    version: "1.1",
    babyName: Peekaboo.baby.name,
    feedbacks: Peekaboo.feedback.getAll(),
    suggestions: Peekaboo.suggestions.getAll(),
    weeklyPlans: Peekaboo.weeklyPlans.getAll(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `peekaboo_data_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("✅ 数据已导出为 JSON 文件");
}

function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.feedbacks && !data.suggestions && !data.weeklyPlans) {
          showToast("❌ 文件格式不正确"); return;
        }
        let importCount = 0;
        // 合并数据（不覆盖）
        if (data.feedbacks) {
          const existing = Peekaboo.feedback.getAll();
          const existingIds = new Set(existing.map(f => f.id));
          const newItems = data.feedbacks.filter(f => !existingIds.has(f.id));
          const merged = [...existing, ...newItems];
          localStorage.setItem("peekaboo_feedbacks", JSON.stringify(merged));
          importCount += newItems.length;
        }
        if (data.suggestions) {
          const existing = Peekaboo.suggestions.getAll();
          const existingIds = new Set(existing.map(s => s.id));
          const newItems = data.suggestions.filter(s => !existingIds.has(s.id));
          const merged = [...existing, ...newItems];
          localStorage.setItem("peekaboo_suggestions", JSON.stringify(merged));
        }
        if (data.weeklyPlans) {
          const existing = Peekaboo.weeklyPlans.getAll();
          Object.keys(data.weeklyPlans).forEach(weekKey => {
            if (!existing[weekKey]) {
              existing[weekKey] = data.weeklyPlans[weekKey];
            }
          });
          localStorage.setItem("peekaboo_weekly_plans", JSON.stringify(existing));
        }
        showToast(`✅ 导入成功！`);
        renderFeedbackHistory();
        renderSuggestionHistory();
        renderStats();
      } catch (err) {
        showToast("❌ 文件解析失败：" + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function clearAllData() {
  if (!confirm("⚠️ 确定要清除所有数据吗？此操作不可撤销！\n\n建议先导出数据备份。")) return;
  if (!confirm("再次确认：清除后所有反馈记录和产品建议都将丢失！")) return;
  localStorage.removeItem("peekaboo_feedbacks");
  localStorage.removeItem("peekaboo_suggestions");
  localStorage.removeItem("peekaboo_weekly_plans");
  showToast("🗑️ 所有数据已清除");
  renderFeedbackHistory();
  renderSuggestionHistory();
  renderStats();
}

function renderFeedbackHistory() {
  const feedbacks = Peekaboo.feedback.getAll().reverse();
  const container = document.getElementById("admin-feedbacks");

  if (feedbacks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-text">还没有反馈记录<br>玩完游戏后来这里记录吧！</div>
      </div>
    `;
    return;
  }

  const emojiMap = { 1: "😐", 2: "🙂", 3: "😊", 4: "😄", 5: "🤩" };
  container.innerHTML = feedbacks.map(f => `
    <div class="feedback-item">
      <div class="feedback-item-header">
        <div>
          <div class="feedback-game">${f.game}</div>
          <div class="feedback-date">📅 ${f.date} · 校正 ${f.correctedAge} · 第${f.weekNumber}周</div>
        </div>
        <div class="feedback-rating">${emojiMap[f.enjoy] || "😊"}</div>
      </div>
      ${f.domains && f.domains.length > 0 ? `
      <div style="margin:6px 0;">
        ${f.domains.map(d => {
          const dom = Peekaboo.domains[d];
          return dom ? `<span class="domain-tag ${d.toLowerCase()}">${dom.emoji} ${dom.name}</span>` : "";
        }).join("")}
      </div>` : ""}
      ${f.duration ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">⏱️ ${f.duration}分钟</div>` : ""}
      ${f.observation ? `<div class="feedback-text">👀 ${f.observation}</div>` : ""}
      ${f.highlight ? `<div class="feedback-text" style="margin-top:4px;">📸 ${f.highlight}</div>` : ""}
      ${f.suggestion ? `<div class="feedback-text" style="margin-top:4px;">💡 ${f.suggestion}</div>` : ""}
    </div>
  `).join("");
}

function renderSuggestionHistory() {
  const suggestions = Peekaboo.suggestions.getAll().reverse();
  const container = document.getElementById("admin-suggestions");

  if (suggestions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💡</div>
        <div class="empty-state-text">还没有产品建议<br>有好想法随时提交！</div>
      </div>
    `;
    return;
  }

  const typeMap = { game: "🎮 游戏内容", ui: "🎨 界面交互", feature: "✨ 新功能", bug: "🐛 问题反馈", other: "📝 其他" };

  container.innerHTML = suggestions.map(s => `
    <div class="feedback-item">
      <div class="feedback-item-header">
        <div>
          <span style="font-size:13px;font-weight:600;">${typeMap[s.type] || s.type}</span>
          <span class="status-badge ${s.status}">${s.status === "pending" ? "待处理" : s.status === "accepted" ? "已采纳" : "已完成"}</span>
        </div>
        <div class="feedback-date">${new Date(s.createdAt).toLocaleDateString("zh-CN")}</div>
      </div>
      <div class="feedback-text">${s.content}</div>
    </div>
  `).join("");
}

function renderStats() {
  const feedbacks = Peekaboo.feedback.getAll();
  const container = document.getElementById("admin-stats");

  if (feedbacks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📈</div>
        <div class="empty-state-text">积累更多反馈后，这里会出现发展统计</div>
      </div>
    `;
    return;
  }

  // 统计
  const totalGames = feedbacks.length;
  const totalMinutes = feedbacks.reduce((sum, f) => sum + (f.duration || 0), 0);
  const avgEnjoy = (feedbacks.reduce((sum, f) => sum + (f.enjoy || 0), 0) / totalGames).toFixed(1);

  // 领域统计
  const domainCount = {};
  feedbacks.forEach(f => {
    (f.domains || []).forEach(d => { domainCount[d] = (domainCount[d] || 0) + 1; });
  });

  // 最受欢迎游戏
  const gameEnjoy = {};
  const gameCount = {};
  feedbacks.forEach(f => {
    gameEnjoy[f.game] = (gameEnjoy[f.game] || 0) + (f.enjoy || 0);
    gameCount[f.game] = (gameCount[f.game] || 0) + 1;
  });

  const topGames = Object.keys(gameEnjoy)
    .map(g => ({ name: g, avg: (gameEnjoy[g] / gameCount[g]).toFixed(1), count: gameCount[g] }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  const emojiMap = { 1: "😐", 2: "🙂", 3: "😊", 4: "😄", 5: "🤩" };

  container.innerHTML = `
    <div class="card">
      <div style="font-size:15px;font-weight:700;margin-bottom:12px;">📊 总览</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center;">
        <div style="background:var(--accent-soft);border-radius:12px;padding:14px;">
          <div style="font-size:24px;font-weight:800;color:var(--accent);">${totalGames}</div>
          <div style="font-size:12px;color:var(--text-light);">游戏记录</div>
        </div>
        <div style="background:var(--info-soft);border-radius:12px;padding:14px;">
          <div style="font-size:24px;font-weight:800;color:var(--info);">${totalMinutes}</div>
          <div style="font-size:12px;color:var(--text-light);">总分钟数</div>
        </div>
        <div style="background:var(--warm-soft);border-radius:12px;padding:14px;">
          <div style="font-size:24px;font-weight:800;color:#E17055;">${avgEnjoy}</div>
          <div style="font-size:12px;color:var(--text-light);">平均愉悦度</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div style="font-size:15px;font-weight:700;margin-bottom:12px;">🏃 领域覆盖</div>
      ${Object.keys(Peekaboo.domains).map(dk => {
        const dom = Peekaboo.domains[dk];
        const count = domainCount[dk] || 0;
        const maxCount = Math.max(...Object.values(domainCount), 1);
        const pct = Math.round((count / maxCount) * 100);
        return `
          <div style="display:flex;align-items:center;gap:10px;margin:6px 0;">
            <span style="font-size:12px;width:80px;font-weight:600;">${dom.emoji} ${dom.name}</span>
            <div style="flex:1;height:20px;background:#f0f0f0;border-radius:10px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:${dom.color};border-radius:10px;transition:width 0.5s;"></div>
            </div>
            <span style="font-size:12px;color:var(--text-light);width:30px;text-align:right;">${count}次</span>
          </div>
        `;
      }).join("")}
    </div>

    ${topGames.length > 0 ? `
    <div class="card">
      <div style="font-size:15px;font-weight:700;margin-bottom:12px;">⭐ 最受欢迎游戏</div>
      ${topGames.map((g, i) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.04);">
          <div>
            <span style="font-size:13px;font-weight:600;">${i+1}. ${g.name}</span>
            <span style="font-size:11px;color:var(--text-muted);margin-left:6px;">玩了${g.count}次</span>
          </div>
          <span style="font-size:18px;">${emojiMap[Math.round(g.avg)] || "😊"} ${g.avg}</span>
        </div>
      `).join("")}
    </div>` : ""}

    <div class="info-block warm">
      <div class="info-block-label">📊 数据如何指导游戏推荐</div>
      宝宝最喜欢的游戏类型和领域偏好会影响下周的游戏推荐。覆盖较少的领域会在下周得到更多关注，最受欢迎的游戏会出现升级变式。
    </div>
  `;
}

// === 辅助内容生成 ===
function getWeeklyTheme(age) {
  const stageThemes = {
    0: [
      { theme: "感官世界初探", description: "宝宝正在建立最基本的感知通道——看、听、摸，每一种感觉都是全新的体验", fatherTip: "父亲的低沉声音是天然的感官刺激器。你的声音频率与母亲不同，能激活宝宝不同的听觉神经通路。抱着她说话、唱歌，本身就是最好的语言启蒙。" },
    ],
    1: [
      { theme: "探索因果", description: "宝宝开始理解'我的动作会产生结果'——按下去会响、拉过来能拿到", fatherTip: "父亲的游戏风格天然更具挑战性和刺激性——你会不自觉地把玩具放远一点、声音做得更夸张、动作幅度更大。这恰好是'激活性依恋'的核心：在安全范围内提供探索的动力。" },
      { theme: "镜中的我", description: "自我意识的种子正在发芽——宝宝开始对镜中的影像产生兴趣", fatherTip: "和宝宝一起照镜子时，你的面部表情是她学习社交信号的第一教材。爸爸的夸张表情对她来说格外有趣——因为和妈妈的温柔表情形成了生动的对比。" },
      { theme: "声音探险家", description: "听觉辨别能力快速发展，宝宝开始对不同声音产生好奇和偏好", fatherTip: "研究显示，父亲的低频声音对早产儿神经系统有独特的镇静与激活双重效果。多和她说话、唱歌，你的声音就是她的安全锚。" },
    ],
    2: [
      { theme: "翻身探索家", description: "翻身越来越熟练，趴姿越来越稳——宝宝正在用身体探索三维空间的第一步", fatherTip: "爸爸是天然的'翻身教练'。你可以躺在她不熟练翻身的那一侧，用声音和笑容吸引她翻过来找你——爱是最好的运动动力。" },
      { theme: "触觉大发现", description: "手部探索能力飞速发展——抓、摸、捏、拍，每一种触感都是新世界", fatherTip: "她反复扔玩具不是捣乱！是在验证'每次扔都会掉'这个物理定律。你配合捡起来还给她=世界上最有耐心的实验助手。" },
    ],
    3: [
      { theme: "社交小天才", description: "共同注意力、模仿、社会参照——宝宝的社交操作系统正在快速安装", fatherTip: "她回头看你的表情来判断'这个东西安不安全'——你就是她的安全GPS。保持微笑和鼓励的表情，就是给她探索世界的绿灯。" },
    ],
    4: [
      { theme: "语言前夜", description: "开口说话前的最后冲刺——词汇库在悄悄积累，理解力远超表达力", fatherTip: "不要因为她还不会说话就少和她对话。她的大脑正在疯狂地建立语音-含义的映射。你说的每一个词都在为'开口那天'做准备。" },
    ],
  };

  const themes = stageThemes[age.stage.id] || stageThemes[1];
  const weekNum = Peekaboo.getWeekNumber();
  return themes[weekNum % themes.length];
}

function getWeekendTheme(age) {
  const themes = {
    1: { theme: "感官大冒险", description: "工作日以单一感官通道为主，周末打组合拳——多感官同时激活！", fatherValue: "周末是爸爸的主场。你有更多时间做'身体激活型'游戏——飞高高、地板翻滚、户外探索。这些游戏提供的前庭觉和本体觉刺激，是工作日短时间内难以覆盖的。Paquette 的研究表明，父亲的激活性游戏帮助孩子建立面对新环境时的自信心。" },
    2: { theme: "翻身小冒险", description: "翻身渐入佳境，趴姿越来越稳——周末用更长的时间陪她巩固这些里程碑式的进步！", fatherValue: "宝宝正在攻克翻身和趴姿这两个大运动关键点。爸爸的角色是提供安全的挑战环境——在她不熟练的翻身方向温柔引导、在趴姿时用有趣的玩具延长她的兴趣。Paquette 的研究表明，父亲的激活性游戏即使在温和的翻身练习中也能体现——你的声音、你的笑容就是她挑战自己的最大动力。" },
    3: { theme: "社交实验室", description: "周末有更多亲子互动时间，正是练习共同注意力和模仿游戏的黄金时段", fatherValue: "周末可以带宝宝去新环境（公园、朋友家），这些社交场景是平时在家无法提供的。在新环境中，她会更频繁地做'社会参照'——回头看你的表情。你的每一个微笑都在说：'放心，这里是安全的。'" },
    4: { theme: "语言浸泡日", description: "周末是语言输入的黄金时间——更多对话、更多命名、更多共读", fatherValue: "研究显示，父亲的语言输入与母亲互补：父亲倾向使用更多新词汇和更复杂的句式。周末多和她'聊天'——即使她还不会回答，你的语言正在塑造她的大脑。" },
  };
  return themes[age.stage.id] || themes[1];
}

function getWeekHighlight(age) {
  const highlights = {
    1: "这个阶段的宝宝正在经历一场感官革命——每一天都有新的神经连接在建立。你可能已经注意到她对你的声音越来越敏感，目光追踪越来越流畅。这些看似微小的变化，背后是大脑在以惊人的速度构建认知地图。",
    2: "翻身这个看似简单的动作，其实是宝宝人生中第一次'自主移动'——她发现自己可以改变身体在空间中的位置。这周注意观察：她的翻身是否越来越流畅？不熟练的那一侧有没有进步？趴着时是否能撑得更久、头转得更灵活？这些微小的变化，每一个都是核心肌群和运动规划能力在飞速发展的证据。",
    3: "社交认知爆发让宝宝变成了一个小小的'读心者'——她开始理解你的表情、语气、手势背后的含义。这周注意观察她的'社会参照'行为：面对新事物时回头看你，是她信任你的最美证据。",
    4: "语言爆发前夜是最让人期待的阶段。她可能还说不出完整的词，但她的理解力已经远远超过表达力。当你说'把球给爸爸'而她真的伸手递给你时——那个瞬间，就是语言理解的里程碑。",
  };
  return highlights[age.stage.id] || highlights[1];
}

function getNextWeekPreview(age) {
  const previews = {
    1: "下周我们将继续深化感知觉训练，并开始引入更多因果关系游戏。宝宝的手眼协调即将进入一个小飞跃期，准备好更多可以抓握和摇晃的安全物品吧！",
    2: "下周我们将继续巩固翻身技能——特别关注不熟练那一侧的引导，同时延长趴姿时间。趴着时手部的自由探索是精细运动的重要训练窗口。认知方面，继续强化因果关系和客体永久性游戏。",
    3: "下周将进入模仿游戏的深化阶段，同时开始引入简单的指令理解训练。宝宝的词汇理解库正在快速扩容，准备好更多命名游戏！",
    4: "下周将聚焦精细运动和语言输出的结合——'指着说'是这个阶段最重要的新技能。每当她指向什么，你的命名就是在帮她的词汇库'注册'新条目。",
  };
  return previews[age.stage.id] || previews[1];
}

function getFatherNote() {
  const notes = [
    `<strong>🏋️ 给 Ethan</strong>你今天又在百忙中打开了这个页面——这本身就说明了一切。研究表明，决定亲子关系质量的不是总时长，而是互动密度。你每天那20分钟全身心投入的游戏，比心不在焉的2小时更有价值。她不会记得你今天加班到几点，但她的大脑会记住：爸爸的声音让我安心，爸爸的怀抱让我勇敢。`,
    `<strong>🌟 给 Ethan</strong>不要追求完美的游戏执行。宝宝最需要的不是一个完美的游戏设计师，而是一个真实在场的爸爸。如果今天她对你精心准备的游戏完全不感兴趣，只想撕纸——那就一起撕纸吧。跟随她的兴趣，比执行你的计划更重要。`,
    `<strong>💪 给 Ethan</strong>在Paquette的研究中，父亲提供的'激活性依恋'是独一无二的。母亲给予安全港，父亲给予探索的勇气——你们不是互相替代，而是拼图的两半。你做的每一次飞高高、每一次追逐游戏，都在告诉她：世界很大，但有爸爸在，你可以勇敢去探索。`,
  ];
  const weekNum = Peekaboo.getWeekNumber();
  return notes[weekNum % notes.length];
}

function getBusyDadNote() {
  const notes = [
    "在你觉得陪伴不够的时候，记住这个数据：每天15分钟高质量互动的影响力，等于低质量陪伴的整整4小时。你正在做的，已经足够好了。",
    "育儿不是马拉松，是接力赛。你不需要独自完成所有事。今天能做多少就做多少，明天继续。宝宝需要的是一个'足够好'的爸爸，不是一个完美的爸爸。",
    "如果今天实在太累了——只做晨间5分钟仪式也很好。那个一致的'早安'和'拜拜'，就是你和她之间最珍贵的约定。",
  ];
  const weekNum = Peekaboo.getWeekNumber();
  return notes[weekNum % notes.length];
}

function getDisclaimer() {
  return `📋 <strong>免责声明</strong>：本游戏计划基于循证发展心理学研究设计，供参考使用。每位宝宝发育节奏不同，请以宝宝当下的状态和兴趣为最终导向。如有发育迟缓疑虑，请咨询儿科发展专科医生。<br><br>
  <span style="font-size:11px;">知识体系参考：Bowlby/Ainsworth依恋理论 · Paquette激活性依恋 · Piaget感知运动期 · Vygotsky ZPD · Harvard Serve & Return · RIE尊重式育儿 · Ayres感觉统合 · AAP早期发展指南 · Zero to Three · EYFS框架</span>`;
}

// === 历史周刊归档页面 ===
function renderArchivePage() {
  const summary = Peekaboo.weeklyPlans.getSummary();
  const keys = Peekaboo.weeklyPlans.getAllKeys(); // newest first
  const currentWeekKey = Peekaboo.weeklyPlans.getWeekKey();

  // 统计概览
  const summaryEl = document.getElementById("archive-summary");
  if (keys.length === 0) {
    summaryEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <div class="empty-state-text">还没有周刊归档<br>每周访问页面时会自动生成归档</div>
      </div>
    `;
    document.getElementById("archive-timeline").innerHTML = "";
    return;
  }

  // 计算覆盖的发展阶段
  const stages = new Set();
  keys.forEach(k => {
    const plan = summary.plans[k];
    if (plan && plan.age) stages.add(plan.age.stageName);
  });

  summaryEl.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center;">
      <div style="background:var(--accent-soft);border-radius:12px;padding:14px;">
        <div style="font-size:24px;font-weight:800;color:var(--accent);">${keys.length}</div>
        <div style="font-size:12px;color:var(--text-light);">归档周数</div>
      </div>
      <div style="background:var(--info-soft);border-radius:12px;padding:14px;">
        <div style="font-size:24px;font-weight:800;color:var(--info);">${stages.size}</div>
        <div style="font-size:12px;color:var(--text-light);">发展阶段</div>
      </div>
      <div style="background:var(--success-soft);border-radius:12px;padding:14px;">
        <div style="font-size:24px;font-weight:800;color:var(--success);">${keys.length * 7}</div>
        <div style="font-size:12px;color:var(--text-light);">游戏方案数</div>
      </div>
    </div>
  `;

  // 时间线
  const timelineEl = document.getElementById("archive-timeline");
  let timelineHTML = '<div class="archive-timeline">';

  // 按阶段分组
  let currentStage = null;
  keys.forEach(weekKey => {
    const plan = summary.plans[weekKey];
    if (!plan || !plan.age) return;

    const isCurrentWeek = weekKey === currentWeekKey;
    const stageName = plan.age.stageName;

    // 阶段分组标题
    if (stageName !== currentStage) {
      currentStage = stageName;
      timelineHTML += `
        <div class="archive-stage-header">
          <span class="archive-stage-badge">${plan.age.stageRange}</span>
          <span class="archive-stage-name">${stageName}</span>
        </div>
      `;
    }

    // 周刊卡片
    const dayNames = { MON: "周一", TUE: "周二", WED: "周三", THU: "周四", FRI: "周五" };
    const dayKeys = ["MON", "TUE", "WED", "THU", "FRI"];

    // 提取该周的游戏名称摘要
    let gameNames = [];
    if (plan.games && plan.games.weekday) {
      dayKeys.forEach(dk => {
        const dg = plan.games.weekday[dk];
        if (dg && dg[0]) gameNames.push(dg[0].name);
      });
    }

    // 周末游戏
    let weekendNames = [];
    if (plan.games && plan.games.weekend) {
      const sat = plan.games.weekend.saturday;
      if (sat && sat.morning && sat.morning.main) weekendNames.push(sat.morning.main.name);
      if (sat && sat.afternoon && sat.afternoon.outdoor) weekendNames.push(sat.afternoon.outdoor.name);
    }

    // 收集涉及的发展领域
    let allDomains = new Set();
    if (plan.games && plan.games.weekday) {
      dayKeys.forEach(dk => {
        const dg = plan.games.weekday[dk];
        if (dg) dg.forEach(g => g.domains.forEach(d => allDomains.add(d)));
      });
    }

    const domainsHTML = Array.from(allDomains).map(d => {
      const dom = Peekaboo.domains[d];
      return dom ? `<span class="domain-tag ${d.toLowerCase()}" style="font-size:10px;padding:1px 6px;">${dom.emoji}</span>` : "";
    }).join("");

    // 反馈统计
    const weekFeedbacks = Peekaboo.feedback.getByWeek(plan.weekNumber);
    const feedbackInfo = weekFeedbacks.length > 0
      ? `<span class="archive-feedback-count">💬 ${weekFeedbacks.length}条反馈</span>`
      : "";

    timelineHTML += `
      <div class="archive-week-card ${isCurrentWeek ? 'current' : ''}" id="archive-card-${weekKey}">
        <div class="archive-week-header" onclick="toggleArchiveDetail('${weekKey}')">
          <div class="archive-week-left">
            <div class="archive-week-dot ${isCurrentWeek ? 'current' : ''}"></div>
            <div>
              <div class="archive-week-key">
                ${isCurrentWeek ? '<span class="archive-current-badge">本周</span>' : ''}
                第${plan.weekNumber}周 · ${plan.dateRange}
              </div>
              <div class="archive-week-age">校正 ${plan.age.correctedDisplay}</div>
              <div class="archive-week-games">
                ${gameNames.slice(0, 3).map(n => `<span class="archive-game-chip">${n}</span>`).join("")}
                ${gameNames.length > 3 ? `<span class="archive-game-chip more">+${gameNames.length - 3}</span>` : ""}
              </div>
              <div style="margin-top:4px;">${domainsHTML} ${feedbackInfo}</div>
            </div>
          </div>
          <button class="archive-expand-btn" id="archive-btn-${weekKey}">▼</button>
        </div>
        <div class="archive-week-body" id="archive-body-${weekKey}" style="display:none;"></div>
      </div>
    `;
  });

  timelineHTML += '</div>';
  timelineEl.innerHTML = timelineHTML;
}

// 展开/收起历史周刊详情
function toggleArchiveDetail(weekKey) {
  const body = document.getElementById(`archive-body-${weekKey}`);
  const btn = document.getElementById(`archive-btn-${weekKey}`);
  const card = document.getElementById(`archive-card-${weekKey}`);

  if (body.style.display === "none") {
    // 收起其他所有展开的
    document.querySelectorAll(".archive-week-body").forEach(b => { b.style.display = "none"; });
    document.querySelectorAll(".archive-expand-btn").forEach(b => { b.textContent = "▼"; b.style.transform = ""; });
    document.querySelectorAll(".archive-week-card").forEach(c => c.classList.remove("expanded"));

    // 展开当前
    body.style.display = "block";
    btn.style.transform = "rotate(180deg)";
    card.classList.add("expanded");

    // 渲染详情内容
    renderArchiveWeekDetail(weekKey);

    // 滚动到卡片位置
    setTimeout(() => card.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  } else {
    body.style.display = "none";
    btn.style.transform = "";
    card.classList.remove("expanded");
  }
}

// 渲染单周的详细内容
function renderArchiveWeekDetail(weekKey) {
  const plan = Peekaboo.weeklyPlans.get(weekKey);
  if (!plan) return;

  const body = document.getElementById(`archive-body-${weekKey}`);
  const games = plan.games;
  if (!games) { body.innerHTML = "<p>暂无详细数据</p>"; return; }

  let html = "";

  // === Hero 信息 ===
  html += `
    <div class="archive-detail-hero">
      <div style="font-size:13px;opacity:0.9;">📍 ${plan.age.stageName} · ${plan.age.stageRange}</div>
      <div style="font-size:11px;opacity:0.7;margin-top:2px;">${plan.age.stageFocus}</div>
    </div>
  `;

  // === 工作日游戏 ===
  const dayNames = { MON: "周一", TUE: "周二", WED: "周三", THU: "周四", FRI: "周五" };
  const dayFocus = { MON: "感知觉", TUE: "运动", WED: "认知", THU: "语言", FRI: "社会情感" };
  const dayKeys = ["MON", "TUE", "WED", "THU", "FRI"];

  html += '<div style="font-size:14px;font-weight:700;margin:16px 0 10px;">📅 工作日游戏</div>';

  dayKeys.forEach(key => {
    const dayGames = games.weekday ? games.weekday[key] : null;
    if (!dayGames || dayGames.length === 0) return;
    const game = dayGames[0];

    const domainsHTML = game.domains.map(d => {
      const dom = Peekaboo.domains[d];
      return `<span class="domain-tag ${d.toLowerCase()}" style="font-size:10px;padding:1px 6px;">${dom.emoji} ${dom.name}</span>`;
    }).join("");

    // 检查本天是否有反馈
    const dayFeedbacks = Peekaboo.feedback.getAll().filter(f =>
      f.game === game.name && f.weekNumber === plan.weekNumber
    );
    const feedbackHTML = dayFeedbacks.length > 0
      ? `<span style="font-size:11px;color:var(--success);margin-left:8px;">✅ 已反馈</span>`
      : "";

    html += `
      <div class="archive-game-item">
        <div class="archive-game-day">${dayNames[key]} · ${dayFocus[key]}日</div>
        <div class="archive-game-name">🎮 ${game.name} ${feedbackHTML}</div>
        <div style="margin:4px 0;">${domainsHTML}</div>
        <div class="archive-game-meta">⏱️ ${game.duration} · 📍 ${game.scene}</div>
        <div class="archive-game-steps">
          ${game.steps.map((s, i) => `<div class="archive-step"><span class="archive-step-num">${i + 1}</span>${s}</div>`).join("")}
        </div>
        ${game.interaction ? `<div class="info-block interact" style="margin-top:8px;font-size:12px;"><div class="info-block-label">💡 互动要点</div>${game.interaction}</div>` : ""}
      </div>
    `;
  });

  // === 周末游戏 ===
  if (games.weekend) {
    html += '<div style="font-size:14px;font-weight:700;margin:20px 0 10px;">🌟 周末游戏</div>';

    const sat = games.weekend.saturday;
    if (sat) {
      if (sat.morning && sat.morning.main) {
        const main = sat.morning.main;
        html += `
          <div class="archive-game-item">
            <div class="archive-game-day">周六上午 · 主游戏</div>
            <div class="archive-game-name">🎮 ${main.name}</div>
            <div class="archive-game-meta">⏱️ ${main.duration}</div>
            <div class="archive-game-steps">
              ${main.steps.map((s, i) => `<div class="archive-step"><span class="archive-step-num">${i + 1}</span>${s}</div>`).join("")}
            </div>
          </div>
        `;
      }
      if (sat.afternoon) {
        if (sat.afternoon.outdoor) {
          html += `
            <div class="archive-game-item">
              <div class="archive-game-day">周六下午 · 户外</div>
              <div class="archive-game-name">🌳 ${sat.afternoon.outdoor.name}</div>
              <div class="archive-game-steps">
                ${sat.afternoon.outdoor.steps.map((s, i) => `<div class="archive-step"><span class="archive-step-num">${i + 1}</span>${s}</div>`).join("")}
              </div>
            </div>
          `;
        }
        if (sat.afternoon.indoor) {
          html += `
            <div class="archive-game-item">
              <div class="archive-game-day">周六下午 · 室内</div>
              <div class="archive-game-name">🏠 ${sat.afternoon.indoor.name}</div>
              <div class="archive-game-steps">
                ${sat.afternoon.indoor.steps.map((s, i) => `<div class="archive-step"><span class="archive-step-num">${i + 1}</span>${s}</div>`).join("")}
              </div>
            </div>
          `;
        }
      }
      if (sat.reading) {
        html += `
          <div class="archive-game-item" style="background:var(--purple-soft);">
            <div class="archive-game-day">周六 · 亲子共读</div>
            <div class="archive-game-name">📖 ${sat.reading.book}</div>
            <div style="font-size:12px;color:var(--text-light);margin-top:4px;">${sat.reading.why}</div>
          </div>
        `;
      }
    }

    const sun = games.weekend.sunday;
    if (sun) {
      if (sun.morning) {
        html += `
          <div class="archive-game-item">
            <div class="archive-game-day">周日上午</div>
            <div class="archive-game-name">🔄 ${sun.morning.name}</div>
            <div style="font-size:12px;color:var(--text-light);margin-top:4px;">${sun.morning.note}</div>
          </div>
        `;
      }
      if (sun.afternoon && sun.afternoon.scenes) {
        html += `
          <div class="archive-game-item">
            <div class="archive-game-day">周日下午 · 日常变游戏</div>
            ${sun.afternoon.scenes.map(s => `
              <div style="background:white;border-radius:8px;padding:8px 10px;margin:6px 0;border:1px solid rgba(0,0,0,0.04);">
                <div style="font-size:12px;font-weight:600;">${s.scene === "换尿布时" ? "🧷" : s.scene === "洗澡时" ? "🛁" : "🍼"} ${s.scene}</div>
                <div style="font-size:11px;color:var(--text-light);margin-top:2px;">${s.script}</div>
              </div>
            `).join("")}
          </div>
        `;
      }
    }
  }

  // === Serve & Return ===
  if (plan.serveReturn) {
    html += `
      <div style="font-size:14px;font-weight:700;margin:20px 0 10px;">🏓 Serve & Return</div>
      <div class="sr-card" style="margin:0;">
        <div class="sr-flow">
          <div class="sr-bubble sr-serve">
            <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:4px;">S · 宝宝信号</div>
            ${plan.serveReturn.serve}
          </div>
          <div class="sr-arrow">→</div>
          <div class="sr-bubble sr-return">
            <div style="font-size:11px;font-weight:600;color:var(--accent);margin-bottom:4px;">R · 爸爸回应</div>
            ${plan.serveReturn.ret}
          </div>
        </div>
        <div class="sr-principle">💡 ${plan.serveReturn.principle}</div>
      </div>
    `;
  }

  // === 该周的反馈 ===
  const weekFeedbacks = Peekaboo.feedback.getByWeek(plan.weekNumber);
  if (weekFeedbacks.length > 0) {
    const emojiMap = { 1: "😐", 2: "🙂", 3: "😊", 4: "😄", 5: "🤩" };
    html += `
      <div style="font-size:14px;font-weight:700;margin:20px 0 10px;">💬 本周反馈记录 (${weekFeedbacks.length}条)</div>
    `;
    weekFeedbacks.forEach(f => {
      html += `
        <div class="archive-game-item" style="background:var(--warm-soft);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:13px;font-weight:600;">${f.game}</div>
              <div style="font-size:11px;color:var(--text-muted);">📅 ${f.date}</div>
            </div>
            <div style="font-size:20px;">${emojiMap[f.enjoy] || "😊"}</div>
          </div>
          ${f.observation ? `<div style="font-size:12px;color:var(--text-light);margin-top:6px;">👀 ${f.observation}</div>` : ""}
          ${f.highlight ? `<div style="font-size:12px;color:var(--text-light);margin-top:4px;">📸 ${f.highlight}</div>` : ""}
        </div>
      `;
    });
  }

  body.innerHTML = html;
}

// === Toast ===
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}
