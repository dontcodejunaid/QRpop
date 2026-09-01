/**
 * History Manager for QRpop
 * Stores generated and scanned items directly in MongoDB Atlas via Backend API.
 */

const API_BASE = '/api';

const STORAGE_KEY = 'qrpop_local_history';

class HistoryManager {
  constructor() {
    this.currentUser = null;
    this.records = [];
    this.currentFilter = 'all';
    this.isLoading = false;
    this.initEventListeners();
    this.initAuthSubscription();
  }

  updateSubtitle() {
    const sub = document.getElementById('history-header-subtitle');
    if (sub) {
      if (this.currentUser) {
        sub.textContent = `Activity history for ${this.currentUser.name || this.currentUser.email} (MongoDB Atlas).`;
      } else {
        sub.textContent = 'Sign in to access and sync your QR activity history.';
      }
    }
  }

  initAuthSubscription() {
    if (window.authManager) {
      window.authManager.onAuthStateChanged((user) => {
        this.currentUser = user;
        this.updateSubtitle();
        
        // When switching users or logging out, clear and reload user-specific records
        if (user) {
          this.records = [];
          this.fetchCloudRecords();
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

  async fetchCloudRecords() {
    if (!this.currentUser) return;
    this.isLoading = true;
    try {
      const res = await fetch(`${API_BASE}/history`, {
        headers: this.getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.records)) {
          this.records = data.records;
        }
      }
    } catch (e) {
      console.warn('History fetch error:', e);
    } finally {
      this.isLoading = false;
      this.render();
    }
  }

  async addRecord(type, category, content) {
    if (!content || !content.trim()) return;

    // Only store history if user is authenticated
    if (!this.currentUser) return;

    // Check duplicate recent local entry
    if (this.records.length > 0 && this.records[0].content === content && this.records[0].type === type) {
      return;
    }

    const localRecord = {
      id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: type || 'generated',
      category: category || 'Text',
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    // Save in memory for current user session immediately
    this.records.unshift(localRecord);
    if (this.records.length > 50) this.records.pop();
    this.render();

    // Sync to MongoDB Atlas under current authenticated user ID
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
        localRecord.id = data.record.id || localRecord.id;
      }
    } catch (e) {
      console.warn('Cloud sync error:', e);
    }
  }

  async deleteRecord(id) {
    this.records = this.records.filter(r => r.id !== id);
    this.render();
    if (window.showToast) window.showToast('Record removed', 'info');

    if (this.currentUser) {
      try {
        await fetch(`${API_BASE}/history/${id}`, {
          method: 'DELETE',
          headers: this.getHeaders()
        });
      } catch (e) {}
    }
  }

  async clearAll() {
    if (this.records.length === 0) return;
    if (confirm('Are you sure you want to clear your activity history?')) {
      this.records = [];
      this.render();
      if (window.showToast) window.showToast('History cleared', 'info');

      if (this.currentUser) {
        try {
          await fetch(`${API_BASE}/history`, {
            method: 'DELETE',
            headers: this.getHeaders()
          });
        } catch (e) {}
      }
    }
  }

  getFilteredRecords() {
    if (this.currentFilter === 'all') return this.records;
    return this.records.filter(r => r.type === this.currentFilter);
  }

  updateCounts() {
    if (!this.currentUser) {
      this.records = [];
    }
    const allCount = this.records ? this.records.length : 0;
    const genCount = this.records ? this.records.filter(r => r.type === 'generated').length : 0;
    const scanCount = this.records ? this.records.filter(r => r.type === 'scanned').length : 0;

    const elAll = document.getElementById('count-all');
    const elGen = document.getElementById('count-generated');
    const elScan = document.getElementById('count-scanned');

    if (elAll) elAll.textContent = allCount;
    if (elGen) elGen.textContent = genCount;
    if (elScan) elScan.textContent = scanCount;
  }

  formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';

    const dateFormatted = date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    const timeFormatted = date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `${dateFormatted} at ${timeFormatted}`;
  }

  parseTitle(category, content) {
    if (!content) return 'QR Code';
    const clean = content.trim();
    if (clean.startsWith('WIFI:')) {
      const match = clean.match(/S:([^;]+)/);
      return match ? `Wi-Fi: ${match[1]}` : 'Wi-Fi Network';
    }
    if (clean.startsWith('BEGIN:VCARD')) {
      const match = clean.match(/FN:([^\n\r]+)/);
      return match ? `Contact: ${match[1]}` : 'vCard Contact';
    }
    if (clean.startsWith('tel:')) {
      return `Phone: ${clean.replace('tel:', '')}`;
    }
    if (clean.startsWith('mailto:')) {
      const email = clean.replace('mailto:', '').split('?')[0];
      return `Email: ${email}`;
    }
    if (/^https?:\/\//i.test(clean)) {
      try {
        const url = new URL(clean);
        return `URL: ${url.hostname}${url.pathname.length > 1 ? url.pathname : ''}`;
      } catch (e) {
        return `URL: ${clean}`;
      }
    }
    return category && category !== 'TEXT' ? `${category} Content` : 'Text Content';
  }

  render() {
    this.updateCounts();
    const listEl = document.getElementById('history-list');
    const clearBtn = document.getElementById('btn-clear-history');
    if (!listEl) return;

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

    if (!this.currentUser) {
      listEl.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-user-lock"></i>
          <p>Please sign in to view and sync your personal QR activity history.</p>
          <button class="btn btn-primary btn-sm" id="btn-history-signin-cta" style="margin-top: 0.75rem;">
            <i class="fa-regular fa-user"></i> Sign In to Account
          </button>
        </div>
      `;
      const signinCta = document.getElementById('btn-history-signin-cta');
      if (signinCta && window.openAuthModal) {
        signinCta.addEventListener('click', () => window.openAuthModal('login'));
      }
      if (clearBtn) clearBtn.style.display = 'none';
      return;
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <i class="fa-regular fa-folder-open"></i>
          <p>No activity records found for your account. Generated and scanned QR codes will appear here!</p>
        </div>
      `;
      if (clearBtn) clearBtn.style.display = 'none';
      return;
    }

    if (clearBtn) clearBtn.style.display = 'inline-flex';

    listEl.innerHTML = filtered.map(rec => {
      const isGen = rec.type === 'generated';
      const icon = isGen ? 'fa-wand-magic-sparkles' : 'fa-camera';
      const badgeClass = isGen ? 'type-gen' : 'type-scan';
      const typeLabel = isGen ? 'Generated' : 'Scanned';
      const categoryLabel = (rec.category || 'Text').toUpperCase();
      const title = this.parseTitle(rec.category, rec.content);

      return `
        <div class="history-card" data-id="${rec.id}">
          <div class="history-card-left">
            <div class="history-icon-badge">
              <i class="fa-solid ${icon}"></i>
            </div>
            <div class="history-details">
              <div class="history-title-row">
                <span class="history-type-tag ${badgeClass}">${typeLabel}</span>
                <span class="history-category-tag">${this.escapeHtml(categoryLabel)}</span>
                <span class="history-time"><i class="fa-regular fa-calendar-days" style="margin-right: 3px; font-size: 0.7rem;"></i>${this.formatDate(rec.timestamp)}</span>
              </div>
              <h4 class="history-item-title">${this.escapeHtml(title)}</h4>
              <div class="history-content-snippet" title="${this.escapeHtml(rec.content)}">${this.escapeHtml(rec.content)}</div>
            </div>
          </div>
          <div class="history-card-actions">
            <button class="btn btn-outline btn-sm copy-hist-btn" data-content="${this.escapeHtml(rec.content)}" title="Copy Content">
              <i class="fa-regular fa-copy"></i>
              <span>Copy</span>
            </button>
            <button class="btn btn-danger btn-sm delete-hist-btn" data-id="${rec.id}" title="Delete Record">
              <i class="fa-solid fa-trash-can"></i>
              <span>Delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach copy & delete listeners
    listEl.querySelectorAll('.copy-hist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = btn.getAttribute('data-content');
        if (text && navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => {
            if (window.showToast) window.showToast('Copied to clipboard!', 'success');
          });
        }
      });
    });

    listEl.querySelectorAll('.delete-hist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) {
          this.deleteRecord(id);
        }
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
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearAll();
      });
    }

    const filterChips = document.querySelectorAll('.history-filter-bar .filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentFilter = chip.getAttribute('data-filter') || 'all';
        this.render();
      });
    });
  }
}

// Instantiate immediately and render when DOM is ready
window.historyManager = new HistoryManager();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.historyManager.initEventListeners();
    window.historyManager.render();
  });
} else {
  window.historyManager.initEventListeners();
  window.historyManager.render();
}
