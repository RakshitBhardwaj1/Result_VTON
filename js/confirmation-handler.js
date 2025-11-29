// Check if user is coming back from confirmation page
document.addEventListener('DOMContentLoaded', function() {
    // If URL has #upload hash and there's a confirmation cookie/flag
    if (window.location.hash === '#upload') {
        // Remove the hash to prevent re-triggering
        window.location.hash = '';
        // Show the upload page directly
        showPage('upload');
    }
});