/**
 * Utilitários Compartilhados de Performance & Acessibilidade — Portfólio Arthur Quites
 * Módulo Centralizado DRY (Não-duplicação de código entre páginas)
 */

(function (global) {
  'use strict';

  // Ofuscação de dados sensíveis contra raspadores de código-fonte
  const ENCODED_EMAIL = 'YXJ0aHVycXVpdGVzMkBnbWFpbC5jb20='; // arthurquites2@gmail.com

  function getContactEmail() {
    try {
      return atob(ENCODED_EMAIL);
    } catch (_) {
      return 'arthurquites2@gmail.com';
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

  global.PortfolioUtils = {
    getContactEmail,
    escapeHTML,
    copyTextToClipboard
  };
})(window);
