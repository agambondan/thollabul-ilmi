#!/usr/bin/env python3
import json
import subprocess
import csv
import io
import sys

JSON_PATH = "/tmp/library_sync_data.json"
CONTAINER = "tholabul-ilmi-tholabul-ilmi-postgres-1"
DB_USER = "postgres"
DB_NAME = "thullabul_ilmi"

def run_psql(query):
    p = subprocess.Popen(
        ["docker", "exec", "-i", CONTAINER, "psql", "-U", DB_USER, "-d", DB_NAME, "-t", "-c", query],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    out, err = p.communicate()
    if p.returncode != 0:
        raise RuntimeError(f"psql failed: {err}")
    return out.strip()

def run_psql_copy(copy_query, csv_data):
    p = subprocess.Popen(
        ["docker", "exec", "-i", CONTAINER, "psql", "-U", DB_USER, "-d", DB_NAME, "-c", copy_query],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    out, err = p.communicate(input=csv_data)
    if p.returncode != 0:
        raise RuntimeError(f"psql COPY failed: {err}")
    return out.strip()

def escape_sql(val):
    if val is None:
        return "NULL"
    return "'" + str(val).replace("'", "''") + "'"

def main():
    print(f"Reading {JSON_PATH}...")
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        books_data = json.load(f)

    print(f"Loaded {len(books_data)} books from JSON.")

    total_pages_synced = 0

    for book in books_data:
        slug = book["slug"]
        status = book["extraction_status"]
        error = book["extraction_error"]
        pages = book["pages"]
        pages_count = len(pages)

        # Find book ID in production
        prod_id_str = run_psql(f"SELECT id FROM library_book WHERE slug = {escape_sql(slug)};")
        if not prod_id_str:
            print(f"[SKIP] Book '{slug}' not found in production DB.")
            continue
        
        prod_id = int(prod_id_str)
        print(f"Syncing '{slug}' (prod_id={prod_id}, {pages_count} pages)...")

        # Delete existing extracted text for this book
        run_psql(f"DELETE FROM library_book_extracted_text WHERE library_book_id = {prod_id};")

        # Prepare CSV data for COPY
        csv_buffer = io.StringIO()
        csv_writer = csv.writer(csv_buffer, quoting=csv.QUOTE_MINIMAL)

        for p in pages:
            # columns: library_book_id, page_number, text, extraction_method, confident, created_at, updated_at
            csv_writer.writerow([
                prod_id,
                p["page_number"],
                p["text"],
                p["extraction_method"],
                "true" if p["confident"] else "false",
                "NOW()",
                "NOW()"
            ])

        # Execute COPY into table
        # Notice: for created_at and updated_at with CSV we can either pass timestamp string or let default handle it if omitted
        # So we omit created_at/updated_at to let database defaults take care of it or use now()
        csv_buffer_clean = io.StringIO()
        csv_writer_clean = csv.writer(csv_buffer_clean, quoting=csv.QUOTE_MINIMAL)
        for p in pages:
            csv_writer_clean.writerow([
                prod_id,
                p["page_number"],
                p["text"],
                p["extraction_method"],
                "true" if p["confident"] else "false"
            ])

        copy_cmd = "COPY library_book_extracted_text (library_book_id, page_number, text, extraction_method, confident) FROM STDIN WITH (FORMAT csv);"
        run_psql_copy(copy_cmd, csv_buffer_clean.getvalue())

        # Update metadata in library_book
        update_cmd = f"UPDATE library_book SET extraction_status = {escape_sql(status)}, extraction_error = {escape_sql(error)}, pages = {pages_count} WHERE id = {prod_id};"
        run_psql(update_cmd)

        total_pages_synced += pages_count
        print(f"  -> Done ({pages_count} pages copied)")

    print(f"\n==========================================")
    print(f"Sync complete! Total {len(books_data)} books and {total_pages_synced} pages synced.")
    print(f"==========================================")

if __name__ == "__main__":
    main()