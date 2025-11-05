// ===========================
// GLOBAL VARIABLES
// ===========================
let uploadedFiles = {
  front: null,
  back: null,
  side: null,
  video: null
};

let currentUploadId = null;
let selectedProduct = null;
let photoArray = [];

// Function to check if all photos are uploaded
function areAllPhotosUploaded() {
  return uploadedFiles.front && uploadedFiles.back && uploadedFiles.side;
}

// Function to handle photo upload completion
function handlePhotoUploadComplete() {
  if (areAllPhotosUploaded()) {
    // Show the continue button
    const continueToStyleBtn = document.getElementById('continueToStyle');
    if (continueToStyleBtn) {
      continueToStyleBtn.style.display = 'inline-block';
    }
  }
}

// Function to handle continue to style button click
function handleContinueToStyle() {
    // Hide current sections
    const photoUploadSection = document.getElementById('photoUploadSection');
    const recommendationsSection = document.getElementById('recommendationsSection');
    const uploadOptions = document.getElementById('uploadOptions');
    
    if (photoUploadSection) photoUploadSection.style.display = 'none';
    if (recommendationsSection) recommendationsSection.style.display = 'none';
    if (uploadOptions) uploadOptions.style.display = 'none';
    
    // Show virtual try-on page
    showPage('virtual-tryon');
    
    // Show style options section
    const styleOptionsSection = document.getElementById('styleOptionsSection');
    if (styleOptionsSection) {
        styleOptionsSection.style.display = 'block';
        
        // Hide other virtual try-on sections
        const productRecommendations = document.getElementById('productRecommendations');
        const vitonResult = document.getElementById('vitonResult');
        if (productRecommendations) productRecommendations.style.display = 'none';
        if (vitonResult) vitonResult.style.display = 'none';
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Make the function globally available
window.handleContinueToStyle = handleContinueToStyle;

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  console.log('StyleVision initialized');

  document.body.style.paddingTop = '70px';

  checkAuth();
  initializeAuth();
  initializeUpload();
  initializeAnimations();
  setupPhotoUploadHandlers();
  initializeRecommendationsHandlers();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('page')) showPage(urlParams.get('page'));
  
  // Handle return from confirmation page
  if (urlParams.get('showPhotoUpload') === 'true' && window.location.hash === '#upload') {
    const uploadOptions = document.getElementById('uploadOptions');
    const photoUploadSection = document.getElementById('photoUploadSection');
    
    if (uploadOptions) uploadOptions.style.display = 'none';
    if (photoUploadSection) photoUploadSection.style.display = 'block';
  }
});

// ===========================
// PAGE MANAGEMENT
// ===========================
// SPA page switcher (safe, global)
if (!window.__navGuard) {
  window.__navGuard = {
    lockUntil: 0,
    lastPage: null
  };
}

function showPage(pageId) {
  // sanity
  if (!pageId) return;

  // If page is protected and user not auth -> prompt and block navigation
  if (PROTECTED_PAGES.includes(pageId) && !isUserAuthenticated()) {
    showAuthRequiredModal(pageId);
    return;
  }

  // proceed with normal SPA switching
  document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
  const target = document.getElementById(pageId);
  if (target) {
    target.style.display = 'block';
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // initialize page-specific logic if needed
    if (pageId === 'virtual-tryon') {
      if (typeof initializeVirtualTryOnPage === 'function') {
        try { initializeVirtualTryOnPage(); } catch (err) { console.error(err); }
      }
      if (typeof loadProducts === 'function') {
        try { loadProducts(); } catch (err) { console.error(err); }
      }
    }
    return;
  }

  // fallback to home if not found
  const home = document.getElementById('home');
  if (home) { home.style.display = 'block'; home.classList.add('active'); }
}

// expose globally in case inline onclicks call it
window.showPage = showPage;

// ===========================
// NAV LOCK HELPER (new)
// ===========================
function setNavLock(ms = 3000) {
  if (!window.__navGuard) window.__navGuard = { lockUntil: 0, lastPage: null };
  window.__navGuard.lockUntil = Date.now() + ms;
  console.log('[navLock] set until', new Date(window.__navGuard.lockUntil).toISOString());
}

// Continue button handler (prevents full navigation)
function continueToTryon(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
  }

  // persist selected choices (optional)
  const selectedSizeEl = document.querySelector('.size-card.selected, .size-option.selected');
  if (selectedSizeEl && selectedSizeEl.dataset.size) {
    localStorage.setItem('recommendedSize', selectedSizeEl.dataset.size);
  }
  const selectedCatEl = document.querySelector('.category-card.selected, .style-category-card.selected');
  if (selectedCatEl && selectedCatEl.dataset.category) {
    localStorage.setItem('recommendedCategory', selectedCatEl.dataset.category);
  }

  // lock automatic redirects to 'home' for 60s to avoid stray fallback navigation
  setNavLock(60000);

  // navigate within SPA
  showPage('virtual-tryon');
}
// expose globally (overrides inline)
window.continueToTryon = continueToTryon;

