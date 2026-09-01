/**
 * Main Application Coordinator & Navigation Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initThemeToggle();
  initToastNotification();
  initAuthUI();
  if (window.historyManager) {
    window.historyManager.render();
  }
  if (window.qrGenerator) {
    window.qrGenerator.init();
  }
});

/**
 * Auth UI Manager (Header profile chip, Modal, Login/Signup forms)
 */
function initAuthUI() {
  const modal = document.getElementById('auth-modal');
  const btnClose = document.getElementById('btn-close-auth-modal');
  const tabLogin = document.getElementById('tab-auth-login');
  const tabSignup = document.getElementById('tab-auth-signup');
  const formLogin = document.getElementById('form-auth-login');
  const formSignup = document.getElementById('form-auth-signup');
  const modalTitle = document.getElementById('auth-modal-title');
  const modalSubtitle = document.getElementById('auth-modal-subtitle');
  const authHeaderSection = document.getElementById('auth-header-section');

  const container = document.getElementById('auth-switch-container');
  const btnSwitchToSignUp = document.getElementById('btn-switch-to-signup');
  const btnSwitchToSignIn = document.getElementById('btn-switch-to-signin');

  // Global helper to open modal in a specific mode
  window.openAuthModal = function(mode = 'login') {
    if (!modal) return;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (mode === 'signup') {
      container?.classList.add('sign-up-mode');
    } else {
      container?.classList.remove('sign-up-mode');
    }
  };

  window.closeAuthModal = function() {
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  // Close triggers
  if (btnClose) {
    btnClose.addEventListener('click', () => window.closeAuthModal());
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        window.closeAuthModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
      window.closeAuthModal();
    }
  });

  // Switch between Sign in and Sign up modes
  if (btnSwitchToSignUp) {
    btnSwitchToSignUp.addEventListener('click', () => {
      container?.classList.add('sign-up-mode');
    });
  }

  if (btnSwitchToSignIn) {
    btnSwitchToSignIn.addEventListener('click', () => {
      container?.classList.remove('sign-up-mode');
    });
  }

  // Toggle Password Visibility
  document.querySelectorAll('.btn-toggle-pwd').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('i');
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
          }
        } else {
          input.type = 'password';
          if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
          }
        }
      }
    });
  });

  // Handle Login Submission
  const btnSubmitLogin = document.getElementById('btn-submit-login');
  if (formLogin) {
    const handleLogin = async (e) => {
      if (e) e.preventDefault();
      const email = document.getElementById('login-email')?.value;
      const pwd = document.getElementById('login-password')?.value;

      if (btnSubmitLogin) btnSubmitLogin.disabled = true;

      const result = await window.authManager.login(email, pwd);
      if (btnSubmitLogin) btnSubmitLogin.disabled = false;

      if (result.success) {
        if (window.showToast) window.showToast(result.message, 'success');
        window.closeAuthModal();
        // Clear fields
        if (document.getElementById('login-password')) document.getElementById('login-password').value = '';
      } else {
        if (window.showToast) window.showToast(result.message, 'error');
      }
    };

    formLogin.addEventListener('submit', handleLogin);
    if (btnSubmitLogin) btnSubmitLogin.addEventListener('click', handleLogin);
  }

  // Assisted Password Confirmation & Strength Validation in Sign Up
  const pwdInput = document.getElementById('signup-password');
  const confirmInput = document.getElementById('signup-confirm-password');
  const dotsTrack = document.getElementById('assisted-pwd-track');
  const dotsContainer = document.getElementById('pwd-dots-container');
  const confirmWrap = document.getElementById('confirm-pwd-wrap');
  
  const strengthBox = document.getElementById('pwd-strength-box');
  const strengthBar = document.getElementById('pwd-strength-bar');
  const strengthText = document.getElementById('pwd-strength-text');
  const reqLen = document.getElementById('req-len');
  const reqNum = document.getElementById('req-num');
  const reqLower = document.getElementById('req-lower');
  const reqUpper = document.getElementById('req-upper');

  function updatePasswordStrength() {
    if (!pwdInput || !strengthBox || !strengthBar || !strengthText) return;
    const pwd = pwdInput.value;

    if (pwd.length === 0) {
      strengthBox.style.display = 'none';
      return;
    }

    strengthBox.style.display = 'block';

    const hasLen = /.{8,}/.test(pwd);
    const hasNum = /[0-9]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);

    const updateReq = (el, met) => {
      if (!el) return;
      if (met) {
        el.classList.add('met');
        const icon = el.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-check';
      } else {
        el.classList.remove('met');
        const icon = el.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-xmark';
      }
    };

    updateReq(reqLen, hasLen);
    updateReq(reqNum, hasNum);
    updateReq(reqLower, hasLower);
    updateReq(reqUpper, hasUpper);

    const score = [hasLen, hasNum, hasLower, hasUpper].filter(Boolean).length;
    strengthBar.className = 'pwd-strength-bar-fill';
    if (score > 0) strengthBar.classList.add(`strength-${score}`);

    if (score === 0) strengthText.textContent = 'Enter a password';
    else if (score <= 2) strengthText.textContent = 'Weak password';
    else if (score === 3) strengthText.textContent = 'Medium password';
    else strengthText.textContent = 'Strong password';
  }

  function updateAssistedDots() {
    updatePasswordStrength();
    if (!pwdInput || !confirmInput || !dotsTrack || !dotsContainer) return;
    const pwd = pwdInput.value;
    const confirm = confirmInput.value;

    if (pwd.length > 0) {
      dotsContainer.innerHTML = pwd.split('').map((char, index) => {
        let statusClass = '';
        if (confirm[index]) {
          statusClass = confirm[index] === char ? 'dot-match' : 'dot-mismatch';
        }
        return `<span class="pwd-dot-item ${statusClass}"><span class="dot-inner"></span></span>`;
      }).join('');

      if (confirm.length > 0) {
        if (confirm === pwd) {
          confirmWrap?.classList.add('match-success');
          confirmWrap?.classList.remove('match-error');
        } else {
          confirmWrap?.classList.add('match-error');
          confirmWrap?.classList.remove('match-success');
        }
      } else {
        confirmWrap?.classList.remove('match-success', 'match-error');
      }
    } else {
      dotsContainer.innerHTML = '<span class="pwd-dots-placeholder">Type password above to preview</span>';
      confirmWrap?.classList.remove('match-success', 'match-error');
    }
  }

  if (pwdInput) pwdInput.addEventListener('input', updateAssistedDots);
  if (confirmInput) {
    confirmInput.addEventListener('input', (e) => {
      const pwd = pwdInput ? pwdInput.value : '';
      if (confirmInput.value.length > pwd.length) {
        confirmInput.value = confirmInput.value.slice(0, pwd.length);
        confirmWrap?.classList.add('shake-error');
        setTimeout(() => confirmWrap?.classList.remove('shake-error'), 450);
      }
      updateAssistedDots();
    });
  }

  // Handle Sign Up Submission
  const btnSubmitSignup = document.getElementById('btn-submit-signup');
  if (formSignup) {
    const handleSignup = async (e) => {
      if (e) e.preventDefault();
      const name = document.getElementById('signup-name')?.value;
      const email = document.getElementById('signup-email')?.value;
      const pwd = document.getElementById('signup-password')?.value;
      const confirmPwd = document.getElementById('signup-confirm-password')?.value;

      if (!pwd || pwd.length < 6) {
        if (window.showToast) window.showToast('Password must be at least 6 characters.', 'error');
        return;
      }

      if (pwd !== confirmPwd) {
        confirmWrap?.classList.add('shake-error');
        setTimeout(() => confirmWrap?.classList.remove('shake-error'), 450);
        if (window.showToast) window.showToast('Passwords do not match. Please confirm your password.', 'error');
        return;
      }

      if (btnSubmitSignup) btnSubmitSignup.disabled = true;

      const result = await window.authManager.signUp(name, email, pwd);
      if (btnSubmitSignup) btnSubmitSignup.disabled = false;

      if (result.success) {
        if (window.showToast) window.showToast(result.message, 'success');
        window.closeAuthModal();
        // Clear fields
        if (document.getElementById('signup-name')) document.getElementById('signup-name').value = '';
        if (document.getElementById('signup-email')) document.getElementById('signup-email').value = '';
        if (document.getElementById('signup-password')) document.getElementById('signup-password').value = '';
        if (document.getElementById('signup-confirm-password')) document.getElementById('signup-confirm-password').value = '';
        updateAssistedDots();
      } else {
        if (window.showToast) window.showToast(result.message, 'error');
      }
    };

    formSignup.addEventListener('submit', handleSignup);
    if (btnSubmitSignup) btnSubmitSignup.addEventListener('click', handleSignup);
  }

  // Render Header Profile / Sign In button according to Auth State
  function renderHeaderAuth(user) {
    if (!authHeaderSection) return;

    if (!user) {
      authHeaderSection.innerHTML = `
        <button class="btn btn-outline btn-auth-trigger" id="btn-open-auth-modal">
          <i class="fa-regular fa-user"></i>
          <span>Sign In</span>
        </button>
      `;
      const btnOpen = document.getElementById('btn-open-auth-modal');
      if (btnOpen) {
        btnOpen.addEventListener('click', () => window.openAuthModal('login'));
      }
    } else {
      const initial = (user.name || 'U').charAt(0).toUpperCase();
      authHeaderSection.innerHTML = `
        <div class="user-profile-menu">
          <button class="user-avatar-btn" id="user-avatar-btn" title="${user.name} (${user.email})">
            <span class="avatar-letter">${initial}</span>
            <span class="user-name-label">${user.name.split(' ')[0]}</span>
            <i class="fa-solid fa-chevron-down avatar-arrow"></i>
          </button>
          <div class="user-dropdown-menu" id="user-dropdown-menu">
            <div class="dropdown-header">
              <strong>${user.name}</strong>
              <small>${user.email}</small>
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" id="btn-view-history-menu">
              <i class="fa-solid fa-clock-rotate-left"></i> My QR History
            </button>
            <button class="dropdown-item text-danger" id="btn-header-logout">
              <i class="fa-solid fa-arrow-right-from-bracket"></i> Log Out
            </button>
          </div>
        </div>
      `;

      const avatarBtn = document.getElementById('user-avatar-btn');
      const dropdown = document.getElementById('user-dropdown-menu');
      const logoutBtn = document.getElementById('btn-header-logout');
      const viewHistoryBtn = document.getElementById('btn-view-history-menu');

      if (avatarBtn && dropdown) {
        avatarBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdown.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
          if (!avatarBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
          }
        });
      }

      if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', () => {
          dropdown?.classList.remove('show');
          document.getElementById('tab-btn-history')?.click();
        });
      }

      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          dropdown?.classList.remove('show');
          window.authManager.logout();
          if (window.showToast) window.showToast('You have been logged out.', 'info');
        });
      }
    }
  }

  // Subscribe to auth state updates
  if (window.authManager) {
    window.authManager.onAuthStateChanged((user) => {
      renderHeaderAuth(user);
    });
  }
}

/**
 * SkyToggle Day/Night Theme Switcher
 */
function initThemeToggle() {
  const toggleCheckbox = document.getElementById('sky-toggle-checkbox');

  if (toggleCheckbox) {
    toggleCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        // Night mode
        document.documentElement.removeAttribute('data-theme');
        if (window.showToast) window.showToast('Night mode enabled', 'info');
      } else {
        // Day mode
        document.documentElement.setAttribute('data-theme', 'light');
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
  let lastToastMsg = '';
  let lastToastTime = 0;

  window.showToast = function(message, type = 'info') {
    const now = Date.now();
    // Suppress exact duplicate toasts within 800ms
    if (message === lastToastMsg && now - lastToastTime < 800) {
      return;
    }
    lastToastMsg = message;
    lastToastTime = now;

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

