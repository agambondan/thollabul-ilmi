#!/usr/bin/env python3
import json
import psycopg2

LOCAL_DSN = "host=localhost port=54320 user=postgres password=postgres dbname=thullabul_ilmi"
OUTPUT_JSON = "/tmp/library_sync_data.json"

def main():
    print("Connecting to local DB...")
    conn = psycopg2.connect(LOCAL_DSN)
    
    books_data = []
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, slug, title, extraction_status, extraction_error, pages
            FROM library_book
            WHERE format = 'pdf'
            ORDER BY id
        """)
        books = cur.fetchall()
        print(f"Found {len(books)} PDF books locally")

        for book_id, slug, title, status, error, pages_count in books:
            cur.execute("""
                SELECT page_number, text, extraction_method, confident
                FROM library_book_extracted_text
                WHERE library_book_id = %s
                ORDER BY page_number
            """, (book_id,))
            rows = cur.fetchall()

            pages_list = []
            for page_num, text, method, confident in rows:
                pages_list.append({
                    "page_number": page_num,
                    "text": text,
                    "extraction_method": method,
                    "confident": confident
                })

            books_data.append({
                "slug": slug,
                "title": title,
                "extraction_status": status,
                "extraction_error": error,
                "pages_count": len(pages_list),
                "pages": pages_list
            })
            print(f"Exported {slug}: {len(pages_list)} pages")

    conn.close()

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(books_data, f, ensure_ascii=False)

    print(f"\nAll data exported to {OUTPUT_JSON}")

if __name__ == "__main__":
    main()