#!/usr/bin/env python3
"""
ŌTOMO · 在线重搜脚本（A 方案 · 运行在 GitHub Actions）
====================================================
workflow_dispatch 触发时执行，向 outfit_archive.json 追加新图并更新 meta.last_push_online 时间戳。
前端检测到 last_push_online 变化即重新加载。

v2.3（2026-04-22）· 新增审核环节
--------------------------------
流程：Step 2 搜索候选 → Step 2.5 审核 PASS/REJECT → Step 2.6 不足补搜（≤3 轮）
    → Step 3 去重过滤（只对 PASS 的图片执行） → Step 4 落盘（前端渲染瀑布流）

硬约束：
- REVIEW_MAX_ROUNDS = 3（见 tools/reviewer.py）
- 目标下限 12，不足则 insufficient=true，前端顶部 banner 提示

模式：
- incremental：追加 8-12 张新图（默认，快）
- full：重抓全部候选池 + 追加（慢，本期暂按 incremental 处理）
"""

import argparse
import json
import random
import sys
import time
import urllib.request
from pathlib import Path
from datetime import datetime, timezone

# 复用同目录的审核模块
sys.path.insert(0, str(Path(__file__).resolve().parent))
from reviewer import (  # noqa: E402
    review_candidates,
    dump_review_log,
    REVIEW_MAX_ROUNDS,
    TARGET_MIN,
    TARGET_MAX,
)

ROOT = Path(__file__).resolve().parent.parent  # .../OOTD
ARCHIVE = ROOT / "data" / "outfit_archive.json"
REVIEW_LOG_DIR = ROOT / "data" / "review_logs"

# 候选 photo ID 池（比 expand_catalog.py 更大，允许随机抽）
# 分 source_type × 风格 tag
POOL = [
    # Lookbook
    ("1521572163474-6864f9cf17ad", "Lookbook", "Neutral Lookbook · Refresh", 2023, ["minimal", "earth tone"]),
    ("1603252109303-2751441dd157", "Lookbook", "Quiet Luxury · Wool", 2024, ["quiet luxury", "wool"]),
    ("1580518337843-f959e992563b", "Lookbook", "Transitional Studio", 2023, ["transitional", "layering"]),
    ("1617137968427-85924c800a23", "Lookbook", "Linen Editorial", 2022, ["linen", "warm"]),
    ("1490578474895-699cd4e2cf5a", "Lookbook", "Earth Tone · Autumn", 2023, ["earth tone", "autumn"]),
    ("1552374196-c4e7ffc6e127", "Lookbook", "Soft Tailoring · Spring", 2024, ["soft tailoring", "spring transitional"]),
    ("1519085360753-af0119f7cbe8", "Lookbook", "Workwear Studio", 2022, ["workwear", "utility"]),
    ("1520975916090-3105956dac39", "Lookbook", "Heavy Layering · Winter", 2023, ["heavy layering", "cold"]),

    # 时装周街拍
    ("1516826957135-700dedea698d", "时装周街拍", "Paris Streetsnap · Winter", 2024, ["wool overcoat", "cold"]),
    ("1543087903-1ac2ec7aa8c6", "时装周街拍", "Milan Streetsnap · Spring", 2024, ["trench", "spring transitional"]),
    ("1593032465175-481ac7f401f1", "时装周街拍", "NY Streetsnap · Fall", 2023, ["unstructured blazer", "cool"]),
    ("1522075469751-3a6694fb2f62", "时装周街拍", "London Streetsnap · Denim", 2024, ["denim", "workwear jacket"]),
    ("1519415943484-9fa1873496d5", "时装周街拍", "Paris Streetsnap · Rain", 2024, ["military parka", "rainy"]),
    ("1488161628813-b6a7d4c4747d", "时装周街拍", "Milan Streetsnap · Linen", 2024, ["linen shirt", "mild"]),
    ("1512353087810-25dfcd100963", "时装周街拍", "NY Streetsnap · Cargo", 2023, ["cargo", "utility"]),

    # 秀场
    ("1581338834647-b0fb40704e22", "秀场", "Paris Runway · Wool", 2024, ["runway", "wool"]),
    ("1542838132-92c53300491f", "秀场", "Milan Runway · Spring", 2024, ["runway", "spring transitional"]),
    ("1564859228273-274232fdb517", "秀场", "NY Runway · Linen", 2024, ["runway", "linen"]),
    ("1507003211169-0a1dd7228f2e", "秀场", "London Runway · Archive", 2023, ["runway", "archive"]),
    ("1539109136881-3be0616acf4c", "秀场", "Tokyo Runway · Minimal", 2024, ["runway", "tokyo archive"]),

    # 日本街拍
    ("1552374196-c4e7ffc6e128", "日本街拍", "Shibuya Snap · Autumn", 2024, ["tokyo street", "autumn"]),
    ("1519085360753-af0119f7cbe9", "日本街拍", "Harajuku Snap · Summer", 2024, ["harajuku", "summer japan"]),
    ("1514222709107-a180c68d72b5", "日本街拍", "Daikanyama · Spring", 2024, ["daikanyama", "spring transitional"]),
    ("1517620798925-5b4e9651fb80", "日本街拍", "Omotesando · Winter", 2024, ["omotesando", "wool overcoat"]),
    ("1503341338985-c0477be52514", "日本街拍", "Nakameguro · Mild Day", 2024, ["nakameguro", "mild"]),
]


def hash_id(photo_id: str) -> str:
    return f"ph-{photo_id.split('-', 1)[0]}"


def url_for(photo_id: str) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}"


# ---------------------------------------------------------------------------
# Step 2：从 POOL 搜索一批候选（不写入 catalog，只返回候选对象列表）
# ---------------------------------------------------------------------------

