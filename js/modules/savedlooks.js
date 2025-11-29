// Save look, cart and saved looks management
(function () {
  async function saveLook(eventOrItem) {
    let triggerBtn = null;
    if (eventOrItem && eventOrItem.target) triggerBtn = eventOrItem.target;
    const origHTML = triggerBtn ? triggerBtn.innerHTML : null;
    if (triggerBtn) { triggerBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...'; triggerBtn.disabled = true; }
    try {
      const uploadId = localStorage.getItem('currentUploadId');
      const photosJson = localStorage.getItem('uploadedPhotos');
      const photos = photosJson ? JSON.parse(photosJson) : [];
      let productId = window.selectedProduct || null; let productName = ''; let productPrice = null;
      if (eventOrItem && eventOrItem.target && eventOrItem.target.dataset) {
        productId = productId || eventOrItem.target.dataset.id;
        productName = eventOrItem.target.dataset.name || productName;
        productPrice = eventOrItem.target.dataset.price || productPrice;
      } else if (eventOrItem && eventOrItem.id) { productId = productId || eventOrItem.id; productName = eventOrItem.name || productName; productPrice = eventOrItem.price || productPrice; }

      const look = { _id: `local_${Date.now()}`, productId: productId || null, productName: productName || '', productPrice: productPrice || '', uploadId: uploadId || null, images: Array.isArray(photos) ? photos.slice(0) : [], selectedSize: localStorage.getItem('recommendedSize') || null, selectedColor: localStorage.getItem('recommendedColor') || null, savedAt: new Date().toISOString() };

      const KEY = 'savedLooksLocal'; const current = JSON.parse(localStorage.getItem(KEY) || '[]');
      const exists = current.some(i => i.productId === look.productId && i.uploadId === look.uploadId);
      if (!exists) { current.unshift(look); localStorage.setItem(KEY, JSON.stringify(current)); }

      if (typeof api !== 'undefined' && typeof api.saveLook === 'function') {
        try { await api.saveLook({ productId: look.productId, uploadId: look.uploadId, selectedSize: look.selectedSize, selectedColor: look.selectedColor, images: look.images }); } catch (srvErr) { console.warn('Server saveLook failed', srvErr); }
      }

      showNotification('Saved to your looks', 'success');
      if (typeof loadSavedLooks === 'function') loadSavedLooks();
    } catch (err) {
      console.error('saveLook error', err); showNotification(err.message || 'Failed to save look', 'error');
    } finally { if (triggerBtn) { triggerBtn.innerHTML = origHTML; triggerBtn.disabled = false; } }
  }

  function addToCart(item) {
    const CART_KEY = 'cartItems'; const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const cartItem = { id: item.productId || item.id || `p_${Date.now()}`, name: item.productName || item.name || 'Product', price: item.productPrice || item.price || '', qty: 1, addedAt: new Date().toISOString() };
    const idx = cart.findIndex(c => c.id === cartItem.id);
    if (idx >= 0) cart[idx].qty += 1; else cart.push(cartItem);
    localStorage.setItem(CART_KEY, JSON.stringify(cart)); showNotification('Added to cart', 'success');
  }

  function buyNow(item) {
    const pid = encodeURIComponent(item.productId || item.id || '');
    if (!pid) { showNotification('Product not available for purchase','warning'); return; }
    window.location.href = `/checkout?product=${pid}`;
  }

  async function loadSavedLooks() {
    const container = document.getElementById('savedLooksContainer'); if (!container) return;
    const saved = JSON.parse(localStorage.getItem('savedLooksLocal') || '[]');
    container.innerHTML = `
      <div class="upload-container">
        <h1 class="page-title">Saved Looks</h1>
        <p class="page-subtitle">Your saved virtual try-on collection</p>
        <div class="product-grid" id="savedGrid"></div>
      </div>
    `;
    const grid = document.getElementById('savedGrid'); if (!grid) return;
    if (saved.length === 0) { grid.innerHTML = `
      <div class="text-center w-100">
        <i class="fas fa-heart-broken fa-4x text-muted mb-3"></i>
        <p class="text-muted">No saved looks yet.</p>
        <button class="btn viton-btn" onclick="showPage('upload')"><i class="fas fa-camera me-2"></i>Start Virtual Try-On</button>
      </div>
    `; return; }

    grid.innerHTML = '';
    saved.forEach(look => {
      const hasImages = Array.isArray(look.images) && look.images.length > 0;
      const card = document.createElement('div'); card.className = 'product-card';
      card.innerHTML = `
        <div class="product-image" style="${hasImages ? `background-image:url('${look.images[0]}'); background-size:cover; background-position:center; height:200px; border-radius:12px;` : 'background:linear-gradient(135deg,#667eea,#764ba2); height:200px; border-radius:12px; display:flex;align-items:center;justify-content:center;'}">
          ${!hasImages ? '<i class="fas fa-shopping-bag fa-3x text-white"></i>' : ''}
        </div>
        <div class="product-name">${look.productName || 'Saved Look'}</div>
        <div class="product-price">${look.productPrice || ''}</div>
        <div class="product-meta small text-muted">Saved: ${new Date(look.savedAt).toLocaleString()}</div>
        <div class="product-actions mt-2"></div>
      `;
      const actions = card.querySelector('.product-actions');
      if (hasImages) {
        const tryBtn = document.createElement('button'); tryBtn.className = 'btn viton-btn me-2'; tryBtn.textContent = 'View Try-On'; tryBtn.addEventListener('click', () => { localStorage.setItem('uploadedPhotos', JSON.stringify(look.images)); if (typeof showPage === 'function') showPage('virtual-tryon'); }); actions.appendChild(tryBtn);
      }
      const cartBtn = document.createElement('button'); cartBtn.className = 'btn btn-outline-primary me-2'; cartBtn.textContent = 'Add to Cart'; cartBtn.addEventListener('click', () => addToCart(look)); actions.appendChild(cartBtn);
      const buyBtn = document.createElement('button'); buyBtn.className = 'btn btn-primary'; buyBtn.textContent = 'Buy Now'; buyBtn.addEventListener('click', () => buyNow(look)); actions.appendChild(buyBtn);
      const del = document.createElement('button'); del.className = 'btn btn-danger ms-2'; del.innerHTML = '<i class="fas fa-trash"></i>';
      del.addEventListener('click', async () => { if (!confirm('Delete this saved look?')) return; const arr = JSON.parse(localStorage.getItem('savedLooksLocal') || '[]'); const remaining = arr.filter(i => i._id !== look._id); localStorage.setItem('savedLooksLocal', JSON.stringify(remaining)); showNotification('Saved look deleted','success'); loadSavedLooks(); try { if (typeof api !== 'undefined' && typeof api.deleteLook === 'function') await api.deleteLook(look._id); } catch(e){} });
      actions.appendChild(del);
      grid.appendChild(card);
    });
  }

  window.saveLook = saveLook;
  window.addToCart = addToCart;
  window.buyNow = buyNow;
  window.loadSavedLooks = loadSavedLooks;
})();
