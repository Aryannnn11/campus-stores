"""Browser smoke test for the offline Campus Stores product exercise.
Run: python tests/smoke_test.py
Requires: playwright Python package + Chromium.
"""
from pathlib import Path
import os
import shutil
from playwright.sync_api import sync_playwright

root_dir = Path(__file__).resolve().parents[1]
markup = (root_dir / 'index.html').read_text().replace('<link rel="stylesheet" href="./styles.css" />','').replace('<script defer src="./app.js"></script>','')
styles = (root_dir / 'styles.css').read_text()
app_js = (root_dir / 'app.js').read_text()
with sync_playwright() as p:
    browser_path = os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('google-chrome')
    launch_options = {'headless': True, 'args': ['--no-sandbox', '--no-proxy-server']}
    if browser_path:
        launch_options['executable_path'] = browser_path
    browser = p.chromium.launch(**launch_options)
    page = browser.new_page(viewport={'width': 1100, 'height': 850})
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.set_content(markup)
    page.evaluate("""() => { const mem = new Map(); Object.defineProperty(window, 'localStorage', { configurable:true, value:{ getItem:(k)=>mem.has(k)?mem.get(k):null, setItem:(k,v)=>mem.set(k,String(v)), removeItem:(k)=>mem.delete(k) } }); }""")
    page.add_style_tag(content=styles)
    page.add_script_tag(content=app_js)
    assert page.get_by_role('heading',name='Shift workspace').count() == 1
    assert '0/3' in page.locator('.stats').inner_text()

    def issue(button_index, unit):
        page.get_by_role('button', name='Issue unit').nth(button_index).click()
        page.locator('select[name="asset"]').select_option(unit)
        page.get_by_role('button',name='Save issue slip').click()
        assert unit in page.locator('.page').inner_text()

    issue(0,'PR-04')
    issue(0,'SP-02')
    issue(0,'AD-12')
    assert '3/3' in page.locator('.stats').inner_text()
    page.get_by_role('button',name='Move to return time').click()

    for unit in ['PR-04','SP-02']:
        row = page.locator('.equipment-row').filter(has_text=unit)
        row.get_by_role('button',name='Receive').click()
        page.locator('input[name="tag"]').fill(unit)
        page.get_by_role('button',name='Confirm this unit received').click()
        assert 'Slip' in page.locator('[data-status]').inner_text()

    row = page.locator('.equipment-row').filter(has_text='AD-12')
    row.get_by_role('button',name='Add handover').click()
    page.locator('input[name="holder"]').fill('Leela Das')
    page.locator('input[name="expected"]').fill('Sat 9 am')
    page.locator('textarea[name="detail"]').fill('Adapter left with Leela; please verify tag.')
    page.get_by_role('button',name='Save item handover').click()
    assert 'Handover saved' in page.locator('.equipment-row').filter(has_text='AD-12').inner_text()
    page.screenshot(path=str(root_dir / 'docs' / 'partial-return.png'),full_page=True)

    page.get_by_role('button',name='Move to next morning').click()
    assert 'AD-12 with Leela Das' in page.locator('.priority').inner_text()
    page.screenshot(path=str(root_dir / 'docs' / 'morning-priority.png'),full_page=True)
    page.get_by_role('button',name='Receive AD-12').click()
    page.locator('input[name="tag"]').fill('AD-15')
    page.get_by_role('button',name='Confirm this unit received').click()
    assert 'NOT closed' in page.locator('[role="alert"]').last.inner_text()
    assert 'Received' not in page.locator('.equipment-row').filter(has_text='AD-12').inner_text()

    page.locator('input[name="tag"]').fill('AD-12')
    page.get_by_role('button',name='Confirm this unit received').click()
    assert '3/3' in page.locator('.stats').inner_text()
    assert 'No outstanding Film Society units.' in page.locator('.page').inner_text()
    page.set_content(markup)
    page.add_style_tag(content=styles)
    page.add_script_tag(content=app_js)
    assert '3/3' in page.locator('.stats').inner_text()
    page.get_by_role('button',name='Desk book').click()
    assert 'AD-12 (L-' in page.locator('.page').inner_text()

    page.set_viewport_size({'width':375,'height':812})
    assert page.locator('nav').is_visible()
    page.screenshot(path=str(root_dir / 'docs' / 'mobile-desk-book.png'),full_page=True)
    assert not errors, f'Browser errors: {errors}'
    browser.close()
print('PASS: issue three units, partial return, linked handover, reject wrong tag, morning close-out, persistence, mobile render.')
