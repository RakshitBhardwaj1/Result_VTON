// main.js — small bootstrap that initializes the modularized frontend.
document.addEventListener('DOMContentLoaded', () => {
  console.log('StyleVision bootstrap starting');
  // keep some top spacing for fixed navbar
  try { document.body.style.paddingTop = '70px'; } catch (e) { /* ignore in non-browser */ }

  // Safe initializer: call a set of well-known init functions if provided by modules.
  const initNames = [
    'checkAuth',
    'initializeAuth',
    'initializeUpload',
    'initializeAnimations',
    'initializeRecommendationsHandlers'
  ];
  initNames.forEach(name => {
    try {
      const fn = window[name];
      if (typeof fn === 'function') fn();
    } catch (err) {
      console.error(`Error running ${name}:`, err);
    }
  });

  // Preserve behavior when page is passed in querystring
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('page') && typeof showPage === 'function') showPage(urlParams.get('page'));
    if (urlParams.get('showPhotoUpload') === 'true' && window.location.hash === '#upload') {
      const uploadOptions = document.getElementById('uploadOptions');
      const photoUploadSection = document.getElementById('photoUploadSection');
      if (uploadOptions) uploadOptions.style.display = 'none';
      if (photoUploadSection) photoUploadSection.style.display = 'block';
    }
  } catch (e) {
    console.error('Error handling URL params in bootstrap:', e);
  }
});

