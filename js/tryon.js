// tryon.js: Virtual Try-On studio logic

let currentCategory = 'tops';
let currentColor = 'black';
let currentSize = 'S';
let selectedProduct = null;

const productData = {
    tops: [
        { id: 'casual-tee', name: 'Premium Cotton T-Shirt', price: '$29.99', description: 'Soft, comfortable cotton tee perfect for daily wear' },
        { id: 'polo-shirt', name: 'Classic Polo Shirt', price: '$39.99', description: 'Elegant polo shirt for smart-casual occasions' },
        { id: 'hoodie', name: 'Cozy Hoodie', price: '$49.99', description: 'Warm and stylish hoodie for cooler days' },
        { id: 'blouse', name: 'Elegant Blouse', price: '$45.99', description: 'Professional blouse perfect for office wear' }
    ],
    bottoms: [
        { id: 'jeans', name: 'Premium Denim Jeans', price: '$69.99', description: 'High-quality denim with perfect fit' },
        { id: 'chinos', name: 'Classic Chinos', price: '$55.99', description: 'Versatile chinos for any occasion' },
        { id: 'leggings', name: 'Athletic Leggings', price: '$34.99', description: 'Comfortable leggings for active lifestyle' },
        { id: 'skirt', name: 'Pleated Skirt', price: '$42.99', description: 'Stylish pleated skirt for elegant look' }
    ],
    dresses: [
        { id: 'summer-dress', name: 'Summer Floral Dress', price: '$59.99', description: 'Light and breezy dress perfect for summer' },
        { id: 'cocktail-dress', name: 'Cocktail Dress', price: '$89.99', description: 'Elegant dress for special occasions' },
        { id: 'casual-dress', name: 'Casual Day Dress', price: '$49.99', description: 'Comfortable dress for everyday wear' },
        { id: 'formal-dress', name: 'Formal Evening Dress', price: '$129.99', description: 'Sophisticated dress for formal events' }
    ],
    jackets: [
        { id: 'leather-jacket', name: 'Genuine Leather Jacket', price: '$199.99', description: 'Classic leather jacket for edgy style' },
        { id: 'blazer', name: 'Business Blazer', price: '$89.99', description: 'Professional blazer for business meetings' },
        { id: 'denim-jacket', name: 'Vintage Denim Jacket', price: '$79.99', description: 'Timeless denim jacket for casual style' },
        { id: 'bomber-jacket', name: 'Modern Bomber Jacket', price: '$95.99', description: 'Trendy bomber jacket for street style' }
    ]
};

function initializeVirtualTryOnPage() {
    const styleOptionsSection = document.getElementById('styleOptionsSection');
    const productRecommendations = document.getElementById('productRecommendations');
    const vitonResult = document.getElementById('vitonResult');
    const styleCategoryCards = document.querySelectorAll('.style-category-card');
    const colorOptions = document.querySelectorAll('.color-option');
    const sizeOptions = document.querySelectorAll('.size-option');
    const productGrid = document.getElementById('productGrid');
    const showRecommendationsBtn = document.getElementById('showRecommendationsBtn');
    const backToStyleBtn = document.getElementById('backToStyleBtn');
    const backToRecommendationsBtn = document.getElementById('backToRecommendationsBtn');
    const saveLookBtn = document.getElementById('saveLookBtn');
    const shareLookBtn = document.getElementById('shareLookBtn');

    // Category selection
    styleCategoryCards.forEach(card => {
        card.addEventListener('click', function() {
            currentCategory = this.dataset.category;
            styleCategoryCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // Color selection
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            currentColor = this.dataset.color;
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // Size selection
    sizeOptions.forEach(option => {
        option.addEventListener('click', function() {
            currentSize = this.dataset.size;
            sizeOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // Show product recommendations
    if (showRecommendationsBtn) {
        showRecommendationsBtn.addEventListener('click', function() {
            styleOptionsSection.style.display = 'none';
            productRecommendations.style.display = 'block';
            loadProductRecommendations();
        });
    }

    // Back navigation
    if (backToStyleBtn) {
        backToStyleBtn.addEventListener('click', function() {
            productRecommendations.style.display = 'none';
            styleOptionsSection.style.display = 'block';
        });
    }
    if (backToRecommendationsBtn) {
        backToRecommendationsBtn.addEventListener('click', function() {
            vitonResult.style.display = 'none';
            productRecommendations.style.display = 'block';
        });
    }

    // Save/share buttons
    if (saveLookBtn) {
        saveLookBtn.addEventListener('click', function() {
            this.innerHTML = 'Saving...';
            setTimeout(() => {
                this.innerHTML = 'Saved!';
                setTimeout(() => {
                    this.innerHTML = 'Save This Look';
                }, 2000);
            }, 1500);
        });
    }
    if (shareLookBtn) {
        shareLookBtn.addEventListener('click', function() {
            alert('Share functionality coming soon! Connect with Facebook, Instagram, Twitter.');
        });
    }

    // Load products
    function loadProductRecommendations() {
        const products = productData[currentCategory] || productData.tops;
        productGrid.innerHTML = '';
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.product = product.id;
            productCard.innerHTML = `
                <div class="product-image">
                    <!-- Product image placeholder -->
                </div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">${product.price}</div>
                <div class="product-description">${product.description}</div>
                <button class="btn viton-btn product-tryon-btn">
                    Try On with VITON
                </button>
            `;
            productCard.querySelector('.product-tryon-btn').addEventListener('click', function() {
                tryOnProduct(product.id, product.name);
            });
            productGrid.appendChild(productCard);
        });
    }
}

// Try on product function
function tryOnProduct(productId, productName) {
    selectedProduct = productId;
    document.getElementById('productRecommendations').style.display = 'none';
    document.getElementById('vitonResult').style.display = 'block';
    document.getElementById('selectedItemName').textContent = productName;
    document.getElementById('processingOverlay1').style.display = 'flex';
    document.getElementById('processingOverlay2').style.display = 'flex';

    setTimeout(() => {
        document.getElementById('processingOverlay1').style.display = 'none';
        document.getElementById('processingOverlay2').style.display = 'none';

        document.querySelector('.image-container .image-placeholder').innerHTML = `
            Your Photo
        `;
        document.querySelector('.image-container.after .image-placeholder').innerHTML = `
            Perfect Fit!
        `;
    }, 3000);
}
// Fade-in animation for tryon sections
function initializeFadeInAnimations() {
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, observerOptions);
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  initializeVirtualTryOnPage();
  initializeFadeInAnimations();
});

document.addEventListener('DOMContentLoaded', initializeVirtualTryOnPage);