// ===========================
// AUTHENTICATION
// ===========================
function updateAuthUI(user) {
  const authLink = document.getElementById('authLink');
  if (!authLink) return;

  if (user) {
    // show username without icon
    authLink.textContent = user.name;
    authLink.onclick = () => {
      if (confirm('Do you want to logout?')) handleLogout();
    };
  } else {
    authLink.innerHTML = 'Login';
    authLink.onclick = () => showPage('login');
  }
}

async function checkAuth() {
  if (api.isAuthenticated()) {
    try {
      const result = await api.getCurrentUser();
      updateAuthUI(result.user);
    } catch (error) {
      console.log('Session expired:', error);
      api.logout();
      updateAuthUI(null);
    }
  }
}

function handleLogout() {
  api.logout();
  updateAuthUI(null);
  showPage('home');
  showNotification('Logged out successfully', 'success');
}

function initializeAuth() {
  // Login
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showNotification('Please fill in all fields', 'warning');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalHtml = submitBtn.innerHTML;
  submitBtn.textContent = 'Signing in...';
    submitBtn.disabled = true;

    try {
        const result = await api.login({ email, password });
        // result should contain token + user
        if (result && result.token) {
            showNotification('Login successful', 'success');
            updateAuthUI(result.user || JSON.parse(localStorage.getItem('currentUser')));
            // Show the upload options first
            showPage('upload');
            // Show only the upload options section initially
            showUploadOptions();
            return;
        }
        // if server returned success:false or missing token
        throw new Error(result.message || 'Invalid login response');
    } catch (err) {
        console.error('Login error:', err);
        showNotification(err.message || 'Login failed. Please try again.', 'error');
    } finally {
        submitBtn.innerHTML = originalHtml;
        submitBtn.disabled = false;
    }
});

  // Register
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async e => {
      e.preventDefault();

      const name = document.getElementById('registerName').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const password = document.getElementById('registerPassword').value;

      if (!name || !email || !password) {
        showNotification('Please fill in all fields', 'warning');
        return;
      }
      if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'warning');
        return;
      }

      const submitBtn = registerForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.textContent = 'Creating account...';
      submitBtn.disabled = true;

      try {
        const result = await api.register({ name, email, password });
        updateAuthUI(result.user);
        registerForm.reset();
        showNotification('Account created successfully! Redirecting...', 'success');
        setTimeout(() => showPage('upload'), 1500);
      } catch (error) {
        showNotification(error.message || 'Registration failed. Please try again.', 'error');
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }
}

// ===========================
// RECOMMENDATIONS HANDLERS
// ===========================
function initializeRecommendationsHandlers() {
  // Size selection handlers
  document.querySelectorAll('.size-card, .size-option').forEach(sizeEl => {
    sizeEl.addEventListener('click', function() {
      // Remove selected class from all size elements
      document.querySelectorAll('.size-card, .size-option').forEach(el => el.classList.remove('selected'));
      // Add selected class to clicked element
      this.classList.add('selected');
      checkRecommendationsComplete();
    });
  });

  // Category selection handlers
  document.querySelectorAll('.category-card, .style-category-card').forEach(catEl => {
    catEl.addEventListener('click', function() {
      // Remove selected class from all category elements
      document.querySelectorAll('.category-card, .style-category-card').forEach(el => el.classList.remove('selected'));
      // Add selected class to clicked element
      this.classList.add('selected');
      checkRecommendationsComplete();
    });
  });
}

function checkRecommendationsComplete() {
  const hasRecommendedSize = document.querySelector('.size-card.selected, .size-option.selected');
  const hasRecommendedCategory = document.querySelector('.category-card.selected, .style-category-card.selected');
  const continueToStyleBtn = document.getElementById('continueToStyle');
  
  if (continueToStyleBtn && hasRecommendedSize && hasRecommendedCategory) {
    continueToStyleBtn.style.display = 'inline-block';
  }
}

// ===========================
// UPLOAD MANAGEMENT
// ===========================
// Function to show upload options and hide other sections
function showUploadOptions() {
    const uploadOptions = document.getElementById('uploadOptions');
    const photoUploadSection = document.getElementById('photoUploadSection');
    const recommendationsSection = document.getElementById('recommendationsSection');
    
    if (uploadOptions) uploadOptions.style.display = 'block';
    if (photoUploadSection) photoUploadSection.style.display = 'none';
    if (recommendationsSection) recommendationsSection.style.display = 'none';
}

// Function to handle the photo option selection
function goToUploadConfirmation(e) {
    if (e) e.preventDefault();
    window.location.href = 'confirmation.html';
}

