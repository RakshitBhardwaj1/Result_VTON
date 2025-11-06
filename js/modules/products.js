// Products & try-on viewer
(function () {
  const productData = {
    tops: [
      { id: 'casual-tee', name: 'Premium Cotton T-Shirt', price: '$29.99', icon: 'fas fa-tshirt', description: 'Soft, comfortable cotton tee perfect for daily wear' },
      { id: 'polo-shirt', name: 'Classic Polo Shirt', price: '$39.99', icon: 'fas fa-user-tie', description: 'Elegant polo shirt for smart-casual occasions' },
      { id: 'hoodie', name: 'Cozy Hoodie', price: '$49.99', icon: 'fas fa-user-ninja', description: 'Warm and stylish hoodie for cooler days' },
      { id: 'blouse', name: 'Elegant Blouse', price: '$45.99', icon: 'fas fa-female', description: 'Professional blouse perfect for office wear' }
    ],
    bottoms: [
      { id: 'jeans', name: 'Premium Denim Jeans', price: '$69.99', icon: 'fas fa-user-tie', description: 'High-quality denim with perfect fit' },
      { id: 'chinos', name: 'Classic Chinos', price: '$55.99', icon: 'fas fa-user-tie', description: 'Versatile chinos for any occasion' },
      { id: 'leggings', name: 'Athletic Leggings', price: '$34.99', icon: 'fas fa-female', description: 'Comfortable leggings for active lifestyle' },
      { id: 'shorts', name: 'Casual Shorts', price: '$39.99', icon: 'fas fa-user-tie', description: 'Comfortable shorts for casual wear' }
    ],
    dresses: [
      { id: 'summer-dress', name: 'Summer Floral Dress', price: '$59.99', icon: 'fas fa-female', description: 'Light and breezy dress perfect for summer' },
      { id: 'cocktail-dress', name: 'Cocktail Dress', price: '$89.99', icon: 'fas fa-female', description: 'Elegant dress for special occasions' },
      { id: 'casual-dress', name: 'Casual Day Dress', price: '$49.99', icon: 'fas fa-female', description: 'Comfortable dress for everyday wear' },
      { id: 'formal-dress', name: 'Formal Evening Dress', price: '$129.99', icon: 'fas fa-female', description: 'Sophisticated dress for formal events' }
    ],
    jackets: [
      { id: 'leather-jacket', name: 'Genuine Leather Jacket', price: '$199.99', icon: 'fas fa-coat-arms', description: 'Classic leather jacket for edgy style' },
      { id: 'blazer', name: 'Business Blazer', price: '$89.99', icon: 'fas fa-user-tie', description: 'Professional blazer for business meetings' },
      { id: 'denim-jacket', name: 'Vintage Denim Jacket', price: '$79.99', icon: 'fas fa-coat-arms', description: 'Timeless denim jacket for casual style' },
      { id: 'bomber-jacket', name: 'Modern Bomber Jacket', price: '$95.99', icon: 'fas fa-coat-arms', description: 'Trendy bomber jacket for street style' }
    ]
  };

  async function loadProducts() {
    const productGrid = document.getElementById('productGrid');
    const productRecommendations = document.getElementById('productRecommendations');
    const styleOptionsSection = document.getElementById('styleOptionsSection');
    if (!productGrid) return;
    if (productRecommendations) productRecommendations.style.display = 'block';
    if (styleOptionsSection) styleOptionsSection.style.display = 'none';
    productGrid.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin fa-3x text-primary"></i><p class="mt-3">Loading products...</p></div>';
    try {
      let products = [];
      if (typeof api !== 'undefined' && typeof api.getRecommendations === 'function') {
        const res = await api.getRecommendations();
        products = (res && (res.products || res.items)) || [];
      }

      let selectedCategory = null;
      const sel = document.querySelector('.style-category-card.selected, .category-card.selected');
      if (sel && sel.dataset && sel.dataset.category) selectedCategory = sel.dataset.category;
      if (!selectedCategory) selectedCategory = localStorage.getItem('recommendedCategory');
      if (!selectedCategory) {
        if (window.uploadedFiles && window.uploadedFiles.side) selectedCategory = 'bottoms';
        else if (window.uploadedFiles && window.uploadedFiles.back) selectedCategory = 'jackets';
        else selectedCategory = 'tops';
      }

      if (!products || products.length === 0) products = productData[selectedCategory] || productData.tops;
      else {
        products = products.filter(p => { if (!p.category) return true; return p.category === selectedCategory || p.category === selectedCategory.slice(0,-1); });
        if (products.length === 0) products = productData[selectedCategory] || productData.tops;
      }

      productGrid.innerHTML = '';
      products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
          <div class="product-image"><i class="${product.icon || 'fas fa-tshirt'} fa-3x"></i></div>
          <div class="product-name">${product.name}</div>
          <div class="product-price">${product.price || ''}</div>
          <div class="product-description">${product.description || ''}</div>
          <button class="btn viton-btn tryon-btn" data-id="${product.id}" data-name="${product.name}"><i class="fas fa-magic me-2"></i>Try On with VITON</button>
        `;
        productGrid.appendChild(card);
      });

      document.querySelectorAll('.tryon-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = btn.dataset.id; const name = btn.dataset.name;
          if (typeof tryOnProduct === 'function') tryOnProduct(id, name);
          else {
            document.getElementById('productRecommendations').style.display = 'none';
            document.getElementById('vitonResult').style.display = 'block';
            if (document.getElementById('selectedItemName')) document.getElementById('selectedItemName').textContent = name || '';
          }
        });
      });

      if (productGrid.children.length === 0) {
        productGrid.innerHTML = `
          <div class="col-12 text-center">
            <i class="fas fa-box-open fa-4x text-muted mb-3"></i>
            <p class="text-muted">No products available. Please check back later.</p>
          </div>
        `;
      }
    } catch (err) {
      console.error('loadProducts error', err);
      productGrid.innerHTML = `<div class="col-12 text-center text-danger">Failed to load products.</div>`;
    }
  }

  function setup3DViewer(imageUrls) {
    const container = document.getElementById('vitonResult');
    container.innerHTML = '';
    const width = container.clientWidth;
    const height = 400;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry(2,3,1);
    const materials = imageUrls.map(url => new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load(url) }));
    const cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);
    camera.position.z = 5;

    document.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') cube.rotation.y -= 0.1; if (e.key === 'ArrowRight') cube.rotation.y += 0.1; });
    (function animate(){ requestAnimationFrame(animate); renderer.render(scene, camera); })();
  }

  function showVirtualTryOn(productId, productName) {
    window.selectedProduct = productId;
    const photosJson = localStorage.getItem('uploadedPhotos');
    window.photoArray = photosJson ? JSON.parse(photosJson) : [];
    if (window.photoArray.length < 3) { showNotification('Please upload front, side and back photos for 3D view.', 'warning'); showPage('upload'); return; }
    document.getElementById('productGrid').style.display = 'none';
    const vitonResult = document.getElementById('vitonResult'); vitonResult.style.display = 'block';
    document.getElementById('selectedItemName').textContent = productName;
    setup3DViewer([window.photoArray[0], window.photoArray[1], window.photoArray[2], window.photoArray[1]]);
  }

  window.loadProducts = loadProducts;
  window.setup3DViewer = setup3DViewer;
  window.showVirtualTryOn = showVirtualTryOn;
})();
