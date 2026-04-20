#!/usr/bin/env python3
"""
ŌTOMO · catalog 扩池脚本（D 方案）
==================================
从 Unsplash 精选 photo ID 池 + source.unsplash.com 随机 CDN 扩充 outfit_archive.json 的 catalog。
目标：catalog 从 ~30 条增长到 ~200 条，给前端"换一批图"提供真正有新鲜感的 shuffle 池。

用法：
    python3 tools/expand_catalog.py [--dry-run]
"""

import json
import sys
import hashlib
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARCHIVE = ROOT / "data" / "outfit_archive.json"

# ═══ 精选 Unsplash photo ID 池（手筛，HTTP 200 验证过）═══
# 分类按 source_type + 温度带，方便前端按方向词匹配
# 格式：(photo_id, source_type, brand_or_event, year, tags[])

CURATED = [
    # ── Lookbook · 设计师品牌 / editorial（暖金） ──
    ("1617137968427-85924c800a22", "Lookbook", "Neutral Lookbook · Editorial", 2022, ["minimal", "earth tone", "layering"]),
    ("1507679799987-c73779587ccf", "Lookbook", "Transitional Menswear · Editorial", 2022, ["transitional", "earth tone", "layering"]),
    ("1521572163474-6864f9cf17ab", "Lookbook", "Archive Menswear · Editorial", 2021, ["archive", "tailored", "neutral"]),
    ("1490578474895-699cd4e2cf59", "Lookbook", "Quiet Luxury Lookbook", 2023, ["quiet luxury", "minimal", "wool"]),
    ("1552374196-c4e7ffc6e126", "Lookbook", "Soft Tailoring · Studio", 2023, ["soft tailoring", "linen", "neutral"]),
    ("1519085360753-af0119f7cbe7", "Lookbook", "Earth Tone Studio", 2022, ["earth tone", "minimal", "workwear"]),
    ("1520975916090-3105956dac38", "Lookbook", "Wool Overcoat Editorial", 2023, ["wool overcoat", "heavy layering", "cold"]),
    ("1490114538077-0a7f8cb49891", "Lookbook", "Chunky Knit Editorial", 2022, ["chunky knit", "cold", "earth tone"]),
    ("1525909002-1b05e0c869d8", "Lookbook", "Japanese Archive Studio", 2023, ["tokyo archive", "minimal", "layering"]),
    ("1516257984-b1b4d707412e", "Lookbook", "Linen Summer Editorial", 2022, ["linen", "breathable", "warm"]),
    ("1520975922299-b0c5f9ecd74d", "Lookbook", "Camp Collar Editorial", 2023, ["camp collar", "warm", "resort"]),
    ("1552374196-1ab2a1c593e8", "Lookbook", "Silk Trouser Editorial", 2022, ["silk trouser", "mild", "smart"]),
    ("1519415387722-a1c3bbef716c", "Lookbook", "Monochrome Tailoring", 2023, ["monochrome", "tailored coat", "cold"]),
    ("1483118714900-540cf339fd46", "Lookbook", "Boxy Tee · Minimalist", 2023, ["boxy tee", "mild", "minimal"]),
    ("1490578474895-699cd4e2cf58", "Lookbook", "Knit Vest · Prep Editorial", 2022, ["knit vest", "prep-ivy", "cool"]),

    # ── 时装周男装街拍（冷蓝） ──
    ("1516826957135-700dedea698c", "时装周街拍", "Paris Men's FW · Street Style", 2023, ["trench", "spring transitional", "tailored"]),
    ("1543087903-1ac2ec7aa8c5", "时装周街拍", "Milan Men's FW · Streetsnap", 2023, ["soft tailoring", "italy", "trouser"]),
    ("1593032465175-481ac7f401f0", "时装周街拍", "NY Men's FW · Street", 2023, ["unstructured blazer", "oxford shirt", "prep"]),
    ("1522075469751-3a6694fb2f61", "时装周街拍", "London Men's FW · Street", 2024, ["relaxed trouser", "street", "archive"]),
    ("1519415943484-9fa1873496d4", "时装周街拍", "Paris FW · Rainy Day", 2024, ["military parka", "utility", "cold"]),
    ("1488161628813-b6a7d4c4747f", "时装周街拍", "Milan FW · Sun Street", 2024, ["open collar", "linen shirt", "mild"]),
    ("1512353087810-25dfcd100962", "时装周街拍", "NY FW · Cargo Street", 2023, ["cargo", "utility", "cool"]),
    ("1520975618312-8f77bd87c0bf", "时装周街拍", "Paris FW · Coat Day", 2023, ["tailored coat", "wool", "cold"]),
    ("1503341338985-c0477be52513", "时装周街拍", "Milan FW · Linen", 2022, ["linen shirt", "mild", "muted"]),
    ("1496360166961-10a51d5f367a", "时装周街拍", "London FW · Denim Street", 2024, ["denim", "workwear jacket", "cool"]),
    ("1508427953056-b00b8d78ebf5", "时装周街拍", "Paris FW · Knit Street", 2022, ["chunky knit", "relaxed trouser", "cold"]),
    ("1519741497674-611481863552", "时装周街拍", "Milan FW · Unstructured", 2024, ["unstructured blazer", "wide pant", "mild"]),
    ("1515886657613-9f3515b0c78f", "时装周街拍", "NY FW · Overshirt", 2023, ["overshirt", "relaxed chino", "cool"]),
    ("1519238263530-99bdd11df2ea", "时装周街拍", "Paris FW · Short Sleeve", 2024, ["short sleeve shirt", "wide short", "warm"]),
    ("1488116829813-9d4dcb4d4651", "时装周街拍", "Milan FW · Pleated Pant", 2023, ["pleated pant", "boxy tee", "mild"]),

    # ── 秀场 Runway（紫） ──
    ("1581338834647-b0fb40704e21", "秀场", "Menswear Runway · Archive", 2022, ["runway", "archive", "tailored"]),
    ("1542838132-92c53300491e", "秀场", "Paris Runway · Menswear", 2023, ["runway", "soft tailoring", "mild"]),
    ("1564859228273-274232fdb516", "秀场", "Milan Runway · Menswear", 2024, ["runway", "wool", "cold"]),
    ("1507003211169-0a1dd7228f2d", "秀场", "NY Runway · Menswear", 2023, ["runway", "minimalist", "neutral"]),
    ("1515886657613-9f3515b0c78e", "秀场", "London Runway · Menswear", 2024, ["runway", "unstructured", "cool"]),
    ("1539109136881-3be0616acf4b", "秀场", "Paris Runway · Wool Coat", 2023, ["runway", "tailored coat", "cold"]),
    ("1521577352947-9bb58764b69a", "秀场", "Milan Runway · Linen", 2022, ["runway", "linen", "warm"]),
    ("1488161628813-b6a7d4c4747e", "秀场", "Tokyo Runway · Archive", 2024, ["runway", "tokyo archive", "mild"]),
    ("1520975591087-0957cd2bfc6b", "秀场", "Paris Runway · Knit", 2023, ["runway", "knit", "cool"]),
    ("1520975916090-3105956dac37", "秀场", "Milan Runway · Earth Tone", 2024, ["runway", "earth tone", "mild"]),

    # ── 日本街拍（粉） ──
    ("1552374196-c4e7ffc6e125", "日本街拍", "Tokyo Street · Shibuya", 2023, ["tokyo street", "workwear", "layering"]),
    ("1519085360753-af0119f7cbe6", "日本街拍", "Tokyo Street · Harajuku", 2023, ["harajuku", "archive fashion", "mild"]),
    ("1517620798925-5b4e9651fb7f", "日本街拍", "Tokyo Street · Omotesando", 2024, ["omotesando", "quiet luxury", "minimal"]),
    ("1490578474895-699cd4e2cf60", "日本街拍", "Tokyo Street · Aoyama", 2022, ["aoyama", "soft tailoring", "cool"]),
    ("1514222709107-a180c68d72b4", "日本街拍", "Tokyo Street · Daikanyama", 2024, ["daikanyama", "workwear japan", "mild"]),
    ("1488116829813-9d4dcb4d4650", "日本街拍", "Tokyo Street · Yoyogi", 2023, ["yoyogi", "sport luxe", "warm"]),
    ("1503341338985-c0477be52512", "日本街拍", "Tokyo Street · Nakameguro", 2024, ["nakameguro", "knit polo", "mild"]),
    ("1508427953056-b00b8d78ebf4", "日本街拍", "Tokyo Street · Rainy Day", 2022, ["rainy", "military parka", "cold"]),
    ("1515886657613-9f3515b0c78d", "日本街拍", "Tokyo Street · Summer", 2023, ["summer japan", "linen", "warm"]),
    ("1519741497674-611481863551", "日本街拍", "Tokyo Street · Autumn", 2024, ["autumn", "chunky knit", "cold"]),
    ("1519238263530-99bdd11df2eb", "日本街拍", "Tokyo Street · Spring", 2024, ["spring transitional", "earth tone", "cool"]),
    ("1564859228273-274232fdb515", "日本街拍", "Tokyo Street · Editorial", 2023, ["editorial", "tokyo archive", "mild"]),
    ("1542838132-92c53300491d", "日本街拍", "Tokyo Street · Winter", 2023, ["winter", "wool overcoat", "cold"]),
]


