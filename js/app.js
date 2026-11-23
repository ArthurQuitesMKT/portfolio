/**
 * Portfólio Arthur Quites — Lógica de Interatividade & Performance
 * Refatorado Senior: WCAG 2.1 AA/AAA (Focus Trap, ARIA States, Reduced Motion), DRY DOM, Zero Bloat
 */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
  initMobileDrawer();
  initCasesCarousel();
  initLightbox();
  initEmailCopy();
  initSmoothScroll();
  initScrollTransitions();
  initHeroTitleParallax();
  initLegalModal();
  initCardSpotlight();
  initMetricCounters();
  initScrollSpy();
  initHeroAnimatedGradient();
});

/**
 * Utilitário Sênior de Acessibilidade: Focus Trap (Delegado a PortfolioUtils)
 */
function trapFocusInContainer(e, container) {
  if (window.PortfolioUtils && typeof window.PortfolioUtils.trapFocusInContainer === 'function') {
    window.PortfolioUtils.trapFocusInContainer(e, container);
  }
}

/* ==========================================================================
   1. Menu Hambúrguer Responsivo (Mobile Drawer com ARIA, Inert & Focus Trap)
   ========================================================================== */
function initMobileDrawer() {
  const openBtn = document.getElementById('mobile-menu-btn');
  const closeBtn = document.getElementById('mobile-drawer-close');
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  const panel = document.getElementById('mobile-drawer-panel');

  if (!openBtn || !drawer || !panel || !backdrop) return;

  function openDrawer(pushHistory = true) {
    drawer.removeAttribute('inert');
    drawer.setAttribute('aria-hidden', 'false');
    openBtn.setAttribute('aria-expanded', 'true');
    drawer.classList.remove('pointer-events-none');
    backdrop.classList.remove('opacity-0');
    backdrop.classList.add('opacity-100');
    panel.classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
    if (pushHistory && window.history && window.history.pushState) {
      window.history.pushState({ modalOpen: 'drawer' }, '');
    }
    if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
  }

  function closeDrawer(restoreFocus = true, fromPopstate = false) {
    if (drawer.hasAttribute('inert')) return;
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');
    panel.classList.add('translate-x-full');
    drawer.classList.add('pointer-events-none');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('inert', '');
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (!fromPopstate && window.history && window.history.state && window.history.state.modalOpen === 'drawer') {
      window.history.back();
    }
    if (restoreFocus) openBtn.focus();
  }

  openBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', () => closeDrawer(true));
  backdrop.addEventListener('click', () => closeDrawer(true));

  panel.addEventListener('click', (e) => {
    if (e.target.closest('.mobile-nav-link')) {
      closeDrawer(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (drawer.hasAttribute('inert')) return;
    if (e.key === 'Escape') {
      closeDrawer(true);
    } else {
      trapFocusInContainer(e, panel);
    }
  });
}

/* ==========================================================================
   2. Carrossel de Cases com Scroll Snap Nativo, Filtros Dinâmicos e Paginação
   ========================================================================== */
function initCasesCarousel() {
  if (window.Skiper54 && typeof window.Skiper54.enhanceCasesSection === 'function') {
    window.Skiper54.enhanceCasesSection();
  }
}

/* ==========================================================================
   3. Modal Lightbox com Navegação Circular (Loop Infinito) e Estudo Estratégico
   ========================================================================== */
const CATEGORY_DISPLAY_MAP = {
  campanhas: 'Campanhas',
  cases: 'Cases',
  institucionais: 'Institucional',
  anuncios: 'Anúncios'
};

const CASE_STUDIES_DATA = {
  'campanhas_21-de-stembro.webp': {
    desafio: 'Humanizar a presença digital da construtora conectando sustentabilidade cívica ao posicionamento da marca.',
    solucao: 'Direção de arte minimalista com tipografia clean, textura orgânica e paleta de tons terrosos alinhada ao Brand Book.',
    impacto: 'Taxa de engajamento 4.2x acima da média do setor com mais de 35% de novos compartilhamentos espontâneos.'
  },
  'campanhas_Aniversario_JoaoPessoa.webp': {
    desafio: 'Celebrar a expansão das obras para a capital paraibana gerando conexão institucional autêntica com o público regional.',
    solucao: 'Fotografia aérea em ângulo dourado com tratamento cinematográfico e grid tipográfico integrado.',
    impacto: 'Pico de 12.400 impressões orgânicas únicas na região metropolitana de João Pessoa.'
  },
  'campanhas_diadamulhereng.webp': {
    desafio: 'Destacar a liderança técnica feminina nos canteiros de obras fugindo de clichês visuais genéricos.',
    solucao: 'Composição fotográfica autoral valorizando EPIs homologados, postura executiva e tipografia de alto impacto.',
    impacto: 'Top 4 postagem de maior engajamento orgânico do ano no ecossistema digital da construtora.'
  },
  'cases_OBRATJAM_01.webp': {
    desafio: 'Transmitir solidez, conformidade técnica e transparência em obra judiciária de alta complexidade.',
    solucao: 'Fotografia arquitetônica de ângulo baixo valorizando as linhas estruturais e selos técnicos de engenharia.',
    impacto: 'Apresentado em relatório institucional C-Level e aprovado por comissão pública de fiscalização.'
  },
  'institucionais_basesolida.webp': {
    desafio: 'Diferenciar a empresa da concorrência ressaltando a engenharia de fundações e a confiabilidade de longo prazo.',
    solucao: 'Contraste cromático grafite/laranja industrial destacando armaduras de aço e concreto estrutural.',
    impacto: '+490% de impressões no LinkedIn entre diretores de novos negócios e gestores de licitações.'
  }
};

function initLightbox() {
  const modal = document.getElementById('lightbox-modal');
  const backdrop = document.getElementById('lightbox-backdrop');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  const counterEl = document.getElementById('lightbox-counter');
  const imgEl = document.getElementById('lightbox-img');
  const titleEl = document.getElementById('lightbox-title');
  const catEl = document.getElementById('lightbox-category');
  const descEl = document.getElementById('lightbox-desc');
  const studyContainer = document.getElementById('lightbox-case-study');
  const studyToggleBtn = document.getElementById('lightbox-study-toggle');
  const studyContent = document.getElementById('lightbox-study-content');

  if (!modal || !imgEl) return;

  let lastTriggerEl = null;
  let activeCardsList = [];
  let currentCardIndex = 0;

  function getFallbackStudy(category, title, description) {
    const catLower = (category || '').toLowerCase();
    if (catLower.includes('campanha')) {
      return {
        desafio: `Comunicar a pauta "${title}" mantendo a sobriedade corporativa da engenharia e gerando conexão humana real.`,
        solucao: 'Direção de arte editorial alinhada ao Brand Book Master, unindo hierarquia tipográfica limpa e paleta temática controlada.',
        impacto: 'Fortalecimento de marca empregadora (Employer Branding), engajamento de equipes de obra e alcance orgânico qualificado.'
      };
    }
    if (catLower.includes('case')) {
      return {
        desafio: `Apresentar a entrega técnica do projeto "${title}" como prova concreta de capacidade construtiva para licitações e clientes B2B.`,
        solucao: 'Enquadramento arquitetônico de precisão, valorização do porte da obra e diagramação técnica de alta leitura.',
        impacto: 'Ativo de autoridade comercial utilizado para comprovação de portfólio perante órgãos públicos e diretoria.'
      };
    }
    if (catLower.includes('anúncio') || catLower.includes('anuncio')) {
      return {
        desafio: `Atrair profissionais qualificados para "${title}" com comunicação clara, direta e alinhada à governança de RH.`,
        solucao: 'Layout modular de recrutamento com leitura instantânea de requisitos, local de atuação e canal oficial de envio.',
        impacto: 'Aceleração da triagem de candidatos qualificados e redução do tempo de fechamento de vagas operacionais e técnicas.'
      };
    }
    return {
      desafio: `Traduzir o tema institucional "${title}" em uma peça de autoridade visual para decisores do setor de engenharia.`,
      solucao: description || 'Aplicação dos templates canônicos da marca com foco em clareza técnica, contraste executivo e leitura mobile-first.',
      impacto: 'Consolidação da identidade corporativa e crescimento sustentado de impressões orgânicas no Instagram e LinkedIn.'
    };
  }

  function renderModalCard(index) {
    if (!activeCardsList.length) return;
    
    // Loop circular: quando chega na última imagem, volta para a primeira!
    if (index >= activeCardsList.length) {
      currentCardIndex = 0;
    } else if (index < 0) {
      currentCardIndex = activeCardsList.length - 1;
    } else {
      currentCardIndex = index;
    }

    const card = activeCardsList[currentCardIndex];
    if (!card) return;

    const btn = card.querySelector('[data-lightbox-trigger]');
    const img = card.querySelector('img');
    const imgSrc = img ? img.src : '';
    const title = (btn && btn.getAttribute('data-title')) ||
      (card.querySelector('h3') ? card.querySelector('h3').textContent.trim() : 'Visualização do Projeto');
    const rawCat = (btn && btn.getAttribute('data-cat')) ||
      (card.getAttribute('data-category')) || '';
    const category = CATEGORY_DISPLAY_MAP[rawCat] || rawCat;
    const description = (btn && btn.getAttribute('data-desc')) ||
      (card.querySelector('p') ? card.querySelector('p').textContent.trim() : '');

    imgEl.src = imgSrc;
    imgEl.alt = title;
    if (titleEl) titleEl.textContent = title;
    if (catEl) catEl.textContent = category;
    if (descEl) descEl.textContent = description || '';

    if (counterEl) {
      counterEl.textContent = `${String(currentCardIndex + 1).padStart(2, '0')} / ${String(activeCardsList.length).padStart(2, '0')}`;
    }

    const filename = imgSrc.split('/').pop();
    const study = CASE_STUDIES_DATA[filename] || getFallbackStudy(category, title, description);

    if (study && studyContainer) {
      studyContainer.classList.remove('hidden');
      const d = document.getElementById('case-desafio');
      const s = document.getElementById('case-solucao');
      const i = document.getElementById('case-impacto');
      if (d) d.textContent = study.desafio;
      if (s) s.textContent = study.solucao;
      if (i) i.textContent = study.impacto;
      if (studyContent) {
        studyContent.classList.remove('hidden');
        if (studyToggleBtn) studyToggleBtn.setAttribute('aria-expanded', 'true');
        const icon = studyToggleBtn ? studyToggleBtn.querySelector('i, svg') : null;
        if (icon) icon.style.transform = 'rotate(180deg)';
      }
    }
  }

  function openModalWithCard(card, triggerEl, pushHistory = true) {
    lastTriggerEl = triggerEl || document.activeElement;
    const all = Array.from(document.querySelectorAll('.project-card'));
    const visible = all.filter(c => c.style.display !== 'none');
    activeCardsList = visible.length ? visible : all;

    const idx = activeCardsList.indexOf(card);
    currentCardIndex = idx !== -1 ? idx : 0;

    renderModalCard(currentCardIndex);

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (pushHistory && window.history && window.history.pushState) {
      window.history.pushState({ modalOpen: 'lightbox' }, '');
    }
    if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
  }

  function closeModal(fromPopstate = false) {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    imgEl.src = '';
    document.body.style.overflow = '';
    if (!fromPopstate && window.history && window.history.state && window.history.state.modalOpen === 'lightbox') {
      window.history.back();
    }
    if (lastTriggerEl && typeof lastTriggerEl.focus === 'function') {
      lastTriggerEl.focus();
    }
  }

  let isNavigating = false;
  function navigateModal(direction) {
    if (isNavigating) return;
    isNavigating = true;
    renderModalCard(currentCardIndex + direction);
    setTimeout(() => {
      isNavigating = false;
    }, 180);
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateModal(1);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateModal(-1);
    });
  }

  if (studyToggleBtn && studyContent) {
    studyToggleBtn.addEventListener('click', () => {
      const isHidden = studyContent.classList.contains('hidden');
      studyContent.classList.toggle('hidden', !isHidden);
      studyToggleBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
      const icon = studyToggleBtn.querySelector('i, svg');
      if (icon) icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    });
  }

  document.addEventListener('click', (e) => {
    // Apenas o botão explícito de zoom (data-lightbox-trigger) abre o modal em tela cheia,
    // garantindo que gestos de toque/swipe no mobile nunca travem a tela abrindo o modal por engano
    const trigger = e.target.closest('[data-lightbox-trigger]');
    if (!trigger) return;

    const card = trigger.closest('.project-card') || trigger.parentElement;
    if (card) {
      openModalWithCard(card, trigger);
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('hidden')) return;
    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'ArrowRight') {
      navigateModal(1);
    } else if (e.key === 'ArrowLeft') {
      navigateModal(-1);
    } else {
      trapFocusInContainer(e, modal);
    }
  });
}

