/**
 * VapeScout UK - Main JavaScript
 */
(function() {
  'use strict';

  // Age Verification
  const AgeGate = {
    storageKey: 'vapescout_age_verified',
    exitUrl: 'https://www.nhs.uk/live-well/quit-smoking/',
    
    init() {
      const ageGate = document.getElementById('age-gate');
      if (!ageGate) return;
      if (this.isVerified()) { this.hide(); return; }
      this.show();
      document.getElementById('age-verify-yes')?.addEventListener('click', () => this.verify());
      document.getElementById('age-verify-no')?.addEventListener('click', () => this.deny());
      document.body.style.overflow = 'hidden';
    },
    
    isVerified() {
      try { return localStorage.getItem(this.storageKey) === 'true'; }
      catch (e) { return sessionStorage.getItem(this.storageKey) === 'true'; }
    },
    
    verify() {
      try { localStorage.setItem(this.storageKey, 'true'); }
      catch (e) { sessionStorage.setItem(this.storageKey, 'true'); }
      this.hide();
    },
    
    deny() { window.location.href = this.exitUrl; },
    
    show() {
      const ageGate = document.getElementById('age-gate');
      if (ageGate) { ageGate.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
    },
    
    hide() {
      const ageGate = document.getElementById('age-gate');
      if (ageGate) { ageGate.classList.add('hidden'); document.body.style.overflow = ''; }
    }
  };

  // Mobile Navigation
  const Navigation = {
    init() {
      const toggle = document.getElementById('nav-toggle');
      const nav = document.getElementById('nav-main');
      if (!toggle || !nav) return;
      
      toggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('active');
        toggle.setAttribute('aria-expanded', isOpen);
        toggle.classList.toggle('active', isOpen);
      });
      
      nav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          nav.classList.remove('active');
          toggle.classList.remove('active');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  };

  // Search
  const Search = {
    init() {
      const searchForm = document.querySelector('.search-box');
      const searchInput = document.querySelector('.search-input');
      if (!searchForm || !searchInput) return;
      
      searchForm.addEventListener('submit', (e) => {
        if (!searchInput.value.trim()) { e.preventDefault(); searchInput.focus(); }
      });
    }
  };

  // Cookie Consent
  const CookieConsent = {
    storageKey: 'vapescout_cookies_accepted',
    
    init() {
      if (this.hasConsent()) return;
      const banner = document.createElement('div');
      banner.id = 'cookie-banner';
      banner.innerHTML = '<div style="position:fixed;bottom:0;left:0;right:0;background:var(--bg-secondary);border-top:1px solid var(--border-color);padding:var(--space-4);z-index:999;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--space-4)"><p style="margin:0;flex:1;min-width:300px;font-size:var(--text-sm);color:var(--text-secondary)">We use cookies to improve your experience. <a href="/legal/cookies.html">Learn more</a></p><button class="btn btn-sm btn-primary" id="cookie-accept">Accept</button></div>';
      document.body.appendChild(banner);
      document.getElementById('cookie-accept')?.addEventListener('click', () => { this.accept(); banner.remove(); });
    },
    
    hasConsent() { try { return localStorage.getItem(this.storageKey) === 'true'; } catch (e) { return false; } },
    accept() { try { localStorage.setItem(this.storageKey, 'true'); } catch (e) {} }
  };

  // Initialize
  function init() {
    AgeGate.init();
    Navigation.init();
    Search.init();
    CookieConsent.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.VapeScout = { AgeGate };
})();
