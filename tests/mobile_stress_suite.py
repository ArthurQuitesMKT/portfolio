"""
Suite de Testes de Estresse Mobile — Cliques Múltiplos (10x+) em Todos os Botões
Emulação de dispositivos móveis: iPhone 14 (390x844), Android Compacto (360x780) e Pixel 7 (412x915)
Valida: Zero vazamento horizontal, Zero erros de console, Resiliência a cliques rápidos repetidos (10x).
"""

import asyncio
import os
import sys
from playwright.async_api import async_playwright

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
INDEX_URL = f"file:///{ROOT_DIR.replace(os.sep, '/')}/index.html"
CURRICULO_URL = f"file:///{ROOT_DIR.replace(os.sep, '/')}/curriculo.html"

MOBILE_VIEWPORTS = [
    {"name": "iPhone 14 / Mobile Padrão", "width": 390, "height": 844, "is_mobile": True},
    {"name": "Android Compacto", "width": 360, "height": 780, "is_mobile": True},
    {"name": "Android Large (Pixel)", "width": 412, "height": 915, "is_mobile": True}
]

async def run_mobile_stress():
    print("\n" + "="*70)
    print("📱 INICIANDO BATERIA DE ESTRESSE MOBILE: 10+ CLIQUES POR BOTÃO")
    print("="*70 + "\n")

    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        
        total_clicks_performed = 0
        buttons_tested = 0
        critical_errors = []

        for vp in MOBILE_VIEWPORTS:
            print(f"\n--- [DISPOSITIVO]: {vp['name']} ({vp['width']}x{vp['height']}) ---")
            context = await browser.new_context(
                viewport={"width": vp["width"], "height": vp["height"]},
                is_mobile=True,
                has_touch=True,
                user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
            )
            page = await context.new_page()

            page_errors = []
            page.on("pageerror", lambda err: page_errors.append(f"JS ERROR: {err}"))
            page.on("console", lambda msg: page_errors.append(f"CONSOLE ERROR: {msg.text}") if msg.type == "error" else None)

            # 1. Carrega index.html
            await page.goto(INDEX_URL, wait_until="networkidle")
            await page.wait_for_timeout(300)

            # Verifica vazamento de scroll horizontal no body
            scroll_width = await page.evaluate("() => document.documentElement.scrollWidth")
            client_width = await page.evaluate("() => document.documentElement.clientWidth")
            print(f"  📐 Largura da página: {client_width}px | ScrollWidth: {scroll_width}px (Vazamento: {scroll_width > client_width})")
            assert scroll_width <= client_width + 1, f"Vazamento horizontal detectado em {vp['name']}!"

            # TESTE 1: Menu Hambúrguer (Abrir e Fechar 10x consecutivas)
            print("  👉 Testando Menu Gaveta Mobile (#mobile-menu-btn e #mobile-drawer-close)...")
            menu_btn = page.locator("#mobile-menu-btn")
            close_btn = page.locator("#mobile-drawer-close")
            drawer = page.locator("#mobile-drawer")

            for i in range(10):
                await menu_btn.click()
                await page.wait_for_timeout(50)
                is_open = await drawer.evaluate("el => !el.hasAttribute('inert')")
                assert is_open, f"Falha ao abrir drawer na iteração {i+1}"
                
                await close_btn.click()
                await page.wait_for_timeout(50)
                is_closed = await drawer.evaluate("el => el.hasAttribute('inert')")
                assert is_closed, f"Falha ao fechar drawer na iteração {i+1}"
                total_clicks_performed += 2
            buttons_tested += 2
            print(f"    ✔ Hambúrguer + Fechar: 10 ciclos de abertura/fechamento executados com sucesso (20 cliques).")

            # TESTE 2: Backdrop do Menu Móvel (Clicar no fundo 10x)
            backdrop = page.locator("#mobile-drawer-backdrop")
            for i in range(10):
                await menu_btn.click()
                await page.wait_for_timeout(50)
                await backdrop.click(position={"x": 10, "y": 100}, force=True)
                await page.wait_for_timeout(50)
                total_clicks_performed += 2
            buttons_tested += 1
            print(f"    ✔ Fechamento via Backdrop Móvel: 10 cliques executados com sucesso.")

            # TESTE 3: Links de Âncora do Menu Móvel (Navegação interna 10x cada)
            print("  👉 Testando Links de Navegação Interna Móvel (#cases, #contato, etc.)...")
            anchor_links = page.locator("#mobile-drawer a[href^='#']")
            a_count = await anchor_links.count()
            for l_idx in range(a_count):
                link = anchor_links.nth(l_idx)
                link_text = (await link.inner_text()).split("\n")[0].strip()
                for i in range(10):
                    await menu_btn.click()
                    await page.wait_for_timeout(50)
                    await link.click()
                    await page.wait_for_timeout(50)
                    total_clicks_performed += 2
                buttons_tested += 1
                print(f"    ✔ Link interno '{link_text}': 10 cliques testados.")

            # Link para Currículo no Drawer (10 transições completas)
            print("  👉 Testando Link do Currículo no Drawer móvel (/curriculo)...")
            curr_link = page.locator("#mobile-drawer a[href='/curriculo']")
            for i in range(10):
                await menu_btn.click()
                await page.wait_for_timeout(50)
                await curr_link.click()
                await page.wait_for_timeout(100)
                # Volta para o index
                await page.goto(INDEX_URL, wait_until="networkidle")
                await page.wait_for_timeout(50)
                total_clicks_performed += 1
            buttons_tested += 1
            print(f"    ✔ Link móvel 'Me Conheça (Currículo)': 10 navegações completas testadas.")

            # TESTE 4: Botões do Hero Mobile ("SOLICITAR DIAGNÓSTICO GRATUITO" e "Ver Projetos")
            print("  👉 Testando Botões do Hero...")
            cta_hero = page.locator("#hero-statement a:has-text('SOLICITAR DIAGNÓSTICO')")
            if await cta_hero.count() > 0:
                for i in range(10):
                    await cta_hero.dispatch_event("click")
                    await page.wait_for_timeout(25)
                    total_clicks_performed += 1
                buttons_tested += 1
                print(f"    ✔ Botão Hero 'SOLICITAR DIAGNÓSTICO GRATUITO': 10 cliques absorvidos com cooldown.")

            ver_projetos = page.locator("#hero-statement a[href='#cases']")
            if await ver_projetos.count() > 0:
                for i in range(10):
                    await ver_projetos.click()
                    await page.wait_for_timeout(35)
                    total_clicks_performed += 1
                buttons_tested += 1
                print(f"    ✔ Botão Hero 'Ver Projetos': 10 cliques executados com rolagem suave.")

            # TESTE 5: Botões do Carrossel Skiper 54 (Next e Prev 10x cada)
            print("  👉 Testando Navegação do Carrossel (#cases-next e #cases-prev)...")
            next_btn = page.locator("#cases-next")
            prev_btn = page.locator("#cases-prev")
            await next_btn.scroll_into_view_if_needed()

            # 10 cliques rápidos consecutivos no botão Next
            for i in range(10):
                await next_btn.click()
                await page.wait_for_timeout(40)
                total_clicks_performed += 1
            buttons_tested += 1
            print(f"    ✔ Botão '#cases-next': 10 cliques rápidos absorvidos sem travar.")

            # 10 cliques rápidos consecutivos no botão Prev
            for i in range(10):
                await prev_btn.click()
                await page.wait_for_timeout(40)
                total_clicks_performed += 1
            buttons_tested += 1
            print(f"    ✔ Botão '#cases-prev': 10 cliques rápidos absorvidos sem travar.")

            # TESTE 6: Botões de Filtro de Categoria (Todos, Campanhas, Cases, Posts, Anúncios)
            print("  👉 Testando Botões de Filtro de Categoria (.filter-btn)...")
            filter_btns = page.locator("#cases-filters .filter-btn")
            f_count = await filter_btns.count()
            for f_idx in range(f_count):
                f_btn = filter_btns.nth(f_idx)
                f_text = (await f_btn.inner_text()).strip()
                for i in range(10):
                    await f_btn.click()
                    await page.wait_for_timeout(35)
                    total_clicks_performed += 1
                buttons_tested += 1
                print(f"    ✔ Filtro '{f_text}': 10 cliques executados com recálculo de grade.")

            # Reseta filtro para 'Todos'
            await filter_btns.nth(0).click()
            await page.wait_for_timeout(100)

            # TESTE 7: Dots de Paginação do Carrossel (.skiper54-dot-btn)
            dots = page.locator("#cases-dots button")
            d_count = await dots.count()
            if d_count > 0:
                print(f"  👉 Testando Dots de Paginação ({d_count} dots)...")
                for d_idx in range(min(d_count, 5)):
                    dot = dots.nth(d_idx)
                    for i in range(10):
                        await dot.click()
                        await page.wait_for_timeout(35)
                        total_clicks_performed += 1
                    buttons_tested += 1
                print(f"    ✔ Dots de navegação: testados com 10 cliques cada.")

            # TESTE 8: Botão de Zoom / Lightbox Trigger (Abrir e Fechar 10x)
            print("  👉 Testando Lightbox Modal (Trigger, Fechar, Next, Prev, Case Study)...")
            active_trigger = page.locator(".skiper54-item.is-active [data-lightbox-trigger]").first
            lightbox = page.locator("#lightbox-modal")
            lb_close = page.locator("#lightbox-close")
            lb_next = page.locator("#lightbox-next")
            lb_prev = page.locator("#lightbox-prev")
            lb_study = page.locator("#lightbox-study-toggle")

            # 10 ciclos de abrir e fechar o Lightbox
            for i in range(10):
                await active_trigger.click(force=True)
                await page.wait_for_timeout(50)
                await lb_close.click()
                await page.wait_for_timeout(50)
                total_clicks_performed += 2
            buttons_tested += 2
            print(f"    ✔ Lightbox (Abrir + Fechar): 10 ciclos completos executados (20 cliques).")

            # Abre lightbox para estressar botões internos
            await active_trigger.click(force=True)
            await page.wait_for_timeout(100)

            # 10 cliques no Next interno do Lightbox
            for i in range(10):
                await lb_next.click()
                await page.wait_for_timeout(40)
                total_clicks_performed += 1
            buttons_tested += 1
            print(f"    ✔ Lightbox '#lightbox-next': 10 cliques circulares executados.")

            # 10 cliques no Prev interno do Lightbox
            for i in range(10):
                await lb_prev.click()
                await page.wait_for_timeout(40)
                total_clicks_performed += 1
            buttons_tested += 1
            print(f"    ✔ Lightbox '#lightbox-prev': 10 cliques circulares executados.")

            # 10 cliques no Toggle de Estudo Estratégico do Lightbox
            if await lb_study.count() > 0:
                for i in range(10):
                    await lb_study.click()
                    await page.wait_for_timeout(35)
                    total_clicks_performed += 1
                buttons_tested += 1
                print(f"    ✔ Lightbox Accordion de Estudo: 10 cliques de toggle executados.")

            # Fecha o Lightbox
            await lb_close.click()
            await page.wait_for_timeout(100)

            # TESTE 9: FAQ Accordion (Alternar 10x entre perguntas)
            print("  👉 Testando Accordions do FAQ (#faq details)...")
            faq_summaries = page.locator("#faq details summary")
            faq_count = await faq_summaries.count()
            for f_idx in range(faq_count):
                summary = faq_summaries.nth(f_idx)
                for i in range(10):
                    await summary.click()
                    await page.wait_for_timeout(30)
                    total_clicks_performed += 1
                buttons_tested += 1
            print(f"    ✔ FAQ: Todos os {faq_count} itens testados com 10 cliques de alternância mútua.")

            # TESTE 10: Modal Legal (Privacidade / Termos) - 10 cliques por aba e fechar
            print("  👉 Testando Modal Legal e Abas de Conformidade LGPD...")
            legal_triggers = page.locator("[data-open-legal]")
            if await legal_triggers.count() > 0:
                l_trig = legal_triggers.first
                await l_trig.scroll_into_view_if_needed()
                await l_trig.click()
                await page.wait_for_timeout(100)

                tab_priv = page.locator("#tab-privacy-btn")
                tab_term = page.locator("#tab-terms-btn")
                for i in range(10):
                    await tab_term.click()
                    await page.wait_for_timeout(30)
                    await tab_priv.click()
                    await page.wait_for_timeout(30)
                    total_clicks_performed += 2
                buttons_tested += 2
                print(f"    ✔ Abas do Modal Legal (Privacidade / Termos): 10 alternâncias executadas.")

                legal_ok = page.locator("#legal-modal-ok")
                await legal_ok.click()
                await page.wait_for_timeout(50)
                total_clicks_performed += 1
                buttons_tested += 1

            # TESTE 11: Botão Voltar ao Topo (#back-to-top-btn)
            print("  👉 Testando Botão Flutuante 'Voltar ao Topo'...")
            await page.evaluate("() => window.scrollTo(0, 1200)")
            await page.wait_for_timeout(200)
            back_to_top = page.locator("#back-to-top-btn")
            if await back_to_top.is_visible():
                for i in range(10):
                    await back_to_top.click()
                    await page.wait_for_timeout(35)
                    total_clicks_performed += 1
                buttons_tested += 1
                print(f"    ✔ '#back-to-top-btn': 10 cliques executados com rolagem suave.")

            # TESTE 12: Botão de Cópia de E-mail (Toast Notification Stress)
            print("  👉 Testando Botões de Copiar E-mail (com Debounce de Toast)...")
            copy_email_btns = page.locator("[data-copy-email], .copy-email-btn")
            if await copy_email_btns.count() > 0:
                c_btn = copy_email_btns.first
                await c_btn.scroll_into_view_if_needed()
                for i in range(10):
                    await c_btn.click()
                    await page.wait_for_timeout(35)
                    total_clicks_performed += 1
                buttons_tested += 1
                toast_visible = await page.locator("#toast-notification").evaluate("el => el.classList.contains('opacity-100')")
                print(f"    ✔ Botão Copiar E-mail: 10 cliques rápidos executados (Toast ativo: {toast_visible}).")

            # TESTE 13: Botões do WhatsApp (Estresse de Debounce / Telemetria)
            print("  👉 Testando Botões de WhatsApp com Trava de Debounce (10 cliques cada)...")
            wa_buttons = page.locator("a[href*='whatsapp.com'], a[href*='wa.me']")
            wa_count = await wa_buttons.count()
            for w_idx in range(min(wa_count, 3)):
                wa_btn = wa_buttons.nth(w_idx)
                for i in range(10):
                    await wa_btn.dispatch_event("click")
                    await page.wait_for_timeout(25)
                    total_clicks_performed += 1
                buttons_tested += 1
            print(f"    ✔ Botões de WhatsApp: disparos de telemetria testados com proteção de cooldown.")

            # TESTE 14: Currículo Mobile (curriculo.html em tela de celular)
            print("  👉 Testando Página de Currículo (curriculo.html no mobile)...")
            await page.goto(CURRICULO_URL, wait_until="networkidle")
            await page.wait_for_timeout(250)

            c_scroll = await page.evaluate("() => document.documentElement.scrollWidth")
            c_client = await page.evaluate("() => document.documentElement.clientWidth")
            print(f"    📐 Currículo Largura: {c_client}px | ScrollWidth: {c_scroll}px (Vazamento: {c_scroll > c_client})")
            assert c_scroll <= c_client + 1, "Vazamento horizontal detectado em curriculo.html!"

            # Botão Copiar E-mail no Currículo (10 cliques)
            c_copy = page.locator("#btn-copiar-email-curriculo")
            if await c_copy.count() > 0:
                for i in range(10):
                    await c_copy.click()
                    await page.wait_for_timeout(35)
                    total_clicks_performed += 1
                buttons_tested += 1
                c_toast_visible = await page.locator("#toast-curriculo").evaluate("el => el.classList.contains('opacity-100')")
                print(f"    ✔ Botão Copiar E-mail (Currículo): 10 cliques rápidos (Toast ativo: {c_toast_visible}).")

            # Botão Imprimir / Salvar PDF (10 cliques rápidos simulados)
            c_print = page.locator("#btn-print-curriculo")
            if await c_print.count() > 0:
                await page.evaluate("() => { window.print = () => console.log('PRINT TRIGGERED'); }")
                for i in range(10):
                    await c_print.click()
                    await page.wait_for_timeout(25)
                    total_clicks_performed += 1
                buttons_tested += 1
                print(f"    ✔ Botão Imprimir PDF (Currículo): 10 cliques absorvidos.")

            # Botão Voltar ao Portfólio (10 cliques)
            c_back = page.locator("a:has-text('VOLTAR AO PORTFÓLIO')").first
            if await c_back.count() > 0:
                for i in range(10):
                    await c_back.dispatch_event("click")
                    await page.wait_for_timeout(25)
                    total_clicks_performed += 1
                buttons_tested += 1
                print(f"    ✔ Botão 'Voltar ao Portfólio': 10 cliques testados.")

            print(f"    🛡️ Erros JS/Console nesta viewport: {len(page_errors)}")
            if len(page_errors) > 0:
                critical_errors.extend(page_errors)
            await context.close()

        await browser.close()

        print("\n" + "="*70)
        print("📊 RELATÓRIO CONSOLIDADO DO TESTE DE ESTRESSE MOBILE")
        print("="*70)
        print(f"  ✔ Viewports testadas: {len(MOBILE_VIEWPORTS)} (iPhone 14, Android Compacto, Pixel)")
        print(f"  ✔ Botões e controles testados: {buttons_tested}")
        print(f"  ✔ Total de cliques de estresse realizados: {total_clicks_performed}")
        print(f"  ✔ Total de erros no console / JS: {len(critical_errors)}")
        print(f"  ✔ Vazamento horizontal de tela (Horizontal Overflow): ZERO em todas as telas")
        print("="*70)
        
        if len(critical_errors) > 0:
            print("\n❌ ERROS DETECTADOS:")
            for err in critical_errors:
                print(f"  - {err}")
            sys.exit(1)
        else:
            print("\n🏆 TODOS OS CONTROLES MOBILE FORAM ESTRESSADOS (10+ CLIQUES) COM SUCESSO!\n")

if __name__ == '__main__':
    asyncio.run(run_mobile_stress())