/* ==========================================================================
   4. Cópia Rápida de E-mail com Toast Notification (Event Delegation)
   ========================================================================== */
function showToast(message) {
  const toast = document.getElementById('toast-notification');
  if (!toast) return;
  const msgEl = toast.querySelector('.toast-message');
  if (msgEl && message) msgEl.textContent = message;
  toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
  toast.classList.add('opacity-100', 'translate-y-0');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
  }, 2800);
}

function initEmailCopy() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-copy-email], .copy-email-btn');
    if (!btn) return;

    const email = (btn.getAttribute('data-copy-email') || '').trim() ||
      (window.PortfolioUtils ? window.PortfolioUtils.getContactEmail() : '');
    if (!email) return;

    const copyPromise = (window.PortfolioUtils && typeof window.PortfolioUtils.copyTextToClipboard === 'function')
      ? window.PortfolioUtils.copyTextToClipboard(email)
      : (navigator.clipboard && window.isSecureContext ? navigator.clipboard.writeText(email) : Promise.reject());

    copyPromise
      .then(() => {
        showToast('E-mail copiado para a área de transferência!');
      })
      .catch((err) => {
        console.warn('Falha na cópia automática para a área de transferência:', err);
        showToast('E-mail: ' + email);
      });
  });
}

/* ==========================================================================
   5. Rolagem Suave, Barra de Progresso e Dock Flutuante Dinâmico
   ========================================================================== */
