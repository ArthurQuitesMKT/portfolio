import asyncio
import os
from playwright.async_api import async_playwright

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CURRICULO_URL = f"file:///{ROOT_DIR.replace(os.sep, '/')}/curriculo.html"
OUTPUT_DESKTOP = os.path.expanduser(r"~\Desktop\Curriculo_Arthur_Quites.pdf")
OUTPUT_REPO = os.path.join(ROOT_DIR, "Curriculo_Arthur_Quites.pdf")

async def generate_pdf():
    print(f"Gerando PDF do Currículo a partir de: {CURRICULO_URL}")
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        page = await browser.new_page()
        
        await page.goto(CURRICULO_URL, wait_until="networkidle")
        # Aguarda ícones Lucide e renderização
        await page.wait_for_timeout(1000)
        
        # Emula mídia print para aplicar as regras executivas de impressão
        await page.emulate_media(media="print")
        
        # Gera o PDF em formato A4 de alta resolução
        pdf_bytes = await page.pdf(
            format="A4",
            print_background=True,
            margin={
                "top": "12mm",
                "bottom": "12mm",
                "left": "12mm",
                "right": "12mm"
            },
            prefer_css_page_size=False
        )
        
        # Salva na Área de Trabalho e no Repositório
        with open(OUTPUT_DESKTOP, "wb") as f:
            f.write(pdf_bytes)
            
        with open(OUTPUT_REPO, "wb") as f:
            f.write(pdf_bytes)
            
        print(f"✔ PDF gerado com sucesso na Área de Trabalho: {OUTPUT_DESKTOP} ({len(pdf_bytes)} bytes)")
        print(f"✔ PDF gerado com sucesso no Repositório: {OUTPUT_REPO}")
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(generate_pdf())
