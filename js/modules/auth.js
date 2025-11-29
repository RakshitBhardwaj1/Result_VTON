// ===========================
// AUTHENTICATION HANDLERS
// ===========================
function updateAuthUI(user) {
  const authLink = document.getElementById('authLink');
  if (!authLink) return;

  if (user) {
    authLink.textContent = user.name;
    authLink.onclick = () => confirm('Logout?') && handleLogout();
  } else {
    authLink.textContent = 'Login';
    authLink.onclick = () => showPage('login');
  }
}

async function checkAuth() {
  if (api.isAuthenticated()) {
    try {
      const result = await api.getCurrentUser();
      updateAuthUI(result.user);
    } catch {
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
  document.getElementById('loginForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    if (!email || !password) return showNotification('Please fill all fields', 'warning');

    try {
      const result = await api.login({ email, password });
      if (result?.token) {
        showNotification('Login successful', 'success');
        updateAuthUI(result.user);
        showPage('upload');
      }
    } catch {
      showNotification('Login failed. Try again.', 'error');
    }
  });

  // Register
  document.getElementById('registerForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const name = registerName.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value;
    if (!name || !email || password.length < 6)
      return showNotification('Please fill all fields properly', 'warning');

    try {
      const result = await api.register({ name, email, password });
      showNotification('Account created successfully!', 'success');
      updateAuthUI(result.user);
      showPage('upload');
    } catch {
      showNotification('Registration failed', 'error');
    }
  });
}
