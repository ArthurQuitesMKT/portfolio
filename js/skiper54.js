/**
 * Skiper 54 — Shadcn clipPath 3D Carousel (Carousel_006)
 * Arquitetura Modular Senior: SRP (Single Responsibility Principle), WCAG 2.1 AA Keyboard Focus & XSS Shield
 * Baseado no componente oficial: https://skiper-ui.com/v1/skiper54
 */

(function (global) {
  'use strict';

  const escapeHTML = (window.PortfolioUtils && window.PortfolioUtils.escapeHTML)
    ? window.PortfolioUtils.escapeHTML
    : function (str) {
        if (!str || typeof str !== 'string') return '';
        return str.replace(/[&<>'"]/g, tag => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;'
        }[tag] || tag));
      };

  /* ==========================================================================
     1. Módulo de Extração e Sanitização de Dados dos Projetos
     ========================================================================== */
  const ProjectDataExtractor = {
    extract(track) {
      const rawCards = Array.from(track.querySelectorAll('.project-card'));
      return rawCards.map((card, idx) => {
        const img = card.querySelector('img');
        const badge = card.querySelector('.card-badge');
        const title = card.querySelector('h3');
        const desc = card.querySelector('p');
        const category = card.getAttribute('data-category') || 'cases';

        return {
          id: idx,
          src: img ? (img.getAttribute('src') || '') : '',
          alt: img ? (img.getAttribute('alt') || '') : '',
          badgeText: badge ? badge.textContent.trim() : '',
          titleText: title ? title.textContent.trim() : `Projeto ${idx + 1}`,
          descText: desc ? desc.textContent.trim() : '',
          category: category
        };
      });
    }
  };

  /* ==========================================================================
     2. Módulo de Renderização e Atualização do DOM
     ========================================================================== */
  class CarouselRenderer {
    constructor(track, viewport) {
      this.track = track;
      this.viewport = viewport;
    }

    setupContainers() {
      this.viewport.className = 'skiper54-viewport relative w-full overflow-hidden py-6 cursor-grab active:cursor-grabbing select-none outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b00]/50 rounded-2xl';
      this.viewport.style.overflow = 'hidden';
      this.viewport.style.userSelect = 'none';
      this.viewport.style.webkitUserSelect = 'none';
      this.viewport.setAttribute('tabindex', '0');
      this.viewport.setAttribute('role', 'region');
      this.viewport.setAttribute('aria-roledescription', 'carousel');
      this.viewport.setAttribute('aria-label', 'Carrossel de Cases e Projetos');

      this.track.className = 'skiper54-track flex items-center will-change-transform';
      this.track.style.transition = 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)';
      this.track.style.display = 'flex';
      this.track.style.gap = '0px';
    }

    renderItems(projectsData) {
      this.track.innerHTML = projectsData.map((p, idx) => `
        <article class="project-card skiper54-item ${idx === 0 ? 'is-active' : 'is-inactive'}" 
                 data-category="${escapeHTML(p.category)}" 
                 data-index="${idx}"
                 aria-current="${idx === 0 ? 'true' : 'false'}">
          <div class="skiper54-card-inner">
            <div class="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#090c10]" style="background: radial-gradient(circle at 50% 40%, rgba(255, 107, 0, 0.08), #090c10 80%);">
              <img src="${escapeHTML(p.src)}" alt="${escapeHTML(p.alt)}" draggable="false" class="relative z-10 w-full h-full object-contain p-2 sm:p-2.5 pointer-events-none select-none" loading="lazy" decoding="async">
              <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none z-20"></div>
            </div>
            ${p.badgeText ? `
              <div class="absolute top-4 left-4 pointer-events-none max-w-[85%] z-30">
                <span class="inline-block px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-orange-500/20 text-orange-400 border border-orange-500/35 backdrop-blur-md truncate max-w-full">
                  ${escapeHTML(p.badgeText)}
                </span>
              </div>
            ` : ''}
            <button type="button" class="absolute bottom-4 right-4 p-2.5 rounded-full bg-zinc-900/90 border border-zinc-700/80 text-zinc-300 hover:text-[#ff6b00] hover:border-[#ff6b00] transition-all cursor-pointer backdrop-blur-md shadow-lg z-30" data-lightbox-trigger aria-label="Ampliar projeto ${escapeHTML(p.titleText)}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7"/></svg>
            </button>
          </div>
          <div class="skiper54-caption pt-3 text-center px-2 pointer-events-none transition-all duration-300">
            <h3 class="font-display font-bold text-white text-xs sm:text-sm tracking-tight line-clamp-2 min-h-[2.4em] leading-snug">${escapeHTML(p.titleText)}</h3>
            <p class="text-[11px] text-zinc-400 truncate mt-0.5">${escapeHTML(p.descText)}</p>
          </div>
        </article>
      `).join('');
    }
  }

  /* ==========================================================================
     3. Módulo de Navegação por Pontos (Dots Indicator)
     ========================================================================== */
  class DotsManager {
    constructor(dotsContainer) {
      this.dotsContainer = dotsContainer;
    }

    render(visibleCount, currentIndex) {
      if (!this.dotsContainer) return;
      this.dotsContainer.innerHTML = '';
      if (visibleCount <= 1) return;

      const maxDots = Math.min(visibleCount, 12);
      for (let i = 0; i < maxDots; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'skiper54-dot-btn p-1.5 flex items-center justify-center cursor-pointer';
        dot.setAttribute('aria-label', `Ir para projeto ${i + 1}`);
        dot.setAttribute('data-dot-index', i);
        dot.innerHTML = `<span class="skiper54-dot-pill block h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-[#ff6b00] shadow-[0_0_12px_rgba(255,107,0,0.5)]' : 'w-2 bg-zinc-700 hover:bg-zinc-500'}"></span>`;
        this.dotsContainer.appendChild(dot);
      }
    }

    update(currentIndex, totalCount) {
      if (!this.dotsContainer) return;
      const dotPills = this.dotsContainer.querySelectorAll('.skiper54-dot-pill');
      if (dotPills.length === 0) return;

      const targetActiveDot = (totalCount <= 1 || dotPills.length <= 1)
        ? 0
        : Math.min(Math.round((currentIndex / (totalCount - 1)) * (dotPills.length - 1)), dotPills.length - 1);

      dotPills.forEach((pill, idx) => {
        if (idx === targetActiveDot) {
          pill.className = 'skiper54-dot-pill block h-2 w-8 rounded-full bg-[#ff6b00] transition-all duration-300 cursor-pointer shadow-[0_0_12px_rgba(255,107,0,0.5)]';
        } else {
          pill.className = 'skiper54-dot-pill block h-2 w-2 rounded-full bg-zinc-700 hover:bg-zinc-500 transition-all duration-300 cursor-pointer';
        }
      });
    }
  }

  /* ==========================================================================
     4. Módulo de Autoplay Inteligente (Pausa no Hover, Visibility & Scroll)
     ========================================================================== */
  class AutoplayController {
    constructor(advanceFn, delay = 3500) {
      this.advanceFn = advanceFn;
      this.delay = delay;
      this.timer = null;
      this.isPaused = false;
    }

    start() {
      this.stop();
      if (this.isPaused) return;
      this.timer = setInterval(() => {
        this.advanceFn();
      }, this.delay);
    }

    stop() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }

    pause() {
      this.isPaused = true;
      this.stop();
    }

    resume() {
      this.isPaused = false;
      this.start();
    }

    restart() {
      this.start();
    }
  }

  /* ==========================================================================
     5. Orquestrador Principal do Carrossel Skiper 54
     ========================================================================== */
  function enhanceCasesSection() {
    const track = document.getElementById('cases-track');
    const viewport = document.getElementById('cases-carousel-viewport');
    const prevBtn = document.getElementById('cases-prev');
    const nextBtn = document.getElementById('cases-next');
    const indicator = document.getElementById('cases-indicator');
    const dotsContainer = document.getElementById('cases-dots');
    const filterContainer = document.getElementById('cases-filters');

    if (!track || !viewport) return;

    const projectsData = ProjectDataExtractor.extract(track);
    if (projectsData.length === 0) return;

    // Atualiza contadores dos botões de filtro
    if (filterContainer) {
      const categoryLabels = {
        all: 'Todos',
        campanhas: 'Campanhas',
        cases: 'Cases',
        institucionais: 'Posts Institucionais',
        anuncios: 'Anúncios'
      };
      filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
        const cat = btn.getAttribute('data-category') || 'all';
        const count = cat === 'all'
          ? projectsData.length
          : projectsData.filter(c => (c.category || '').includes(cat)).length;
        const label = categoryLabels[cat] || btn.textContent.replace(/\s*\(\d+\)/, '').trim();
        btn.textContent = `${label} (${count})`;
      });
    }

    // Inicializa Renderizador e Dots
    const renderer = new CarouselRenderer(track, viewport);
    renderer.setupContainers();
    renderer.renderItems(projectsData);

    const dotsManager = new DotsManager(dotsContainer);
    const allItems = Array.from(track.querySelectorAll('.skiper54-item'));

    let currentIndex = 0;
    let currentCategory = 'all';
    let currentTranslate = 0;
    let prevTranslate = 0;
    let dragDistance = 0;

    function getVisibleItems() {
      return allItems.filter(item => {
        const cat = item.getAttribute('data-category') || '';
        return currentCategory === 'all' || cat.includes(currentCategory);
      });
    }

    function goTo(index, animate = true) {
      const visible = getVisibleItems();
      if (visible.length === 0) return;

      if (index < 0) {
        index = visible.length - 1;
      } else if (index >= visible.length) {
        index = 0;
      }

      currentIndex = index;

      const viewportWidth = viewport.clientWidth;
      const targetItem = visible[index];
      if (!targetItem) return;

      const itemLeft = targetItem.offsetLeft;
      const itemWidth = targetItem.clientWidth;
      const centerOffset = (viewportWidth - itemWidth) / 2;

      currentTranslate = -(itemLeft - centerOffset);
      prevTranslate = currentTranslate;

      track.style.transition = animate ? 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
      viewport.scrollLeft = 0;
      track.style.transform = `translateX(${currentTranslate}px)`;

      visible.forEach((item, vIdx) => {
        const isActive = (vIdx === index);
        item.classList.toggle('is-active', isActive);
        item.classList.toggle('is-inactive', !isActive);
        item.setAttribute('aria-current', isActive ? 'true' : 'false');
      });

      if (indicator) {
        indicator.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(visible.length).padStart(2, '0')}`;
      }

      dotsManager.update(currentIndex, visible.length);
    }

    const autoplay = new AutoplayController(() => goTo(currentIndex + 1));

    // Navegação via botões
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        goTo(currentIndex - 1);
        autoplay.restart();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        goTo(currentIndex + 1);
        autoplay.restart();
      });
    }

    if (dotsContainer) {
      dotsContainer.addEventListener('click', (e) => {
        const dot = e.target.closest('[data-dot-index]');
        if (dot) {
          const dotIdx = parseInt(dot.getAttribute('data-dot-index'), 10);
          const visible = getVisibleItems();
          const dotPills = dotsContainer.querySelectorAll('.skiper54-dot-pill');
          const targetIndex = dotPills.length > 1
            ? Math.min(Math.round((dotIdx / (dotPills.length - 1)) * (visible.length - 1)), visible.length - 1)
            : 0;
          goTo(targetIndex);
          autoplay.restart();
        }
      });
    }

    // Clique nos cards: centraliza ou abre Lightbox se já estiver ativo
    allItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        if (dragDistance > 8 || e.target.closest('[data-lightbox-trigger]')) return;
        const visible = getVisibleItems();
        const vIdx = visible.indexOf(item);
        if (vIdx === -1) return;

        if (vIdx !== currentIndex) {
          e.preventDefault();
          e.stopPropagation();
          goTo(vIdx);
          autoplay.restart();
        } else {
          const trigger = item.querySelector('[data-lightbox-trigger]');
          if (trigger) trigger.click();
        }
      });
    });

    // Filtros de Categoria
    if (filterContainer) {
      filterContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;

        filterContainer.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.remove('active', 'bg-[#ff6b00]', 'text-[#090c10]', 'font-bold');
          b.classList.add('bg-zinc-900/70', 'text-zinc-400');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active', 'bg-[#ff6b00]', 'text-[#090c10]', 'font-bold');
        btn.classList.remove('bg-zinc-900/70', 'text-zinc-400');
        btn.setAttribute('aria-pressed', 'true');

        currentCategory = btn.getAttribute('data-category') || 'all';

        allItems.forEach(item => {
          const cat = item.getAttribute('data-category') || '';
          const matches = (currentCategory === 'all' || cat.includes(currentCategory));
          item.style.display = matches ? 'block' : 'none';
        });

        const visible = getVisibleItems();
        dotsManager.render(visible.length, 0);
        goTo(0, false);
        autoplay.restart();
      });
    }

    /* ==========================================================================
       6. Gestos Touch (Mobile) & Mouse (Desktop) com Direction Locking
       ========================================================================== */
    let moveRaf = null;
    let isMouseDragging = false;
    let mouseStartX = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let isHorizontalSwipe = false;
    let isVerticalScroll = false;
    let isDragging = false;

    // Desktop Mouse Drag
    const onMouseMove = (e) => {
      if (!isMouseDragging) return;
      const diffX = e.pageX - mouseStartX;
      dragDistance = Math.abs(diffX);

      if (!moveRaf) {
        moveRaf = requestAnimationFrame(() => {
          track.style.transform = `translateX(${prevTranslate + diffX}px)`;
          moveRaf = null;
        });
      }
    };

    const onMouseEnd = (e) => {
      if (!isMouseDragging) return;
      isMouseDragging = false;
      isDragging = false;

      if (moveRaf) {
        cancelAnimationFrame(moveRaf);
        moveRaf = null;
      }

      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseEnd);

      track.style.transition = 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)';
      const movedBy = (e.pageX || mouseStartX) - mouseStartX;

      if (movedBy < -55) goTo(currentIndex + 1);
      else if (movedBy > 55) goTo(currentIndex - 1);
      else goTo(currentIndex);

      autoplay.restart();
    };

    viewport.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || e.target.closest('[data-lightbox-trigger]')) return;
      isMouseDragging = true;
      isDragging = false;
      mouseStartX = e.pageX;
      dragDistance = 0;
      track.style.transition = 'none';
      autoplay.stop();

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseEnd);
    });

    // Mobile Touch com Trava de Direção (Direction Lock)
    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1 || e.target.closest('[data-lightbox-trigger]')) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isHorizontalSwipe = false;
      isVerticalScroll = false;
      isDragging = false;
      dragDistance = 0;
      autoplay.stop();
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (isVerticalScroll || e.touches.length !== 1) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - touchStartX;
      const diffY = currentY - touchStartY;

      if (!isHorizontalSwipe && !isVerticalScroll) {
        if (Math.abs(diffY) > 6 && Math.abs(diffY) > Math.abs(diffX)) {
          isVerticalScroll = true;
          return;
        }
        if (Math.abs(diffX) > 6 && Math.abs(diffX) >= Math.abs(diffY)) {
          isHorizontalSwipe = true;
          isDragging = true;
          track.style.transition = 'none';
        }
      }

      if (isHorizontalSwipe && isDragging) {
        if (e.cancelable) e.preventDefault();
        dragDistance = Math.abs(diffX);

        if (!moveRaf) {
          moveRaf = requestAnimationFrame(() => {
            track.style.transform = `translateX(${prevTranslate + diffX}px)`;
            moveRaf = null;
          });
        }
      }
    }, { passive: false });

    const onTouchEnd = (e) => {
      if (moveRaf) {
        cancelAnimationFrame(moveRaf);
        moveRaf = null;
      }

      if (isDragging) {
        isDragging = false;
        track.style.transition = 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)';
        const endX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : touchStartX;
        const movedBy = endX - touchStartX;

        if (movedBy < -40) goTo(currentIndex + 1);
        else if (movedBy > 40) goTo(currentIndex - 1);
        else goTo(currentIndex);
      }

      isHorizontalSwipe = false;
      isVerticalScroll = false;
      isDragging = false;
      autoplay.restart();
    };

    viewport.addEventListener('touchend', onTouchEnd, { passive: true });
    viewport.addEventListener('touchcancel', onTouchEnd, { passive: true });

    // Pausa no Hover do mouse
    viewport.addEventListener('mouseenter', () => autoplay.pause());
    viewport.addEventListener('mouseleave', () => autoplay.resume());

    // Observer de Visibilidade do Carrossel
    let isCarouselVisible = false;
    const visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isCarouselVisible = entry.isIntersecting;
        if (isCarouselVisible) autoplay.start();
        else autoplay.stop();
      });
    }, { threshold: 0.1 });
    visibilityObserver.observe(viewport);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) autoplay.stop();
      else if (isCarouselVisible) autoplay.start();
    });

    /* ==========================================================================
       7. Teclado com Verificação Estrita de Foco (Sem Sequestro Global)
       ========================================================================== */
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

      // Não intercepta se o modal lightbox estiver aberto
      const lightboxModal = document.getElementById('lightbox-modal');
      if (lightboxModal && !lightboxModal.classList.contains('hidden')) return;

      // Proteção de Foco: apenas responde se o foco estiver dentro da seção de cases (#cases)
      const casesSection = document.getElementById('cases');
      const isFocusedInCases = casesSection && casesSection.contains(activeEl);

      if (!isFocusedInCases) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo(currentIndex - 1);
        autoplay.restart();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goTo(currentIndex + 1);
        autoplay.restart();
      }
    });

    // Responsividade
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        goTo(currentIndex, false);
      }, 100);
    });

    // Inicialização
    const initialVisible = getVisibleItems();
    dotsManager.render(initialVisible.length, 0);
    goTo(0, false);
    autoplay.start();
  }

  global.Skiper54 = {
    enhanceCasesSection
  };

})(window);
