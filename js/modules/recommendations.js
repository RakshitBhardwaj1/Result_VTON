// Recommendations and selection handlers
(function () {
  function initializeRecommendationsHandlers() {
    document.querySelectorAll('.size-card, .size-option').forEach(sizeEl => {
      if (sizeEl.dataset.bound) return; sizeEl.addEventListener('click', function() {
        document.querySelectorAll('.size-card, .size-option').forEach(el => el.classList.remove('selected'));
        this.classList.add('selected');
        checkRecommendationsComplete();
      }); sizeEl.dataset.bound = '1';
    });

    document.querySelectorAll('.category-card, .style-category-card').forEach(catEl => {
      if (catEl.dataset.bound) return; catEl.addEventListener('click', function() {
        document.querySelectorAll('.category-card, .style-category-card').forEach(el => el.classList.remove('selected'));
        this.classList.add('selected');
        checkRecommendationsComplete();
      }); catEl.dataset.bound = '1';
    });
  }

  function checkRecommendationsComplete() {
    const hasRecommendedSize = document.querySelector('.size-card.selected, .size-option.selected');
    const hasRecommendedCategory = document.querySelector('.category-card.selected, .style-category-card.selected');
    const continueToStyleBtn = document.getElementById('continueToStyle');
    if (continueToStyleBtn && hasRecommendedSize && hasRecommendedCategory) continueToStyleBtn.style.display = 'inline-block';
  }

  function attachRecommendationHandlers() {
    document.querySelectorAll('.category-card').forEach(card => {
      if (card.dataset.bound === '1') return;
      card.addEventListener('click', () => { document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected')); card.classList.add('selected'); window.selectedProduct = card.dataset.category || null; });
      card.dataset.bound = '1';
    });

    document.querySelectorAll('.size-card').forEach(size => {
      if (size.dataset.bound === '1') return;
      size.addEventListener('click', () => { document.querySelectorAll('.size-card').forEach(s => s.classList.remove('selected')); size.classList.add('selected'); const recommended = document.getElementById('recommendedSize'); if (recommended) recommended.textContent = size.dataset.size || ''; });
      size.dataset.bound = '1';
    });
  }

  function showRecommendations() {
    const uploadOptions = document.getElementById('uploadOptions');
    const photoUploadSection = document.getElementById('photoUploadSection');
    const progressContainer = document.getElementById('progressContainer');
    const recommendationsSection = document.getElementById('recommendationsSection');
    if (uploadOptions) uploadOptions.style.display = 'none';
    if (photoUploadSection) photoUploadSection.style.display = 'none';
    if (progressContainer) progressContainer.style.display = 'none';
    if (recommendationsSection) { recommendationsSection.style.display = 'block'; recommendationsSection.scrollIntoView({ behavior: 'smooth' }); }

    const sel = document.querySelector('.size-card.selected') || document.querySelector('.size-card[data-size="S"]');
    if (sel) { sel.classList.add('selected'); const recommended = document.getElementById('recommendedSize'); if (recommended) recommended.textContent = sel.dataset.size || sel.textContent || ''; }

    attachRecommendationHandlers();
  }

  window.initializeRecommendationsHandlers = initializeRecommendationsHandlers;
  window.checkRecommendationsComplete = checkRecommendationsComplete;
  window.attachRecommendationHandlers = attachRecommendationHandlers;
  window.showRecommendations = showRecommendations;
})();
