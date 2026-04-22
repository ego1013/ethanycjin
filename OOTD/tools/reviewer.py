#!/usr/bin/env python3
"""
ŌTOMO · 穿搭图片审核官（Step 2.5 / 2.6）
========================================
规范见 docs/reviewer-sop.md。

职责：
- 对搜索 Agent 提交的候选图片列表逐张审核 PASS/REJECT
- 输出严格 JSON 契约
- 维护三轮循环上下文（由调用方控制循环）

Phase 分期：
- Phase 1（当前）：规则兜底审核（URL/年份/source_type/brand 存在性）
- Phase 2（Roadmap P0）：CLIP + VLM 视觉审核，逐项核查 5 条通过条件
- Phase 3（Roadmap P1）：驳回原因聚类回写搜索 Agent

公共入口：
    review_candidates(candidates, target_count, round_no) -> dict (JSON-serializable)
"""

from __future__ import annotations

import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any

# 硬约束：最多循环轮次（见 reviewer-sop.md §6）
REVIEW_MAX_ROUNDS = 3

# 目标区间
TARGET_MIN = 12
TARGET_MAX = 18

# 4 类来源白名单
SOURCE_WHITELIST = {"Lookbook", "时装周街拍", "秀场", "日本街拍"}


# ---------------------------------------------------------------------------
# Phase 1 · 规则兜底审核
# ---------------------------------------------------------------------------

def _verify_url(url: str, timeout: int = 4) -> bool:
    """HTTP HEAD 200 校验（与 online_refresh.py 保持一致）。"""
    try:
        req = urllib.request.Request(
            url + ("?w=500" if "?" not in url else ""),
            method="HEAD",
            headers={"User-Agent": "Mozilla/5.0 otomo-reviewer"},
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status == 200
    except Exception:
        return False


def _rule_verdict(cand: Dict[str, Any]) -> Dict[str, Any]:
    """
    对单张候选执行规则兜底审核。
    Phase 1 只做"硬性元数据"检查，视觉层面的 5 条通过条件留给 Phase 2。
    """
    url = cand.get("image_url") or cand.get("url", "")
    src = cand.get("source_type", "")
    year = cand.get("year")
    brand = cand.get("brand_or_event", "")

    # 规则 1：URL 可访问
    if not url:
        return {"image_url": url, "verdict": "REJECT", "reason": "缺少图片 URL"}
    if not _verify_url(url):
        return {"image_url": url, "verdict": "REJECT", "reason": "图片 URL 无法访问（HTTP 非 200）"}

    # 规则 2：年份 ≥ 2021
    try:
        if year is not None and int(year) < 2021:
            return {"image_url": url, "verdict": "REJECT",
                    "reason": f"年份 {year} 早于 2021"}
    except (TypeError, ValueError):
        pass  # 年份解析不了的暂放行，留给 Phase 2

    # 规则 3：来源白名单
    if src not in SOURCE_WHITELIST:
        return {"image_url": url, "verdict": "REJECT",
                "reason": f"来源类型 '{src}' 不在 4 类白名单"}

    # 规则 4：品牌/活动名非空
    if not brand or not brand.strip():
        return {"image_url": url, "verdict": "REJECT",
                "reason": "缺少 brand_or_event 标识"}

    # Phase 1 全部通过
    return {"image_url": url, "verdict": "PASS"}


# ---------------------------------------------------------------------------
# 公共入口
# ---------------------------------------------------------------------------

def review_candidates(
    candidates: List[Dict[str, Any]],
    target_count: int = TARGET_MAX,
    round_no: int = 1,
) -> Dict[str, Any]:
    """
    对候选图片执行审核，返回符合 SOP §5 输出契约的 JSON dict。

    参数：
        candidates   : 搜索 Agent 提交的候选列表，每项至少含 image_url / source_type / year / brand_or_event
        target_count : 目标图片数量（默认 18，下限 12）
        round_no     : 当前第几轮（1/2/3）

    返回：
        {
          "round": int,
          "target_count": int,
          "total_submitted": int,
          "total_passed": int,
          "total_rejected": int,
          "need_supplement": int,
          "results": [{"image_url":..., "verdict":"PASS"|"REJECT", "reason":?...}]
        }
    """
    target_count = max(TARGET_MIN, min(TARGET_MAX, int(target_count)))
    results = [_rule_verdict(c) for c in candidates]
    passed = sum(1 for r in results if r["verdict"] == "PASS")
    rejected = len(results) - passed
    need = max(0, target_count - passed)

    return {
        "round": round_no,
        "target_count": target_count,
        "total_submitted": len(candidates),
        "total_passed": passed,
        "total_rejected": rejected,
        "need_supplement": need,
        "results": results,
        "_reviewed_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


# ---------------------------------------------------------------------------
# 审核日志落盘
# ---------------------------------------------------------------------------

def dump_review_log(push_id: str, rounds_reports: List[Dict[str, Any]],
                    log_dir: Path) -> Path:
    """
    将一次推送的所有轮次审核结果落盘到 data/review_logs/<push_id>.json（只增不减）。
    """
    log_dir.mkdir(parents=True, exist_ok=True)
    path = log_dir / f"{push_id}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump({
            "push_id": push_id,
            "rounds": rounds_reports,
            "total_rounds": len(rounds_reports),
            "final_passed": sum(r["total_passed"] for r in rounds_reports),
            "insufficient": (
                sum(r["total_passed"] for r in rounds_reports) < TARGET_MIN
            ),
        }, f, ensure_ascii=False, indent=2)
    return path


# ---------------------------------------------------------------------------
# CLI 自测
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # 快速自测：构造 3 张样例候选（含一张年份违规 + 一张非法 source）
    samples = [
        {
            "image_url": "https://images.unsplash.com/photo-1603252109303-2751441dd157",
            "source_type": "Lookbook",
            "brand_or_event": "Quiet Luxury · Wool",
            "year": 2024,
        },
        {
            "image_url": "https://images.unsplash.com/photo-1490578474895-699cd4e2cf5a",
            "source_type": "Lookbook",
            "brand_or_event": "Old Archive",
            "year": 2019,  # 会被 REJECT
        },
        {
            "image_url": "https://images.unsplash.com/photo-1516826957135-700dedea698d",
            "source_type": "商品平铺",  # 非白名单
            "brand_or_event": "N/A",
            "year": 2024,
        },
    ]
    report = review_candidates(samples, target_count=18, round_no=1)
    print(json.dumps(report, ensure_ascii=False, indent=2))
