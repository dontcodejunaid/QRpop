/**
 * History Manager for QRpop
 * Stores generated and scanned items in localStorage
 */

const HISTORY_KEY = 'qrpop_history_records';

class HistoryManager {
  constructor() {
    this.records = this.loadRecords();
    this.currentFilter = 'all';
    this.initEventListeners();
  }

  loadRecords() {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load history from localStorage', e);
      return [];
    }
  }

  saveRecords() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.records));
      this.render();
    } catch (e) {
      console.error('Failed to save history to localStorage', e);
    }
  }

  addRecord(type, category, content) {
    if (!content || !content.trim()) return;

    // Prevent duplicate adjacent entries
    if (this.records.length > 0 && this.records[0].content === content && this.records[0].type === type) {
      return;
    }

    const record = {
      id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: type, // 'generated' | 'scanned'
      category: category || 'Text',
      content: content,
      timestamp: new Date().toISOString()
    };

    this.records.unshift(record);
    // Keep maximum 50 records
    if (this.records.length > 50) {
      this.records.pop();
    }

    this.saveRecords();
  }

  deleteRecord(id) {
    this.records = this.records.filter(r => r.id !== id);
    this.saveRecords();
    if (window.showToast) window.showToast('Record deleted', 'info');
  }

  clearAll() {
    if (this.records.length === 0) return;
    if (confirm('Are you sure you want to clear all history?')) {
      this.records = [];
      this.saveRecords();
      if (window.showToast) window.showToast('History cleared', 'info');
    }
  }

  getFilteredRecords() {
    if (this.currentFilter === 'all') return this.records;
    return this.records.filter(r => r.type === this.currentFilter);
  }

  updateCounts() {
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
    this.updateCounts();
    const listEl = document.getElementById('history-list');
    if (!listEl) return;

    const filtered = this.getFilteredRecords();

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <i class="fa-regular fa-folder-open"></i>
          <p>No history records found for this view.</p>
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
