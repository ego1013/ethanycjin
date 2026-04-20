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

- **顶部**：sticky 导航栏，**左侧** primary 链接 `← Ethan's Lab`、次级链接 `anti_average`；右侧 brand 标签。（v2 要求：统一导航格式，放顶部左侧）
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

---

## 3. Changelog（按时间线，越新越靠上）

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

| 优先级 | 事项 |
|---|---|
| P0 | 图源从 Unsplash 占位升级为真实 Lookbook/街拍 CDN（设计师品牌官网 Lookbook 页面解析） |
| P0 | 单品搜索接入真实搜索后端（Google Images / Pinterest API / 自建爬虫代理） |
| P1 | 归档 > 500 时的自动分卷（按季度或年份归档） |
| P1 | 卡片增加 "收藏" 功能 + 我的收藏页 |
| P1 | 天气数据源稳定性（当前依赖抓取 tianqi24，应考虑和风天气 API） |
| P2 | 图片质量自动打分（CLIP embedding 筛选男装、全身率） |
| P2 | 历史周回放（按 `push_id` 切换显示过往某一周的推送） |

---

## 5. 推送记录（由自动化每次追加一行）

> 格式：`- YYYY-MM-DD W## | 天气 X°C <状况> | 方向 <keywords> | 新增 N 张 | 累计 M 张`

- 2026-04-20 W17 | 天气 21°C 阴（多云转雾）| 方向 light layering / spring transitional / earth tone minimalist | 新增 15 张 | 累计 28 张
