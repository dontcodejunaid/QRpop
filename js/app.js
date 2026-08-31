/**
 * Main Application Coordinator & Navigation Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initToastNotification();
  initAISmartPrompt();
  if (window.historyManager) {
    window.historyManager.render();
  }
});

/**
 * AI Smart Prompt Natural Language Parser
 */
function initAISmartPrompt() {
  const promptInput = document.getElementById('ai-smart-prompt');
  const btnAi = document.getElementById('btn-ai-generate');

  if (!promptInput || !btnAi) return;

  const processAIPrompt = () => {
    const text = promptInput.value.trim();
    if (!text) {
      if (window.showToast) window.showToast('Please type a prompt for the AI to parse', 'info');
      return;
    }

    if (window.showToast) window.showToast('AI Analyzing intent & formulating QR...', 'info');

    setTimeout(() => {
      parseAndPopulate(text);
    }, 300);
  };

  btnAi.addEventListener('click', processAIPrompt);
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      processAIPrompt();
    }
  });
}

function parseAndPopulate(prompt) {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  // 1. Wi-Fi Detection
  if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('network') || lower.includes('pass')) {
    switchToType('wifi');
    
    // Extract SSID and Password
    const ssidMatch = p.match(/(?:network|ssid|name|wifi)\s*(?:is|:)?\s*([a-zA-Z0-9_\-\.\s]+?)(?=\s+(?:password|pass|with|key|$))/i);
    const passMatch = p.match(/(?:password|pass|key)\s*(?:is|:)?\s*([a-zA-Z0-9_\-\.!@#\$%\^&\*]+)/i);

    if (ssidMatch && ssidMatch[1]) {
      document.getElementById('input-wifi-ssid').value = ssidMatch[1].trim();
    }
    if (passMatch && passMatch[1]) {
      document.getElementById('input-wifi-password').value = passMatch[1].trim();
    }
    if (window.qrGenerator) window.qrGenerator.updateQR(true);
    if (window.showToast) window.showToast('AI synthesized Wi-Fi credentials!', 'success');
    return;
  }

  // 2. Phone / Call Detection
  const phoneMatch = p.match(/(?:\+?\d{1,4}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
  if (lower.includes('call') || lower.includes('phone') || (phoneMatch && !lower.includes('http'))) {
    switchToType('phone');
    if (phoneMatch) {
      document.getElementById('input-phone').value = phoneMatch[0].trim();
    }
    if (window.qrGenerator) window.qrGenerator.updateQR(true);
    if (window.showToast) window.showToast('AI configured Phone payload!', 'success');
    return;
  }

  // 3. Email Detection
  const emailMatch = p.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (lower.includes('email') || lower.includes('mail') || emailMatch) {
    switchToType('email');
    if (emailMatch) {
      document.getElementById('input-email-to').value = emailMatch[0].trim();
    }
    const subjMatch = p.match(/(?:subject|re)\s*(?:is|:)?\s*(.+?)(?=\s+(?:body|message|$))/i);
    if (subjMatch) {
      document.getElementById('input-email-subject').value = subjMatch[1].trim();
    }
    if (window.qrGenerator) window.qrGenerator.updateQR(true);
    if (window.showToast) window.showToast('AI formulated Email message!', 'success');
    return;
  }

  // 4. URL / Website Detection
  if (lower.includes('http') || lower.includes('www.') || lower.includes('.com') || lower.includes('.org') || lower.includes('.io') || lower.includes('.ai') || lower.includes('link') || lower.includes('site')) {
    switchToType('url');
    const urlMatch = p.match(/((https?:\/\/)|(www\.))[^\s]+/i) || p.match(/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*/);
    if (urlMatch) {
      document.getElementById('input-url').value = urlMatch[0];
    } else {
      document.getElementById('input-url').value = p;
    }
    if (window.qrGenerator) window.qrGenerator.updateQR(true);
    if (window.showToast) window.showToast('AI mapped Web URL!', 'success');
    return;
  }

  // 5. Contact / vCard Detection
  if (lower.includes('contact') || lower.includes('vcard') || lower.includes('name')) {
    switchToType('vcard');
    const nameMatch = p.match(/(?:name|contact)\s*(?:is|:)?\s*([a-zA-Z]+)(?:\s+([a-zA-Z]+))?/i);
    if (nameMatch) {
      document.getElementById('input-vcard-fn').value = nameMatch[1] || '';
      document.getElementById('input-vcard-ln').value = nameMatch[2] || '';
    }
    if (window.qrGenerator) window.qrGenerator.updateQR(true);
    if (window.showToast) window.showToast('AI composed vCard profile!', 'success');
    return;
  }

  // 6. Default: Text
  switchToType('text');
  document.getElementById('input-text').value = p;
  if (window.qrGenerator) window.qrGenerator.updateQR(true);
  if (window.showToast) window.showToast('AI generated Text payload!', 'success');
}

function switchToType(type) {
  const btn = document.querySelector(`#qr-type-selector .type-btn[data-type="${type}"]`);
  if (btn) btn.click();
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
