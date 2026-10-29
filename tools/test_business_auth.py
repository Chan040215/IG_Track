import sys
import os
import time
import json
from playwright.sync_api import sync_playwright

def sanitize(text):
    return str(text).encode('ascii', 'replace').decode('ascii')

def main():
    print("[*] Starting Playwright Business Auth & Multi-tenant Test...")
    artifact_dir = r"C:\Users\chank\.gemini\antigravity\brain\fd3f3443-f652-4582-84b2-e3195be1e311"
    os.makedirs(artifact_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 1. Unauthenticated Visitor
        context = browser.new_context(viewport={"width": 1280, "height": 900})
        page = context.new_page()

        print("[*] 1. Visiting app as unauthenticated guest...")
        page.goto("http://127.0.0.1:8000/", wait_until="networkidle")
        page.wait_for_timeout(1000)

        # Clear any leftover tokens in localStorage for clean test
        page.evaluate("() => { localStorage.removeItem('ig_user_token'); localStorage.removeItem('ig_user_profile'); }")
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(1000)

        # Check Business Hero card presence
        hero_card = page.locator(".business-auth-hero-card")
        assert hero_card.count() > 0, "Business Auth Hero Card should be visible for unauthenticated user"
        print("[+] Business Auth Hero Card is visible!")

        # Screenshot 1: Unauthenticated Guest with Google Direct Login Card
        p1 = os.path.join(artifact_dir, "test_business_guest_login.png")
        page.screenshot(path=p1)
        print(f"[+] Saved screenshot 1: {sanitize(p1)}")

        # 2. Click Developer Fast Login for chankahhao0215@gmail.com
        print("[*] 2. Logging in as primary user: chankahhao0215@gmail.com...")
        dev_btn = page.locator("button:has-text('chankahhao0215@gmail.com')")
        dev_btn.click()
        page.wait_for_timeout(1500)

        # Check that user profile avatar appears in navbar
        user_btn = page.locator(".ig-user-profile-btn")
        assert user_btn.count() > 0, "User profile button should appear in navbar"
        print("[+] User profile button appeared in navbar!")

        # Check user menu dropdown
        user_btn.click()
        page.wait_for_timeout(500)
        menu_dropdown = page.locator(".ig-user-menu-dropdown")
        assert menu_dropdown.count() > 0, "User menu dropdown should be open"
        print("[+] User dropdown menu verified!")

        # Screenshot 2: User A Logged in with Profile Menu
        p2 = os.path.join(artifact_dir, "test_business_user_a_profile.png")
        page.screenshot(path=p2)
        print(f"[+] Saved screenshot 2: {sanitize(p2)}")

        # Close menu
        user_btn.click()
        page.wait_for_timeout(300)

        # 3. Perform a Search for 'vivian.myy'
        print("[*] 3. Testing personal search record saving...")
        search_input = page.locator(".home-search-input")
        search_input.fill("vivian.myy")
        page.locator(".home-search-btn").first.click()
        page.wait_for_timeout(1000)

        # Go back to home
        page.locator(".ig-nav-left").click()
        page.wait_for_timeout(800)

        # Focus search bar to view recent searches dropdown
        search_input = page.locator(".home-search-input")
        search_input.focus()
        page.wait_for_timeout(500)

        recent_dropdown = page.locator(".recent-searches-dropdown")
        assert recent_dropdown.count() > 0, "Recent searches dropdown should appear on focus"
        assert "vivian.myy" in recent_dropdown.inner_text(), "Search for vivian.myy should be in recent history"
        print("[+] Personal search history dropdown contains 'vivian.myy'!")

        # Screenshot 3: User A's Personal Search History Dropdown
        p3 = os.path.join(artifact_dir, "test_business_search_history.png")
        page.screenshot(path=p3)
        print(f"[+] Saved screenshot 3: {sanitize(p3)}")

        # 4. Multi-Tenant Isolation Test with User B (Bob)
        print("[*] 4. Testing Multi-Tenant Isolation with User B (bob@business.com)...")
        context_b = browser.new_context(viewport={"width": 1280, "height": 900})
        page_b = context_b.new_page()
        page_b.goto("http://127.0.0.1:8000/", wait_until="networkidle")

        # Simulate login as bob@business.com via API
        login_res = page_b.evaluate("""async () => {
            const res = await fetch('/api/auth/dev_login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ email: 'bob@business.com', name: 'Bob Client' })
            });
            const data = await res.json();
            localStorage.setItem('ig_user_token', data.token);
            localStorage.setItem('ig_user_profile', JSON.stringify(data.user));
            return data;
        }""")
        print(f"[+] Logged in as User B: {login_res.get('user', {}).get('name')}")
        page_b.reload(wait_until="networkidle")
        page_b.wait_for_timeout(1000)

        # Focus search bar in User B's session
        search_input_b = page_b.locator(".home-search-input")
        search_input_b.focus()
        page_b.wait_for_timeout(500)

        # User B's search history should NOT contain User A's search 'vivian.myy'
        b_dropdown = page_b.locator(".recent-searches-dropdown")
        if b_dropdown.count() > 0:
            assert "vivian.myy" not in b_dropdown.inner_text(), "CRITICAL: User B must not see User A's search records!"
        print("[+] PASSED: User B has 0 of User A's search records (100% isolated)!")

        # Screenshot 4: User B's isolated clean state
        p4 = os.path.join(artifact_dir, "test_business_user_b_isolation.png")
        page_b.screenshot(path=p4)
        print(f"[+] Saved screenshot 4: {sanitize(p4)}")

        context.close()
        context_b.close()
        browser.close()

    print("[*] ALL MULTI-TENANT BUSINESS AUTH TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
