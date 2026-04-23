# ŌTOMO · Design Decisions & Changelog

项目位置：`/Users/ethanycjin/WorkBuddy/OOTD/`
部署地址：https://ego1013.github.io/ethanycjin/OOTD/
部署仓库：`/Users/ethanycjin/WorkBuddy/_github_pages/OOTD/`

---

## 1. 项目定位

**ŌTOMO**（日语 お供，"相伴"）是 Ethan 的男装穿搭灵感推送助手，不是商品推荐，不是购物工具，是 _灵感 feed_。

- **定时模式**：每周固定时间执行一次，基于上海当日天气生成方向关键词并推送 12–18 张图
- **单品模式**：用户在反馈栏输入关键词，立即重新执行 Step 2–4，刷新整个瀑布流
- 归档 **只增不减**（`data/outfit_archive.json`）—— 所有推送过的图片永久保留

---

## 2. 设计决策（按领域）

### 2.1 图源策略（Image Source）

| 约束 | 决策 |
|---|---|
| 来源白名单 | 仅 4 类：① 2021 年至今设计师品牌 Lookbook（Lemaire / Auralee / Comoli / Dries Van Noten / Our Legacy / Studio Nicholson / Margaret Howell 等） · ② 时装周男装街拍（巴黎/米兰/东京/纽约） · ③ 时装周秀场（男装场次） · ④ 日系街拍（Popeye / GINZA / SNAP） |
| 年份 | ≥ 2021 |
| 性别 | 男装 |
| 完整性 | 全身或四分之三身（膝盖以上不可截断），至少 2 件单品的搭配组合 |
| 排除 | 商品平铺/挂拍、配件特写、女装、模糊/严重遮挡 |
| 第一周占位 | 因抓取真实 Lookbook/街拍 CDN 受防盗链与效率限制，**第一周使用 Unsplash 公开 CDN 占位**，通过 `curl -I` 逐条验证 HTTP 200，保证不 broken。设计记录里显式声明这是占位数据 |
| 后续演进 | 自动化推送会在每周五 16:30 调用搜索，逐步替换为真实 Lookbook/街拍图；当归档真实图片比例 > 50% 时，考虑对 Unsplash 占位图做标注或软删除 |

### 2.2 搜索词模板（每次生成 3–5 组）

```
[穿搭方向] menswear lookbook 2022 2023 2024 2025
[穿搭方向] men's fashion week street style full body
[穿搭方向] menswear runway show 2022 2023 2024 2025
[穿搭方向] 日本 メンズ ストリートスナップ 全身
```

### 2.3 单品模式（v2）

- 用户最多输入 **5 个关键词**，每个独立生成一组 Query（中英日三语）
- 目标：每个单品 **3–4 张**，总量控制 **12–18 张**
- 不足 3 张 → 从其他单品结果中补足（优先补命中多的单品）
- 瀑布流 **均匀穿插**（round-robin），避免同一单品连续 > 2 张
- 每张卡片除 `source_type` 标签外，额外显示 `#<触发单品>` 标签

### 2.4 视觉语言（Visual Language）

| 项 | 值 | 说明 |
|---|---|---|
| Background | `#0f0f0f` | 近黑，不是纯黑，降低眩光 |
| Surface | `#181818` / `#1f1f1f` | 双层 surface，卡片与输入框区分 |
| Text | `#f0f0f0` / `#9a9a9a` / `#5e5e5e` | 三级文字 |
| Accent | `#d9b37a` | earth tone warm gold，呼应 OOTD 调性，避免彩色污染 |
| 来源分色 | Lookbook → 暖金；时装周街拍 → 冷蓝；秀场 → 紫；日本街拍 → 粉 | 四类来源差异化，一眼区分 |
| 字体 | 系统字体栈，优先 SF Pro / PingFang SC | 跨平台中日双语清晰 |

### 2.5 布局（Layout）

