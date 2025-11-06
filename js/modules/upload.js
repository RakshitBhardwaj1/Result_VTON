// Upload management: show/hide, initialize handlers and send uploads
(function () {
  function showUploadOptions() {
    const uploadOptions = document.getElementById('uploadOptions');
    const photoUploadSection = document.getElementById('photoUploadSection');
    const recommendationsSection = document.getElementById('recommendationsSection');
    if (uploadOptions) uploadOptions.style.display = 'block';
    if (photoUploadSection) photoUploadSection.style.display = 'none';
    if (recommendationsSection) recommendationsSection.style.display = 'none';
  }

  function goToUploadConfirmation(e) {
    if (e) e.preventDefault();
    window.location.href = 'confirmation.html';
  }

  function enableContinueButton() {
    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
      continueBtn.classList.add('enabled');
      continueBtn.disabled = false;
    }
  }

  function checkAllUploads() {
    const photoCount = ['front', 'back', 'side'].filter(type => window.uploadedFiles[type]).length;
    if (photoCount >= 2) {
      const recommendationsSection = document.getElementById('recommendationsSection');
      if (recommendationsSection) recommendationsSection.style.display = 'block';
      enableContinueButton();

      const continueToStyleBtn = document.getElementById('continueToStyle');
      if (continueToStyleBtn) {
        const hasRecommendedSize = document.querySelector('.size-card.selected, .size-option.selected');
        const hasRecommendedCategory = document.querySelector('.category-card.selected, .style-category-card.selected');
        if (hasRecommendedSize && hasRecommendedCategory) continueToStyleBtn.style.display = 'inline-block';
      }
    }
  }

  function handlePhotoUpload(type, file, zone) {
    if (typeof type === 'string' && !file && !zone) {
      const input = document.getElementById(`${type}Input`);
      if (input && input.files[0]) { file = input.files[0]; zone = document.getElementById(`${type}Zone`); }
    }
    if (!file || !zone) return;

    window.uploadedFiles[type] = file;
    zone.classList.add('uploaded');
    const icon = zone.querySelector('.upload-icon i');
    const text = zone.querySelector('.upload-text');
    const subtitle = zone.querySelector('.upload-subtitle');

    if (icon) icon.className = 'fas fa-check-circle';
    if (text) text.textContent = 'Photo Uploaded ✓';
    if (subtitle) subtitle.textContent = 'Click to change';

    const reader = new FileReader();
    reader.onload = e => {
      zone.style.backgroundImage = `url(${e.target.result})`;
      zone.style.backgroundSize = 'cover';
      zone.style.backgroundPosition = 'center';
      if (icon) icon.style.display = 'none';
    };
    reader.readAsDataURL(file);

    const continueToStyleBtn = document.getElementById('continueToStyle');
    if (continueToStyleBtn) {
      if (window.uploadedFiles.front && window.uploadedFiles.back && window.uploadedFiles.side) continueToStyleBtn.style.display = 'inline-block';
      else continueToStyleBtn.style.display = 'none';
    }

    checkAllUploads();
  }

  async function sendUploads() {
    try {
      const formData = new FormData();
      if (window.uploadedFiles.front) formData.append('front', window.uploadedFiles.front);
      if (window.uploadedFiles.back) formData.append('back', window.uploadedFiles.back);
      if (window.uploadedFiles.side) formData.append('side', window.uploadedFiles.side);
      if (window.uploadedFiles.video) formData.append('video', window.uploadedFiles.video);

      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) { showNotification(data.message || 'Upload failed', 'error'); return; }

      showNotification('Files uploaded successfully', 'success');
      const target = data.redirectTo || 'virtual-tryon';
      if (typeof showPage === 'function') showPage(target);
      else window.location.href = `/${target}`;

      if (data.upload) localStorage.setItem('lastUpload', JSON.stringify(data.upload));
    } catch (err) {
      console.error('Upload failed:', err);
      showNotification(err.message || 'Upload failed', 'error');
    }
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

    if (photoOption) photoOption.addEventListener('click', () => { uploadOptions.style.display = 'none'; photoUploadSection.style.display = 'block'; });
    if (videoOption) videoOption.addEventListener('click', () => showNotification('Video upload feature is coming soon!','info'));
    if (backToOptions) backToOptions.addEventListener('click', () => { photoUploadSection.style.display = 'none'; uploadOptions.style.display = 'block'; });

    ['front','back','side'].forEach(type => {
      const input = document.getElementById(`${type}Input`);
      const zone = document.getElementById(`${type}Zone`);
      if (input && zone) {
        input.addEventListener('change', e => { if (e.target.files[0]) handlePhotoUpload(type, e.target.files[0], zone); });
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = '#764ba2'; zone.style.transform = 'scale(1.02)'; });
        zone.addEventListener('dragleave', e => { e.preventDefault(); zone.style.borderColor = '#6366f1'; zone.style.transform = 'scale(1)'; });
        zone.addEventListener('drop', e => {
          e.preventDefault(); zone.style.borderColor = '#6366f1'; zone.style.transform = 'scale(1)';
          const file = e.dataTransfer.files[0];
          if (file && file.type.startsWith('image/')) handlePhotoUpload(type, file, zone);
          else showNotification('Please upload an image file', 'warning');
        });
      }
    });

    if (continueBtn) {
      continueBtn.addEventListener('click', async function() {
        if (!this.classList.contains('enabled')) return showNotification('Please upload at least 2 photos','warning');
        this.textContent = 'Processing...'; this.disabled = true;
        try {
          const formData = new FormData();
          formData.append('front', document.getElementById('frontInput').files[0]);
          formData.append('back', document.getElementById('backInput').files[0]);
          formData.append('side', document.getElementById('sideInput').files[0]);

          progressContainer.style.display = 'block';
          let progress = 0;
          const progressInterval = setInterval(() => { progress += 10; if (progress <= 90) { progressBar.style.width = `${progress}%`; progressText.textContent = `${progress}%`; } }, 200);

          const result = await api.uploadFiles(formData);

          clearInterval(progressInterval);
          progressBar.style.width = '100%'; progressText.textContent = '100%';

          window.currentUploadId = result.upload._id; localStorage.setItem('currentUploadId', window.currentUploadId);
          window.photoArray = [];
          if (result.upload.files.front) window.photoArray.push(result.upload.files.front.url);
          if (result.upload.files.side) window.photoArray.push(result.upload.files.side.url);
          if (result.upload.files.back) window.photoArray.push(result.upload.files.back.url);
          localStorage.setItem('uploadedPhotos', JSON.stringify(window.photoArray));

          showNotification('Photos uploaded successfully!', 'success');
          setTimeout(() => { progressContainer.style.display = 'none'; setNavLock(60000); showPage('virtual-tryon'); }, 1000);
        } catch (error) {
          console.error('Upload error:', error);
          showNotification(error.message || 'Upload failed. Please try again.', 'error');
          this.textContent = 'Continue to Virtual Try-On'; this.disabled = false; progressContainer.style.display = 'none';
        }
      });
    }
  }

  // expose
  window.showUploadOptions = showUploadOptions;
  window.goToUploadConfirmation = goToUploadConfirmation;
  window.initializeUpload = initializeUpload;
  window.handlePhotoUpload = handlePhotoUpload;
  window.sendUploads = sendUploads;
  // Handler for Continue to Choose Style button - shows style options section
  window.handleContinueToStyle = function () {
    try {
      // Navigate to virtual-tryon page
      if (typeof showPage === 'function') {
        showPage('virtual-tryon');
      }
      
      // Ensure the style options section is visible (not product recommendations)
      setTimeout(() => {
        const styleOptionsSection = document.getElementById('styleOptionsSection');
        const productRecommendations = document.getElementById('productRecommendations');
        const vitonResult = document.getElementById('vitonResult');
        
        if (styleOptionsSection) styleOptionsSection.style.display = 'block';
        if (productRecommendations) productRecommendations.style.display = 'none';
        if (vitonResult) vitonResult.style.display = 'none';
      }, 100);
    } catch (e) {
      console.error('handleContinueToStyle error:', e);
    }
  };
})();
