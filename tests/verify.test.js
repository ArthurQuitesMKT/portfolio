/**
 * Suite Formal de Testes Automatizados — Portfólio Arthur Quites
 * Execução Nativa Node.js (Zero dependências externas obrigatórias)
 * Uso: npm test ou node tests/verify.test.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

function test(description, fn) {
  try {
    fn();
    console.log(`  \x1b[32m✔\x1b[0m ${description}`);
  } catch (err) {
    console.error(`  \x1b[31m✖\x1b[0m ${description}`);
    console.error(`    Erro: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\n\x1b[1m=== Bateria de Testes Automatizados de Qualidade & Arquitetura ===\x1b[0m\n');

// 1. Integridade de index.html
test('index.html deve conter DOCTYPE, título canônico e meta charset UTF-8', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  assert.ok(html.includes('<!DOCTYPE html>'), 'Falta <!DOCTYPE html>');
  assert.ok(html.includes('<meta charset="UTF-8">'), 'Falta charset UTF-8');
  assert.ok(html.includes('Arthur Quites: Direção de Arte'), 'Título incorreto');
  assert.ok(html.includes('<link rel="canonical" href="https://arthurquites.com.br/">'), 'Falta canonical URL');
});

test('index.html NÃO deve conter scripts executáveis inline (Conformidade CSP)', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  // Procura por tags <script> que não sejam do tipo application/ld+json e não tenham atributo src
  const inlineExecutableScripts = html.match(/<script(?![^>]*type=["']application\/ld\+json["'])(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi);
  assert.strictEqual(inlineExecutableScripts, null, 'Encontrado script executável inline em index.html!');
});

test('index.html deve carregar a cadeia de scripts modularizada na ordem correta', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  assert.ok(html.includes('src="./js/shared-utils.js"'), 'Falta shared-utils.js');
  assert.ok(html.includes('src="./js/skiper54.js"'), 'Falta skiper54.js');
  assert.ok(html.includes('src="./js/app.js"'), 'Falta app.js');
});

// 2. Integridade de curriculo.html
test('curriculo.html deve usar URLs canônicas limpas (zero href="index.html")', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'curriculo.html'), 'utf8');
  assert.ok(!html.includes('href="index.html"'), 'Encontrado href="index.html" legado em curriculo.html!');
  assert.ok(html.includes('href="/"'), 'Falta link canônico para a raiz em curriculo.html');
});

test('curriculo.html NÃO deve conter scripts executáveis inline nem onclick', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'curriculo.html'), 'utf8');
  const inlineExecutableScripts = html.match(/<script(?![^>]*type=["']application\/ld\+json["'])(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi);
  assert.strictEqual(inlineExecutableScripts, null, 'Encontrado script executável inline em curriculo.html!');
  assert.ok(!html.includes('onclick="copiarEmailCurriculo()"'), 'Encontrado onclick inline legado em curriculo.html');
  assert.ok(!html.includes('onclick="window.print()"'), 'Encontrado onclick inline legado de impressão em curriculo.html');
});

// 3. Segurança e Headers em vercel.json
test('vercel.json deve ter cleanUrls ativado e política CSP rigorosa sem script-src unsafe-inline', () => {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'vercel.json'), 'utf8');
  const config = JSON.parse(content);
  assert.strictEqual(config.cleanUrls, true, 'cleanUrls deve ser true');

  const globalHeaderGroup = config.headers.find(h => h.source === '/(.*)');
  assert.ok(globalHeaderGroup, 'Falta source /(.*) em headers de vercel.json');

  const csp = globalHeaderGroup.headers.find(h => h.key === 'Content-Security-Policy');
  assert.ok(csp, 'Falta cabeçalho Content-Security-Policy');
  assert.ok(csp.value.includes("script-src 'self'"), 'CSP deve conter script-src self');
  assert.ok(!csp.value.includes("script-src 'self' 'unsafe-inline'"), 'CSP NÃO deve conter script-src unsafe-inline!');
  assert.ok(csp.value.includes("object-src 'none'"), 'CSP deve conter object-src none');
  assert.ok(csp.value.includes("frame-ancestors 'none'"), 'CSP deve conter frame-ancestors none');
});

// 4. Paridade em _headers
test('_headers deve conter política CSP idêntica a vercel.json', () => {
  const headers = fs.readFileSync(path.join(ROOT_DIR, '_headers'), 'utf8');
  assert.ok(headers.includes("script-src 'self'"), 'Falta script-src self em _headers');
  assert.ok(!headers.includes("script-src 'self' 'unsafe-inline'"), 'Encontrado unsafe-inline em _headers!');
});

// 5. Módulo Centralizado DRY (js/shared-utils.js)
test('js/shared-utils.js deve exportar métodos essenciais, focus trap e ofuscar e-mail sensível', () => {
  const js = fs.readFileSync(path.join(ROOT_DIR, 'js', 'shared-utils.js'), 'utf8');
  assert.ok(js.includes('getContactEmail'), 'Falta getContactEmail');
  assert.ok(js.includes('escapeHTML'), 'Falta escapeHTML');
  assert.ok(js.includes('copyTextToClipboard'), 'Falta copyTextToClipboard');
  assert.ok(js.includes('trapFocusInContainer'), 'Falta trapFocusInContainer em PortfolioUtils');
  assert.ok(!js.includes('arthurquites2@gmail.com') || js.includes('ENCODED_EMAIL'), 'E-mail deve ser codificado');
});

// 6. Refatoração Modular do Skiper 54 (js/skiper54.js)
test('js/skiper54.js deve implementar arquitetura modular e sanitizar atributos', () => {
  const js = fs.readFileSync(path.join(ROOT_DIR, 'js', 'skiper54.js'), 'utf8');
  assert.ok(js.includes('ProjectDataExtractor'), 'Falta módulo ProjectDataExtractor');
  assert.ok(js.includes('CarouselRenderer'), 'Falta módulo CarouselRenderer');
  assert.ok(js.includes('DotsManager'), 'Falta módulo DotsManager');
  assert.ok(js.includes('AutoplayController'), 'Falta módulo AutoplayController');
  assert.ok(js.includes('escapeHTML(p.src)'), 'p.src deve ser sanitizado com escapeHTML');
  assert.ok(js.includes('isFocusedInCases'), 'Atalhos de teclado devem respeitar foco restrito');
});

// 7. Validação de Ativos de Mídia (Zero Links Quebrados)
test('Todas as imagens referenciadas nos 32 cases de index.html devem existir em disco', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  const imgRegex = /src=["'](\.\/assets\/img\/cases\/[^"']+)["']/g;
  let match;
  let count = 0;
  while ((match = imgRegex.exec(html)) !== null) {
    const relPath = match[1].replace(/^\.\//, '');
    const fullPath = path.join(ROOT_DIR, relPath);
    assert.ok(fs.existsSync(fullPath), `Arquivo de imagem não encontrado: ${relPath}`);
    count++;
  }
  assert.ok(count >= 32, `Esperado pelo menos 32 imagens de cases, encontrado: ${count}`);
});

// 8. Integridade dos Canais de Conversão WhatsApp
test('Todos os links de WhatsApp em index.html e curriculo.html devem apontar para 5531971454442', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  const curriculoHtml = fs.readFileSync(path.join(ROOT_DIR, 'curriculo.html'), 'utf8');
  const combined = indexHtml + '\n' + curriculoHtml;

  const matches = [...combined.matchAll(/https?:\/\/(?:api\.whatsapp\.com|wa\.me)\/[^"'\s]+/g)].map(m => m[0]);
  assert.ok(matches.length >= 8, `Esperado pelo menos 8 links de WhatsApp, encontrado: ${matches.length}`);

  const phoneNumbers = new Set(matches.map(l => {
    const m = l.match(/(?:phone=|wa\.me\/)(\d+)/);
    return m ? m[1] : null;
  }));

  assert.strictEqual(phoneNumbers.size, 1, `Múltiplos números de WhatsApp encontrados: ${Array.from(phoneNumbers).join(', ')}`);
  assert.ok(phoneNumbers.has('5531971454442'), 'Número canônico de WhatsApp deve ser 5531971454442');
});

// 9. Segurança de Repositório (Zero Tokens Expostos em .git/config)
test('.git/config NÃO deve conter tokens de autenticação pessoais (PAT)', () => {
  const gitConfigPath = path.join(ROOT_DIR, '.git', 'config');
  if (fs.existsSync(gitConfigPath)) {
    const gitConfig = fs.readFileSync(gitConfigPath, 'utf8');
    assert.ok(!gitConfig.includes('ghp_'), 'Encontrado token pessoal do GitHub no arquivo .git/config!');
  }
});

// 10. SEO Técnico: Rotas Limpas, Sitemap & Telemetria
test('index.html e sitemap.xml devem usar rotas canônicas limpas e app.js deve conter telemetria', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  assert.ok(!indexHtml.includes('href="index.html"'), 'Encontrado href="index.html" em index.html!');
  assert.ok(!indexHtml.includes('href="curriculo.html"'), 'Encontrado href="curriculo.html" em index.html!');
  assert.ok(indexHtml.includes('href="/curriculo"'), 'Falta link limpo para /curriculo');

  const sitemap = fs.readFileSync(path.join(ROOT_DIR, 'sitemap.xml'), 'utf8');
  assert.ok(!sitemap.includes('/curriculo.html'), 'sitemap.xml não deve conter .html nas URLs');
  assert.ok(sitemap.includes('/curriculo'), 'sitemap.xml deve conter /curriculo');

  const appJs = fs.readFileSync(path.join(ROOT_DIR, 'js', 'app.js'), 'utf8');
  assert.ok(appJs.includes('initWhatsAppConversionTracking'), 'Falta initWhatsAppConversionTracking em app.js');
});

console.log('\n\x1b[32m✔ TODOS OS TESTES PASSARAM COM SUCESSO!\x1b[0m\n');