function initializeUpload() {
  const uploadOptions = document.getElementById('uploadOptions');
  const photoUploadSection = document.getElementById('photoUploadSection');
  const photoOption = document.getElementById('photoOption');
  const videoOption = document.getElementById('videoOption');
  const backToOptions = document.getElementById('backToOptions');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const recommendationsSection = document.getElementById('recommendationsSection');
  const continueBtn = document.getElementById('continueBtn');

  if (photoOption) {
    photoOption.addEventListener('click', () => {
      uploadOptions.style.display = 'none';
      photoUploadSection.style.display = 'block';
    });
  }

  if (videoOption) {
    videoOption.addEventListener('click', () => {
      showNotification('Video upload feature is coming soon! Please use photo upload option for now.', 'info');
    });
  }

  if (backToOptions) {
    backToOptions.addEventListener('click', () => {
      photoUploadSection.style.display = 'none';
      uploadOptions.style.display = 'block';
    });
  }

  ['front', 'back', 'side'].forEach(type => {
    const input = document.getElementById(`${type}Input`);
    const zone = document.getElementById(`${type}Zone`);

    if (input && zone) {
      input.addEventListener('change', e => {
        if (e.target.files[0]) handlePhotoUpload(type, e.target.files[0], zone);
      });

      zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = '#764ba2'; zone.style.transform = 'scale(1.02)'; });
      zone.addEventListener('dragleave', e => { e.preventDefault(); zone.style.borderColor = '#6366f1'; zone.style.transform = 'scale(1)'; });
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.style.borderColor = '#6366f1';
        zone.style.transform = 'scale(1)';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) handlePhotoUpload(type, file, zone);
        else showNotification('Please upload an image file', 'warning');
      });
    }
  });

  if (continueBtn) {
    continueBtn.addEventListener('click', async function () {
      if (!this.classList.contains('enabled')) {
        showNotification('Please upload at least 2 photos', 'warning');
        return;
      }
  this.textContent = 'Processing...';
      this.disabled = true;

      try {
        const formData = new FormData();
        formData.append('front', document.getElementById('frontInput').files[0]);
        formData.append('back', document.getElementById('backInput').files[0]);
        formData.append('side', document.getElementById('sideInput').files[0]);
        // if video present:
        // formData.append('video', document.getElementById('videoInput').files[0]);

        progressContainer.style.display = 'block';
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 10;
          if (progress <= 90) {
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
          }
        }, 200);

        const result = await api.uploadFiles(formData);

        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        progressText.textContent = '100%';

        currentUploadId = result.upload._id;
        localStorage.setItem('currentUploadId', currentUploadId);

        photoArray = [];
        if (result.upload.files.front) photoArray.push(result.upload.files.front.url);
        if (result.upload.files.side) photoArray.push(result.upload.files.side.url);
        if (result.upload.files.back) photoArray.push(result.upload.files.back.url);
        localStorage.setItem('uploadedPhotos', JSON.stringify(photoArray));

        showNotification('Photos uploaded successfully!', 'success');

        setTimeout(() => {
          progressContainer.style.display = 'none';
          // prevent any immediate fallback redirect to home after upload
          setNavLock(60000);
          showPage('virtual-tryon');
        }, 1000);
      } catch (error) {
        console.error('Upload error:', error);
        showNotification(error.message || 'Upload failed. Please try again.', 'error');
        this.textContent = 'Continue to Virtual Try-On';
        this.disabled = false;
        progressContainer.style.display = 'none';
      }
    });
  }
}

function handlePhotoUpload(type, file, zone) {
  // Allow direct string type for onchange handlers
  if (typeof type === 'string' && !file && !zone) {
    const input = document.getElementById(`${type}Input`);
    if (input && input.files[0]) {
      file = input.files[0];
      zone = document.getElementById(`${type}Zone`);
    }
  }
  
  if (!file || !zone) return;

  uploadedFiles[type] = file;
  zone.classList.add('uploaded');
  const icon = zone.querySelector('.upload-icon i');
  const text = zone.querySelector('.upload-text');
  const subtitle = zone.querySelector('.upload-subtitle');

  icon.className = 'fas fa-check-circle';
  text.textContent = 'Photo Uploaded ✓';
  subtitle.textContent = 'Click to change';

  const reader = new FileReader();
  reader.onload = e => {
    zone.style.backgroundImage = `url(${e.target.result})`;
    zone.style.backgroundSize = 'cover';
    zone.style.backgroundPosition = 'center';
    icon.style.display = 'none';
  };
  reader.readAsDataURL(file);

  // Check for "Continue to Choose Style" button visibility
  const continueToStyleBtn = document.getElementById('continueToStyle');
  if (continueToStyleBtn) {
    if (uploadedFiles.front && uploadedFiles.back && uploadedFiles.side) {
      continueToStyleBtn.style.display = 'inline-block';
    } else {
      continueToStyleBtn.style.display = 'none';
    }
  }

  checkAllUploads();
}