- **顶部**：sticky 导航栏，内部 wrapper `max-width: 1320px` 与下方 container 完全对齐；左侧 primary 链接 `← Ethan's Lab`，右侧 brand 标签。**不含外站跳转链接**。（v2.1 修正：去掉 anti_average 链接；nav 内容与正文左对齐）
- **Header 操作区**：日期/天气/方向 chip 下方新增 refresh-row，含 🎯 换方向词 / 🔄 换一批图 两个按钮，点击即整页刷新瀑布流
- **Header 区**：brand + 日期/天气/方向 chip + trigger banner
- **Masonry**：`column-count` 响应式 3 / 2 / 1，`break-inside: avoid`
- **底部反馈栏**：fixed 定位，分两行 —— 上行最近 5 次搜索 tag 组合、下行 5 输入框 + 搜索按钮（桌面 grid 5 列，移动降为 2/1 列）
- **Footer**：归档计数 + 最后更新时间

### 2.6 卡片信息密度

卡片只显示 3 条信息：`source_type` 标签 + `#触发单品` 标签（单品模式才有） + `year`（右上角） + `brand_or_event`（主文案）。不显示 tags、不显示描述，避免视觉噪音。

### 2.7 最近搜索的呈现

- v1：单 input + 单 chip
- v2：**tag 组合**（5 个单品视为一组），点击后 5 个输入框一并回填，再次触发搜索
- localStorage key：`otomo_recent_combos_v2`（v1 的 `otomo_recent_queries` 废弃）

### 2.8 无真实搜索后端时的回退

第一周无真实搜索后端，单品模式的检索在 catalog 内做模糊匹配（`brand_or_event + tags + query_tag`），命中不足时：
- 用 catalog 内的其他图补足到 3 张
- 顶部 toast 提示："部分单品归档不足，已用相近风格补足。自动化推送会逐步扩充真实 Lookbook / 街拍图库。"

### 2.9 自动化窗口

- **用户反复确认**：每周一次，周五 **16:30**（用户最初说"周一"，后改"周五 16:30"，以最新为准）
- RRULE：`FREQ=WEEKLY;BYDAY=FR;BYHOUR=16;BYMINUTE=30`
- 双工作区：`/Users/ethanycjin/WorkBuddy/OOTD` + `/Users/ethanycjin/WorkBuddy/_github_pages`
- 每次推送自动 `git add / commit / pull --rebase / push`，失败 retry 一次

### 2.10 GitHub Pages 大小写

部署路径 `/OOTD/` 大写 —— 用户明确使用大写，与 `_github_pages/OOTD/` 目录一致，链接保持大小写敏感。

### 2.11 上游导航页同步

- 根仓库 `https://ego1013.github.io/ethanycjin/` 的生活板块末尾新增 OOTD 卡片
- 卡片要素：emoji 🧥 / 标题 "ŌTOMO · 男装穿搭灵感" / 标签 "每周五 · 16:30" / "天气驱动" / "第 1 周"
- 项目计数 11 → 12

### 2.12 审核环节与三轮补搜机制（v2.3）

**流程位置**：在 Step 2（搜索候选）与 Step 3（去重过滤）之间插入 **Step 2.5 审核 + Step 2.6 补搜循环**。

```
Step 2 搜索 → Step 2.5 审核 PASS/REJECT → Step 2.6 不足则打回（≤3 轮） → Step 3 去重 → Step 4 渲染
```

**审核官定义 / 审核标准 / 输出 JSON 契约 / 循环规则**：完整 SOP 独立文件 `docs/reviewer-sop.md`，本节只写架构决策。

