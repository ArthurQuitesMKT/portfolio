/**
 * Skiper 54 — Shadcn clipPath Carousel (Carousel_006)
 * Implementação de alta fidelidade visual para o portfólio de Arthur Quites.
 * Baseado no componente oficial: https://skiper-ui.com/v1/skiper54
 */

(function (global) {
  'use strict';

  function escapeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  function enhanceCasesSection() {
    const track = document.getElementById('cases-track');
    const viewport = document.getElementById('cases-carousel-viewport');
    const prevBtn = document.getElementById('cases-prev');
    const nextBtn = document.getElementById('cases-next');
    const indicator = document.getElementById('cases-indicator');
    const dotsContainer = document.getElementById('cases-dots');
    const filterContainer = document.getElementById('cases-filters');

    if (!track || !viewport) return;

    // Extrai dados dos 32 cards originais do DOM
    const rawCards = Array.from(track.querySelectorAll('.project-card'));
    if (rawCards.length === 0) return;

    const projectsData = rawCards.map((card, idx) => {
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

    // Atualiza automaticamente os contadores dos botões de filtro com base no DOM real
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

    // Reestrutura o Viewport e Track para a mecânica Skiper 54
    viewport.className = 'skiper54-viewport relative w-full overflow-hidden py-6 cursor-grab active:cursor-grabbing select-none';
    viewport.style.overflow = 'hidden';
    viewport.style.userSelect = 'none';
    viewport.style.webkitUserSelect = 'none';

    track.className = 'skiper54-track flex items-center will-change-transform';
    track.style.transition = 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)';
    track.style.display = 'flex';
    track.style.gap = '0px';

    track.innerHTML = projectsData.map((p, idx) => `
      <article class="project-card skiper54-item ${idx === 0 ? 'is-active' : 'is-inactive'}" 
               data-category="${p.category}" 
               data-index="${idx}"
               aria-current="${idx === 0 ? 'true' : 'false'}">
        <div class="skiper54-card-inner">
          <div class="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#090c10]" style="background: radial-gradient(circle at 50% 40%, rgba(255, 107, 0, 0.08), #090c10 80%);">
            <img src="${p.src}" alt="${escapeHTML(p.alt)}" draggable="false" class="relative z-10 w-full h-full object-contain p-2 sm:p-2.5 pointer-events-none select-none" loading="lazy" decoding="async">
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

    // Estado interno do Carrossel Skiper 54
    let currentIndex = 0;
    let currentCategory = 'all';
    let isDragging = false;
    let startX = 0;
    let dragDistance = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let autoplayTimer = null;

    const allItems = Array.from(track.querySelectorAll('.skiper54-item'));

    function getVisibleItems() {
      return allItems.filter(item => {
        const cat = item.getAttribute('data-category') || '';
        return currentCategory === 'all' || cat.includes(currentCategory);
      });
    }

    function renderDots(visibleCount) {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      if (visibleCount <= 1) return;

      const maxDots = Math.min(visibleCount, 12);
      for (let i = 0; i < maxDots; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'skiper54-dot-btn p-1.5 flex items-center justify-center cursor-pointer';
        dot.setAttribute('aria-label', `Ir para projeto ${i + 1}`);
        dot.setAttribute('data-dot-index', i);
        dot.innerHTML = `<span class="skiper54-dot-pill block h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-[#ff6b00] shadow-[0_0_12px_rgba(255,107,0,0.5)]' : 'w-2 bg-zinc-700 hover:bg-zinc-500'}"></span>`;
        dotsContainer.appendChild(dot);
      }
    }

    function getActiveDotIndex(currIdx, totalCount, dotsCount) {
      if (totalCount <= 1 || dotsCount <= 1) return 0;
      return Math.min(Math.round((currIdx / (totalCount - 1)) * (dotsCount - 1)), dotsCount - 1);
    }

    function updateDotsState() {
      if (!dotsContainer) return;
      const visible = getVisibleItems();
      const dotPills = dotsContainer.querySelectorAll('.skiper54-dot-pill');
      if (dotPills.length === 0) return;
      const targetActiveDot = getActiveDotIndex(currentIndex, visible.length, dotPills.length);

      dotPills.forEach((pill, idx) => {
        if (idx === targetActiveDot) {
          pill.className = 'skiper54-dot-pill block h-2 w-8 rounded-full bg-[#ff6b00] transition-all duration-300 cursor-pointer shadow-[0_0_12px_rgba(255,107,0,0.5)]';
        } else {
          pill.className = 'skiper54-dot-pill block h-2 w-2 rounded-full bg-zinc-700 hover:bg-zinc-500 transition-all duration-300 cursor-pointer';
        }
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

      if (!animate) {
        track.style.transition = 'none';
      } else {
        track.style.transition = 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)';
      }

      viewport.scrollLeft = 0;
      track.style.transform = `translateX(${currentTranslate}px)`;

      // Aplica classes de aceleração GPU e transição suave
      visible.forEach((item, vIdx) => {
        const isActive = (vIdx === index);
        item.classList.toggle('is-active', isActive);
        item.classList.toggle('is-inactive', !isActive);
        item.setAttribute('aria-current', isActive ? 'true' : 'false');
      });

      // Atualiza Indicador Numérico
      if (indicator) {
        indicator.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(visible.length).padStart(2, '0')}`;
      }

      updateDotsState();
    }

    function next() {
      goTo(currentIndex + 1);
    }

    function prev() {
      goTo(currentIndex - 1);
    }

    function startAutoplay() {
      stopAutoplay();
      autoplayTimer = setInterval(() => {
        next();
      }, 3500);
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function resetAutoplay() {
      startAutoplay();
    }

    // Interações de Navegação
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prev();
        resetAutoplay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        next();
        resetAutoplay();
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
          resetAutoplay();
        }
      });
    }

    // Clique nos cards: Clicar em card vizinho inativo centraliza o card
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
          resetAutoplay();
        }
        // Se já está ativo, o card permanece em foco sem abrir modal indesejado
      });
    });

    // Filtros de Categoria Dinâmicos
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

        // Atualiza visibilidade dos itens no DOM
        allItems.forEach(item => {
          const cat = item.getAttribute('data-category') || '';
          const matches = (currentCategory === 'all' || cat.includes(currentCategory));
          item.style.display = matches ? 'block' : 'none';
        });

        const visible = getVisibleItems();
        renderDots(visible.length);
        currentIndex = 0;
        goTo(0, false);
        resetAutoplay();
      });
    }

    // Engine Híbrida de Gestos Touch (Mobile) & Mouse (Desktop) com Direction-Locking
    let moveRaf = null;
    let touchStartX = 0;
    let touchStartY = 0;
    let isHorizontalSwipe = false;
    let isVerticalScroll = false;

    // --- MOUSE DESKTOP ---
    let isMouseDragging = false;
    let mouseStartX = 0;

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

      if (movedBy < -55) {
        next();
      } else if (movedBy > 55) {
        prev();
      } else {
        goTo(currentIndex);
      }

      resetAutoplay();
    };

    const onMouseDown = (e) => {
      if (e.button !== 0 || e.target.closest('[data-lightbox-trigger]')) return;
      isMouseDragging = true;
      isDragging = false;
      mouseStartX = e.pageX;
      dragDistance = 0;
      track.style.transition = 'none';
      stopAutoplay();

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseEnd);
    };

    // --- TOUCH ENGINE MOBILE (Zero-Jank, Permite Scroll Vertical Nativo da Página) ---
    const onTouchStart = (e) => {
      if (e.touches.length !== 1 || e.target.closest('[data-lightbox-trigger]')) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isHorizontalSwipe = false;
      isVerticalScroll = false;
      isDragging = false;
      dragDistance = 0;
      stopAutoplay();
    };

    const onTouchMove = (e) => {
      if (isVerticalScroll || e.touches.length !== 1) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - touchStartX;
      const diffY = currentY - touchStartY;

      // Trava de Direção (Direction Lock): identifica se o usuário quer rolar a página ou arrastar o carrossel
      if (!isHorizontalSwipe && !isVerticalScroll) {
        if (Math.abs(diffY) > 6 && Math.abs(diffY) > Math.abs(diffX)) {
          // O usuário está rolando a página: entrega 100% o controle para o navegador nativo
          isVerticalScroll = true;
          return;
        }
        if (Math.abs(diffX) > 6 && Math.abs(diffX) >= Math.abs(diffY)) {
          // O usuário está arrastando o carrossel horizontalmente
          isHorizontalSwipe = true;
          isDragging = true;
          track.style.transition = 'none';
        }
      }

      if (isHorizontalSwipe && isDragging) {
        if (e.cancelable) {
          e.preventDefault(); // Impede que a tela balance verticalmente durante o swipe do carrossel
        }
        dragDistance = Math.abs(diffX);

        if (!moveRaf) {
          moveRaf = requestAnimationFrame(() => {
            track.style.transform = `translateX(${prevTranslate + diffX}px)`;
            moveRaf = null;
          });
        }
      }
    };

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

        if (movedBy < -40) {
          next();
        } else if (movedBy > 40) {
          prev();
        } else {
          goTo(currentIndex);
        }
      }

      isHorizontalSwipe = false;
      isVerticalScroll = false;
      isDragging = false;
      resetAutoplay();
    };

    viewport.addEventListener('mousedown', onMouseDown);
    viewport.addEventListener('touchstart', onTouchStart, { passive: true });
    viewport.addEventListener('touchmove', onTouchMove, { passive: false });
    viewport.addEventListener('touchend', onTouchEnd, { passive: true });
    viewport.addEventListener('touchcancel', onTouchEnd, { passive: true });

    // Pausa no hover do carrossel
    viewport.addEventListener('mouseenter', stopAutoplay);
    viewport.addEventListener('mouseleave', resetAutoplay);

    // Otimização Sênior de Autoplay: desliga quando a seção sai da tela ou a aba é ocultada
    let isCarouselVisible = false;
    const visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isCarouselVisible = entry.isIntersecting;
        if (isCarouselVisible) {
          startAutoplay();
        } else {
          stopAutoplay();
        }
      });
    }, { threshold: 0.1 });
    visibilityObserver.observe(viewport);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoplay();
      } else if (isCarouselVisible) {
        startAutoplay();
      }
    });

    // Teclado (Setas Esquerda e Direita quando a seção estiver no foco)
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;
      if (document.getElementById('lightbox-modal') && !document.getElementById('lightbox-modal').classList.contains('hidden')) return;

      const rect = viewport.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      if (e.key === 'ArrowLeft') {
        prev();
        resetAutoplay();
      } else if (e.key === 'ArrowRight') {
        next();
        resetAutoplay();
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
    renderDots(initialVisible.length);
    goTo(0, false);
    startAutoplay();
  }

  global.Skiper54 = {
    enhanceCasesSection: enhanceCasesSection
  };

})(window);
