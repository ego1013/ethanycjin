# 📸 ŌTOMO · 穿搭图片审核官 SOP

> **版本**：v1.0（2026-04-22 建立）
> **定位**：搜索 Agent 与去重过滤之间的"质量闸门"。非人工，由视觉审核 Agent 执行；目前流程框架已接入，视觉判别模型（CLIP / VLM）待集成，占位阶段由规则兜底。
> **原始规格来源**：用户 2026-04-22 需求原文（详见本文末附录 A）

---

## 1. 流程位置

```
Step 1  生成搜索方向（天气 + 方向词池）
   ↓
Step 2  搜索候选图片（搜索 Agent）
   ↓
Step 2.5  审核官逐张审核，输出 PASS / REJECT         ← 本 SOP
   ↓
Step 2.6  不足则打回补搜，最多循环 3 轮              ← 本 SOP
   ↓
Step 3  去重过滤（只对 PASS 的图片执行）
   ↓
Step 4  渲染瀑布流
```

**目标图片数量**：每期 12 – 18 张。

---

## 2. 角色定义

> 你是一个专业的男装穿搭图片质量审核员。
> 你的唯一职责是：对搜索 Agent 提交的候选图片逐一审核，
> 判断每张图片是否符合发布标准，并给出明确的通过 / 驳回结论。

**不做**：不重写搜索词、不给艺术点评、不输出多余解释。
**只做**：逐张投票 PASS / REJECT；REJECT 必须一句话说清主要原因。

---

## 3. 审核标准

### ✅ 通过条件（全部满足才 PASS）

| # | 维度 | 要求 |
|---|---|---|
| 1 | **人物完整性** | 真实人物出镜，至少看到头到膝盖（全身或 3/4 身） |
| 2 | **性别** | 着装者为男性 |
| 3 | **穿搭完整性** | 可清晰识别至少上下身 2 件以上单品的搭配组合 |
| 4 | **图片质量** | 画面清晰，主体无严重遮挡（遮挡面积 ≤ 20%） |
| 5 | **内容相关性** | 主体是人物穿搭，而非产品平铺 / 静物 / 活动现场 / 建筑背景 |

### ❌ 驳回条件（满足任意一条即 REJECT）

- 仅展示单件商品的平铺图、挂拍图、模特局部图
- 仅展示鞋子、配件、包袋、饰品等局部特写
- 着装者为女性或性别模糊
- 图片主体为非穿搭内容（静物、建筑、活动现场等）
- 画质模糊、严重过曝、大面积遮挡
- 图片年份早于 2021 年（如可判断）

---

## 4. 审核流程（逐张）

**输入**：搜索 Agent 提交的候选列表，每张含 `image_url` / `source_type` / `brand_or_event` / `year`。

对每张图执行：

1. **Step 1｜读取图片** —— 加载 URL，对图像内容做视觉理解
2. **Step 2｜逐项核查** —— 对照 §3 的通过 / 驳回条件逐项判断，记录每项结果
3. **Step 3｜给出结论** ——
   - 输出 `PASS` 或 `REJECT`
   - 若 `REJECT`，注明主要驳回原因（一句话，如"仅为鞋子局部特写"）
4. **Step 4｜汇总报告** —— 所有图片审完，输出总报告

---

## 5. 输出格式（JSON · 严格）

```json
{
  "round": 1,
  "target_count": 18,
  "total_submitted": 18,
  "total_passed": 13,
  "total_rejected": 5,
  "need_supplement": 2,
  "results": [
    {
      "image_url": "https://images.unsplash.com/photo-xxxxxxxx",
      "verdict": "PASS"
    },
    {
      "image_url": "https://images.unsplash.com/photo-yyyyyyyy",
      "verdict": "REJECT",
      "reason": "仅为鞋子局部特写，无完整人物穿搭"
    }
  ]
}
```

字段约束：
- `round`：本次是第几轮审核（1 / 2 / 3）
- `target_count`：本期目标图片数量（默认 18，下限 12）
- `need_supplement = max(0, target_count - total_passed)`
- `results[]`：每张提交图片一条记录，顺序与输入一致

---

## 6. 补搜循环机制

```
Round 1：审核通过 N₁ 张
   ├── N₁ ≥ 12 且 N₁ ≤ 18 → 达标，进入 Step 3
   └── N₁ < 12           → 打回补搜 (18 - N₁) 张
Round 2：审核（仅审新补的）通过 N₂ 张
   ├── N₁ + N₂ ≥ 12 → 达标
   └── 不足         → 再打回补搜
Round 3：最后一轮
   ├── 累计 ≥ 12 → 达标
   └── 累计 < 12 → 不再循环，以实际 PASS 数量发布，
                  并在页面顶部显示："本期图片数量有限"
```

**硬约束**：
- 最多 **3 轮**，不得增加
- 补搜请求要明确告知搜索 Agent 上一轮的驳回原因聚类，指导换词（如"上轮大量鞋子特写，本轮排除'shoes / sneakers'"）
- 每轮必须完整走完审核 Step 1–4，不许跳过
- 三轮累计图源要保证**搜索多样性**（避免同一搜索词反复跑）

**落盘字段**（写入 `data/outfit_archive.json`）：
```jsonc
"meta": {
  "review": {
    "enabled": true,
    "last_run": "2026-04-22T08:15:02Z",
    "rounds": 2,
    "total_passed": 14,
    "total_rejected": 7,
    "insufficient": false       // true 时前端显示"本期图片数量有限"
  }
}
```

---

## 7. 实现分期

| 阶段 | 范围 | 状态 |
|---|---|---|
| **Phase 1** | 流程框架 + JSON 契约 + 循环逻辑 + 落盘字段 + 前端 banner | ✅ v2.3（2026-04-22） |
| **Phase 2** | 规则兜底审核（URL 白名单 + 年份校验 + source_type 匹配） | ✅ Phase 1 内随框架完成 |
| **Phase 3** | 真实视觉审核（CLIP embedding：男装 / 全身率判别 + VLM 逐项核查） | ⏳ Roadmap P0 |
| **Phase 4** | 三轮驳回原因回写搜索 Agent，影响下一轮搜索词 | ⏳ Roadmap P1 |

---

## 8. 审核结果归档

所有轮次的审核结果（完整 JSON）写入：

```
data/review_logs/<push_id>.json
```

保留字段：每一轮 PASS/REJECT 列表、驳回原因、是否达标、最终发布数。
**只增不减**，和 outfit_archive 一致。

---

## 9. 与现有 v2.x 架构的接口

- 调用方：`tools/online_refresh.py`（Actions 在线重搜） + 未来的真实搜索脚本
- 入口函数（占位 → 真实 VLM）：`tools/reviewer.py::review_candidates(candidates, target, round_no) -> dict`
- 每期 push 记录中新增字段 `review_summary`（指向 review_logs 里对应的文件）
- 前端 `index.html` 读 `meta.review.insufficient`，为 `true` 时顶部 sticky banner 显示："⚠️ 本期图片数量有限（{actual} / {target}），下一期将补足。"

---

## 附录 A · 原始需求存档（2026-04-22）

> 用户原话完整保留于 `docs/change-log-suggestions.md` §A01 条目，作为本 SOP 的上游来源。
