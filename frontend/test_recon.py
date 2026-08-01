"""Reconnaissance: screenshot the app to understand rendered state."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Test 1: Unauthenticated visit to home — should redirect to login
    page.goto("http://localhost:3003/")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="/tmp/01_home_unauthenticated.png", full_page=True)
    print(f"URL after visiting /: {page.url}")

    # Test 2: Check what's on the login page
    page.goto("http://localhost:3003/auth/login")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="/tmp/02_login_page.png", full_page=True)
    print(f"URL on login page: {page.url}")

    # Check for Google login button
    buttons = page.locator("button").all()
    print(f"Buttons found: {len(buttons)}")
    for b in buttons:
        print(f"  - '{b.inner_text()}' (visible={b.is_visible()})")

    # Test 3: Check console errors
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)

    page.goto("http://localhost:3003/auth/login")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)

    if errors:
        print(f"\nConsole errors on login page: {len(errors)}")
        for e in errors:
            print(f"  ERROR: {e}")
    else:
        print("\nNo console errors on login page")

    # Test 4: Check the unauthorized page
    page.goto("http://localhost:3003/unauthorized")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="/tmp/03_unauthorized_page.png", full_page=True)
    print(f"URL on unauthorized page: {page.url}")

    browser.close()
    print("\nReconnaissance complete. Check /tmp/01-03 screenshots.")
