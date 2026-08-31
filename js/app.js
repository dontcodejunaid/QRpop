/**
 * Main Application Coordinator & Navigation Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initThemeToggle();
  initToastNotification();
  if (window.historyManager) {
    window.historyManager.render();
  }
});

/**
 * SkyToggle Day/Night Theme Switcher
 */
function initThemeToggle() {
  const toggleCheckbox = document.getElementById('sky-toggle-checkbox');
  const savedTheme = localStorage.getItem('qrpop_theme') || 'dark';

  if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    if (toggleCheckbox) toggleCheckbox.checked = false;
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (toggleCheckbox) toggleCheckbox.checked = true;
  }

  if (toggleCheckbox) {
    toggleCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        // Night mode
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('qrpop_theme', 'dark');
        if (window.showToast) window.showToast('Night mode enabled', 'info');
      } else {
        // Day mode
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('qrpop_theme', 'light');
        if (window.showToast) window.showToast('Day mode enabled', 'info');
      }
    });
  }
}

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
        // Automatically start camera & trigger permission request when user opens Scan tab
        if (window.qrScanner && !window.qrScanner.isCameraRunning) {
          window.qrScanner.startCamera();
        }
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

  // Logo Click Navigation -> Go to Home
  const logoLink = document.getElementById('brand-logo-link');
  if (logoLink) {
    const goToHome = () => {
      document.getElementById('tab-btn-home')?.click();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    logoLink.addEventListener('click', goToHome);
    logoLink.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goToHome();
      }
    });
  }

  // Home Quick Action Button Navigation
  const btnHomeGen = document.getElementById('btn-home-go-generate');
  const btnHomeScan = document.getElementById('btn-home-go-scan');

  if (btnHomeGen) {
    btnHomeGen.addEventListener('click', () => {
      document.getElementById('tab-btn-generator')?.click();
    });
  }

  if (btnHomeScan) {
    btnHomeScan.addEventListener('click', () => {
      document.getElementById('tab-btn-scanner')?.click();
    });
  }
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
