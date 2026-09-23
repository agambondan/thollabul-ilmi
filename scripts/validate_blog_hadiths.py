#!/usr/bin/env python3
import json
import os
import re
import subprocess
import sys

def run_query(query):
    db_host = os.environ.get("DB_HOST")
    if db_host:
        import psycopg2
        conn = psycopg2.connect(
            host=db_host,
            port=os.environ.get("DB_PORT", "5432"),
            dbname=os.environ.get("DB_NAME", "thullabul_ilmi"),
            user=os.environ.get("DB_USER", "postgres"),
            password=os.environ.get("DB_PASSWORD", ""),
        )
        with conn.cursor() as cur:
            cur.execute(query)
            try:
                res = cur.fetchall()
            except Exception:
                res = []
        conn.close()
        return res

    cmd = [
        "ssh", "sumopod",
        f"docker exec tholabul-ilmi-tholabul-ilmi-postgres-1 psql -U postgres -d thullabul_ilmi -t -A -c \"{query}\""
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        return None
    return res.stdout.strip()

def main():
    raw = run_query("SELECT json_agg(json_build_object('slug', slug, 'content', content)) FROM blog_post;")
    if not raw:
        print("Failed to fetch blog posts from database.")
        sys.exit(1)

    posts = json.loads(raw if isinstance(raw, str) else raw[0][0])
    print(f"Auditing {len(posts)} blog articles for hadith and Quran link integrity...\n")

    total_hadith = 0
    total_quran = 0
    errors = 0

    for post in posts:
        slug = post["slug"]
        content = post.get("content", "")
        h_matches = re.findall(r"\[(.*?)\]\(/hadith/([a-z0-9\-]+)/([0-9]+)\)", content)
        q_matches = re.findall(r"\[(.*?)\]\(/quran/([0-9]+)(?:#([0-9]+))?\)", content)

        if not h_matches and not q_matches:
            continue

        print(f"=== Article: {slug} ({len(h_matches)} hadith, {len(q_matches)} Quran links) ===")
        for text, book, number in h_matches:
            total_hadith += 1
            book_clean = book.replace("-", "")
            q = (
                f"SELECT b.slug, h.number, left(t.idn, 60) "
                f"FROM hadith h "
                f"JOIN book b ON h.book_id = b.id "
                f"JOIN translation t ON h.translation_id = t.id "
                f"WHERE (b.slug = '{book}' OR b.slug = '{book_clean}') AND h.number = {number};"
            )
            out = run_query(q)
            if not out:
                print(f"  ❌ [MISSING HADITH] {book} no. {number} ('{text}') -> NOT FOUND in DB!")
                errors += 1
            else:
                parts = out.split("|") if isinstance(out, str) else [str(x) for x in out[0]]
                preview = parts[2] if len(parts) > 2 else ""
                print(f"  ✓ [HADITH OK] {book} no. {number} ('{text}') -> \"{preview}...\"")

        for text, surah, ayah in q_matches:
            total_quran += 1
            if ayah:
                q = f"SELECT s.number, a.number FROM surah s JOIN ayah a ON a.surah_id = s.id WHERE s.number = {surah} AND a.number = {ayah};"
            else:
                q = f"SELECT s.number FROM surah s WHERE s.number = {surah};"
            out = run_query(q)
            if not out:
                print(f"  ❌ [MISSING QURAN] Surah {surah}:{ayah or 'all'} ('{text}') -> NOT FOUND in DB!")
                errors += 1
            else:
                print(f"  ✓ [QURAN OK] Surah {surah}:{ayah or 'all'} ('{text}')")
        print()

    print(f"=== Audit Summary: {total_hadith} hadith + {total_quran} Quran links checked across {len(posts)} articles. Errors: {errors} ===")
    if errors > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
