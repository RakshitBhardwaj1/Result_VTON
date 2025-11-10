// API Service for StyleVision
const API_BASE_URL = 'http://localhost:5000/api';




class APIService {
    constructor() {
        this.token = localStorage.getItem('authToken');
    }

    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }

    async handleResponse(response) {
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        
        return data;
    }
    async loginWithFirebaseToken(idToken) {
  const response = await fetch(`${this.baseUrl}/auth/firebase-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed login');
  this.setToken(data.token);
  localStorage.setItem('currentUser', JSON.stringify(data.user));
  return data;
}

    // AUTH ENDPOINTS
    async register(userData) {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: this.getHeaders(false),
            body: JSON.stringify(userData)
        });
        
        const data = await this.handleResponse(response);
        this.setToken(data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return data;
    }

    async login(credentials) {
        // send request
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: this.getHeaders(false),
            body: JSON.stringify(credentials)
        });

        // parse and handle errors (assumes handleResponse throws on non-OK)
        const data = await this.handleResponse(response);

        // store token and user for later calls
        if (data.token) {
            this.setToken(data.token);
            localStorage.setItem('authToken', data.token);
        }
        if (data.user) {
            localStorage.setItem('currentUser', JSON.stringify(data.user));
        }

        // IMPORTANT: return the server data so caller can act on success
        return data;
    }

    async getCurrentUser() {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    }

    logout() {
        this.clearToken();
    }

    // UPLOAD ENDPOINTS
    async uploadFiles(formData) {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });
        
        return await this.handleResponse(response);
    }

    async getUserUploads() {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    }

    // PRODUCT ENDPOINTS
    async getProducts(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        const url = `${API_BASE_URL}/products${queryString ? '?' + queryString : ''}`;
        
        const response = await fetch(url);
        return await this.handleResponse(response);
    }

    async getProduct(id) {
        const response = await fetch(`${API_BASE_URL}/products/${id}`);
        return await this.handleResponse(response);
    }

    async getRecommendations(filters = {}) {
        // Build query string from filters (category, size, colors)
        const queryString = new URLSearchParams(filters).toString();
        const url = `${API_BASE_URL}/products/recommendations${queryString ? '?' + queryString : ''}`;
        
        const response = await fetch(url, {
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    }

    // SAVED LOOKS ENDPOINTS
    async saveLook(lookData) {
        const response = await fetch(`${API_BASE_URL}/looks`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(lookData)
        });
        
        return await this.handleResponse(response);
    }

    async getSavedLooks() {
        const response = await fetch(`${API_BASE_URL}/looks`, {
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    }

    async deleteLook(id) {
        const response = await fetch(`${API_BASE_URL}/looks/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    }

    async shareLook(id, platforms) {
        const response = await fetch(`${API_BASE_URL}/looks/${id}/share`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ platforms })
        });
        
        return await this.handleResponse(response);
    }

    // Check if user is logged in
    isAuthenticated() {
        return !!this.token;
    }
}

// Create singleton instance
const api = new APIService();