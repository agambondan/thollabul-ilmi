#!/usr/bin/env python3
import json
import sys

def merge_kajian(file_a, file_b, out_file):
    with open(file_a, encoding="utf-8") as f:
        items_a = json.load(f)
    with open(file_b, encoding="utf-8") as f:
        items_b = json.load(f)

    merged = {}
    for item in items_a + items_b:
        key = item.get("video_id") or item.get("url")
        if not key:
            continue
        # Keep the one with more transcripts; on a tie, keep the last seen
        # (file_b wins over file_a, since items_b is appended after items_a).
        if key not in merged or len(item.get("transcripts", [])) >= len(merged[key].get("transcripts", [])):
            merged[key] = item

    result = list(merged.values())
    result.sort(key=lambda x: x.get("title", ""))

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"Merged {len(items_a)} + {len(items_b)} into {len(result)} unique videos -> {out_file}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: merge_kajian.py <file_a> <file_b> <out_file>")
        sys.exit(1)
    merge_kajian(sys.argv[1], sys.argv[2], sys.argv[3])