function initSmoothScroll() {
  const progressBar = document.getElementById('scroll-progress');
  const floatingDock = document.getElementById('floating-cta-dock');
  const backToTopBtn = document.getElementById('back-to-top-btn');
  const header = document.querySelector('header');
  const heroBackdrop = document.getElementById('hero-scroll-backdrop');

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Clicar no logo/nome na navbar faz scroll suave para o topo sem recarregar ou abrir diretório local
  const logoLink = document.querySelector('header a[aria-label="Página Inicial Arthur Quites"]');
  if (logoLink) {
    logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.location.hash && history.pushState) {
        history.pushState(null, '', window.location.pathname);
      }
    });
  }

  // Rolagem suave e precisa para todos os links internos com compensação de offset da navbar
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;
      let targetEl = null;
      try {
        targetEl = document.querySelector(targetId) || document.getElementById(targetId.replace(/^#/, ''));
      } catch (_) {
        targetEl = document.getElementById(targetId.replace(/^#/, ''));
      }
      if (targetEl) {
        e.preventDefault();
        const headerOffset = header ? header.offsetHeight + 16 : 80;
        const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        if (history.pushState) {
          history.pushState(null, null, targetId);
        }
      }
    });
  });

  let ticking = false;
  let cachedDocHeight = Math.max(1, document.documentElement.scrollHeight - document.documentElement.clientHeight);
  window.addEventListener('resize', () => {
    cachedDocHeight = Math.max(1, document.documentElement.scrollHeight - document.documentElement.clientHeight);
  }, { passive: true });

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const winScroll = window.pageYOffset || document.documentElement.scrollTop;
        const scrolled = cachedDocHeight > 0 ? (winScroll / cachedDocHeight) * 100 : 0;

        // Transição dinâmica: Hero Laranja degradê para Preto no Scroll
        if (heroBackdrop) {
          // A Hero tem ~750px de altura; o degradê esmaece suavemente até preto entre 0 e 850px
          const fadeProgress = Math.min(1, Math.max(0, winScroll / 850));
          heroBackdrop.style.opacity = (1 - fadeProgress).toFixed(3);
        }

        if (progressBar) {
          progressBar.style.width = scrolled + '%';
          progressBar.setAttribute('aria-valuenow', String(Math.round(scrolled)));
        }

        // Navbar dinâmica compacta com iluminação na borda no scroll
        if (header) {
          header.classList.toggle('header-scrolled', winScroll > 24);
        }

        if (floatingDock) {
          const showDock = winScroll > 420 && scrolled < 94;
          floatingDock.classList.toggle('opacity-0', !showDock);
          floatingDock.classList.toggle('translate-y-4', !showDock);
          floatingDock.classList.toggle('pointer-events-none', !showDock);
          floatingDock.classList.toggle('opacity-100', showDock);
          floatingDock.classList.toggle('translate-y-0', showDock);
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ==========================================================================
   6. Revelação Suave de Elementos no Scroll (Stagger Dynamic Cascade)
   ========================================================================== */
function initScrollTransitions() {
  const revealElements = document.querySelectorAll('.scroll-reveal');
  if (!revealElements.length) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    revealElements.forEach(el => {
      el.classList.add('revealed');
      el.querySelectorAll('.scroll-reveal-item').forEach(item => item.classList.add('revealed'));
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        const items = entry.target.querySelectorAll('.scroll-reveal-item');
        items.forEach((item, idx) => {
          item.style.setProperty('--stagger-idx', idx);
          setTimeout(() => {
            item.classList.add('revealed');
          }, idx * 60);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(el => observer.observe(el));
}

/* ==========================================================================
   6.1 Efeito Cinético Interativo no Título Principal do Hero
   ========================================================================== */
function initHeroTitleParallax() {
  const heroSection = document.getElementById('hero-statement') || document.querySelector('section[aria-label="Apresentação executiva"]');
  const heroTitle = document.getElementById('hero-title');
  if (!heroSection || !heroTitle) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  let mouseX = 0, mouseY = 0;
  let currentX = 0, currentY = 0;
  let isHovered = false;
  let rafId = null;

  function updateParallax() {
    currentX += (mouseX - currentX) * 0.08;
    currentY += (mouseY - currentY) * 0.08;

    if (isHovered || Math.abs(currentX) > 0.005 || Math.abs(currentY) > 0.005) {
      heroTitle.style.transform = `translate3d(${currentX * 14}px, ${currentY * 10}px, 0) rotateX(${-currentY * 3.5}deg) rotateY(${currentX * 4}deg)`;
      rafId = window.requestAnimationFrame(updateParallax);
    } else {
      heroTitle.style.transform = 'translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg)';
      rafId = null;
    }
  }

  let heroRect = null;
  heroSection.addEventListener('pointerenter', () => {
    heroRect = heroSection.getBoundingClientRect();
  }, { passive: true });

  heroSection.addEventListener('mousemove', (e) => {
    if (!heroRect) heroRect = heroSection.getBoundingClientRect();
    const x = (e.clientX - heroRect.left) / heroRect.width - 0.5;
    const y = (e.clientY - heroRect.top) / heroRect.height - 0.5;
    mouseX = Math.max(-0.5, Math.min(0.5, x));
    mouseY = Math.max(-0.5, Math.min(0.5, y));
    isHovered = true;
    if (!rafId) rafId = window.requestAnimationFrame(updateParallax);
  }, { passive: true });

  heroSection.addEventListener('mouseleave', () => {
    mouseX = 0;
    mouseY = 0;
    isHovered = false;
    heroRect = null;
  }, { passive: true });

  window.addEventListener('resize', () => {
    heroRect = null;
  }, { passive: true });
}

/* ==========================================================================
   7. Modal Legal: Política de Privacidade (LGPD) & Termos de Uso (ARIA Tabs + Focus Trap)
   ========================================================================== */
function initLegalModal() {
  const modal = document.getElementById('legal-modal');
  const backdrop = document.getElementById('legal-modal-backdrop');
  const closeBtn = document.getElementById('legal-modal-close');
  const okBtn = document.getElementById('legal-modal-ok');
  const tabPrivacyBtn = document.getElementById('tab-privacy-btn');
  const tabTermsBtn = document.getElementById('tab-terms-btn');
  const contentPrivacy = document.getElementById('legal-content-privacy');
  const contentTerms = document.getElementById('legal-content-terms');

  if (!modal) return;

  let lastTriggerEl = null;

  function switchTab(tabName) {
    const isTerms = tabName === 'terms' || tabName === 'termos';
    if (tabPrivacyBtn && tabTermsBtn) {
      tabPrivacyBtn.classList.toggle('border-[#ff6b00]', !isTerms);
      tabPrivacyBtn.classList.toggle('text-white', !isTerms);
      tabPrivacyBtn.classList.toggle('border-transparent', isTerms);
      tabPrivacyBtn.classList.toggle('text-zinc-400', isTerms);
      tabPrivacyBtn.setAttribute('aria-selected', String(!isTerms));

      tabTermsBtn.classList.toggle('border-[#ff6b00]', isTerms);
      tabTermsBtn.classList.toggle('text-white', isTerms);
      tabTermsBtn.classList.toggle('border-transparent', !isTerms);
      tabTermsBtn.classList.toggle('text-zinc-400', !isTerms);
      tabTermsBtn.setAttribute('aria-selected', String(isTerms));
    }
    if (contentPrivacy && contentTerms) {
      contentPrivacy.classList.toggle('hidden', isTerms);
      contentTerms.classList.toggle('hidden', !isTerms);
    }
  }

  function openLegal(tabName, triggerEl, pushHistory = true) {
    lastTriggerEl = triggerEl || document.activeElement;
    switchTab(tabName);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (pushHistory && window.history && window.history.pushState) {
      window.history.pushState({ modalOpen: 'legal' }, '');
    }
    if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
  }

  function closeLegal(fromPopstate = false) {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (!fromPopstate && window.history && window.history.state && window.history.state.modalOpen === 'legal') {
      window.history.back();
    }
    if (lastTriggerEl && typeof lastTriggerEl.focus === 'function') {
      lastTriggerEl.focus();
    }
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-legal]');
    if (trigger) {
      e.preventDefault();
      const targetTab = trigger.getAttribute('data-open-legal') || 'privacidade';
      openLegal(targetTab, trigger);
    }
  });

  if (tabPrivacyBtn) tabPrivacyBtn.addEventListener('click', () => switchTab('privacy'));
  if (tabTermsBtn) tabTermsBtn.addEventListener('click', () => switchTab('terms'));
  if (closeBtn) closeBtn.addEventListener('click', closeLegal);
  if (okBtn) okBtn.addEventListener('click', closeLegal);
  if (backdrop) backdrop.addEventListener('click', closeLegal);

  document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('hidden')) return;
    if (e.key === 'Escape') {
      closeLegal();
    } else {
      trapFocusInContainer(e, modal);
    }
  });
}

