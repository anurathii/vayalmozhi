/* ============================================================
   VayalMozhi — Marketplace Module
   ============================================================ */

const Marketplace = (() => {
  let products = [];
  let currentCategory = 'All';
  let initialized = false;

  function init() {
    if (!initialized) {
      setupEventListeners();
      initialized = true;
    }
    updateActions();
    loadProducts();
  }

  function updateActions() {
    const addBtn = document.getElementById('add-product-btn');
    if (!addBtn) return;
    addBtn.style.display = Auth.isFarmer() ? 'inline-flex' : 'none';
  }

  function setupEventListeners() {
    const filterBtns = document.querySelectorAll('#marketplace-filters .filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-category');
        loadProducts();
      });
    });

    const searchInput = document.getElementById('marketplace-search');
    if (searchInput) {
      let debounce;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => loadProducts(), 300);
      });
    }

    const addBtn = document.getElementById('add-product-btn');
    const modal = document.getElementById('add-product-modal');
    const closeBtn = document.getElementById('close-product-modal');

    if (addBtn) addBtn.addEventListener('click', () => modal.classList.add('visible'));
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('visible'));
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('visible'); });

    // Rental toggle in Add Product form
    const categorySelect = document.getElementById('product-category');
    const rentalGroup = document.getElementById('rental-option-group');
    const rentalCheckbox = document.getElementById('product-rental');
    const rentalFields = document.getElementById('rental-fields');

    if (categorySelect && rentalGroup) {
      categorySelect.addEventListener('change', () => {
        rentalGroup.style.display = categorySelect.value === 'Machinery' ? 'block' : 'none';
      });
    }
    if (rentalCheckbox && rentalFields) {
      rentalCheckbox.addEventListener('change', () => {
        rentalFields.style.display = rentalCheckbox.checked ? 'block' : 'none';
      });
    }

    const form = document.getElementById('add-product-form');
    if (form) form.addEventListener('submit', handleAddProduct);

    const contactModal = document.getElementById('contact-modal');
    const closeContact = document.getElementById('close-contact-modal');
    if (closeContact) closeContact.addEventListener('click', () => contactModal.classList.remove('visible'));
    if (contactModal) contactModal.addEventListener('click', (e) => { if (e.target === contactModal) contactModal.classList.remove('visible'); });

    // Global I18n listener
    window.addEventListener('languageChanged', () => renderProducts());
  }

  async function loadProducts() {
    const search = document.getElementById('marketplace-search')?.value || '';
    const params = new URLSearchParams();
    if (currentCategory !== 'All') params.set('category', currentCategory);
    if (search) params.set('search', search);
    try {
      products = await App.api(`/api/products?${params.toString()}`);
      renderProducts();
    } catch (error) {
      console.error('Failed to load products', error);
    }
  }

  async function viewSellers(title) {
    const allProducts = await App.api('/api/products');
    const sellers = allProducts.filter(p => p.title === title);
    window.location.hash = 'sellers';
    setTimeout(() => { renderSellerDirectory(sellers, title); }, 100);
  }

  function renderSellerDirectory(sellers, title) {
    const list = document.getElementById('seller-directory-list');
    const titleEl = document.getElementById('seller-directory-subtitle');
    if (!list) return;
    
    if (titleEl) titleEl.textContent = title;

    const lang = typeof I18n !== 'undefined' ? I18n.getLang() : 'en';
    const t = (obj, key) => lang === 'ta' && obj[`${key}_ta`] ? obj[`${key}_ta`] : obj[key];

    list.innerHTML = sellers.map(s => `
      <div class="seller-item">
        <div class="seller-info">
          <h4>${s.seller}</h4>
          <p class="text-sm" style="color:var(--color-gray-500);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14" style="vertical-align:middle; margin-right:4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${t(s, 'location')}
          </p>
        </div>
        <div class="seller-price-big">${App.formatCurrency(s.price)}</div>
        <a href="tel:${s.phone}" class="neo-btn neo-btn-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
          <span data-en="Call" data-ta="அழைக்க">Call</span>
        </a>
      </div>
    `).join('');
    if (typeof I18n !== 'undefined') I18n.updateUI();
  }

  // Star rating HTML
  function renderStars(rating, count, productId) {
    const r = rating || 0;
    let html = '<div class="star-rating">';
    for (let i = 1; i <= 5; i++) {
      html += `<span class="star ${i <= Math.round(r) ? 'filled' : ''}" data-star="${i}" data-product="${productId}">★</span>`;
    }
    html += `<span class="rating-text">${r.toFixed(1)} (${count || 0})</span></div>`;
    return html;
  }

  async function rateProduct(productId, stars) {
    if (!Auth.getUser()) { App.notify('Login Required', 'Please login to rate products.'); return; }
    try {
      await App.api(`/api/products/${productId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: stars, user_id: Auth.getUser().id })
      });
      App.notify('Rated!', `You rated this product ${stars} stars.`);
      loadProducts();
    } catch (e) { console.error('Rating failed', e); }
  }

  function renderProducts() {
    const grid = document.getElementById('products-grid');
    const empty = document.getElementById('marketplace-empty');
    if (!grid) return;

    if (products.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    const lang = typeof I18n !== 'undefined' ? I18n.getLang() : 'en';
    const t = (obj, key) => lang === 'ta' && obj[`${key}_ta`] ? obj[`${key}_ta`] : obj[key];

    grid.innerHTML = products.map(product => {
      const categoryColors = { 'Livestock':'orange', 'Seeds':'green', 'Fertilizers':'blue', 'Machinery':'gold', 'Crops':'pink' };
      const badgeClass = `neo-badge-${categoryColors[product.category] || 'gold'}`;

      const imageContent = product.image
        ? `<img src="${product.image}" alt="${product.title}" onerror="this.onerror=null; this.src='/static/images/product_fallback.png';">`
        : `<div class="category-icon-placeholder" data-category="${product.category}"><span>${t(product, 'category')}</span></div>`;

      const rentalBadge = product.rental_available
        ? `<span class="rental-badge" data-en="Available for Rent" data-ta="வாடகைக்கு கிடைக்கும்">${lang==='ta'?'வாடகைக்கு கிடைக்கும்':'Available for Rent'}</span>` : '';

      const rentalPrice = (product.rental_available && product.rental_price)
        ? `<div class="rental-price-tag"><span data-en="Rent:" data-ta="வாடகை:">${lang==='ta'?'வாடகை:':'Rent:'}</span> ${App.formatCurrency(product.rental_price)} <span class="product-unit">/ ${t(product, 'rental_unit') || (lang==='ta'?'நாளைக்கு':'per day')}</span></div>` : '';

      return `
        <div class="neo-card product-card">
          <div class="card-image">
            ${imageContent}
            <span class="neo-badge ${badgeClass}">${t(product, 'category')}</span>
            ${rentalBadge}
          </div>
          <div class="card-title">${t(product, 'title')}</div>
          <div class="card-subtitle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="display:inline;vertical-align:middle;margin-right:4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${t(product, 'location')}
          </div>
          <div class="card-desc">${truncate(t(product, 'description'), 100)}</div>
          ${renderStars(product.rating, product.rating_count, product.id)}
          <div class="product-price">
            ${App.formatCurrency(product.price)}
            <span class="product-unit">/ ${t(product, 'unit')}</span>
          </div>
          ${rentalPrice}
          <div class="product-actions" style="margin-top:var(--space-4);">
            ${Auth.getUser() && product.seller_id == Auth.getUser().id ? `
              <button class="neo-btn neo-btn-sm neo-btn-error neo-btn-block" onclick="Marketplace.deleteProduct(${product.id})">
                <span data-en="Delete Listing" data-ta="பட்டியலை நீக்கு">Delete Listing</span>
              </button>
            ` : `
              <div style="display:flex; gap:var(--space-2);">
                <button class="neo-btn neo-btn-sm neo-btn-primary neo-btn-block" onclick="Marketplace.viewSellers('${product.title.replace(/'/g, "\\'")}')">
                  <span data-en="Contact Sellers" data-ta="விற்பனையாளர்களைத் தொடர்பு கொள்க">Contact Sellers</span>
                </button>
                ${Auth.getUser() && Auth.getUser().role === 'consumer' ? `
                  <button class="neo-btn neo-btn-sm neo-btn-success" title="Add to Cart" onclick='Auth.addToCart(${JSON.stringify(product).replace(/'/g, "\\'")})'>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
                  </button>
                ` : ''}
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');

    // Star click handlers
    grid.querySelectorAll('.star').forEach(star => {
      star.addEventListener('click', () => {
        rateProduct(parseInt(star.dataset.product), parseInt(star.dataset.star));
      });
    });
    
    if (typeof I18n !== 'undefined') I18n.updateUI();
  }

  function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  }

  function contactSeller(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    document.getElementById('contact-seller-name').textContent = product.seller || 'N/A';
    document.getElementById('contact-product-name').textContent = product.title;
    document.getElementById('contact-phone').textContent = product.phone || 'N/A';
    const callBtn = document.getElementById('contact-call-btn');
    if (callBtn && product.phone) callBtn.href = `tel:${product.phone.replace(/\s/g, '')}`;
    document.getElementById('contact-modal').classList.add('visible');
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    if (!Auth.isFarmer()) { App.notify('Permission Denied', 'Only Farmers can list products.', 'error'); return; }
    const form = e.target;
    const formData = new FormData(form);
    const user = Auth.getUser();
    if (user) formData.append('seller_id', user.id);
    try {
      const response = await fetch('/api/products', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add product');
      App.notify('Success', 'Product listed successfully!');
      document.getElementById('add-product-modal').classList.remove('visible');
      form.reset();
      const rg = document.getElementById('rental-option-group');
      if (rg) rg.style.display = 'none';
      loadProducts();
    } catch (error) { App.notify('Error', error.message, 'error'); }
  }

  async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      const response = await App.api(`/api/products/${productId}`, { method: 'DELETE' });
      App.notify('Deleted', response.message || 'Product removed successfully.');
      loadProducts();
      if (window.location.hash === '#profile' && typeof Auth !== 'undefined') Auth.renderProfile();
    } catch (error) { App.notify('Error', error.message || 'Failed to delete product', 'error'); }
  }

  return { init, contactSeller, updateActions, deleteProduct, viewSellers, rateProduct };
})();
