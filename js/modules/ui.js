// UI, navigation and common helpers
(function () {
  // Keep upload and saved-looks protected, but allow unauthenticated users
  // to access the virtual-tryon styling flow (choice UX) without forcing login.
  const PROTECTED_PAGES = ['upload', 'saved-looks'];

  function setNavLock(ms = 3000) {
    if (!window.__navGuard) window.__navGuard = { lockUntil: 0, lastPage: null };
    window.__navGuard.lockUntil = Date.now() + ms;
    console.log('[navLock] set until', new Date(window.__navGuard.lockUntil).toISOString());
  }

  function showAuthRequiredModal(requestedPage) {
    // keep same behaviour as original: create modal and route to login/register
    const id = 'authRequiredModal';
    let modalEl = document.getElementById(id);
    if (modalEl) {
      const bs = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      bs.show();
      return;
    }

    modalEl = document.createElement('div');
    modalEl.id = id;
    modalEl.className = 'modal fade';
    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Login / Register Required</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>To use this feature you must have an account. Please sign up or login to continue.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Stay on Home</button>
            <button type="button" class="btn btn-outline-primary" id="goRegisterBtn">Register</button>
            <button type="button" class="btn btn-primary" id="goLoginBtn">Login</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    document.getElementById('goLoginBtn').addEventListener('click', () => {
      bsModal.hide();
      showPage('login');
    });
    document.getElementById('goRegisterBtn').addEventListener('click', () => {
      bsModal.hide();
      showPage('register');
    });

    modalEl.addEventListener('hidden.bs.modal', () => {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.remove();
      }, 300);
    });
  }

  function isUserAuthenticated() {
    try {
      if (typeof api !== 'undefined' && typeof api.isAuthenticated === 'function') return !!api.isAuthenticated();
    } catch (e) { /* ignore */ }
    return !!(localStorage.getItem('token') || localStorage.getItem('authToken'));
  }

  function showPage(pageId) {
    if (!pageId) return;
    if (PROTECTED_PAGES.includes(pageId) && !isUserAuthenticated()) {
      showAuthRequiredModal(pageId);
      return;
    }

    document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
    const target = document.getElementById(pageId);
    if (target) {
      target.style.display = 'block';
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (pageId === 'virtual-tryon') {
        if (typeof initializeVirtualTryOnPage === 'function') {
          try { initializeVirtualTryOnPage(); } catch (err) { console.error(err); }
        }
      }
      return;
    }

    const home = document.getElementById('home');
    if (home) { home.style.display = 'block'; home.classList.add('active'); }
  }

  function showNotification(message, type = 'info') {
    const existing = document.querySelector('.custom-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `custom-notification notification-${type}`;
    const icons = { success: 'check-circle', error: 'exclamation-circle', warning: 'exclamation-triangle', info: 'info-circle' };
    notification.innerHTML = `
      <i class="fas fa-${icons[type]} me-2"></i>
      <span>${message}</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  function initializeAnimations() {
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, observerOptions);
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  }

  // expose globals
  window.showPage = showPage;
  window.setNavLock = setNavLock;
  window.showNotification = showNotification;
  window.isUserAuthenticated = isUserAuthenticated;
  window.initializeAnimations = initializeAnimations;
})();

// Attach some delegated controls that were previously inline in main.js
(function attachVitonControls() {
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest && t.closest('#backToStyleBtn')) {
      e.preventDefault();
      const prod = document.getElementById('productRecommendations');
      const style = document.getElementById('styleOptionsSection');
      if (prod) prod.style.display = 'none';
      if (style) style.style.display = 'block';
      const pg = document.getElementById('productGrid');
      if (pg) pg.innerHTML = '';
      return;
    }

    if (t.closest && t.closest('#backToRecommendationsBtn')) {
      e.preventDefault();
      const viton = document.getElementById('vitonResult');
      const products = document.getElementById('productRecommendations');
      if (viton) viton.style.display = 'none';
      if (products) products.style.display = 'block';
      return;
    }

    if (t.closest && t.closest('#saveLookBtn')) {
      e.preventDefault();
      try { if (typeof saveLook === 'function') saveLook(e); } catch (err) { console.error(err); }
      return;
    }

    if (t.closest && t.closest('#shareLookBtn')) {
      e.preventDefault();
      try {
        const shareData = { title: 'My VITON Result', text: 'Check my try-on result', url: window.location.href };
        if (navigator.share) { navigator.share(shareData).catch(()=>{}); }
        else { navigator.clipboard.writeText(shareData.url).then(()=> showNotification('Result link copied to clipboard','success')); }
      } catch (err) { console.error(err); showNotification('Unable to share', 'error'); }
      return;
    }
  });
})();