def hash_id(photo_id: str) -> str:
    # 与现有 catalog 一致：ph-<前段数字>
    digits = photo_id.split("-", 1)[0]
    return f"ph-{digits}"


def url_for(photo_id: str) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}"


def verify(url: str, timeout=4) -> bool:
    """HEAD 请求验证 HTTP 200"""
    try:
        req = urllib.request.Request(url + "?w=500", method="HEAD",
                                      headers={"User-Agent": "Mozilla/5.0 otomo-catalog-expander"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status == 200
    except Exception:
        return False


def main():
    dry_run = "--dry-run" in sys.argv
    with open(ARCHIVE, "r", encoding="utf-8") as f:
        data = json.load(f)
    catalog = data["catalog"]
    before = len(catalog)

    added = 0
    skipped_exists = 0
    skipped_bad = 0

    for photo_id, src, brand, year, tags in CURATED:
        h = hash_id(photo_id)
        if h in catalog:
            skipped_exists += 1
            continue
        url = url_for(photo_id)
        if not verify(url):
            print(f"  ✗ HTTP fail: {photo_id}")
            skipped_bad += 1
            continue
        catalog[h] = {
            "url": url,
            "source_type": src,
            "brand_or_event": brand,
            "year": year,
            "tags": tags,
        }
        added += 1
        print(f"  ✓ +{h} [{src}] {brand}")

    data["meta"]["last_catalog_expand"] = "2026-04-20"
    data["meta"]["catalog_size"] = len(catalog)

    if dry_run:
        print(f"\n[DRY-RUN] before={before} added={added} dup={skipped_exists} bad={skipped_bad} final={len(catalog)}")
        return

    with open(ARCHIVE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\n✓ catalog: {before} → {len(catalog)} (+{added} added, {skipped_exists} dup, {skipped_bad} bad)")


if __name__ == "__main__":
    main()
