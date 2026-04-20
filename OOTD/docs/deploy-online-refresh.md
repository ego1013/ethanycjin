# ŌTOMO · 在线重搜部署手册（v2.2 · A 方案）

## 整体架构

```
┌──────────────┐       POST /       ┌─────────────────┐
│  前端 index  │ ─────────────────▶ │ Cloudflare      │
│  🛰️ 在线重搜 │   {mode}           │ Worker          │
└──────────────┘                     │ (持有 PAT)       │
      │                              └────────┬────────┘
      │                                       │ workflow_dispatch
      │                                       ▼
      │                              ┌─────────────────┐
      │                              │ GitHub Actions  │
      │                              │ otomo-refresh   │
      │                              │ .yml            │
      │                              └────────┬────────┘
      │                                       │ python online_refresh.py
      │                                       │ git commit & push
      │                                       ▼
      │                              ┌─────────────────┐
      │  poll outfit_archive.json   │ main @ ego1013  │
      │◀─────────────────────────── │ /ethanycjin     │
      │  meta.last_push_online      │ OOTD/data/...   │
      │  变化 → reload               └─────────────────┘
      ▼
   masonry 刷新
```

## 一次性部署（5 步）

### 1. 生成 GitHub Fine-grained PAT

访问 <https://github.com/settings/tokens?type=beta>

- **Token name**: `otomo-refresh-worker`
- **Expiration**: 90 days（到期前需更新）
- **Resource owner**: `ego1013`
- **Repository access**: *Only select repositories* → `ethanycjin`
- **Permissions** → Repository permissions：
  - **Actions**: Read and write
  - **Contents**: Read (用于读 workflow 文件；GitHub 默认隐式，保守起见勾上)
- 生成 → **立即复制 token**（只显示一次）

### 2. 部署 Cloudflare Worker

1. 登录 <https://dash.cloudflare.com/>，免费账号就够
2. 左侧 **Workers & Pages** → **Create** → **Create Worker**
3. 名称：`otomo-refresh-proxy` → Deploy 占位版本
4. 进入 Worker → **Edit code**，删掉示例代码
5. 将 `tools/cloudflare-worker-proxy.js` 的内容完整粘贴 → **Save and deploy**
6. **Settings** → **Variables and Secrets** → 添加两个 **Secret**：
   - `GITHUB_PAT` = 步骤 1 复制的 token
   - `ALLOWED_ORIGIN` = `https://ego1013.github.io`
7. 复制 Worker URL，形如 `https://otomo-refresh-proxy.ethanycjin.workers.dev`

### 3. 配置前端

编辑 `OOTD/index.html`，找到：

```js
const WORKER_REFRESH_URL = ''; // 粘贴你的 Worker URL，留空则隐藏"在线重搜"按钮
```

填入步骤 2 拿到的 URL。提交 + push。

### 4. 验证调用链

浏览器控制台：

```js
await fetch('<Worker URL>', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({mode: 'incremental'})
}).then(r => r.json())
```

期望返回：

```json
{ "ok": true, "dispatched": true, "mode": "incremental" }
```

同时 GitHub → Actions → "ŌTOMO · On-Demand Catalog Refresh" 应该有新一条 running。

### 5. 验证前端按钮

打开 <https://ego1013.github.io/ethanycjin/OOTD/>，点 🛰️ **在线重搜**。

- 按钮进入 loading 态，toast 提示"已触发在线抓取，约 1-2 分钟"
- 前端开始每 5s 轮询 `outfit_archive.json`
- `meta.last_push_online` 时间戳变化 → 自动 reload → 新图出现

## 运行时监控

- **Actions 日志**：<https://github.com/ego1013/ethanycjin/actions/workflows/otomo-refresh.yml>
- **Worker 日志**：Cloudflare Dashboard → Workers → otomo-refresh-proxy → Logs (Real-time)

## 常见问题

| 症状 | 原因 | 处理 |
|---|---|---|
| Worker 返回 401 | PAT 过期 | 生成新 PAT → 更新 Worker Secret `GITHUB_PAT` |
| Worker 返回 403 | Origin 不匹配 | 检查 `ALLOWED_ORIGIN` Secret 和前端访问域名 |
| Actions 触发但 commit 为空 | 所有候选图都已在 catalog | 正常，说明池子已饱和；扩大 `online_refresh.py` 的 POOL |
| Actions 报错 HTTP 403 | 抓图时部分 URL 过期 | 脚本已做 HEAD 验证，失败跳过；若大面积失败需更新 POOL |
| 前端轮询一直不更新 | Actions 失败或 push 未成功 | 查 Actions 日志；手工 `curl` 最新 JSON 看 `last_push_online` |

## 安全边界

- **PAT 只存在 Worker Secret**，前端永远拿不到
- **Worker 校验 Origin**，只允许 `ego1013.github.io` 调用
- **PAT 权限最小化**：只 Actions R/W + Contents R，**不能**改 settings、collaborators、secrets
- **速率**：GitHub workflow_dispatch 每仓库 1000 req/h，绝对够用
- **成本**：Cloudflare Workers 免费 tier 10 万 req/day，绝对够用

## 到期维护

- PAT 90 天到期前：GitHub 会发邮件提醒，收到后 30 秒操作即可
- Worker 代码如需更新：直接 Dashboard 里 Edit code → Save and deploy