function checkAllUploads() {
  const photoCount = ['front', 'back', 'side'].filter(type => uploadedFiles[type]).length;
  if (photoCount >= 2) {
    const recommendationsSection = document.getElementById('recommendationsSection');
    if (recommendationsSection) recommendationsSection.style.display = 'block';
    enableContinueButton();
    
    // Also check if we should show the style continue button
    const continueToStyleBtn = document.getElementById('continueToStyle');
    if (continueToStyleBtn) {
      const hasRecommendedSize = document.querySelector('.size-card.selected, .size-option.selected');
      const hasRecommendedCategory = document.querySelector('.category-card.selected, .style-category-card.selected');
      
      if (hasRecommendedSize && hasRecommendedCategory) {
        continueToStyleBtn.style.display = 'inline-block';
      }
    }
  }
}

function enableContinueButton() {
  const continueBtn = document.getElementById('continueBtn');
  if (continueBtn) {
    continueBtn.classList.add('enabled');
    continueBtn.disabled = false;
  }
}

// ===========================
// PRODUCTS & TRY-ON
// ===========================
// --- local product data (fallback) ---
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

// --- load products and render into productGrid ---
async function loadProducts() {
  const productGrid = document.getElementById('productGrid');
  const productRecommendations = document.getElementById('productRecommendations');
  const styleOptionsSection = document.getElementById('styleOptionsSection');

  if (!productGrid) return;

  // show recommendations container
  if (productRecommendations) productRecommendations.style.display = 'block';
  if (styleOptionsSection) styleOptionsSection.style.display = 'none';

  productGrid.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin fa-3x text-primary"></i><p class="mt-3">Loading products...</p></div>';

  try {
    // prefer API if available
    let products = [];
    if (typeof api !== 'undefined' && typeof api.getRecommendations === 'function') {
      const res = await api.getRecommendations();
      products = (res && (res.products || res.items)) || [];
    }

    // determine category priority:
    // - explicit UI selection (.style-category-card.selected or localStorage)
    // - if side photo uploaded => bottoms
    // - if back photo uploaded => jackets
    // - fallback to tops
    let selectedCategory = null;
    const sel = document.querySelector('.style-category-card.selected, .category-card.selected');
    if (sel && sel.dataset && sel.dataset.category) selectedCategory = sel.dataset.category;
    if (!selectedCategory) selectedCategory = localStorage.getItem('recommendedCategory');

    // uploadedFiles (global) used to influence category
    if (!selectedCategory) {
      if (window.uploadedFiles && uploadedFiles.side) selectedCategory = 'bottoms';
      else if (window.uploadedFiles && uploadedFiles.back) selectedCategory = 'jackets';
      else selectedCategory = 'tops';
    }

    // if no API products or empty, use productData mapping
    if (!products || products.length === 0) {
      products = productData[selectedCategory] || productData.tops;
    } else {
      // if API returned items filter by category key if available
      products = products.filter(p => {
        if (!p.category) return true;
        return p.category === selectedCategory || p.category === selectedCategory.slice(0, -1); // simple match
      });
      if (products.length === 0) products = productData[selectedCategory] || productData.tops;
    }

    // render grid
    productGrid.innerHTML = '';
    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-image">
          <i class="${product.icon || 'fas fa-tshirt'} fa-3x"></i>
        </div>
        <div class="product-name">${product.name}</div>
        <div class="product-price">${product.price || ''}</div>
        <div class="product-description">${product.description || ''}</div>
        <button class="btn viton-btn tryon-btn" data-id="${product.id}" data-name="${product.name}">
          <i class="fas fa-magic me-2"></i>Try On with VITON
        </button>
      `;
      productGrid.appendChild(card);
    });

    // attach try-on handlers
    document.querySelectorAll('.tryon-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        if (typeof tryOnProduct === 'function') tryOnProduct(id, name);
        else {
          // fallback: show vitonResult
          document.getElementById('productRecommendations').style.display = 'none';
          document.getElementById('vitonResult').style.display = 'block';
          if (document.getElementById('selectedItemName')) document.getElementById('selectedItemName').textContent = name || '';
        }
      });
    });

    // if none rendered
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

// expose globally
window.loadProducts = loadProducts;

function setup3DViewer(imageUrls) {
  const container = document.getElementById('vitonResult');
  container.innerHTML = '';
  const width = container.clientWidth;
  const height = 400;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const geometry = new THREE.BoxGeometry(2, 3, 1);
  const materials = imageUrls.map(url => new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load(url) }));
  const cube = new THREE.Mesh(geometry, materials);
  scene.add(cube);

  camera.position.z = 5;

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') cube.rotation.y -= 0.1;
    if (e.key === 'ArrowRight') cube.rotation.y += 0.1;
  });

  (function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  })();
}

function showVirtualTryOn(productId, productName) {
  selectedProduct = productId;
  const photosJson = localStorage.getItem('uploadedPhotos');
  photoArray = photosJson ? JSON.parse(photosJson) : [];
  if (photoArray.length < 3) {
    showNotification('Please upload front, side and back photos for 3D view.', 'warning');
    showPage('upload');
    return;
  }
  document.getElementById('productGrid').style.display = 'none';
  const vitonResult = document.getElementById('vitonResult');
  vitonResult.style.display = 'block';
  document.getElementById('selectedItemName').textContent = productName;
  setup3DViewer([photoArray[0], photoArray[1], photoArray[2], photoArray[1]]);
}

// ===========================
// SAVE LOOK AND MANAGE LOOKS
// ===========================
async function saveLook(eventOrItem) {
  // eventOrItem can be a click event or an object { id, name, price, description }
  let triggerBtn = null;
  if (eventOrItem && eventOrItem.target) triggerBtn = eventOrItem.target;

  const origHTML = triggerBtn ? triggerBtn.innerHTML : null;
  if (triggerBtn) { triggerBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...'; triggerBtn.disabled = true; }

  try {
    const uploadId = localStorage.getItem('currentUploadId');
    const photosJson = localStorage.getItem('uploadedPhotos');
    const photos = photosJson ? JSON.parse(photosJson) : [];

    // product info may come from selectedProduct or passed item
    let productId = selectedProduct || null;
    let productName = '';
    let productPrice = null;
    if (eventOrItem && eventOrItem.target && eventOrItem.target.dataset) {
      productId = productId || eventOrItem.target.dataset.id;
      productName = eventOrItem.target.dataset.name || productName;
      productPrice = eventOrItem.target.dataset.price || productPrice;
    } else if (eventOrItem && eventOrItem.id) {
      productId = productId || eventOrItem.id;
      productName = eventOrItem.name || productName;
      productPrice = eventOrItem.price || productPrice;
    }

    // build look object
    const look = {
      _id: `local_${Date.now()}`,
      productId: productId || null,
      productName: productName || '',
      productPrice: productPrice || '',
      uploadId: uploadId || null,
      images: Array.isArray(photos) ? photos.slice(0) : [],
      selectedSize: localStorage.getItem('recommendedSize') || null,
      selectedColor: localStorage.getItem('recommendedColor') || null,
      savedAt: new Date().toISOString()
    };

    // save locally (savedLooksLocal)
    const KEY = 'savedLooksLocal';
    const current = JSON.parse(localStorage.getItem(KEY) || '[]');
    // avoid duplicates by productId + uploadId
    const exists = current.some(i => i.productId === look.productId && i.uploadId === look.uploadId);
    if (!exists) {
      current.unshift(look);
      localStorage.setItem(KEY, JSON.stringify(current));
    }

    // attempt server save (fire & forget)
    if (typeof api !== 'undefined' && typeof api.saveLook === 'function') {
      try {
        await api.saveLook({
          productId: look.productId,
          uploadId: look.uploadId,
          selectedSize: look.selectedSize,
          selectedColor: look.selectedColor,
          images: look.images
        });
      } catch (srvErr) {
        console.warn('Server saveLook failed', srvErr);
      }
    }

    showNotification('Saved to your looks', 'success');
    if (typeof loadSavedLooks === 'function') loadSavedLooks();
  } catch (err) {
    console.error('saveLook error', err);
    showNotification(err.message || 'Failed to save look', 'error');
  } finally {
    if (triggerBtn) { triggerBtn.innerHTML = origHTML; triggerBtn.disabled = false; }
  }
}

// helper: add item to cart (local)
function addToCart(item) {
  const CART_KEY = 'cartItems';
  const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  // store minimal product info
  const cartItem = {
    id: item.productId || item.id || `p_${Date.now()}`,
    name: item.productName || item.name || 'Product',
    price: item.productPrice || item.price || '',
    qty: 1,
    addedAt: new Date().toISOString()
  };
  // if exists increment qty
  const idx = cart.findIndex(c => c.id === cartItem.id);
  if (idx >= 0) cart[idx].qty += 1;
  else cart.push(cartItem);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  showNotification('Added to cart', 'success');
}

// helper: buy now (redirect)
function buyNow(item) {
  // implement your checkout route. Here we'll redirect with product id param
  const pid = encodeURIComponent(item.productId || item.id || '');
  if (!pid) {
    showNotification('Product not available for purchase', 'warning');
    return;
  }
  // example: /checkout?product=...
  window.location.href = `/checkout?product=${pid}`;
}

// Replace loadSavedLooks to render buy/add-to-cart when no images
async function loadSavedLooks() {
  const container = document.getElementById('savedLooksContainer');
  if (!container) return;

  const saved = JSON.parse(localStorage.getItem('savedLooksLocal') || '[]');

  container.innerHTML = `
    <div class="upload-container">
      <h1 class="page-title">Saved Looks</h1>
      <p class="page-subtitle">Your saved virtual try-on collection</p>
      <div class="product-grid" id="savedGrid"></div>
    </div>
  `;

  const grid = document.getElementById('savedGrid');
  if (!grid) return;

  if (saved.length === 0) {
    grid.innerHTML = `
      <div class="text-center w-100">
        <i class="fas fa-heart-broken fa-4x text-muted mb-3"></i>
        <p class="text-muted">No saved looks yet.</p>
        <button class="btn viton-btn" onclick="showPage('upload')"><i class="fas fa-camera me-2"></i>Start Virtual Try-On</button>
      </div>
    `;
    return;
  }

  // render each saved look
  grid.innerHTML = '';
  saved.forEach(look => {
    const hasImages = Array.isArray(look.images) && look.images.length > 0;
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-image" style="${hasImages ? `background-image:url('${look.images[0]}'); background-size:cover; background-position:center; height:200px; border-radius:12px;` : 'background:linear-gradient(135deg,#667eea,#764ba2); height:200px; border-radius:12px; display:flex;align-items:center;justify-content:center;'}">
        ${!hasImages ? '<i class="fas fa-shopping-bag fa-3x text-white"></i>' : ''}
      </div>
      <div class="product-name">${look.productName || 'Saved Look'}</div>
      <div class="product-price">${look.productPrice || ''}</div>
      <div class="product-meta small text-muted">Saved: ${new Date(look.savedAt).toLocaleString()}</div>
      <div class="product-actions mt-2"></div>
    `;
    // actions
    const actions = card.querySelector('.product-actions');
    // always allow viewing try-on result if images exist
    if (hasImages) {
      const tryBtn = document.createElement('button');
      tryBtn.className = 'btn viton-btn me-2';
      tryBtn.textContent = 'View Try-On';
      tryBtn.addEventListener('click', () => {
        // show try-on using stored images
        localStorage.setItem('uploadedPhotos', JSON.stringify(look.images));
        if (typeof showPage === 'function') showPage('virtual-tryon');
      });
      actions.appendChild(tryBtn);
    }

    // buy / add-to-cart for product-only or always show
    const cartBtn = document.createElement('button');
    cartBtn.className = 'btn btn-outline-primary me-2';
    cartBtn.textContent = 'Add to Cart';
    cartBtn.addEventListener('click', () => addToCart(look));
    actions.appendChild(cartBtn);

    const buyBtn = document.createElement('button');
    buyBtn.className = 'btn btn-primary';
    buyBtn.textContent = 'Buy Now';
    buyBtn.addEventListener('click', () => buyNow(look));
    actions.appendChild(buyBtn);

    // delete button
    const del = document.createElement('button');
    del.className = 'btn btn-danger ms-2';
    del.innerHTML = '<i class="fas fa-trash"></i>';
    del.addEventListener('click', async () => {
      if (!confirm('Delete this saved look?')) return;
      const arr = JSON.parse(localStorage.getItem('savedLooksLocal') || '[]');
      const remaining = arr.filter(i => i._id !== look._id);
      localStorage.setItem('savedLooksLocal', JSON.stringify(remaining));
      showNotification('Saved look deleted', 'success');
      loadSavedLooks();
      try { if (typeof api !== 'undefined' && typeof api.deleteLook === 'function') await api.deleteLook(look._id); } catch(e){/* ignore */ }
    });
    actions.appendChild(del);

    grid.appendChild(card);
  });
}

