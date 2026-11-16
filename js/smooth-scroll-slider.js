/**
 * Smooth Scroll Slider — Momentum Physics Image Carousel
 * Engine adaptada com base nas especificações do Originkit (originkit.dev/components/smooth-scroll-slider)
 * Otimizada para JavaScript Vanilla puro, 60 FPS, aceleração de GPU e responsividade total.
 */

(function (global) {
  'use strict';

  const MAX_SCALE = 2.5;
  const MIN_SCALE = 0.1;

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  function wrap(value, span) {
    return ((value % span) + span) % span;
  }

  class SmoothScrollSliderInstance {
    constructor(container, options = {}) {
      if (!container) throw new Error('SmoothScrollSlider: Container element is required.');
      this.container = container;

      // Opções com defaults idênticos ao Preset Base do Originkit
      this.items = options.items || [];
      this.slideWidth = options.slideWidth || 380;
      this.slideHeight = options.slideHeight || 460;
      this.spacing = options.spacing !== undefined ? options.spacing : 2;
      this.direction = options.direction || 'right';
      this.smoothness = options.smoothness !== undefined ? options.smoothness : 8; // 0 a 10
      this.radius = options.radius !== undefined ? options.radius : 16;
      this.dim = options.dim !== undefined ? options.dim : 10; // 0 a 10
      this.sensitivity = options.sensitivity !== undefined ? options.sensitivity : 5; // 0 a 10
      this.loop = options.loop !== false;
      this.onCardClick = options.onCardClick || null;
      this.autoDrift = options.autoDrift || 0; // se > 0, drift sutil quando idle

      // Estado de interpolação física
      this.target = 0;
      this.current = 0;
      this.width = 0;
      this.height = 0;
      this.isInteracting = false;
      this.isPaused = false;
      this.rafId = 0;
      this.lastTime = 0;

      // Estrutura DOM dos slides
      this.slides = [];
      this.slideNodes = [];

      this.init();
    }

    init() {
      // Estilização do container
      this.container.style.position = 'relative';
      this.container.style.width = '100%';
      this.container.style.overflow = 'hidden';
      this.container.style.cursor = 'grab';
      this.container.style.touchAction = 'pan-y';
      this.container.style.userSelect = 'none';
      this.container.style.webkitUserSelect = 'none';

      // ResizeObserver
      this.resizeObserver = new ResizeObserver((entries) => {
        if (!entries || !entries[0]) return;
        const rect = entries[0].contentRect;
        this.width = rect.width;
        this.height = rect.height;
        this.rebuildSlides();
      });
      this.resizeObserver.observe(this.container);

      const initialRect = this.container.getBoundingClientRect();
      this.width = initialRect.width || this.container.offsetWidth;
      this.height = initialRect.height || this.container.offsetHeight;

      this.rebuildSlides();
      this.bindEvents();

      // IntersectionObserver para pausar rAF quando fora do viewport
      if ('IntersectionObserver' in window) {
        this.intersectionObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            this.isPaused = !entry.isIntersecting;
            if (!this.isPaused && !this.rafId) {
              this.lastTime = performance.now();
              this.rafId = requestAnimationFrame(this.tick.bind(this));
            }
          });
        }, { threshold: 0.05 });
        this.intersectionObserver.observe(this.container);
      }

      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame(this.tick.bind(this));
    }

    rebuildSlides() {
      if (!this.items.length || this.width <= 0) return;

      // Limpa os nós existentes
      this.container.innerHTML = '';
      this.slideNodes = [];

      const step = this.getStep();
      const count = this.items.length;

      // Quantidade de repetições necessárias para wrap infinito sem costuras
      let repeats = 1;
      if (this.loop && this.width > 0 && step > 0) {
        repeats = Math.max(2, Math.ceil((this.width + step * 3) / (count * step)) + 1);
      }

      this.slides = [];
      for (let r = 0; r < repeats; r++) {
        for (let i = 0; i < count; i++) {
          this.slides.push({
            ...this.items[i],
            originalIndex: i
          });
        }
      }

      // Criação dos elementos DOM
      const fragment = document.createDocumentFragment();
      this.slides.forEach((item, idx) => {
        const slide = document.createElement('div');
        slide.className = 'originkit-slide group';
        slide.style.position = 'absolute';
        slide.style.top = '50%';
        slide.style.left = '0';
      const dims = this.getEffectiveDimensions();
      slide.style.width = `${dims.width}px`;
      slide.style.height = `${dims.height}px`;
        slide.style.borderRadius = `${this.radius}px`;
        slide.style.overflow = 'hidden';
        slide.style.willChange = 'transform, filter';
        slide.style.transform = 'translate3d(0, -50%, 0)';
        slide.style.cursor = 'pointer';
        slide.style.boxShadow = '0 12px 32px -8px rgba(0, 0, 0, 0.7)';
        slide.style.border = '1px solid rgba(255, 255, 255, 0.12)';
        slide.style.backgroundColor = '#12151c';

        slide.innerHTML = `
          <div class="relative w-full h-full overflow-hidden select-none">
            <img 
              src="${item.src}" 
              alt="${item.title || 'Projeto Arthur Quites'}"
              draggable="false" 
              loading="lazy"
              decoding="async"
              style="width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; user-select: none; pointer-events: none;"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none"></div>
            ${item.category || item.title ? `
              <div class="absolute bottom-0 inset-x-0 p-4 sm:p-5 flex flex-col justify-end text-left pointer-events-none transition-transform duration-300">
                ${item.category ? `<span class="inline-block text-[10px] font-mono font-bold uppercase tracking-wider text-[#ff6b00] mb-1">${item.category}</span>` : ''}
                ${item.title ? `<h3 class="text-white font-bold text-sm sm:text-base leading-tight drop-shadow-md line-clamp-2">${item.title}</h3>` : ''}
              </div>
            ` : ''}
          </div>
        `;

        slide.addEventListener('click', (e) => {
          if (this.dragDistance > 6) return; // Se estava arrastando, ignora clique
          if (typeof this.onCardClick === 'function') {
            this.onCardClick(item, idx, e);
          }
        });

        this.slideNodes.push(slide);
        fragment.appendChild(slide);
      });

      this.container.appendChild(fragment);
    }

    getEffectiveDimensions() {
      // Adaptação fluida para telas menores e smartphones
      if (this.width > 0 && this.width < 640) {
        const sw = Math.min(this.slideWidth, Math.round(this.width * 0.75));
        const sh = Math.round(sw * (this.slideHeight / this.slideWidth));
        return { width: sw, height: sh };
      }
      return { width: this.slideWidth, height: this.slideHeight };
    }

    getStep() {
      const dims = this.getEffectiveDimensions();
      return dims.width + clamp(this.spacing, 0, 10) * 20;
    }

    bindEvents() {
      // 1. Wheel / Trackpad
      const onWheel = (e) => {
        // Consome scroll quando o cursor está no slider para permitir deslizar horizontalmente
        e.preventDefault();
        const dominant = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        const wheelMultiplier = 0.4 + (clamp(this.sensitivity, 0, 10) / 10) * 1.2;
        this.target += dominant * wheelMultiplier;
      };
      this.container.addEventListener('wheel', onWheel, { passive: false });

      // 2. Pointer Drag (Mouse & Touch)
      let pointerId = null;
      let lastX = 0;
      let startX = 0;
      this.dragDistance = 0;

      const onPointerDown = (e) => {
        if (pointerId !== null) return;
        pointerId = e.pointerId;
        lastX = e.clientX;
        startX = e.clientX;
        this.dragDistance = 0;
        this.isInteracting = true;
        this.container.style.cursor = 'grabbing';
        this.container.setPointerCapture(e.pointerId);
      };

      const onPointerMove = (e) => {
        if (pointerId !== e.pointerId) return;
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        this.dragDistance += Math.abs(dx);

        const dragMultiplier = 0.6 + (clamp(this.sensitivity, 0, 10) / 10) * 1.8;
        const flip = this.direction === 'left';
        this.target += (flip ? dx : -dx) * dragMultiplier;
      };

      const onPointerUp = (e) => {
        if (pointerId !== e.pointerId) return;
        pointerId = null;
        this.isInteracting = false;
        this.container.style.cursor = 'grab';
        try {
          if (this.container.hasPointerCapture(e.pointerId)) {
            this.container.releasePointerCapture(e.pointerId);
          }
        } catch (_) {}
      };

      this.container.addEventListener('pointerdown', onPointerDown);
      this.container.addEventListener('pointermove', onPointerMove);
      this.container.addEventListener('pointerup', onPointerUp);
      this.container.addEventListener('pointercancel', onPointerUp);
    }

    tick(now) {
      if (this.isPaused) {
        this.rafId = 0;
        return;
      }
      this.rafId = requestAnimationFrame(this.tick.bind(this));

      const delta = this.lastTime ? Math.min((now - this.lastTime) / 1000, 0.1) : 1 / 60;
      this.lastTime = now;

      const count = this.slideNodes.length;
      const step = this.getStep();
      if (!count || step <= 0 || this.width <= 0) return;

      const span = count * step;

      // Auto-drift sutil quando não estiver arrastando
      if (this.autoDrift && !this.isInteracting) {
        this.target += this.autoDrift * delta * 60;
      }

      // Tratamento de looping infinito contínuo
      if (this.loop) {
        if (this.current > span || this.current < -span) {
          const shift = Math.trunc(this.current / span) * span;
          this.current -= shift;
          this.target -= shift;
        }
      } else {
        this.target = clamp(this.target, 0, (count - 1) * step);
      }

      // Lerp independente de framerate calibrado a 60fps (Física Originkit)
      const ease = 0.15 - (clamp(this.smoothness, 0, 10) / 10) * 0.13;
      const k = 1 - Math.pow(1 - ease, delta * 60);
      this.current += (this.target - this.current) * k;

      const dims = this.getEffectiveDimensions();
      const slideW = dims.width;
      const pad = (this.width - slideW) / 2;
      const half = this.width / 2;
      const dimAmount = (clamp(this.dim, 0, 10) / 10) * 0.85;
      const flip = this.direction === 'left';

      for (let i = 0; i < count; i++) {
        const node = this.slideNodes[i];
        if (!node) continue;

        const raw = i * step - this.current + pad;
        const x = this.loop ? wrap(raw + step, span) - step : raw;

        const distance = x + slideW / 2 - half;
        let scale;
        let push;

        if (distance > 0) {
          scale = Math.min(MAX_SCALE, 1 + distance / this.width);
          push = (scale - 1) * slideW * 0.75;
        } else {
          scale = Math.max(MIN_SCALE, 1 + distance / this.width);
          push = 0;
        }

        const left = flip ? this.width - slideW - (x + push) : x + push;
        node.style.transform = `translate3d(${left.toFixed(2)}px, -50%, 0) scale(${scale.toFixed(3)})`;

        // Efeito de escurecimento (dim) nos slides que se afastam
        if (dimAmount > 0 && scale < 1) {
          const t = (1 - scale) / Math.max(0.001, 1 - MIN_SCALE);
          node.style.filter = `brightness(${(1 - t * dimAmount).toFixed(3)})`;
        } else {
          node.style.filter = 'none';
        }
      }
    }

    stepPrev() {
      this.target -= this.getStep();
    }

    stepNext() {
      this.target += this.getStep();
    }

    setDirection(dir) {
      this.direction = dir;
    }

    destroy() {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      if (this.resizeObserver) this.resizeObserver.disconnect();
      if (this.intersectionObserver) this.intersectionObserver.disconnect();
      this.container.innerHTML = '';
    }
  }

  global.SmoothScrollSlider = {
    create: (container, options) => new SmoothScrollSliderInstance(container, options)
  };

})(window);