| 决策点 | 取值 | 理由 |
|---|---|---|
| 目标数量 | 12 – 18 张 | 与 v2.1 瀑布流容量一致 |
| 最多循环 | 3 轮 | 避免无限补搜拖垮 Actions 时限（5min 硬上限） |
| 达标判定 | PASS 累计 ≥ 12 | 区间下限即达标，不追满 18 |
| 三轮不达标 | 以实际数量发布 + 顶部 banner | 用户原文要求"本期图片数量有限" |
| 实现分期 | Phase 1 规则兜底 → Phase 2 CLIP/VLM → Phase 3 驳回原因回写 | 先打通闭环再提升精度 |
| 入口函数 | `tools/reviewer.py::review_candidates(cands, target, round_no)` | 独立模块，搜索脚本和未来的真实搜索都 import |
| 落盘字段 | `meta.review.{enabled,last_run,rounds,total_passed,total_rejected,insufficient}` | 前端仅关心 `insufficient` 做 banner |
| 逐期日志 | `data/review_logs/<push_id>.json`（只增不减） | 和 outfit_archive 同口径 |
| 前端 banner | `#review-banner`，insufficient=true 时显示 | 顶部 sticky，accent 暖金描边 |

**产品修改建议留档**：本次用户需求原文完整保留于 `docs/change-log-suggestions.md` §A01 条目；该文件是产品建议的永久档，与本文件（内部技术决策）职责分离。

---

## 3. Changelog（按时间线，越新越靠上）

### 2026-04-22 · v2.3（22:23 用户需求触发）

**触发事件**：用户要求在 Step 2 与 Step 3 之间插入"穿搭图片审核官"环节，最多 3 轮补搜。

**落地清单**：

| 组件 | 位置 | 作用 |
|---|---|---|
| `docs/reviewer-sop.md` | 主仓库 | 审核官完整 SOP（角色 / 标准 / 流程 / JSON / 循环 / 归档） |
| `docs/change-log-suggestions.md` | 主仓库 | 产品修改建议独立留档册，A01 为本次需求 |
| `docs/decisions.md` §2.12 | 主仓库 | 架构决策（本节） |
| `tools/reviewer.py` | 主仓库 | 审核入口 `review_candidates()`，Phase 1 规则兜底实现 |
| `tools/online_refresh.py` | 主仓库 | 改造为"搜索→审核→补搜→去重"循环，最多 3 轮 |
| `data/outfit_archive.json` | 主仓库 | `meta.review` 字段就位，初始 `insufficient: false` |
| `data/review_logs/` | 主仓库 | 审核日志目录 |
| `index.html` `#review-banner` | 两仓库 | insufficient=true 时顶部显示"本期图片数量有限" |

**硬约束**：
- `REVIEW_MAX_ROUNDS = 3`，不可配置
- 目标下限 12，不足 12 才算 insufficient
- 每轮审核必须完整生成 JSON 报告并写入 review_logs，不许跳过

**Phase 1 审核的规则兜底逻辑**（接入真实 VLM 前）：
1. URL 必须 HTTP 200（继承旧 `verify()`）
2. `year ≥ 2021`
3. `source_type` 必须在 4 类白名单内（Lookbook / 时装周街拍 / 秀场 / 日本街拍）
4. `brand_or_event` 非空
5. 命中以上全部 → PASS；否则 REJECT 并给出 reason

**Roadmap 新增**：
- P0：接入真实视觉审核（CLIP embedding 男装/全身率判别 + VLM 逐项核查 5 条通过条件）
- P1：三轮驳回原因聚类回写搜索 Agent，影响下一轮搜索词



### 2026-04-20 · v2.2（20:49 用户提问触发）

**用户提问**：当前"换一批图"只是 shuffle 已归档的 28 张，并不是真在线搜索。如何实现真正的重新搜索？

**决策（A + D 混合）**：
- **A**：通过 GitHub Actions workflow_dispatch 实现 on-demand 在线抓取；Cloudflare Worker 代理隐藏 PAT；前端轮询 `meta.last_push_online` 检测更新
- **D**：扩大前端 catalog 池（离线，立刻见效），提升"换一批图"的 shuffle 新鲜感

**不选 B（前端直连 Unsplash API）** 的原因：Unsplash 没有真正的设计师 Lookbook / 街拍内容，出来是艺术摄影/生活照，与 ŌTOMO 调性不匹配。

**落地清单**：

