/**
 * Authentication Manager for QRpop
 * Integrated with Express / MongoDB Atlas REST backend API
 */

const TOKEN_KEY = 'qrpop_auth_token';
const CURRENT_USER_KEY = 'qrpop_current_user_session';
const API_BASE = '/api';

class AuthManager {
  constructor() {
    this.listeners = [];
    this.token = sessionStorage.getItem(TOKEN_KEY) || null;
    this.currentUser = this.loadCurrentSession();

    // Verify token validity with backend if token exists
    if (this.token) {
      this.verifySession();
    }
  }

  getToken() {
    return this.token;
  }

  onAuthStateChanged(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
      callback(this.currentUser);
    }
  }

  notifyListeners() {
    this.listeners.forEach(cb => {
      try {
        cb(this.currentUser);
      } catch (err) {
        console.error('Auth listener error:', err);
      }
    });
  }

  loadCurrentSession() {
    try {
      const data = sessionStorage.getItem(CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  async verifySession() {
    if (!this.token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          this.currentUser = data.user;
          sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
          this.notifyListeners();
        }
      } else {
        // Token expired/invalid
        this.logout();
      }
    } catch (err) {
      console.warn('Could not verify session with server', err);
    }
  }

  isAuthenticated() {
    return !!this.currentUser && !!this.token;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Sign Up a new user with MongoDB Atlas
   */
  async signUp(name, email, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Sign up failed.' };
      }

      this.token = data.token;
      this.currentUser = data.user;
      sessionStorage.setItem(TOKEN_KEY, data.token);
      sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
      this.notifyListeners();

      return { success: true, user: data.user, message: data.message };
    } catch (err) {
      console.error('Sign up error:', err);
      return { success: false, message: 'Could not connect to server. Please try again.' };
    }
  }

  /**
   * Log In an existing user with MongoDB Atlas
   */
  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Login failed.' };
      }

      this.token = data.token;
      this.currentUser = data.user;
      sessionStorage.setItem(TOKEN_KEY, data.token);
      sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
      this.notifyListeners();

      return { success: true, user: data.user, message: data.message };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: 'Could not connect to server. Please try again.' };
    }
  }

  /**
   * Log Out
   */
  logout() {
    this.token = null;
    this.currentUser = null;
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(CURRENT_USER_KEY);
    this.notifyListeners();
    return { success: true, message: 'Logged out successfully.' };
  }
}

window.authManager = new AuthManager();
