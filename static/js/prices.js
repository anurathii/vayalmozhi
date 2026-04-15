/* ============================================================
   VayalMozhi — Market Prices Module
   ============================================================ */

const Prices = (() => {
  let prices = [];
  let viewMode = 'cards'; // 'cards' or 'table'
  let initialized = false;

  function init() {
    if (!initialized) {
      setupEventListeners();
      initialized = true;
    }
    loadPrices();
  }

  function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('prices-search');
    if (searchInput) {
      let debounce;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => loadPrices(), 300);
      });
    }

    // View toggle
    const toggleBtn = document.getElementById('prices-view-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        viewMode = viewMode === 'cards' ? 'table' : 'cards';
        toggleBtn.innerHTML = viewMode === 'cards'
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> Cards`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> Table`;
        renderPrices();
      });
    }

    // Global I18n listener
    window.addEventListener('languageChanged', () => renderPrices());
  }

  async function loadPrices() {
    const search = document.getElementById('prices-search')?.value || '';
    const params = new URLSearchParams();
    if (search) params.set('search', search);

    try {
      prices = await App.api(`/api/prices?${params.toString()}`);
      renderPrices();
    } catch (error) {
      App.notify('Error', 'Failed to load market prices', 'error');
    }
  }

  function renderPrices() {
    const cardView = document.getElementById('prices-card-view');
    const tableView = document.getElementById('prices-table-view');
    const tableBody = document.getElementById('prices-table-body');
    const empty = document.getElementById('prices-empty');

    if (prices.length === 0) {
      if (cardView) cardView.innerHTML = '';
      if (tableBody) tableBody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }

    if (empty) empty.style.display = 'none';

    if (viewMode === 'cards') {
      if (cardView) cardView.style.display = '';
      if (tableView) tableView.style.display = 'none';
      renderCardView();
    }
    
    if (typeof I18n !== 'undefined') I18n.updateUI();
  }

  function renderCardView() {
    const container = document.getElementById('prices-card-view');
    if (!container) return;

    const lang = typeof I18n !== 'undefined' ? I18n.getLang() : 'en';
    const t = (obj, key) => lang === 'ta' && obj[`${key}_ta`] ? obj[`${key}_ta`] : obj[key];

    container.innerHTML = prices.map(price => {
      const trendClass = price.trend === 'up' ? 'trend-up' : 'trend-down';
      const trendArrow = price.trend === 'up'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>';
      const changeSign = price.change > 0 ? '+' : '';

      return `
        <div class="price-card">
          <div class="price-crop-info">
            <h4>${t(price, 'crop')}</h4>
            <div class="price-market">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" style="display:inline;vertical-align:middle;margin-right:4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${t(price, 'market')}
            </div>
          </div>
          <div class="price-value-section">
            <div class="price-amount">${App.formatCurrency(price.price)}</div>
            <div style="font-size: 0.7rem; color: var(--color-gray-500); margin-bottom: 4px;">${t(price, 'unit')}</div>
            <span class="trend-indicator ${trendClass}">
              ${trendArrow} ${changeSign}${price.change}%
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderTableView() {
    const tbody = document.getElementById('prices-table-body');
    if (!tbody) return;

    const lang = typeof I18n !== 'undefined' ? I18n.getLang() : 'en';
    const t = (obj, key) => lang === 'ta' && obj[`${key}_ta`] ? obj[`${key}_ta`] : obj[key];

    tbody.innerHTML = prices.map(price => {
      const trendClass = price.trend === 'up' ? 'trend-up' : 'trend-down';
      const trendArrow = price.trend === 'up'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>';
      const changeSign = price.change > 0 ? '+' : '';

      return `
        <tr>
          <td><strong>${t(price, 'crop')}</strong></td>
          <td>${t(price, 'market')}</td>
          <td><strong>${App.formatCurrency(price.price)}</strong></td>
          <td>${t(price, 'unit')}</td>
          <td><span class="trend-indicator ${trendClass}">${trendArrow} ${changeSign}${price.change}%</span></td>
          <td>${price.date}</td>
        </tr>
      `;
    }).join('');
  }

  return { init };
})();
