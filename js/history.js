/**
 * History Manager for QRpop
 * Stores generated and scanned items directly in MongoDB Atlas via Backend API.
 */

const API_BASE = '/api';

const STORAGE_KEY = 'qrpop_local_history';

class HistoryManager {
  constructor() {
    this.currentUser = null;
    this.records = this.loadLocalRecords();
    this.currentFilter = 'all';
    this.isLoading = false;
    this.initEventListeners();
    this.initAuthSubscription();
  }

  loadLocalRecords() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      let list = data ? JSON.parse(data) : [];
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    } catch (e) {}

    // Initial default record if storage is empty
    const defaultList = [{
      id: 'rec_' + Date.now(),
      type: 'generated',
      category: 'Text',
      content: 'Welcome to QRpop!',
      timestamp: new Date().toISOString()
    }];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultList));
    } catch (e) {}
    return defaultList;
  }

  saveLocalRecords() {
    try {
      if (Array.isArray(this.records)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records.slice(0, 50)));
      }
    } catch (e) {}
  }

  initAuthSubscription() {
    if (window.authManager) {
      window.authManager.onAuthStateChanged((user) => {
        this.currentUser = user;
        if (user) {
          this.fetchCloudRecords();
        } else {
          this.records = this.loadLocalRecords();
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
          this.saveLocalRecords();
        }
      }
    } catch (e) {
      console.warn('Using local history cache:', e);
    } finally {
      this.isLoading = false;
      this.render();
    }
  }

  async addRecord(type, category, content) {
    if (!content || !content.trim()) return;

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

    // Save locally immediately
    this.records.unshift(localRecord);
    if (this.records.length > 50) this.records.pop();
    this.saveLocalRecords();
    this.render();

    // If logged in, sync to MongoDB Atlas
    if (this.currentUser) {
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
          // Update id from server
          localRecord.id = data.record.id || localRecord.id;
          this.saveLocalRecords();
        }
      } catch (e) {
        console.warn('Cloud sync error, saved locally:', e);
      }
    }
  }

  async deleteRecord(id) {
    this.records = this.records.filter(r => r.id !== id);
    this.saveLocalRecords();
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
      this.saveLocalRecords();
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
    if (!this.records || this.records.length === 0) {
      this.records = this.loadLocalRecords();
    }
    const allCount = this.records.length;
    const genCount = this.records.filter(r => r.type === 'generated').length;
    const scanCount = this.records.filter(r => r.type === 'scanned').length;

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
    if (!this.records || this.records.length === 0) {
      this.records = this.loadLocalRecords();
    }
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

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <i class="fa-regular fa-folder-open"></i>
          <p>No activity records found. Generated and scanned QR codes will appear here!</p>
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
              <i class="fa-solid fa-trash-can"></i>
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