// ===========================
// NOTIFICATIONS
// ===========================
function showNotification(message, type = 'info') {
  const existing = document.querySelector('.custom-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = `custom-notification notification-${type}`;

  const icons = {
    success: 'check-circle',
    error: 'exclamation-circle',
    warning: 'exclamation-triangle',
    info: 'info-circle'
  };

  notification.innerHTML = `
    <i class="fas fa-${icons[type]} me-2"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(notification);

  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ===========================
// ANIMATIONS
// ===========================
function initializeAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

async function sendUploads() {
  try {
    const formData = new FormData();
    if (uploadedFiles.front) formData.append('front', uploadedFiles.front);
    if (uploadedFiles.back) formData.append('back', uploadedFiles.back);
    if (uploadedFiles.side) formData.append('side', uploadedFiles.side);
    if (uploadedFiles.video) formData.append('video', uploadedFiles.video);

    const token = localStorage.getItem('authToken');
    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
        // DO NOT set Content-Type for FormData
      },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      showNotification(data.message || 'Upload failed', 'error');
      return;
    }

    showNotification('Files uploaded successfully', 'success');

    // Redirect based on backend hint (SPA)
    const target = data.redirectTo || 'virtual-tryon';
    // If your SPA uses showPage(pageId):
    if (typeof showPage === 'function') {
      showPage(target);
    } else {
      // fallback: navigate to a path (if you have routes)
      window.location.href = `/${target}`;
    }

    // Optionally keep the returned upload object in localStorage for try-on
    if (data.upload) {
      localStorage.setItem('lastUpload', JSON.stringify(data.upload));
    }
  } catch (err) {
    console.error('Upload failed:', err);
    showNotification(err.message || 'Upload failed', 'error');
  }
}

// safe attach for sizeRecBtn (won't throw if element missing)
const sizeRecBtn = document.getElementById('sizeRecBtn');
if (sizeRecBtn) {
  sizeRecBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof showPage === 'function') {
      showPage('virtual-tryon');
    } else {
      window.location.href = '/virtual-tryon';
    }
  });
}

// ensure recommendation handlers are attached on DOM ready (in case panel is already visible)
document.addEventListener('DOMContentLoaded', () => {
  if (typeof attachRecommendationHandlers === 'function') attachRecommendationHandlers();
});

// --- Recommendations / Size UI handlers ---
document.addEventListener('DOMContentLoaded', () => {
  const showRecBtn = document.getElementById('showRecommendationsBtn');
  if (showRecBtn) {
    showRecBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showRecommendations();
    });
  }

  const continueBtn = document.getElementById('continueBtn');
  if (continueBtn) {
    continueBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showPage('virtual-tryon');
    });
  }

  document.addEventListener('click', (e) => {
    const cat = e.target.closest('.category-card');
    if (cat) {
      document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
      cat.classList.add('selected');
      selectedProduct = cat.dataset.category || null;
    }

    const size = e.target.closest('.size-card');
    if (size) {
      document.querySelectorAll('.size-card').forEach(s => s.classList.remove('selected'));
      size.classList.add('selected');
      const recommended = document.getElementById('recommendedSize');
      if (recommended) recommended.textContent = size.dataset.size || '';
    }
  });
});

function showRecommendations() {
  const uploadOptions = document.getElementById('uploadOptions');
  const photoUploadSection = document.getElementById('photoUploadSection');
  const progressContainer = document.getElementById('progressContainer');
  const recommendationsSection = document.getElementById('recommendationsSection');

  if (uploadOptions) uploadOptions.style.display = 'none';
  if (photoUploadSection) photoUploadSection.style.display = 'none';
  if (progressContainer) progressContainer.style.display = 'none';
  if (recommendationsSection) {
    recommendationsSection.style.display = 'block';
    recommendationsSection.scrollIntoView({ behavior: 'smooth' });
  }

  const sel = document.querySelector('.size-card.selected') || document.querySelector('.size-card[data-size="S"]');
  if (sel) {
    sel.classList.add('selected');
    const recommended = document.getElementById('recommendedSize');
    if (recommended) recommended.textContent = sel.dataset.size || sel.textContent || '';
  }

  // ensure click handlers are attached (works if elements are inserted/visible dynamically)
  attachRecommendationHandlers();
}

// --- add this helper at end of file (or near other helpers) ---
function attachRecommendationHandlers() {
  // category cards
  document.querySelectorAll('.category-card').forEach(card => {
    if (card.dataset.bound === '1') return;
    card.addEventListener('click', () => {
      document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedProduct = card.dataset.category || null;
    });
    card.dataset.bound = '1';
  });

  // size cards
  document.querySelectorAll('.size-card').forEach(size => {
    if (size.dataset.bound === '1') return;
    size.addEventListener('click', () => {
      document.querySelectorAll('.size-card').forEach(s => s.classList.remove('selected'));
      size.classList.add('selected');
      const recommended = document.getElementById('recommendedSize');
      if (recommended) recommended.textContent = size.dataset.size || '';
    });
    size.dataset.bound = '1';
  });
}

// Delegated handler for category cards (works even if cards are added later)
document.addEventListener('click', function (e) {
  const card = e.target.closest && e.target.closest('.category-card, .style-category-card');
  if (!card) return;

  e.preventDefault();
  // ensure card is interactable
  if (card.hasAttribute('disabled') || card.classList.contains('disabled')) return;

  // toggle selection
  document.querySelectorAll('.category-card, .style-category-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');

  // store selected category
  const cat = card.dataset.category || card.getAttribute('data-category') || null;
  selectedProduct = cat;
  // persist if needed
  if (cat) localStorage.setItem('recommendedCategory', cat);
});

(function attachContinueToTryon() {
  const continueBtn = document.getElementById('continueBtn');
  if (!continueBtn) return;
  continueBtn.type = 'button';
  continueBtn.addEventListener('click', (e) => {
    e.preventDefault();
    setNavLock(60000);
    // persist selected size/category for try-on page (if any)
    const selectedSize = document.querySelector('.size-card.selected, .size-option.selected');
    if (selectedSize && selectedSize.dataset.size) localStorage.setItem('recommendedSize', selectedSize.dataset.size);
    const selectedCat = document.querySelector('.category-card.selected, .style-category-card.selected');
    if (selectedCat && selectedCat.dataset.category) localStorage.setItem('recommendedCategory', selectedCat.dataset.category);

    // navigate SPA
    if (typeof showPage === 'function') {
      showPage('virtual-tryon');
      // give page a moment then initialize products/tryon if function exists
      setTimeout(() => { if (typeof loadProducts === 'function') loadProducts(); }, 150);
      return;
    }

    // fallback: show element directly
    document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
    const target = document.getElementById('virtual-tryon');
    if (target) { target.style.display = 'block'; target.classList.add('active'); }
  });
})();

// attach virtual-tryon controls (save/share/back)
(function attachVitonControls() {
  document.addEventListener('click', (e) => {
    const t = e.target;

    if (t.closest && t.closest('#backToStyleBtn')) {
      e.preventDefault();
      const prod = document.getElementById('productRecommendations');
      const style = document.getElementById('styleOptionsSection');
      if (prod) prod.style.display = 'none';
      if (style) style.style.display = 'block';
      const pg = document.getElementById('productGrid');
      if (pg) pg.innerHTML = '';
      return;
    }

    if (t.closest && t.closest('#backToRecommendationsBtn')) {
      e.preventDefault();
      // go back to recommendations panel within try-on
      const viton = document.getElementById('vitonResult');
      const products = document.getElementById('productRecommendations');
      if (viton) viton.style.display = 'none';
      if (products) products.style.display = 'block';
      return;
    }

    if (t.closest && t.closest('#saveLookBtn')) {
      e.preventDefault();
      // call saveLook with synthetic event (saveLook expects event.target)
      try { saveLook(e); } catch (err) { console.error(err); }
      return;
    }

    if (t.closest && t.closest('#shareLookBtn')) {
      e.preventDefault();
      // simple share: copy current product URL or show notification (customize as needed)
      try {
        const shareData = { title: 'My VITON Result', text: 'Check my try-on result', url: window.location.href };
        if (navigator.share) { navigator.share(shareData).catch(()=>{}); }
        else { navigator.clipboard.writeText(shareData.url).then(()=> showNotification('Result link copied to clipboard','success')); }
      } catch (err) { console.error(err); showNotification('Unable to share', 'error'); }
      return;
    }
  });
})();

// AUTH CHECK + PROTECTED NAVIGATION (replace any existing showPage implementation)
// helper: check authentication (uses api.isAuthenticated if available, fallback to token)
function isUserAuthenticated() {
  try {
    if (typeof api !== 'undefined' && typeof api.isAuthenticated === 'function') {
      return !!api.isAuthenticated();
    }
  } catch (e) { /* ignore */ }
  return !!(localStorage.getItem('token') || localStorage.getItem('authToken'));
}

// helper: show auth-required modal (register/login). No "continue as guest".
function showAuthRequiredModal(requestedPage) {
  const id = 'authRequiredModal';
  // avoid duplicate
  let modalEl = document.getElementById(id);
  if (modalEl) {
    const bs = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    bs.show();
    return;
  }

  modalEl = document.createElement('div');
  modalEl.id = id;
  modalEl.className = 'modal fade';
  modalEl.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Login / Register Required</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p>To use this feature you must have an account. Please sign up or login to continue.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Stay on Home</button>
          <button type="button" class="btn btn-outline-primary" id="goRegisterBtn">Register</button>
          <button type="button" class="btn btn-primary" id="goLoginBtn">Login</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalEl);

  const bsModal = new bootstrap.Modal(modalEl);
  bsModal.show();

  document.getElementById('goLoginBtn').addEventListener('click', () => {
    bsModal.hide();
    // open login page
    showPage('login');
  });
  document.getElementById('goRegisterBtn').addEventListener('click', () => {
    bsModal.hide();
    // open register page
    showPage('register');
  });

  modalEl.addEventListener('hidden.bs.modal', () => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.remove();
    }, 300);
  });
}

// Protected pages list (require auth)
const PROTECTED_PAGES = ['upload', 'virtual-tryon', 'saved-looks'];

// ===========================
// WELCOME OVERLAY
// ===========================
function showWelcomeThenUpload(user = {}) {
  // create overlay if missing
  const id = 'welcomeOverlay';
  if (document.getElementById(id)) return;

  const name = (user && (user.name || user.username)) || localStorage.getItem('username') || 'User';
  localStorage.setItem('username', name);

  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '9999';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.background = 'linear-gradient(135deg, rgba(56, 13, 209, 0.95), rgba(28, 12, 148, 0.95))';
  overlay.innerHTML = `
    <div style="text-align:center;color:#fff;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial;">
      <h1 style="font-size:2.4rem;margin:0 0 8px;">Welcome, ${escapeHtml(name)}!</h1>
      <p style="margin:0 0 14px;opacity:0.95;">Preparing your Virtual Try-On…</p>
      <div style="width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;margin:12px auto;box-shadow:0 8px 30px rgba(0,0,0,0.12);">
        <i class="fas fa-smile fa-2x" style="color:#fff;"></i>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // show for n ms then navigate
  const showMs = 2600;
  setTimeout(() => {
    // fade out
    overlay.style.transition = 'opacity 300ms ease, transform 300ms ease';
    overlay.style.opacity = '0';
    overlay.style.transform = 'scale(0.98)';
    setTimeout(() => {
      overlay.remove();
      // navigate to upload (SPA)
      if (typeof showPage === 'function') showPage('upload');
      else window.location.href = '/upload';
    }, 320);
  }, showMs);
}

// small helper to avoid HTML injection into overlay
function escapeHtml(str) {
  return String(str).replace(/[&<>"'`=\/]/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',"/":'&#x2F;','`':'&#x60;','=':'&#x3D;' }[s]));
}