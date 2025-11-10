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
    productGrid.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin fa-3x text-primary"></i><p class="mt-3">Loading ML-powered recommendations...</p></div>';
    
    try {
      // Gather user selections for ML recommendation
      let selectedCategory = null;
      let selectedSize = null;
      let selectedColors = [];

      // Get category from user selection or localStorage
      const categoryCard = document.querySelector('.style-category-card.selected, .category-card.selected');
      if (categoryCard && categoryCard.dataset && categoryCard.dataset.category) {
        selectedCategory = categoryCard.dataset.category;
      }
      if (!selectedCategory) selectedCategory = localStorage.getItem('recommendedCategory');
      if (!selectedCategory) {
        // Fallback logic based on uploaded photos
        if (window.uploadedFiles && window.uploadedFiles.side) selectedCategory = 'bottoms';
        else if (window.uploadedFiles && window.uploadedFiles.back) selectedCategory = 'jackets';
        else selectedCategory = 'tops';
      }

      // Get size from user selection or localStorage
      const sizeCard = document.querySelector('.size-card.selected, .size-option.selected');
      if (sizeCard && sizeCard.dataset && sizeCard.dataset.size) {
        selectedSize = sizeCard.dataset.size;
      }
      if (!selectedSize) selectedSize = localStorage.getItem('recommendedSize');

      // Get colors from user selection (if color selector exists)
      document.querySelectorAll('.color-option.selected, .color-card.selected').forEach(el => {
        if (el.dataset && el.dataset.color) selectedColors.push(el.dataset.color);
      });

      // Build filters for ML recommendation API
      const filters = {};
      if (selectedCategory) filters.category = selectedCategory;
      if (selectedSize) filters.size = selectedSize;
      if (selectedColors.length > 0) filters.colors = selectedColors.join(',');

      console.log('🤖 ML Recommendation filters:', filters);

      // Call backend ML recommendation API
      let products = [];
      let usedFallback = false;
      
      if (typeof api !== 'undefined' && typeof api.getRecommendations === 'function') {
        try {
          const res = await api.getRecommendations(filters);
          products = (res && (res.products || res.items)) || [];
          console.log(`✅ Received ${products.length} ML recommendations`, res);
          
          // Show which filters were applied
          if (res && res.filters) {
            console.log('🎯 Applied filters:', res.filters);
          }
        } catch (apiErr) {
          console.warn('ML API error, using fallback data:', apiErr);
          usedFallback = true;
        }
      }

      // Fallback to local product data if no API results
      if (!products || products.length === 0) {
        console.log('⚠️ No ML results, using fallback product data');
        products = productData[selectedCategory] || productData.tops;
        usedFallback = true;
      }

      // Render products
      productGrid.innerHTML = '';
      
      // Show ML badge if using real recommendations
      if (!usedFallback && products.length > 0) {
        const mlBadge = document.createElement('div');
        mlBadge.className = 'alert alert-info mb-3';
        mlBadge.innerHTML = `<i class="fas fa-robot me-2"></i><strong>ML-Powered Recommendations</strong> - ${products.length} products matched your preferences`;
        productGrid.appendChild(mlBadge);
      }

      products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Handle both old format (icon) and new format (image URL)
        const imageHtml = product.image 
          ? `<img src="${product.image}" alt="${product.name}" style="width:100%; height:200px; object-fit:cover; border-radius:8px;" onerror="this.outerHTML='<i class=\\'fas fa-tshirt fa-3x\\'></i>'">`
          : `<i class="${product.icon || 'fas fa-tshirt'} fa-3x"></i>`;
        
        card.innerHTML = `
          <div class="product-image">${imageHtml}</div>
          <div class="product-name">${product.name}</div>
          <div class="product-price">${product.price ? (typeof product.price === 'number' ? '$' + product.price.toFixed(2) : product.price) : ''}</div>
          <div class="product-description">${product.description || ''}</div>
          ${product.size ? `<small class="text-muted">Size: ${product.size}</small>` : ''}
          ${product.color ? `<small class="text-muted ms-2">Color: ${product.color}</small>` : ''}
          <button class="btn viton-btn tryon-btn mt-2" data-id="${product.id || product._id}" data-name="${product.name}">
            <i class="fas fa-magic me-2"></i>Try On with VITON
          </button>
        `;
        productGrid.appendChild(card);
      });

      // Attach event listeners
      document.querySelectorAll('.tryon-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = btn.dataset.id; 
          const name = btn.dataset.name;
          if (typeof tryOnProduct === 'function') {
            tryOnProduct(id, name);
          } else {
            document.getElementById('productRecommendations').style.display = 'none';
            document.getElementById('vitonResult').style.display = 'block';
            if (document.getElementById('selectedItemName')) {
              document.getElementById('selectedItemName').textContent = name || '';
            }
          }
        });
      });

      // Empty state
      if (productGrid.children.length === 0) {
        productGrid.innerHTML = `
          <div class="col-12 text-center">
            <i class="fas fa-box-open fa-4x text-muted mb-3"></i>
            <p class="text-muted">No products available matching your preferences.</p>
            <p class="text-muted">Try selecting different size or category options.</p>
          </div>
        `;
      }
    } catch (err) {
      console.error('loadProducts error', err);
      productGrid.innerHTML = `<div class="col-12 text-center text-danger">
        <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
        <p>Failed to load products. Please try again.</p>
      </div>`;
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
