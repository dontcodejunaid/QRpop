/**
 * History Manager for QRpop
 * Stores generated and scanned items directly in MongoDB Atlas via Backend API.
 */

const API_BASE = '/api';

class HistoryManager {
  constructor() {
    this.currentUser = null;
    this.records = [];
    this.currentFilter = 'all';
    this.isLoading = false;
    this.initEventListeners();
    this.initAuthSubscription();
  }

  initAuthSubscription() {
    if (window.authManager) {
      window.authManager.onAuthStateChanged((user) => {
        this.currentUser = user;
        if (user) {
          this.fetchRecords();
        } else {
          this.records = [];
          this.render();
        }
      });
    }
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = window.authManager?.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async fetchRecords() {
    if (!this.currentUser) return;
    this.isLoading = true;
    try {
      const res = await fetch(`${API_BASE}/history`, {
        headers: this.getHeaders()
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.records)) {
        this.records = data.records;
      }
    } catch (e) {
      console.error('Failed to fetch history from MongoDB Atlas', e);
    } finally {
      this.isLoading = false;
      this.render();
    }
  }

  async addRecord(type, category, content) {
    if (!content || !content.trim()) return;

    if (!this.currentUser) {
      if (window.showToast) {
        window.showToast('Please sign in to save activity to your History', 'info');
      }
      return;
    }

    // Check duplicate recent local entry
    if (this.records.length > 0 && this.records[0].content === content && this.records[0].type === type) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/history`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          type: type || 'generated',
          category: category || 'Text',
          content: content.trim()
        })
      });

      const data = await res.json();
      if (data.success && data.record) {
        this.records.unshift(data.record);
        if (this.records.length > 50) this.records.pop();
        this.render();
      }
    } catch (e) {
      console.error('Failed to add record to MongoDB Atlas', e);
    }
  }

  async deleteRecord(id) {
    if (!this.currentUser) return;

    try {
      const res = await fetch(`${API_BASE}/history/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        this.records = this.records.filter(r => r.id !== id);
        this.render();
        if (window.showToast) window.showToast('Record deleted', 'info');
      }
    } catch (e) {
      console.error('Failed to delete history record', e);
    }
  }

  async clearAll() {
    if (!this.currentUser) return;
    if (this.records.length === 0) return;
    if (confirm('Are you sure you want to clear your history?')) {
      try {
        const res = await fetch(`${API_BASE}/history`, {
          method: 'DELETE',
          headers: this.getHeaders()
        });
        const data = await res.json();
        if (data.success) {
          this.records = [];
          this.render();
          if (window.showToast) window.showToast('History cleared', 'info');
        }
      } catch (e) {
        console.error('Failed to clear history in MongoDB Atlas', e);
      }
    }
  }

  getFilteredRecords() {
    if (this.currentFilter === 'all') return this.records;
    return this.records.filter(r => r.type === this.currentFilter);
  }

  updateCounts() {
    const allCount = this.currentUser ? this.records.length : 0;
    const genCount = this.currentUser ? this.records.filter(r => r.type === 'generated').length : 0;
    const scanCount = this.currentUser ? this.records.filter(r => r.type === 'scanned').length : 0;

    const elAll = document.getElementById('count-all');
    const elGen = document.getElementById('count-generated');
    const elScan = document.getElementById('count-scanned');

    if (elAll) elAll.textContent = allCount;
    if (elGen) elGen.textContent = genCount;
    if (elScan) elScan.textContent = scanCount;
  }

  formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  render() {
    this.updateCounts();
    const listEl = document.getElementById('history-list');
    const clearBtn = document.getElementById('btn-clear-history');
    if (!listEl) return;

    // If no user is logged in, show Auth Gate state
    if (!this.currentUser) {
      if (clearBtn) clearBtn.style.display = 'none';
      listEl.innerHTML = `
        <div class="auth-gate-state">
          <div class="auth-gate-icon">
            <i class="fa-solid fa-lock"></i>
          </div>
          <h3>Sign in to View Your History</h3>
          <p>Your generated and scanned QR codes are stored securely in your private cloud account on MongoDB Atlas. Log in or create a free account to track your QR history.</p>
          <button class="btn btn-primary btn-lg" id="btn-history-signin">
            <i class="fa-solid fa-right-to-bracket"></i> Sign In / Sign Up
          </button>
        </div>
      `;

      const gateSignInBtn = document.getElementById('btn-history-signin');
      if (gateSignInBtn) {
        gateSignInBtn.addEventListener('click', () => {
          if (window.openAuthModal) {
            window.openAuthModal('login');
          }
        });
      }
      return;
    }

    if (clearBtn) clearBtn.style.display = 'inline-flex';

    if (this.isLoading) {
      listEl.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <p>Loading your cloud history...</p>
        </div>
      `;
      return;
    }

    const filtered = this.getFilteredRecords();

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <i class="fa-regular fa-folder-open"></i>
          <p>No activity records found for this view.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(rec => {
      const isGen = rec.type === 'generated';
      const icon = isGen ? 'fa-wand-magic-sparkles' : 'fa-camera';
      const badgeClass = isGen ? 'type-gen' : 'type-scan';
      const typeLabel = isGen ? 'Generated' : 'Scanned';

      return `
        <div class="history-card" data-id="${rec.id}">
          <div class="history-card-left">
            <div class="history-icon-badge">
              <i class="fa-solid ${icon}"></i>
            </div>
            <div class="history-details">
              <div class="history-title-row">
                <span class="history-type-tag ${badgeClass}">${typeLabel}</span>
                <span class="history-time">${this.formatDate(rec.timestamp)}</span>
              </div>
              <div class="history-content-snippet" title="${this.escapeHtml(rec.content)}">${this.escapeHtml(rec.content)}</div>
            </div>
          </div>
          <div class="history-card-actions">
            <button class="btn btn-outline btn-sm copy-hist-btn" data-content="${this.escapeHtml(rec.content)}" title="Copy Content">
              <i class="fa-regular fa-copy"></i>
            </button>
            <button class="btn btn-outline btn-sm delete-hist-btn" data-id="${rec.id}" title="Delete Record">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to cards
    listEl.querySelectorAll('.copy-hist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const content = btn.getAttribute('data-content');
        if (navigator.clipboard) {
          navigator.clipboard.writeText(content).then(() => {
            if (window.showToast) window.showToast('Copied to clipboard!', 'success');
          });
        }
      });
    });

    listEl.querySelectorAll('.delete-hist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.deleteRecord(id);
      });
    });
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  initEventListeners() {
    const clearBtn = document.getElementById('btn-clear-history');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearAll());
    }

    const filterChips = document.querySelectorAll('.history-filter-bar .filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentFilter = chip.getAttribute('data-filter');
        this.render();
      });
    });
  }
}

window.historyManager = new HistoryManager();
