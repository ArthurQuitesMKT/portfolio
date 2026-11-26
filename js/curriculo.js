/**
 * Currículo Interativo — Arthur Quites
 * Módulo de Interatividade & UX (Isolado de Scripts Inline para conformidade estrita com CSP)
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }

    // Efeito Spotlight suave nos cards do currículo
    document.addEventListener('mousemove', (e) => {
      const card = e.target.closest('.print-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    }, { passive: true });

    // Botão de imprimir / salvar PDF
    const printBtn = document.getElementById('btn-print-curriculo') || document.querySelector('[data-action="print"]');
    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }

    // Listener para botão de copiar e-mail
    const copyBtn = document.getElementById('btn-copiar-email-curriculo') || document.querySelector('[data-copy-curriculo-email]');
    if (copyBtn) {
      copyBtn.addEventListener('click', copiarEmailCurriculo);
    }
  });

  function showCurriculoToast(msg) {
    const toast = document.getElementById('toast-curriculo');
    if (window.PortfolioUtils && typeof window.PortfolioUtils.showToastNotification === 'function') {
      window.PortfolioUtils.showToastNotification(toast, msg, 3000);
      return;
    }
    if (!toast) return;

    if (msg) {
      const msgSpan = toast.querySelector('span');
      if (msgSpan) msgSpan.textContent = msg;
    }

    toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
    toast.classList.add('opacity-100', 'translate-y-0');

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
    }, 3000);
  }

  function copiarEmailCurriculo() {
    const email = window.PortfolioUtils ? window.PortfolioUtils.getContactEmail() : 'arthurquites2@gmail.com';
    const copyFn = (window.PortfolioUtils && window.PortfolioUtils.copyTextToClipboard)
      ? window.PortfolioUtils.copyTextToClipboard
      : (text) => navigator.clipboard.writeText(text);

    copyFn(email)
      .then(() => {
        showCurriculoToast('E-mail copiado para a área de transferência!');
      })
      .catch((err) => {
        console.warn('Falha na cópia automática:', err);
        showCurriculoToast('E-mail: ' + email);
      });
  }

  // Exporta para escopo global caso algum elemento ainda chame por referência
  window.copiarEmailCurriculo = copiarEmailCurriculo;
})();
