/* ============================================================
   VayalMozhi — Internationalization (i18n) Utility
   ============================================================ */

const I18n = (() => {
  let currentLang = localStorage.getItem('vayalmozhi_lang') || 'en';

  const translations = {
    en: {
      nav_home: "Home",
      nav_marketplace: "Marketplace",
      nav_prices: "Market Prices",
      nav_disease: "Disease Detect",
      nav_schemes: "Govt Schemes",
      nav_login: "Login",
      nav_profile: "Profile",
      hero_title: "Empowering Farmers Through Technology",
      hero_subtitle: "Access market prices, detect crop diseases, and explore government schemes - all in one professional platform.",
      get_started: "Get Started",
      explore_market: "Explore Marketplace",
      add_to_cart: "Add to Cart",
      contact_seller: "Contact Sellers",
      delete_listing: "Delete Listing",
      my_listings: "My Listings",
      my_cart: "My Cart",
      saved_schemes: "Saved Schemes",
      no_items: "No items found."
    },
    ta: {
      nav_home: "முகப்பு",
      nav_marketplace: "சந்தை",
      nav_prices: "சந்தை விலைகள்",
      nav_disease: "நோய் கண்டறிதல்",
      nav_schemes: "அரசு திட்டங்கள்",
      nav_login: "உள்நுழை",
      nav_profile: "சுயவிவரம்",
      hero_title: "தொழில்நுட்பம் மூலம் விவசாயிகளை மேம்படுத்துதல்",
      hero_subtitle: "சந்தை விலைகள், பயிர் நோய்கள் மற்றும் அரசு திட்டங்களை ஒரே இடத்தில் அணுகுங்கள்.",
      get_started: "தொடங்கவும்",
      explore_market: "சந்தையை ஆராயுங்கள்",
      add_to_cart: "கூடையில் சேர்",
      contact_seller: "விற்பனையாளர்களைத் தொடர்பு கொள்க",
      delete_listing: "பட்டியலை நீக்கு",
      my_listings: "எனது பட்டியல்கள்",
      my_cart: "எனது கூடை",
      saved_schemes: "சேமிக்கப்பட்ட திட்டங்கள்",
      no_items: "பொருட்கள் எதுவும் இல்லை."
    }
  };

  function init() {
    updateUI();
    setupToggle();
  }

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('vayalmozhi_lang', lang);
    updateUI();
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
  }

  function updateUI() {
    // 1. Update elements with data-en/data-ta
    const attr = currentLang === 'ta' ? 'data-ta' : 'data-en';
    document.querySelectorAll(`[${attr}]`).forEach(el => {
      const text = el.getAttribute(attr);
      if (text) {
        // For input elements, update placeholder instead of textContent
        if (el.tagName === 'INPUT' && el.type !== 'hidden' && el.type !== 'submit') {
          el.placeholder = text;
        } else {
          el.textContent = text;
        }
      }
    });

    // 2. Update elements with data-i18n keys
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[currentLang][key]) {
        el.textContent = translations[currentLang][key];
      }
    });

    // 3. Update toggle buttons state
    document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
    });

    // 4. Update HTML lang attribute
    document.documentElement.lang = currentLang;
  }

  function setupToggle() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('lang-toggle-btn')) {
        setLanguage(e.target.getAttribute('data-lang'));
      }
    });
  }

  function getLang() { return currentLang; }
  function t(key) { return translations[currentLang][key] || key; }

  return { init, setLanguage, getLang, t, updateUI };
})();
