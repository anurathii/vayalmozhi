/* ============================================================
   VayalMozhi — Main Application (Routing & Navigation)
   ============================================================ */

const App = (() => {
  const pages = ['home', 'marketplace', 'prices', 'disease', 'schemes', 'login', 'profile', 'sellers'];
  let currentPage = 'home';

  function init() {
    setupNavigation();
    setupHamburger();
    Auth.init();
    
    // Initialize I18n
    if (typeof I18n !== 'undefined') I18n.init();
    setupLanguageToggles();
    
    // Hash routing
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  function handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'home';
    const page = pages.includes(hash) ? hash : 'home';
    showPage(page);
  }

  function showPage(page) {
    currentPage = page;

    // Hide all sections
    document.querySelectorAll('.page-section').forEach(section => {
      section.classList.remove('active');
    });

    // Show target section
    const target = document.getElementById(`page-${page}`);
    if (target) {
      target.classList.add('active');
    }

    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-page') === page) {
        link.classList.add('active');
      }
    });

    // Close mobile menu
    const navLinks = document.getElementById('nav-links');
    const hamburger = document.getElementById('hamburger-btn');
    if (navLinks) navLinks.classList.remove('open');
    if (hamburger) hamburger.classList.remove('open');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Trigger page-specific init
    switch (page) {
      case 'marketplace':
        if (typeof Marketplace !== 'undefined') Marketplace.init();
        break;
      case 'prices':
        if (typeof Prices !== 'undefined') Prices.init();
        break;
      case 'schemes':
        if (typeof Schemes !== 'undefined') Schemes.init();
        break;
      case 'sellers':
        // Sellers logic is handled by Marketplace.viewSellers
        break;
    }
    
    // Always update UI translations when page changes
    if (typeof I18n !== 'undefined') I18n.updateUI();
  }

  function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const page = link.getAttribute('data-page');
        if (page) {
          // hash change will trigger handleRoute
        }
      });
    });
  }

  function setupHamburger() {
    const hamburger = document.getElementById('hamburger-btn');
    const navLinks = document.getElementById('nav-links');

    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        navLinks.classList.toggle('open');
      });
    }
  }

  function setupLanguageToggles() {
    document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lang = btn.getAttribute('data-lang');
        if (typeof I18n !== 'undefined') {
          I18n.setLanguage(lang);
          
          // Sync voice module if needed
          if (typeof Voice !== 'undefined' && Voice.setLanguage) {
            Voice.setLanguage(lang === 'ta' ? 'ta-IN' : 'en-IN');
          }
        }
      });
    });
  }

  // Global notification system
  function notify(title, message, type = 'success') {
    if (type === 'error') return; // Suppress errors entirely
    const notification = document.getElementById('notification');
    const titleEl = document.getElementById('notification-title');
    const messageEl = document.getElementById('notification-message');

    if (!notification) return;

    notification.className = 'neo-notification';
    notification.classList.add(type);

    titleEl.textContent = title;
    messageEl.textContent = message;

    // Show
    requestAnimationFrame(() => {
      notification.classList.add('visible');
    });

    // Auto-hide after 4 seconds
    setTimeout(() => {
      notification.classList.remove('visible');
    }, 4000);
  }

  // API helper
  async function api(url, options = {}) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Format currency
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  return { init, notify, api, formatCurrency, showPage };
})();

// Initialize app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
