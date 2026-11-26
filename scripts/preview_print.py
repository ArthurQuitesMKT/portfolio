import asyncio
import os
from playwright.async_api import async_playwright

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CURRICULO_URL = f"file:///{ROOT_DIR.replace(os.sep, '/')}/curriculo.html"
SCREENSHOT_PATH = os.path.join(ROOT_DIR, "preview_print.png")

async def preview():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        page = await browser.new_page(viewport={"width": 1024, "height": 1400})
        await page.goto(CURRICULO_URL, wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.emulate_media(media="print")
        await page.screenshot(path=SCREENSHOT_PATH, full_page=True)
        print(f"Screenshot salvo em {SCREENSHOT_PATH}")
        await browser.close()

if __name__ == '__main__':
    asyncio.run(preview())
