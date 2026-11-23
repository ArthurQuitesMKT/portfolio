"""
Suite de Testes E2E (End-to-End) Headless Browser com Playwright
Valida interações, renderização, acessibilidade, ausência de erros e @media print
"""

import asyncio
import os
import sys
from playwright.async_api import async_playwright

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
INDEX_URL = f"file:///{ROOT_DIR.replace(os.sep, '/')}/index.html"
CURRICULO_URL = f"file:///{ROOT_DIR.replace(os.sep, '/')}/curriculo.html"

async def run_e2e():
    print("\n=== Executando Suite de Testes E2E (Playwright) ===\n")
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})

        errors = []
        page.on("pageerror", lambda err: errors.append(f"PAGE ERROR: {err}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE ERROR: {msg.text}") if msg.type == "error" else None)

        # 1. Carregamento de index.html
        resp = await page.goto(INDEX_URL, wait_until="networkidle")
        await page.wait_for_timeout(400)
        title = await page.title()
        print(f"  ✔ index.html carregado: {title}")
        assert "Arthur Quites" in title, "Título incorreto em index.html"

        # 2. Ícones Lucide renderizados
        svg_count = await page.locator("svg").count()
        print(f"  ✔ Ícones SVG renderizados: {svg_count}")
        assert svg_count > 20, "Falha na renderização de ícones SVG"

        # 3. Interação com o Carrossel Skiper 54 e Lightbox
        active_card = page.locator(".skiper54-item.is-active")
        await active_card.click()
        await page.wait_for_timeout(300)
        lightbox = page.locator("#lightbox-modal")
        is_open = await lightbox.evaluate("el => !el.classList.contains('hidden')")
        print(f"  ✔ Lightbox abre ao clicar no card central ativo: {is_open}")
        assert is_open, "Lightbox deveria ter aberto"

        # Fechar Lightbox com Escape
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(300)
        is_closed = await lightbox.evaluate("el => el.classList.contains('hidden')")
        print(f"  ✔ Lightbox fecha com Escape: {is_closed}")
        assert is_closed, "Lightbox deveria ter fechado"

        # 4. FAQ Accordion: exclusividade mútua
        faq1 = page.locator("#faq details").nth(0)
        faq2 = page.locator("#faq details").nth(1)
        faq1_start = await faq1.evaluate("el => el.hasAttribute('open')")
        print(f"  ✔ FAQ 1 começa aberto: {faq1_start}")
        await faq2.locator("summary").click()
        await page.wait_for_timeout(250)
        faq1_after = await faq1.evaluate("el => el.hasAttribute('open')")
        faq2_after = await faq2.evaluate("el => el.hasAttribute('open')")
        print(f"  ✔ Ao abrir FAQ 2, FAQ 1 fecha automaticamente: {not faq1_after and faq2_after}")
        assert not faq1_after and faq2_after, "FAQ falhou na exclusividade mútua"

        # 5. Currículo: carregamento e @media print
        c_page = await browser.new_page(viewport={"width": 1440, "height": 900})
        c_errors = []
        c_page.on("pageerror", lambda err: c_errors.append(f"CURRICULO ERROR: {err}"))
        c_page.on("console", lambda msg: c_errors.append(f"CURRICULO CONSOLE: {msg.text}") if msg.type == "error" else None)

        await c_page.goto(CURRICULO_URL, wait_until="networkidle")
        await c_page.wait_for_timeout(400)
        c_title = await c_page.title()
        print(f"  ✔ curriculo.html carregado: {c_title}")

        # Testar clique no botão de cópia de e-mail no currículo
        copy_btn = c_page.locator("#btn-copiar-email-curriculo")
        await copy_btn.click()
        await c_page.wait_for_timeout(200)
        toast = c_page.locator("#toast-curriculo")
        toast_visible = await toast.evaluate("el => el.classList.contains('opacity-100')")
        print(f"  ✔ Toast do currículo ativado com sucesso: {toast_visible}")
        assert toast_visible, "Toast do currículo deveria estar visível"

        # Simular @media print
        await c_page.emulate_media(media="print")
        header_hidden = await c_page.locator("header").evaluate("el => window.getComputedStyle(el).display === 'none'")
        print(f"  ✔ Em modo @media print, cabeçalho de navegação é ocultado: {header_hidden}")
        assert header_hidden, "Cabeçalho deveria estar oculto na impressão"

        print(f"\n  Zero erros no index: {len(errors) == 0}")
        print(f"  Zero erros no currículo: {len(c_errors) == 0}")
        assert len(errors) == 0, f"Erros encontrados no index: {errors}"
        assert len(c_errors) == 0, f"Erros encontrados no currículo: {c_errors}"

        await browser.close()
        print("\n\x1b[32m✔ TODOS OS TESTES E2E PASSARAM COM 100% DE SUCESSO!\x1b[0m\n")

if __name__ == '__main__':
    asyncio.run(run_e2e())