| 组件 | 位置 | 作用 |
|---|---|---|
| `tools/expand_catalog.py` | 主仓库 | D 方案一次性扩池：本地运行，catalog 28 → 45（+17） |
| `tools/online_refresh.py` | 主仓库 | A 方案在线脚本：Actions 里运行，每次 incremental +8-12 张 |
| `.github/workflows/otomo-refresh.yml` | 部署仓库 | 监听 workflow_dispatch，跑 online_refresh.py，自动 git push |
| `tools/cloudflare-worker-proxy.js` | 主仓库（代码） | 代理前端 → GitHub API，持有 PAT 的中间层 |
| `docs/deploy-online-refresh.md` | 主仓库 | 5 步部署手册：生成 PAT → 部署 Worker → 填 URL |
| `index.html` 🛰️ 在线重搜 | 两仓库 | 第三个按钮，调 Worker → 轮询 JSON → reload |

**架构**：
```
前端 🛰️ ──POST──▶ Cloudflare Worker ──dispatch──▶ GitHub Actions
  ▲                                                    │
  │                                                    ▼
  └──── poll meta.last_push_online ◀── push ──── online_refresh.py
```

**前端常量**（需用户部署后填写）：
```js
const WORKER_REFRESH_URL = ''; // 留空则隐藏按钮
```

**三按钮定位**：
- 🎯 换方向词（即时，离线）—— 心情换，重新采样方向
- 🔄 换一批图（即时，离线）—— 从 catalog 45 张池子 shuffle
- 🛰️ 在线重搜（1-2 分钟，真在线）—— 触发 Actions 真抓新图

**安全边界**：PAT 只存 Worker Secret，前端不可见；Worker 校验 Origin 只允许 ego1013.github.io；PAT 权限最小化（仅 Actions R/W + Contents R）。

**后续 Roadmap**：
- P0：`online_refresh.py` 的 POOL 需逐步替换为真实设计师 Lookbook CDN（目前仍是精选 Unsplash ID）
- P1：Worker 增加调用频率限制（避免误触连刷）
- P1：前端缓存 `last_push_online`，避免点"在线重搜"后看到同一个时间戳立即 return

### 2026-04-20 · v2.1（17:13 用户反馈修正）

**用户反馈（原话）**：
1. 自动化任务应该只有一条，删除重复的
2. 导航栏位置不对，应该和下方内容左对齐（参考 anti_average 页，但不需要 anti_average 超链接）
3. 图片质量不 OK，需要增加两个刷新按钮：a) 方向词刷新 b) 现有图片刷新，点击后瀑布流全部刷新

**落地**：
- **自动化清理**：`ls /Users/ethanycjin/.workbuddy/automations/` 显示 4 个目录，其中 `automation-2` / `automation-3` 仅存 memory.md（旧版 skill 删除后残留的孤儿目录），已 `rm -rf` 清理。当前生效自动化仅 2 条：`otomo-weekly`（本项目）+ `perceptual-c-3`（其他项目）。ŌTOMO 实际就只有 1 条，不存在重复
- **导航栏对齐**：`.topnav` 去掉直接 padding，改为内部 `.topnav-inner`（`max-width: 1320px; margin: 0 auto; padding: 0.7rem 1rem`），和下方 `.container` 完全一致，视觉上导航栏内容与正文左边对齐
- **移除 anti_average 链接**：导航栏仅保留 `← Ethan's Lab` 一个链接 + 右侧 brand 标签
- **新增两个刷新按钮**（Header 下方 `.refresh-row`）：
  - 🎯 **换方向词**（primary 暖金描边）：从 `DIRECTION_POOL` 按当前温度分层（cold/cool/mild/warm 四档）随机抽一组新方向，避免连续重复，然后按新方向词从 catalog 模糊匹配 tags/brand/query_tag 重新召回 ≥8 张，不足则回退到整个 catalog，整页刷新
  - 🔄 **换一批图**：方向词保持不变，整页 shuffle（Fisher-Yates）打散顺序，弹 toast 提示"已刷新全部图片顺序（N 张候选）"