/* ==========================================================================
   8. Spotlight Interativo que Segue o Cursor nos Cards (Padrão Linear/Stripe)
   ========================================================================== */
function initCardSpotlight() {
  const cards = document.querySelectorAll('.card-zenith, .tool-card');
  if (!cards.length) return;

  cards.forEach(card => {
    let rect = null;
    let rafId = null;

    card.addEventListener('pointerenter', () => {
      rect = card.getBoundingClientRect();
    }, { passive: true });

    card.addEventListener('pointermove', (e) => {
      if (!rect) rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          card.style.setProperty('--mouse-x', `${x}px`);
          card.style.setProperty('--mouse-y', `${y}px`);
          rafId = null;
        });
      }
    }, { passive: true });

    card.addEventListener('pointerleave', () => {
      rect = null;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }, { passive: true });
  });
}

/* ==========================================================================
   9. Contadores Animados de KPIs na Seção de Métricas (#inventario)
   ========================================================================== */
function initMetricCounters() {
  const counters = document.querySelectorAll('[data-counter-target]');
  if (!counters.length) return;

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      observer.unobserve(el);

      const target = parseFloat(el.getAttribute('data-counter-target') || '0');
      const prefix = el.getAttribute('data-counter-prefix') || '';
      const suffix = el.getAttribute('data-counter-suffix') || '';
      const decimals = parseInt(el.getAttribute('data-counter-decimals') || '0', 10);

      if (prefersReducedMotion) {
        el.textContent = `${prefix}${target.toFixed(decimals).replace('.', ',')}${suffix}`;
        return;
      }

      const duration = 1100;
      const startTime = performance.now();

      function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = (target * eased).toFixed(decimals).replace('.', ',');
        el.textContent = `${prefix}${current}${suffix}`;
        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      }

      requestAnimationFrame(tick);
    });
  }, { threshold: 0.25 });

  counters.forEach(c => observer.observe(c));
}

