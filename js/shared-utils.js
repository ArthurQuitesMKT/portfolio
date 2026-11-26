/**
 * Utilitários Compartilhados de Performance & Acessibilidade — Portfólio Arthur Quites
 * Módulo Centralizado DRY (Não-duplicação de código entre páginas)
 */

(function (global) {
  'use strict';

  // Ofuscação de dados sensíveis contra raspadores de código-fonte
  const ENCODED_EMAIL = 'YXJ0aHVycXVpdGVzMkBnbWFpbC5jb20=';

  function getContactEmail() {
    try {
      return atob(ENCODED_EMAIL);
    } catch (_) {
      return '';
    }
  }

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

  function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback seguro para WebViews de redes sociais, HTTP local e navegadores legados
    return new Promise((resolve, reject) => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) resolve();
        else reject(new Error('execCommand copy failed'));
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Utilitário Sênior de Acessibilidade: Focus Trap (Prende a navegação Tab dentro de Modais/Drawers)
   */
  function trapFocusInContainer(e, container) {
    if (e.key !== 'Tab' || !container) return;
    const focusableSelectors = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(container.querySelectorAll(focusableSelectors)).filter(
      el => !el.closest('.hidden') && el.offsetParent !== null
    );
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /**
   * Utilitário Unificado de Feedback Visual: Toast Notification (DRY)
   */
  function showToastNotification(toastEl, message, duration = 3000) {
    if (!toastEl) return;
    if (message) {
      const msgSpan = toastEl.querySelector('.toast-message, span:last-child');
      if (msgSpan) msgSpan.textContent = message;
    }
    toastEl.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
    toastEl.classList.add('opacity-100', 'translate-y-0');

    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => {
      toastEl.classList.remove('opacity-100', 'translate-y-0');
      toastEl.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
    }, duration);
  }

  global.PortfolioUtils = {
    getContactEmail,
    escapeHTML,
    copyTextToClipboard,
    trapFocusInContainer,
    showToastNotification
  };
})(window);
