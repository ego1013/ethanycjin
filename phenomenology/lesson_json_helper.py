#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
辅助脚本：将文本中的英文直引号 "..." 自动转换为中文弯引号 \u201c...\u201d，
然后写出合法的 JSON 文件。避免手写 JSON 时因中文引号混用导致的转义错误。

用法：在各 lesson_data_XXX.py 中用 Python 普通字符串（可自由使用双引号，
因为我们用单引号包裹，或直接用双引号但让脚本自动转换配对）书写内容，
调用 write_lesson_json(num, data) 输出。
"""
import json
import re
import os

def smart_quotes(text):
    """将文本中的英文直引号转换为中文弯引号（成对处理，奇数次出现的是开引号，偶数次是闭引号）"""
    if not isinstance(text, str):
        return text
    result = []
    count = 0
    for ch in text:
        if ch == '"':
            if count % 2 == 0:
                result.append('\u201c')
            else:
                result.append('\u201d')
            count += 1
        else:
            result.append(ch)
    return ''.join(result)

def deep_smart_quotes(obj):
    if isinstance(obj, str):
        return smart_quotes(obj)
    if isinstance(obj, list):
        return [deep_smart_quotes(x) for x in obj]
    if isinstance(obj, dict):
        return {k: deep_smart_quotes(v) for k, v in obj.items()}
    return obj

def write_lesson_json(num, data, out_dir=None):
    if out_dir is None:
        out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lessons", "content")
    data = deep_smart_quotes(data)
    path = os.path.join(out_dir, f"lesson-{num:03d}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    total_chars = 0
    for key in ["ursprung", "deskription", "widerstreit", "ruckkehr",
                "phenom", "other", "paradox", "position_a", "position_b", "unresolved"]:
        val = data.get(key)
        if isinstance(val, list):
            total_chars += sum(len(re.sub(r'<[^>]+>', '', p)) for p in val)
    print(f"lesson-{num:03d}.json written, body chars ~= {total_chars}")
    return path