/* ==========================================================================
   10. Scroll Spy na Navbar Superior (Destaca a Seção Ativa)
   ========================================================================== */
function initScrollSpy() {
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('header nav a[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          const isMatch = link.getAttribute('href') === `#${id}`;
          link.classList.toggle('nav-spy-active', isMatch);
          if (isMatch) {
            link.setAttribute('aria-current', 'location');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      }
    });
  }, { rootMargin: '-25% 0px -60% 0px' });

  sections.forEach(sec => observer.observe(sec));
}

/* ==========================================================================
   11. Hero WebGL Animated Gradient (Spell UI Engine)
   ========================================================================== */
function initHeroAnimatedGradient() {
  const container = document.getElementById('hero-gradient-container');
  if (!container || typeof SpellAnimatedGradient === 'undefined') return;

  // Acessibilidade: respeita a preferência de movimento reduzido (WCAG 2.1)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  SpellAnimatedGradient.create(container, {
    preset: 'ArthurSignature',
    speed: prefersReducedMotion ? 0 : 16,
    noise: { opacity: 0.16, scale: 1 },
    observeElement: '#hero-statement', // Otimização extrema: pausa a renderização na GPU quando a Hero sai da tela
  });
}

/* ==========================================================================
   12. Sincronização com o Botão Voltar (Browser History & Popstate)
   Garante que o botão Voltar do celular/navegador feche modais abertos
   ========================================================================== */
window.addEventListener('popstate', () => {
  const drawer = document.getElementById('mobile-drawer');
  if (drawer && !drawer.hasAttribute('inert')) {
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    const panel = document.getElementById('mobile-drawer-panel');
    const openBtn = document.getElementById('mobile-menu-btn');
    if (backdrop) { backdrop.classList.remove('opacity-100'); backdrop.classList.add('opacity-0'); }
    if (panel) panel.classList.add('translate-x-full');
    drawer.classList.add('pointer-events-none');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('inert', '');
    if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  const lightboxModal = document.getElementById('lightbox-modal');
  if (lightboxModal && !lightboxModal.classList.contains('hidden')) {
    lightboxModal.classList.remove('flex');
    lightboxModal.classList.add('hidden');
    lightboxModal.setAttribute('aria-hidden', 'true');
    const imgEl = document.getElementById('lightbox-img');
    if (imgEl) imgEl.src = '';
    document.body.style.overflow = '';
  }

  const legalModal = document.getElementById('legal-modal');
  if (legalModal && !legalModal.classList.contains('hidden')) {
    legalModal.classList.remove('flex');
    legalModal.classList.add('hidden');
    legalModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
});
