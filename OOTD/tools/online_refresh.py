#!/usr/bin/env python3
"""
ŌTOMO · 在线重搜脚本（A 方案 · 运行在 GitHub Actions）
====================================================
workflow_dispatch 触发时执行，向 outfit_archive.json 追加新图并更新 meta.last_push_online 时间戳。
前端检测到 last_push_online 变化即重新加载。

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

ROOT = Path(__file__).resolve().parent.parent  # .../OOTD
ARCHIVE = ROOT / "data" / "outfit_archive.json"

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


def verify(url: str, timeout=4) -> bool:
    try:
        req = urllib.request.Request(url + "?w=500", method="HEAD",
                                      headers={"User-Agent": "Mozilla/5.0 otomo-online-refresh"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status == 200
    except Exception:
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["incremental", "full"], default="incremental")
    args = ap.parse_args()

    with open(ARCHIVE, "r", encoding="utf-8") as f:
        data = json.load(f)

    catalog = data["catalog"]
    before = len(catalog)
    target = 12 if args.mode == "incremental" else 20

    # 随机抽样 + 去重 + HTTP 验证
    random.shuffle(POOL)
    added = 0
    tried = 0
    added_ids = []
    for photo_id, src, brand, year, tags in POOL:
        if added >= target:
            break
        tried += 1
        h = hash_id(photo_id)
        if h in catalog:
            continue
        url = url_for(photo_id)
        if not verify(url):
            print(f"  ✗ {photo_id}")
            continue
        catalog[h] = {
            "url": url,
            "source_type": src,
            "brand_or_event": brand,
            "year": year,
            "tags": tags,
        }
        added_ids.append(h)
        added += 1
        print(f"  ✓ {h} [{src}] {brand}")

    # 写 meta —— 关键：last_push_online 是前端轮询的信号
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    data["meta"]["last_push_online"] = now
    data["meta"]["catalog_size"] = len(catalog)

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
    })

    with open(ARCHIVE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n✓ mode={args.mode} catalog: {before} → {len(catalog)} (+{added})")
    print(f"  last_push_online={now}")


if __name__ == "__main__":
    main()
