#!/usr/bin/env python3
"""Debug script to check what hadits.in renders with Playwright."""
from playwright.sync_api import sync_playwright
import json

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, args=["--no-sandbox"])
    page = browser.new_page()

    # Capture network requests
    requests = []
    def on_response(response):
        if response.status == 200 and 'json' in response.headers.get('content-type', ''):
            requests.append({'url': response.url, 'status': response.status})
    page.on("response", on_response)

    page.goto("https://hadits.in/ahmad/2", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(8000)

    # Print captured JSON requests
    print("=== JSON Responses ===")
    for r in requests:
        print(f"  {r['url']}")

    # Check all scripts loaded
    scripts = page.evaluate("""() => {
        return Array.from(document.scripts).map(s => s.src).filter(Boolean);
    }""")
    print(f"\n=== Scripts loaded ({len(scripts)}) ===")
    for s in scripts:
        print(f"  {s}")

    # Check localStorage or sessionStorage
    ls = page.evaluate("""() => {
        return {...localStorage};
    }""")
    print(f"\n=== localStorage ===")
    if ls:
        for k, v in list(ls.items())[:5]:
            print(f"  {k}: {v[:100]}")
    else:
        print("  (empty)")

    # Check for iframes
    iframes = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('iframe')).map(f => f.src);
    }""")
    print(f"\n=== Iframes ===")
    for f in iframes:
        print(f"  {f}")

    # Get page structure via JS
    divs = page.evaluate("""() => {
        const all = document.querySelectorAll('main, div.container, p');
        return Array.from(all).map(c => ({
            tag: c.tagName,
            id: c.id,
            cls: c.className,
            text: (c.innerText || '').substring(0, 300)
        }));
    }""")
    print(f"=== Page Structure ===")
    for d in divs:
        if d["text"].strip():
            print(f"<{d['tag']}> id={d['id']} class={d['cls']}")
            print(f"  text: {d['text'][:200]}")

    # Check if there's Arabic text anywhere
    arabic_text = page.evaluate("""() => {
        const walker = document.createTreeWalker(document.body, 4);
        const results = [];
        let node;
        while (node = walker.nextNode()) {
            const text = node.textContent.trim();
            if (text && /[\\u0600-\\u06FF]/.test(text)) {
                results.push(text.substring(0, 100));
            }
        }
        return results.slice(0, 10);
    }""")
    print(f"\n=== Arabic text found ({len(arabic_text)} occurrences) ===")
    for a in arabic_text[:3]:
        print(f"  {a[:100]}")

    browser.close()