- **JS 状态**：新增全局 `currentDirection` 与 `currentShuffleSeed`；`renderLatest(opts)` 改造为支持 `{newDirection, shuffle}` 两个分支
- **方向词池**（前端兜底，未来会让自动化写入 archive）：按温度分 4 档，每档 4 组 × 3 关键词，覆盖从重叠穿 → 夏季通风的全季候
- **备注**：图片质量的根本性提升（真实 Lookbook / 街拍 CDN）仍在 Roadmap P0，本次改动提供用户侧"不满意就重抽"的即时逃生口

### 2026-04-20 · v2（今日）

**触发事件**：用户提交第二版 prompt，核心变化：
1. 单品模式从"单输入"→ **5 个独立输入框**
2. 来源从 3 类扩为 **4 类**（新增"秀场 runway"与"时装周街拍"分离）
3. 每张卡片需额外标注 **触发单品 tag**
4. 最近搜索展示为 **tag 组合**，不再是单 chip
5. 导航栏要求统一格式，放 **顶部左侧**，含 `anti_average` 链接

**落地**：
- `index.html`：重写反馈栏为 5 × grid input + 单按钮；顶部 sticky nav；卡片增加 `query_tag` 渲染；localStorage key 升级为 `otomo_recent_combos_v2`；source 样式新增 `.source-秀场` 紫色标签
- `data/outfit_archive.json`：结构兼容（catalog 新字段 `query_tag` 在单品搜索时动态注入）
- `docs/decisions.md`：新增（本文件）
- 自动化任务：prompt 内嵌入 v2 4 类来源白名单 + 单品模式 5 关键词逻辑

### 2026-04-20 · v1（当日早些时候）

- 初始化项目结构 `data/outfit_archive.json` + `index.html`
- 第一周首推：上海 21°C 阴、light layering + spring transitional + earth tone，15 张图入库
- 双仓库同步 + git push（rebase 一次后成功）
- 上游根导航页新增 OOTD 卡片
- 自动化任务第一次创建（未落盘，后续重建）

---

## 4. 待迭代（Roadmap）

| 优先级 | 事项 | 状态 |
|---|---|---|
| P0 | 图源从 Unsplash 占位升级为真实 Lookbook/街拍 CDN | ⏳ 架构已就位（A 方案通道），待替换 `online_refresh.py` 的 POOL 为真实 Lookbook URL |
| P0 | 单品搜索接入真实搜索后端 | ⏳ 复用 A 方案的 Worker + Actions 通道 |
| P1 | 归档 > 500 时的自动分卷（按季度或年份归档） | |
| P1 | 卡片增加 "收藏" 功能 + 我的收藏页 | |
| P1 | 天气数据源稳定性（当前依赖抓取 tianqi24，应考虑和风天气 API） | |
| P1 | Worker 增加调用频率限制 + 前端 `last_push_online` 缓存（避免误触连刷） | v2.2 新增 |
| P0 | 审核官接入真实视觉审核（CLIP + VLM 逐项核查 5 条通过条件） | v2.3 新增，Phase 2 |
| P1 | 三轮驳回原因聚类回写搜索 Agent，指导下一轮搜索词 | v2.3 新增，Phase 3 |
| P2 | 图片质量自动打分（CLIP embedding 筛选男装、全身率） | 与审核官 Phase 2 合并 |
| P2 | 历史周回放（按 `push_id` 切换显示过往某一周的推送） | |

---

## 5. 推送记录（由自动化每次追加一行）

> 格式：`- YYYY-MM-DD W## | 天气 X°C <状况> | 方向 <keywords> | 新增 N 张 | 累计 M 张`

- 2026-04-22 W17 | 审核官首次扫描（存量 45 张 + R2/R3 补搜 30 张）| 目标 12-18 | 最终 published 13 张（PASS 13 / REJECT 62 / 通过率 17%）| catalog 45 → 13
- 2026-04-20 W17 | 天气 21°C 阴（多云转雾）| 方向 light layering / spring transitional / earth tone minimalist | 新增 15 张 | 累计 28 张
