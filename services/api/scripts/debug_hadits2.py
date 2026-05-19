#!/usr/bin/env python3
"""Deep debug: wait longer, check all possibilities."""
from playwright.sync_api import sync_playwright

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, args=["--no-sandbox"])
    page = browser.new_page()

    # Monitor ALL network requests
    all_requests = []
    def on_request(request):
        all_requests.append(request.url)
    page.on("request", on_request)

    page.goto("https://hadits.in/ahmad/2", timeout=30000)

    # Wait progressively
    for sec in [2, 5, 10]:
        page.wait_for_timeout(sec * 1000)
        html = page.content()
        has_arabic = "\u0600" in html
        print(f"After {sec+2}s wait: Arabic in page = {has_arabic}")

        # Check specific containers
        arab_cont = page.evaluate("document.getElementById('arabic_container')?.innerHTML || '(not found)'")
        print(f"  #arabic_container: {arab_cont[:100]}")

    # Check all network requests
    print(f"\n=== All requests ({len(all_requests)}) ===")
    for url in all_requests:
        if any(x in url for x in ['ajax', 'api', '.json', 'data', 'hadits', 'getHadith']):
            print(f"  {url}")
        elif url.endswith('.js'):
            print(f"  [JS] {url}")

    # Check body for any script that contains hadith data
    scripts = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('script')).map(s => ({
            src: s.src,
            type: s.type,
            length: (s.textContent || '').length
        }));
    }""")
    print(f"\n=== Inline scripts ({len(scripts)}) ===")
    for s in scripts:
        if not s['src'] and s['length'] > 100:
            print(f"  type={s['type']}, len={s['length']}")

    browser.close()
