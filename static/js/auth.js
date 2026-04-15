/* ============================================================
   VayalMozhi — Authentication & User Module
   ============================================================ */

const Auth = (() => {
  let currentUser = null;
  let initialized = false;

  function init() {
    if (initialized) return;
    if (typeof I18n !== 'undefined') I18n.init();
    checkSession();
    setupEventListeners();
    initialized = true;
  }

  function checkSession() {
    const savedUser = localStorage.getItem('vayalmozhi_user');
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      updateUIForAuth();
    }
  }

  function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const registerForm = document.getElementById('register-form');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => switchAuthMode(tab.getAttribute('data-mode')));
    });

    document.querySelectorAll('.role-option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.role-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        const roleInput = document.getElementById('reg-role');
        if (roleInput) roleInput.value = option.getAttribute('data-role');
      });
    });
  }

  function switchAuthMode(mode) {
    const loginForm = document.getElementById('login-section');
    const registerForm = document.getElementById('register-section');
    document.querySelectorAll('.auth-tab').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-mode') === mode);
    });
    if (mode === 'login') { loginForm.style.display = 'block'; registerForm.style.display = 'none'; }
    else { loginForm.style.display = 'none'; registerForm.style.display = 'block'; }
  }

  async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
      const data = await App.api('/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (data.success) {
        currentUser = data.user;
        localStorage.setItem('vayalmozhi_user', JSON.stringify(currentUser));
        App.notify('Success', `Welcome back, ${currentUser.name}!`);
        updateUIForAuth();
        window.location.hash = 'home';
      }
    } catch (error) { App.notify('Login Failed', error.message || 'Invalid credentials', 'error'); }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;
    const phone = document.getElementById('reg-phone').value;
    const location = document.getElementById('reg-location').value;
    try {
      const data = await App.api('/api/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, phone, location })
      });
      if (data.success) {
        App.notify('Account Created', 'Please login with your new account.');
        switchAuthMode('login');
      }
    } catch (error) { App.notify('Registration Failed', error.message || 'Could not create account', 'error'); }
  }

  function logout() {
    currentUser = null;
    localStorage.removeItem('vayalmozhi_user');
    updateUIForAuth();
    App.notify('Logged Out', 'Successfully logged out.');
    window.location.hash = 'home';
  }

  function updateUIForAuth() {
    const loginLink = document.querySelector('.nav-link[data-page="login"]');
    const profileLink = document.querySelector('.nav-link[data-page="profile"]');
    if (currentUser) {
      if (loginLink) loginLink.style.display = 'none';
      if (profileLink) {
        profileLink.style.display = 'flex';
        profileLink.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          ${currentUser.name.split(' ')[0]}
        `;
      }
      renderProfile();
    } else {
      if (loginLink) loginLink.style.display = 'flex';
      if (profileLink) profileLink.style.display = 'none';
    }
    if (window.location.hash === '#marketplace') Marketplace.updateActions();
  }

  // === FINANCE (Profit/Loss) HELPERS ===
  function getTransactions() {
    return JSON.parse(localStorage.getItem(`tx_${currentUser.id}`) || '[]');
  }
  function saveTransactions(txs) {
    localStorage.setItem(`tx_${currentUser.id}`, JSON.stringify(txs));
  }
  function addTransaction(label, amount, type) {
    const txs = getTransactions();
    txs.push({ label, amount: parseFloat(amount), type, date: new Date().toISOString().slice(0,10) });
    saveTransactions(txs);
    renderProfile();
  }

  // === RENDER PROFILE (Professional Dashboard) ===
  async function renderProfile() {
    const profileContent = document.getElementById('profile-content');
    if (!profileContent || !currentUser) return;

    const isFarmer = currentUser.role === 'farmer';
    const favs = getFavorites();
    const cart = getCart();
    const txs = isFarmer ? getTransactions() : [];
    const totalRevenue = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const netProfit = totalRevenue - totalExpense;

    profileContent.innerHTML = `
      <!-- Pro Dashboard Header -->
      <div class="dashboard-header-pro">
        <div style="display:flex; align-items:center; gap:var(--space-6); position:relative; z-index:1;">
          <div class="profile-avatar-pro">${currentUser.name[0]}</div>
          <div>
            <h2>${currentUser.name}</h2>
            <div class="user-meta">
              <span class="neo-badge neo-badge-${isFarmer ? 'green' : 'blue'}" style="font-size:0.7rem;" data-en="${currentUser.role.toUpperCase()}" data-ta="${isFarmer ? 'விவசாயி' : 'நுகர்வோர்'}">${currentUser.role.toUpperCase()}</span>
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="vertical-align:middle; margin-right:2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span data-en="${currentUser.location || 'Tamil Nadu'}" data-ta="${(currentUser.location || 'Tamil Nadu') === 'Tamil Nadu' ? 'தமிழ்நாடு' : (currentUser.location === 'Tiruppur' ? 'திருப்பூர்' : (currentUser.location === 'Erode' ? 'ஈரோடு' : (currentUser.location === 'Madurai' ? 'மதுரை' : currentUser.location)))}">${currentUser.location || 'Tamil Nadu'}</span>
              </span>
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="vertical-align:middle; margin-right:2px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                ${currentUser.email}
              </span>
            </div>
          </div>
        </div>
        <button class="neo-btn neo-btn-sm" style="background:rgba(255,255,255,0.15); color:white; border-color:rgba(255,255,255,0.3); position:relative; z-index:1;" id="logout-btn-profile">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span data-en="Logout" data-ta="வெளியேறு">Logout</span>
        </button>
      </div>

      <!-- Quick Stats -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:var(--space-4); margin-bottom:var(--space-6);">
        ${isFarmer ? `
          <div class="stat-card-pro">
            <div class="stat-icon" style="background:#E8F5E9; border: 2px solid var(--color-black); border-radius: 0; box-shadow: 2px 2px 0 var(--color-black);">
               <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" stroke-width="2" width="20" height="20"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </div>
            <div class="stat-number" id="stat-active-listings">...</div>
            <div class="stat-label" data-en="Active Listings" data-ta="செயலில் உள்ளவை">Active Listings</div>
          </div>
          <div class="stat-card-pro">
            <div class="stat-icon" style="background:#E3F2FD; border: 2px solid var(--color-black); border-radius: 0; box-shadow: 2px 2px 0 var(--color-black);">
               <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" stroke-width="2" width="20" height="20"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <div class="stat-number">12</div>
            <div class="stat-label" data-en="Total Inquiries" data-ta="மொத்த விசாரணைகள்">Total Inquiries</div>
          </div>
          <div class="stat-card-pro">
            <div class="stat-icon" style="background:#FFF3E0; border: 2px solid var(--color-black); border-radius: 0; box-shadow: 2px 2px 0 var(--color-black);">
               <svg viewBox="0 0 24 24" fill="var(--color-yellow)" stroke="var(--color-black)" stroke-width="2" width="20" height="20"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </div>
            <div class="stat-number">4.8</div>
            <div class="stat-label" data-en="Market Rating" data-ta="சந்தை மதிப்பீடு">Market Rating</div>
          </div>
          <div class="stat-card-pro">
            <div class="stat-icon" style="background:${netProfit >= 0 ? '#E8F5E9' : '#FFEBEE'}; color:${netProfit >= 0 ? 'var(--color-green)' : 'var(--color-red)'}; border: 2px solid var(--color-black); border-radius: 0; box-shadow: 2px 2px 0 var(--color-black);">
               ${netProfit >= 0 ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>'}
            </div>
            <div class="stat-number" style="color:${netProfit >= 0 ? 'var(--color-green)' : 'var(--color-red)'};">${App.formatCurrency(Math.abs(netProfit))}</div>
            <div class="stat-label" data-en="${netProfit >= 0 ? 'Net Profit' : 'Net Loss'}" data-ta="${netProfit >= 0 ? 'நிகர லாபம்' : 'நிகர நஷ்டம்'}">${netProfit >= 0 ? 'Net Profit' : 'Net Loss'}</div>
          </div>
        ` : `
          <div class="stat-card-pro">
            <div class="stat-icon" style="background:#E3F2FD; border: 2px solid var(--color-black); border-radius: 0; box-shadow: 2px 2px 0 var(--color-black);">
               <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" stroke-width="2" width="20" height="20"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            </div>
            <div class="stat-number">${cart.length}</div>
            <div class="stat-label" data-en="Cart Items" data-ta="கூடையில் உள்ளவை">Cart Items</div>
          </div>
          <div class="stat-card-pro">
            <div class="stat-icon" style="background:#FFF3E0; border: 2px solid var(--color-black); border-radius: 0; box-shadow: 2px 2px 0 var(--color-black);">
               <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-red)" stroke-width="2" width="20" height="20"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </div>
            <div class="stat-number">${favs.length}</div>
            <div class="stat-label" data-en="Saved Schemes" data-ta="சேமிக்கப்பட்ட திட்டங்கள்">Saved Schemes</div>
          </div>
          <div class="stat-card-pro">
            <div class="stat-icon" style="background:#E8F5E9; border: 2px solid var(--color-black); border-radius: 0; box-shadow: 2px 2px 0 var(--color-black);">
               <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            </div>
            <div class="stat-number" style="color:var(--color-green);">${App.formatCurrency(cart.reduce((s,i) => s + (i.price||0), 0))}</div>
            <div class="stat-label" data-en="Cart Value" data-ta="கூடை மதிப்பு">Cart Value</div>
          </div>
        `}
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        ${isFarmer ? `
          <button class="quick-action-btn" onclick="window.location.hash='marketplace'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span data-en="Add Listing" data-ta="பட்டியல் சேர்">Add Listing</span>
          </button>
          <button class="quick-action-btn" onclick="window.location.hash='prices'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            <span data-en="Check Prices" data-ta="விலை சரிபார்">Check Prices</span>
          </button>
          <button class="quick-action-btn" onclick="window.location.hash='schemes'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span data-en="Browse Schemes" data-ta="திட்டங்களை பார்">Browse Schemes</span>
          </button>
        ` : `
          <button class="quick-action-btn" onclick="window.location.hash='marketplace'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            <span data-en="Shop Now" data-ta="இப்போது வாங்கு">Shop Now</span>
          </button>
          <button class="quick-action-btn" onclick="window.location.hash='schemes'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span data-en="Browse Schemes" data-ta="திட்டங்களை பார்">Browse Schemes</span>
          </button>
          <button class="quick-action-btn" onclick="window.location.hash='disease'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><circle cx="12" cy="12" r="10"></circle><line x1="14.31" y1="8" x2="20.05" y2="17.94"></line><line x1="9.69" y1="8" x2="21.17" y2="8"></line><line x1="7.38" y1="12" x2="13.12" y2="2.06"></line><line x1="9.69" y1="16" x2="3.95" y2="6.06"></line><line x1="14.31" y1="16" x2="2.83" y2="16"></line><line x1="16.62" y1="12" x2="10.88" y2="21.94"></line></svg>
            <span data-en="Detect Disease" data-ta="நோய் கண்டறி">Detect Disease</span>
          </button>
        `}
      </div>

      <!-- Main Content -->
      ${isFarmer ? `
        <!-- Profit/Loss Tracker -->
        <div class="finance-section">
          <h3 style="margin-bottom:var(--space-5); font-weight:900;" data-en="Profit & Loss Tracker" data-ta="லாப நஷ்ட கணக்கு">Profit & Loss Tracker</h3>
          <div class="finance-summary">
            <div class="finance-card revenue">
              <h4 data-en="Total Revenue" data-ta="மொத்த வருவாய்">Total Revenue</h4>
              <div class="finance-amount">${App.formatCurrency(totalRevenue)}</div>
            </div>
            <div class="finance-card expense">
              <h4 data-en="Total Expenses" data-ta="மொத்த செலவுகள்">Total Expenses</h4>
              <div class="finance-amount">${App.formatCurrency(totalExpense)}</div>
            </div>
            <div class="finance-card ${netProfit >= 0 ? 'profit' : 'loss'}">
              <h4 data-en="${netProfit >= 0 ? 'Net Profit' : 'Net Loss'}" data-ta="${netProfit >= 0 ? 'நிகர லாபம்' : 'நிகர நஷ்டம்'}">${netProfit >= 0 ? 'Net Profit' : 'Net Loss'}</h4>
              <div class="finance-amount">${App.formatCurrency(Math.abs(netProfit))}</div>
            </div>
          </div>

          <h4 style="margin-bottom:var(--space-3);" data-en="Add Transaction" data-ta="பரிவர்த்தனை சேர்">Add Transaction</h4>
          <div class="add-tx-form">
            <input type="text" id="tx-label" placeholder="Description" required>
            <input type="number" id="tx-amount" placeholder="Amount" required>
            <select id="tx-type">
              <option value="income">Income / வருமானம்</option>
              <option value="expense">Expense / செலவு</option>
            </select>
            <button class="neo-btn neo-btn-sm neo-btn-success" onclick="Auth.addTransaction(document.getElementById('tx-label').value, document.getElementById('tx-amount').value, document.getElementById('tx-type').value)">
              <span data-en="Add" data-ta="சேர்">Add</span>
            </button>
          </div>

          ${txs.length > 0 ? `
            <h4 style="margin-top:var(--space-5); margin-bottom:var(--space-3);" data-en="Recent Transactions" data-ta="சமீபத்திய பரிவர்த்தனைகள்">Recent Transactions</h4>
            <div class="transaction-list">
              ${txs.slice(-10).reverse().map(tx => `
                <div class="transaction-item">
                  <div>
                    <div class="tx-label">${tx.label}</div>
                    <div class="tx-date">${tx.date}</div>
                  </div>
                  <div class="tx-amount ${tx.type === 'income' ? 'income' : 'expense'}">
                    ${tx.type === 'income' ? '+' : '-'} ${App.formatCurrency(tx.amount)}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- My Products -->
        <div style="margin-top:var(--space-6);">
          <h3 style="margin-bottom:var(--space-4); font-weight:900;" data-en="My Listings" data-ta="எனது பட்டியல்கள்">My Listings</h3>
          <div id="my-products-list" class="products-grid">
            <div class="loading-inline" data-en="Loading your listings..." data-ta="உங்கள் பட்டியல்கள் ஏற்றப்படுகின்றன...">Loading your listings...</div>
          </div>
        </div>
      ` : `
        <!-- Shopping Cart -->
        <div style="margin-bottom:var(--space-6);">
          <h3 style="margin-bottom:var(--space-4); font-weight:900;" data-en="My Shopping Cart" data-ta="எனது கூடை">My Shopping Cart</h3>
          <div id="my-cart-list" style="display:flex; flex-direction:column; gap:var(--space-3);"></div>
        </div>

        <!-- Saved Schemes -->
        <div>
          <h3 style="margin-bottom:var(--space-4); font-weight:900;" data-en="Saved Schemes" data-ta="சேமிக்கப்பட்ட திட்டங்கள்">Saved Schemes</h3>
          <div id="my-favorites-list" style="display:flex; flex-direction:column; gap:var(--space-3);"></div>
        </div>
      `}
    `;

    document.getElementById('logout-btn-profile').addEventListener('click', logout);
    
    if (isFarmer) {
      loadMyProducts();
    } else {
      renderCart();
      renderFavorites();
    }
    
    if (typeof I18n !== 'undefined') I18n.updateUI();
  }

  async function loadMyProducts() {
    try {
      const allProducts = await App.api('/api/products');
      const myProducts = allProducts.filter(p => p.seller_id == currentUser.id);
      const statEl = document.getElementById('stat-active-listings');
      if (statEl) statEl.textContent = myProducts.length;
      renderMyProducts(myProducts);
    } catch (e) { console.error(e); }
  }

  function renderMyProducts(products) {
    const list = document.getElementById('my-products-list');
    if (!list) return;
    if (products.length === 0) {
      list.innerHTML = `
        <div class="empty-state-dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="40" height="40"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          <p data-en="No active listings." data-ta="செயலில் உள்ள பட்டியல்கள் இல்லை.">No active listings.</p>
        </div>
      `;
      return;
    }
    list.innerHTML = products.map(p => {
      const imageHTML = p.image 
        ? `<img src="${p.image}" alt="${p.title}" style="height:200px; object-fit:cover; width:100%; border-bottom:2px solid var(--color-black);" onerror="this.onerror=null; this.src='/static/images/product_fallback.png';">`
        : `<div class="category-icon-placeholder" data-category="${p.category}" style="height:200px; display:flex; align-items:center; justify-content:center;"><span>${p.category}</span></div>`;
      return `
      <div class="neo-card product-card" style="overflow:hidden;">
        ${imageHTML}
        <div style="padding:var(--space-4);">
          <h4>${p.title}</h4>
          <div class="product-price">${App.formatCurrency(p.price)}</div>
          <button class="neo-btn neo-btn-sm neo-btn-error neo-btn-block" style="margin-top:var(--space-2);" onclick="Marketplace.deleteProduct(${p.id})">
            <span data-en="Delete Listing" data-ta="பட்டியலை நீக்கு">Delete Listing</span>
          </button>
        </div>
      </div>
      `;
    }).join('');
  }

  function getFavorites() { return JSON.parse(localStorage.getItem(`favs_${currentUser.id}`) || '[]'); }
  function toggleFavorite(scheme) {
    let favs = getFavorites();
    const idx = favs.findIndex(f => f.id === scheme.id);
    if (idx > -1) { favs.splice(idx, 1); App.notify('Removed', 'Scheme removed from favorites.'); }
    else { favs.push(scheme); App.notify('Saved', 'Scheme added to your favorites.'); }
    localStorage.setItem(`favs_${currentUser.id}`, JSON.stringify(favs));
    if (window.location.hash === '#profile') renderProfile();
  }

  function getCart() { return JSON.parse(localStorage.getItem(`cart_${currentUser.id}`) || '[]'); }
  function addToCart(product) {
    let cart = getCart();
    cart.push(product);
    localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(cart));
    App.notify('Added to Cart', `${product.title} has been added.`);
    if (window.location.hash === '#profile') renderProfile();
  }

  function renderCart() {
    const list = document.getElementById('my-cart-list');
    const cart = getCart();
    if (!list) return;
    if (cart.length === 0) {
      list.innerHTML = `
        <div class="empty-state-dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="40" height="40"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
          <p data-en="Your cart is empty." data-ta="உங்கள் கூடை காலியாக உள்ளது.">Your cart is empty.</p>
        </div>
      `;
      return;
    }
    list.innerHTML = cart.map(item => {
      const img = item.image
        ? `<img src="${item.image}" style="width:80px; height:80px; object-fit:cover; border-radius:var(--radius-md); border:2px solid var(--color-black);" onerror="this.onerror=null; this.src='/static/images/product_fallback.png';">`
        : `<div style="width:80px; height:80px; background:var(--color-gray-200); border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; font-size:var(--fs-xs); font-weight:700;">${item.category}</div>`;
      return `
      <div style="display:flex; gap:var(--space-4); background:white; border-radius:var(--radius-lg); box-shadow:var(--shadow-sm); padding:var(--space-4); border:1px solid var(--color-gray-300); align-items:center;">
        ${img}
        <div style="flex:1;">
          <h5 style="margin:0;">${item.title}</h5>
          <span style="font-size:0.8rem; color:var(--color-gray-500);">${item.category}</span>
        </div>
        <strong>${App.formatCurrency(item.price)}</strong>
      </div>
      `;
    }).join('');
    if (typeof I18n !== 'undefined') I18n.updateUI();
  }

  function renderFavorites() {
    const favs = getFavorites();
    const list = document.getElementById('my-favorites-list');
    if (!list) return;
    if (favs.length === 0) {
      list.innerHTML = `
        <div class="empty-state-dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="40" height="40"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          <p data-en="No saved schemes." data-ta="சேமிக்கப்பட்ட திட்டங்கள் எதுவும் இல்லை.">No saved schemes.</p>
        </div>
      `;
      return;
    }
    list.innerHTML = favs.map(item => `
      <div class="fav-scheme-card">
        <a href="#schemes" style="font-weight:900; color:var(--color-black); display:block; margin-bottom:4px;">${item.title}</a>
        <p class="text-xs" style="color:var(--color-gray-600); line-height:1.4;">${item.description.substring(0, 100)}...</p>
      </div>
    `).join('');
    if (typeof I18n !== 'undefined') I18n.updateUI();
  }

  function getUser() { return currentUser; }
  function isFarmer() { return currentUser && currentUser.role === 'farmer'; }

  return { init, login: handleLogin, logout, getUser, isFarmer, switchAuthMode, toggleFavorite, addToCart, getFavorites, renderProfile, addTransaction };
})();
