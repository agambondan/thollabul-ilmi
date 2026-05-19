#!/usr/bin/env python3
"""Check if lib.min.js is accessible and what it contains."""
import requests

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://hadits.in/ahmad/2",
})

# First visit a page to get cookies
resp = session.get("https://hadits.in/ahmad/2", timeout=15)
print(f"Page status: {resp.status_code}")
print(f"Cookies: {dict(session.cookies)}")

# Then try to download lib.min.js
resp2 = session.get(
    "https://hadits.in/viewer/lib.min.js?s=1779185724",
    timeout=15,
    headers={"Referer": "https://hadits.in/ahmad/2"},
)
print(f"\nlib.min.js status: {resp2.status_code}")
print(f"Content-Type: {resp2.headers.get('content-type', '')}")
print(f"Content-Length: {len(resp2.content)}")
print(f"First 500 bytes: {resp2.text[:500]}")