def search_candidates(catalog: dict, exclude_hashes: set, want: int) -> list:
    """
    从 POOL 随机抽样 want 张未入档的候选，返回候选 dict 列表（未入档）。
    """
    random.shuffle(POOL)
    candidates = []
    for photo_id, src, brand, year, tags in POOL:
        if len(candidates) >= want:
            break
        h = hash_id(photo_id)
        if h in catalog or h in exclude_hashes:
            continue
        candidates.append({
            "_hash": h,
            "image_url": url_for(photo_id),
            "source_type": src,
            "brand_or_event": brand,
            "year": year,
            "tags": tags,
        })
    return candidates


# ---------------------------------------------------------------------------
# Main · 搜索 → 审核 → 补搜（最多 3 轮） → 去重 → 落盘
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["incremental", "full"], default="incremental")
    args = ap.parse_args()

    with open(ARCHIVE, "r", encoding="utf-8") as f:
        data = json.load(f)

    catalog = data["catalog"]
    before = len(catalog)
    target = TARGET_MAX if args.mode == "full" else 12  # incremental 下限

    passed_cumulative = []  # 本次累计 PASS 的候选
    rounds_reports = []     # 每轮审核报告（落盘用）
    seen_this_run = set()   # 本次已提交审核过的 hash，防止补搜重复

    print(f"\n===== ŌTOMO 在线重搜 · mode={args.mode} · 目标 {target} 张 =====")

    for round_no in range(1, REVIEW_MAX_ROUNDS + 1):
        need = target - len(passed_cumulative)
        if need <= 0:
            break

        print(f"\n--- Round {round_no}/{REVIEW_MAX_ROUNDS} | 需补 {need} 张 ---")

        # Step 2：搜索候选（每轮多抓一点以抵消驳回率，抓 need * 1.5，下限 need，上限 TARGET_MAX）
        want = min(TARGET_MAX, max(need, int(need * 1.5)))
        cands = search_candidates(catalog, seen_this_run, want)
        if not cands:
            print("  ⚠️ POOL 已耗尽可用候选，无法继续补搜")
            break
        for c in cands:
            seen_this_run.add(c["_hash"])
        print(f"  Step 2: 搜索到 {len(cands)} 张候选")

        # Step 2.5：审核官逐张审核
        report = review_candidates(cands, target_count=target, round_no=round_no)
        rounds_reports.append(report)
        print(f"  Step 2.5: PASS {report['total_passed']} / REJECT {report['total_rejected']}")
        for r in report["results"]:
            if r["verdict"] == "REJECT":
                print(f"    ✗ {r['image_url'][-40:]}  ·  {r.get('reason','')}")

        # 把本轮 PASS 的候选回收（保留原 _hash/tags 等字段）
        passed_urls = {r["image_url"] for r in report["results"] if r["verdict"] == "PASS"}
        for c in cands:
            if c["image_url"] in passed_urls:
                passed_cumulative.append(c)

        # Step 2.6：判断是否需要补搜
        if len(passed_cumulative) >= target:
            print(f"  ✓ 已达目标 {target}，停止循环")
            break
        if round_no < REVIEW_MAX_ROUNDS:
            print(f"  → 累计 PASS {len(passed_cumulative)} < {target}，进入下一轮补搜")
        else:
            print(f"  ⚠️ 已达最大轮次 {REVIEW_MAX_ROUNDS}，以实际数量发布")

    # Step 3：去重过滤（只对 PASS 的图片执行）
    added_ids = []
    for c in passed_cumulative:
        h = c["_hash"]
        if h in catalog:
            continue
        catalog[h] = {
            "url": c["image_url"],
            "source_type": c["source_type"],
            "brand_or_event": c["brand_or_event"],
            "year": c["year"],
            "tags": c["tags"],
        }
        added_ids.append(h)
    added = len(added_ids)

    # Step 4：落盘
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    data["meta"]["last_push_online"] = now
    data["meta"]["catalog_size"] = len(catalog)

    total_passed_final = sum(r["total_passed"] for r in rounds_reports)
    total_rejected_final = sum(r["total_rejected"] for r in rounds_reports)
    insufficient = added < TARGET_MIN

    data["meta"]["review"] = {
        "enabled": True,
        "last_run": now,
        "rounds": len(rounds_reports),
        "total_passed": total_passed_final,
        "total_rejected": total_rejected_final,
        "published": added,
        "target": target,
        "insufficient": insufficient,
    }

    # 追加一个伪 push（用于 trigger_banner 显示"在线重搜"）
    push_id = f"online-{int(time.time())}"
    data["pushes"].append({
        "push_id": push_id,
        "push_date": now[:10],
        "push_type": "online_refresh",
        "trigger_label": "在线重搜",
        "weather": data["pushes"][-1].get("weather", {}),  # 继承上一次的天气
        "item_count": added,
        "items": added_ids,
        "review_summary": f"review_logs/{push_id}.json",
    })

    with open(ARCHIVE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # 审核日志独立落盘
    log_path = dump_review_log(push_id, rounds_reports, REVIEW_LOG_DIR)

    print(f"\n===== ✓ 完成 =====")
    print(f"  catalog: {before} → {len(catalog)} (+{added})")
    print(f"  rounds: {len(rounds_reports)} / max {REVIEW_MAX_ROUNDS}")
    print(f"  passed (累计提交审核): {total_passed_final}, rejected: {total_rejected_final}")
    print(f"  published: {added}, insufficient: {insufficient}")
    print(f"  review log: {log_path}")
    print(f"  last_push_online: {now}")


if __name__ == "__main__":
    main()
