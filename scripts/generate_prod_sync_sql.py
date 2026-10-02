#!/usr/bin/env python3
import psycopg2
import sys

LOCAL_DSN = "host=localhost port=54320 user=postgres password=postgres dbname=thullabul_ilmi"
OUTPUT_SQL = "/tmp/sync_library_prod.sql"

def escape_sql_str(val):
    if val is None:
        return "NULL"
    return "'" + str(val).replace("'", "''") + "'"

def main():
    print("Connecting to local DB...")
    local = psycopg2.connect(LOCAL_DSN)
    
    with open(OUTPUT_SQL, "w", encoding="utf-8") as out:
        out.write("-- Atomic sync script for library_book and library_book_extracted_text\n")
        out.write("BEGIN;\n\n")
        
        with local.cursor() as lc:
            lc.execute("""
                SELECT lb.id, lb.slug, lb.title, lb.extraction_status, lb.extraction_error, lb.pages
                FROM library_book lb
                WHERE lb.format = 'pdf'
                ORDER BY lb.id
            """)
            local_books = lc.fetchall()
            print(f"Found {len(local_books)} PDF books locally")

            for local_id, slug, title, ext_status, ext_err, pages_count in local_books:
                lc.execute("""
                    SELECT page_number, text, extraction_method, confident
                    FROM library_book_extracted_text
                    WHERE library_book_id = %s
                    ORDER BY page_number
                """, (local_id,))
                pages = lc.fetchall()
                print(f"Book: {slug} ({len(pages)} pages)")

                out.write(f"-- Book: {slug}\n")
                out.write("DO $$\n")
                out.write("DECLARE\n")
                out.write("  v_book_id BIGINT;\n")
                out.write("BEGIN\n")
                out.write(f"  SELECT id INTO v_book_id FROM library_book WHERE slug = {escape_sql_str(slug)};\n")
                out.write("  IF v_book_id IS NOT NULL THEN\n")
                out.write("    DELETE FROM library_book_extracted_text WHERE library_book_id = v_book_id;\n")
                
                # Insert pages
                for page_num, text, method, confident in pages:
                    conf_str = "TRUE" if confident else "FALSE"
                    out.write(f"    INSERT INTO library_book_extracted_text (library_book_id, page_number, text, extraction_method, confident, created_at, updated_at) "
                              f"VALUES (v_book_id, {page_num}, {escape_sql_str(text)}, {escape_sql_str(method)}, {conf_str}, NOW(), NOW());\n")
                
                out.write(f"    UPDATE library_book SET extraction_status = {escape_sql_str(ext_status)}, extraction_error = {escape_sql_str(ext_err)}, pages = {len(pages)} WHERE id = v_book_id;\n")
                out.write("  END IF;\n")
                out.write("END $$;\n\n")

        out.write("COMMIT;\n")

    local.close()
    print(f"SQL file generated at {OUTPUT_SQL}")

if __name__ == "__main__":
    main()