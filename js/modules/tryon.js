// ===========================
// TRY-ON LOGIC
// ===========================
function loadProducts() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '<p>Loading products...</p>';
  const products = productData.tops;
  grid.innerHTML = products
    .map(
      p => `
      <div class="product-card">
        <div>${p.name}</div>
        <div>${p.price}</div>
        <button onclick="showVirtualTryOn('${p.id}','${p.name}')">Try On</button>
      </div>
    `
    )
    .join('');
}

function showVirtualTryOn(productId, productName) {
  const photos = JSON.parse(localStorage.getItem('uploadedPhotos') || '[]');
  if (photos.length < 3) return showNotification('Upload all views first', 'warning');
  document.getElementById('productGrid').style.display = 'none';
  document.getElementById('vitonResult').style.display = 'block';
  setup3DViewer(photos);
}
