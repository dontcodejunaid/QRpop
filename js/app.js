/**
 * Main Application Coordinator & Navigation Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initToastNotification();
  if (window.historyManager) {
    window.historyManager.render();
  }
});

/**
 * Segmented Tab Switching
 */
function initNavigation() {
  const tabs = document.querySelectorAll('.nav-segmented .nav-tab');
  const sections = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');

      // Update tab active state
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update sections
      sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === `section-${targetId}`) {
          section.classList.add('active');
        }
      });

      // Special tab handlers
      if (targetId === 'scanner') {
        // Ready for scan
      } else {
        // If navigating away from scanner, stop camera to release device resource
        if (window.qrScanner && window.qrScanner.isCameraRunning) {
          window.qrScanner.stopCamera();
        }
      }

      if (targetId === 'history' && window.historyManager) {
        window.historyManager.render();
      }
    });
  });
}

/**
 * Global Toast Notification System
 */
function initToastNotification() {
  window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  };
}
