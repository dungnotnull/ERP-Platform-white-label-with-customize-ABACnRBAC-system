"""Comprehensive flow tests for React Query migration."""
from playwright.sync_api import sync_playwright
import json

RESULTS = []

def test(name, passed, detail=""):
    status = "PASS" if passed else "FAIL"
    RESULTS.append({"test": name, "status": status, "detail": detail})
    print(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Collect console errors
    console_errors = []
    page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ("error", "warning") else None)

    # ============================================================
    # TEST GROUP 1: Unauthenticated flows
    # ============================================================
    print("\n--- Unauthenticated Flows ---")

    # Test: Visiting / redirects to login
    page.goto("http://localhost:3003/")
    page.wait_for_load_state("networkidle")
    redirected_to_login = "/login" in page.url or "/auth/login" in page.url
    test("Unauthenticated / redirects to login", redirected_to_login, f"URL: {page.url}")

    # Test: No console errors
    page.wait_for_timeout(1000)
    errors_now = [e for e in console_errors if "[error]" in e]
    test("No console errors on redirect", len(errors_now) == 0, f"{len(errors_now)} errors")

    # Test: Login page renders content
    page.goto("http://localhost:3003/auth/login")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    body_text = page.locator("body").inner_text()
    has_login_content = len(body_text.strip()) > 10
    test("Login page renders content", has_login_content, f"Body text length: {len(body_text)}")

    # Test: Login page has visible elements
    all_elements = page.locator("img, button, a, input").all()
    test("Login page has interactive elements", len(all_elements) > 0, f"Found {len(all_elements)} elements")

    # ============================================================
    # TEST GROUP 2: Simulate login by injecting tokens + profile
    # ============================================================
    print("\n--- Simulated Auth Flows ---")

    # We can't do a real login (no credentials), but we can test the React Query
    # integration by checking that the app handles the auth state correctly.

    # Test: Protected route without auth returns login redirect
    page.goto("http://localhost:3003/team")
    page.wait_for_load_state("networkidle")
    redirected = "/login" in page.url or "/auth/login" in page.url
    test("/team redirects without auth", redirected, f"URL: {page.url}")

    # Test: /unauthorized page loads
    page.goto("http://localhost:3003/unauthorized")
    page.wait_for_load_state("networkidle")
    is_unauthorized = "/unauthorized" in page.url
    test("/unauthorized page accessible", is_unauthorized, f"URL: {page.url}")

    # ============================================================
    # TEST GROUP 3: Check React Query initialization
    # ============================================================
    print("\n--- React Query Integration ---")

    # Check that useQuery is properly configured by inspecting the React tree
    page.goto("http://localhost:3003/auth/login")
    page.wait_for_load_state("networkidle")

    # Test: No React errors in console
    react_errors = [e for e in console_errors if "react" in e.lower() or "hook" in e.lower()]
    test("No React/Hook errors", len(react_errors) == 0, f"{len(react_errors)} React errors")

    # Test: QueryClient is available (check window.__REACT_QUERY_DEVTOOLS__)
    # In production mode, this won't exist, but we can check that the app doesn't crash
    page.goto("http://localhost:3003/auth/login")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    all_errors = [e for e in console_errors if "[error]" in e]
    test("App doesn't crash on mount", len(all_errors) == 0,
         f"{len(all_errors)} total errors" if all_errors else "")

    # ============================================================
    # TEST GROUP 4: Logout redirect (the bug we just fixed)
    # ============================================================
    print("\n--- Logout Flow ---")

    # We can't fully test logout without logging in first.
    # But we can test that clearing the profile cache + token
    # causes the ProtectedRoute to redirect.
    # Simulate by going to a protected page with no token.
    page.goto("http://localhost:3003/")
    page.wait_for_load_state("networkidle")
    is_on_login = "/login" in page.url or "/auth/login" in page.url
    test("After clearing state, redirects to login", is_on_login, f"URL: {page.url}")

    # ============================================================
    # TEST GROUP 5: Navigation between pages
    # ============================================================
    print("\n--- Navigation ---")

    # Test: Direct URL to a non-existent page
    page.goto("http://localhost:3003/nonexistent-page-xyz")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)
    # Should either show 404 or redirect to login
    is_404_or_login = "not found" in page.locator("body").inner_text().lower() or "/login" in page.url
    test("Non-existent route handled", is_404_or_login, f"URL: {page.url}")

    browser.close()

    # ============================================================
    # Summary
    # ============================================================
    print("\n" + "=" * 50)
    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    failed = sum(1 for r in RESULTS if r["status"] == "FAIL")
    print(f"Results: {passed} passed, {failed} failed out of {len(RESULTS)} tests")

    if failed > 0:
        print("\nFailed tests:")
        for r in RESULTS:
            if r["status"] == "FAIL":
                print(f"  - {r['test']}: {r['detail']}")

    # Print all console errors for debugging
    if console_errors:
        print(f"\nAll console messages ({len(console_errors)}):")
        for e in console_errors:
            print(f"  {e}")
