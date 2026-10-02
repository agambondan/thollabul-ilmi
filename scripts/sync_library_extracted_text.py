#!/usr/bin/env python3
import psycopg2
import sys

LOCAL_DSN = "host=localhost port=54320 user=postgres password=postgres dbname=thullabul_ilmi"
PROD_DSN = "host=localhost port=54320 user=postgres password=postgres dbname=thullabul_ilmi"

def get_prod_dsn():
    return "host=sumopod port=5432 user=postgres password=postgres dbname=thullabul_ilmi"

def main():
    print("Connecting to local DB...")
    local = psycopg2.connect(LOCAL_DSN)
    local.autocommit = False

    print("Connecting to production DB...")
    prod = psycopg2.connect(get_prod_dsn())
    prod.autocommit = False

    try:
        with local.cursor() as lc, prod.cursor() as pc:
            lc.execute("""
                SELECT lb.id, lb.slug, lb.title
                FROM library_book lb
                WHERE lb.format = 'pdf'
                ORDER BY lb.id
            """)
            local_books = lc.fetchall()
            print(f"Found {len(local_books)} PDF books locally")

            for local_id, slug, title in local_books:
                print(f"\n--- {slug} (local_id={local_id}) ---")

                lc.execute("""
                    SELECT library_book_id, page_number, text, extraction_method, confident
                    FROM library_book_extracted_text
                    WHERE library_book_id = %s
                    ORDER BY page_number
                """, (local_id,))
                pages = lc.fetchall()

                if not pages:
                    print("  No extracted pages locally, skipping")
                    continue

                pc.execute("SELECT id, extraction_status FROM library_book WHERE slug = %s", (slug,))
                prod_book = pc.fetchone()
                if not prod_book:
                    print(f"  Book not found in production by slug={slug}, skipping")
                    continue

                prod_id, prod_status = prod_book
                print(f"  Production: id={prod_id}, status={prod_status}")

                pc.execute("DELETE FROM library_book_extracted_text WHERE library_book_id = %s", (prod_id,))
                deleted = pc.rowcount
                print(f"  Deleted {deleted} old extracted pages")

                insert_sql = """
                    INSERT INTO library_book_extracted_text
                    (library_book_id, page_number, text, extraction_method, confident, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                """
                for _, page_num, text, method, confident in pages:
                    pc.execute(insert_sql, (prod_id, page_num, text, method, confident))
                print(f"  Inserted {len(pages)} pages")

                new_status = 'done' if len(pages) > 0 else 'none'
                pc.execute("UPDATE library_book SET extraction_status = %s, pages = %s WHERE id = %s",
                           (new_status, len(pages), prod_id))
                print(f"  Updated book status={new_status}, pages={len(pages)}")

        prod.commit()
        print("\n=== Sync complete, committed to production ===")

    except Exception as e:
        prod.rollback()
        print(f"Error: {e}", file=sys.stderr)
        raise
    finally:
        local.close()
        prod.close()

if __name__ == "__main__":
    main()