/* ============================================================
   VayalMozhi — Government Schemes Module
   ============================================================ */

const Schemes = (() => {
  let schemes = [];
  let initialized = false;

  function init() {
    if (!initialized) {
      setupEventListeners();
      initialized = true;
    }
    loadSchemes();
  }

  function setupEventListeners() {
    const searchInput = document.getElementById('schemes-search');
    if (searchInput) {
      let debounce;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => loadSchemes(), 300);
      });
    }
    
    // Global I18n listener
    window.addEventListener('languageChanged', () => renderSchemes());
  }

  async function loadSchemes() {
    const search = document.getElementById('schemes-search')?.value || '';
    const params = new URLSearchParams();
    if (search) params.set('search', search);

    try {
      schemes = await App.api(`/api/schemes?${params.toString()}`);
      renderSchemes();
    } catch (error) {
      App.notify('Error', 'Failed to load schemes', 'error');
    }
  }

  function renderSchemes() {
    const grid = document.getElementById('schemes-grid');
    const empty = document.getElementById('schemes-empty');

    if (!grid) return;

    if (schemes.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }

    if (empty) empty.style.display = 'none';

    const colors = ['#00A878', '#3A86FF', '#FF6B35', '#7B2FBE', '#FF006E', '#FFD700', '#00E5FF', '#E63946'];

    const lang = typeof I18n !== 'undefined' ? I18n.getLang() : 'en';
    const t = (obj, key) => lang === 'ta' && obj[`${key}_ta`] ? obj[`${key}_ta`] : obj[key];

    grid.innerHTML = schemes.map((scheme, index) => {
      const color = colors[index % colors.length];
      const isFav = Auth.getUser() && Auth.getFavorites().some(f => f.id === scheme.id);
      
      return `
        <div class="scheme-card">
          <div class="scheme-card-header" style="background-color: ${color};">
            <h4>${t(scheme, 'title')}</h4>
            ${Auth.getUser() && Auth.getUser().role === 'consumer' ? `
              <button class="favorite-btn ${isFav ? 'active' : ''}" onclick='Auth.toggleFavorite(${JSON.stringify(scheme).replace(/'/g, "\\'")})'>
                <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.5" width="20" height="20">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
              </button>
            ` : ''}
          </div>
          <div class="scheme-card-body">
            <div class="scheme-detail">
              <div class="scheme-detail-label" data-en="Description" data-ta="விளக்கம்">Description</div>
              <p>${t(scheme, 'description')}</p>
            </div>
            <div class="scheme-detail">
              <div class="scheme-detail-label" data-en="Eligibility" data-ta="தகுதி">Eligibility</div>
              <p>${t(scheme, 'eligibility')}</p>
            </div>
            <div class="scheme-detail">
              <div class="scheme-detail-label" data-en="Benefits" data-ta="நன்மைகள்">Benefits</div>
              <p>${t(scheme, 'benefits')}</p>
            </div>
          </div>
          <div class="scheme-card-footer">
            <a href="${scheme.link}" target="_blank" rel="noopener noreferrer" class="neo-btn neo-btn-sm neo-btn-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              <span data-en="Learn More" data-ta="மேலும் அறிய">Learn More</span>
            </a>
          </div>
        </div>
      `;
    }).join('');

    if (typeof I18n !== 'undefined') I18n.updateUI();
  }

  return { init };
})();
