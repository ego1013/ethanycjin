/**
 * ŌTOMO · Cloudflare Worker 代理
 * =================================
 * 隐藏 GitHub PAT，代理前端 → GitHub Actions workflow_dispatch 调用。
 *
 * 部署步骤：
 * 1. 登录 https://dash.cloudflare.com/ → Workers & Pages → Create Worker
 * 2. Worker 名称建议：otomo-refresh-proxy
 * 3. Settings → Variables → Secret：
 *      GITHUB_PAT  = <Fine-grained PAT，权限：Actions: Read and write，仓库限定 ego1013/ethanycjin>
 *      ALLOWED_ORIGIN = https://ego1013.github.io
 * 4. 粘贴本文件内容到 Worker 编辑器，Deploy
 * 5. 得到 URL，例如 https://otomo-refresh-proxy.<your-subdomain>.workers.dev
 * 6. 填入前端 index.html 的 WORKER_REFRESH_URL 常量
 *
 * PAT 生成：https://github.com/settings/tokens?type=beta
 *   Resource owner: ego1013
 *   Repository access: Only select repositories → ethanycjin
 *   Permissions → Repository permissions → Actions: Read and write
 *   90 天有效期，到期前 Worker 会返回 401，届时重新生成粘贴到 Secret 即可
 */

const OWNER = "ego1013";
const REPO = "ethanycjin";
const WORKFLOW_FILE = "otomo-refresh.yml";

export default {
  async fetch(request, env) {
    // CORS 预检
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://ego1013.github.io";
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, corsHeaders);
    }

    if (!origin.startsWith(allowedOrigin)) {
      return json({ error: "Origin not allowed" }, 403, corsHeaders);
    }

    if (!env.GITHUB_PAT) {
      return json({ error: "GITHUB_PAT secret not configured on Worker" }, 500, corsHeaders);
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      // 允许空 body
    }
    const mode = body.mode === "full" ? "full" : "incremental";

    // 调用 GitHub REST API: Create a workflow dispatch event
    const ghUrl = `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
    const ghResp = await fetch(ghUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_PAT}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        "User-Agent": "otomo-refresh-proxy",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: { mode },
      }),
    });

    if (ghResp.status !== 204) {
      const text = await ghResp.text();
      return json(
        { error: "GitHub dispatch failed", status: ghResp.status, detail: text.slice(0, 500) },
        502,
        corsHeaders
      );
    }

    return json(
      {
        ok: true,
        dispatched: true,
        mode,
        message: "Workflow dispatched. Frontend should poll meta.last_push_online on outfit_archive.json.",
        hint_poll_url: `https://${OWNER}.github.io/${REPO}/OOTD/data/outfit_archive.json`,
      },
      202,
      corsHeaders
    );
  },
};

function json(obj, status, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}
