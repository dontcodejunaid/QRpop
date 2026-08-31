/**
 * QR Code Scanner Logic supporting live camera & image file decoding
 */

class QRScanner {
  constructor() {
    this.html5QrCode = null;
    this.isCameraRunning = false;
    this.currentScanResult = null;
    this.cameras = [];
    this.selectedCameraId = null;

    this.init();
  }

  init() {
    this.initElements();
    this.initCameraControls();
    this.initFileUpload();
    this.initResultActions();
  }

  initElements() {
    this.readerEl = document.getElementById('qr-reader');
    this.placeholderEl = document.getElementById('camera-placeholder');
    this.overlayEl = document.getElementById('scanner-overlay');
    this.actionBarEl = document.getElementById('camera-action-bar');
    this.cameraSelect = document.getElementById('camera-select');

    this.resultCard = document.getElementById('scanner-result-card');
    this.emptyState = document.getElementById('result-empty-state');
    this.resultBox = document.getElementById('result-content-box');
    this.resultBadge = document.getElementById('result-type-badge');
    this.resultIcon = document.getElementById('result-icon-badge');
    this.resultTitle = document.getElementById('result-title');
    this.resultTimestamp = document.getElementById('result-timestamp');
    this.resultRawText = document.getElementById('result-raw-text');
    this.btnOpen = document.getElementById('btn-open-result');
  }

  initCameraControls() {
    const btnStart = document.getElementById('btn-start-camera');
    const btnStop = document.getElementById('btn-stop-camera');

    if (btnStart) {
      btnStart.addEventListener('click', () => this.startCamera());
    }

    if (btnStop) {
      btnStop.addEventListener('click', () => this.stopCamera());
    }

    if (this.cameraSelect) {
      this.cameraSelect.addEventListener('change', (e) => {
        this.selectedCameraId = e.target.value;
        if (this.isCameraRunning) {
          this.stopCamera().then(() => this.startCamera());
        }
      });
    }
  }

  initFileUpload() {
    const dropZone = document.getElementById('file-drop-zone');
    const fileInput = document.getElementById('qr-file-input');

    if (!dropZone || !fileInput) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.scanImageFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.scanImageFile(e.target.files[0]);
      }
    });
  }

  initResultActions() {
    const btnCopy = document.getElementById('btn-copy-result');
    const btnShare = document.getElementById('btn-share-result');
    const btnScanAgain = document.getElementById('btn-scan-again');

    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        if (!this.currentScanResult) return;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(this.currentScanResult.raw).then(() => {
            if (window.showToast) window.showToast('Copied decoded content!', 'success');
          });
        }
      });
    }

    if (btnShare) {
      btnShare.addEventListener('click', () => {
        if (!this.currentScanResult) return;
        if (navigator.share) {
          navigator.share({
            title: 'Scanned QR Code',
            text: this.currentScanResult.raw
          }).catch(() => {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(this.currentScanResult.raw);
          if (window.showToast) window.showToast('Copied content to clipboard', 'info');
        }
      });
    }

    if (btnScanAgain) {
      btnScanAgain.addEventListener('click', () => {
        this.resetResultView();
        this.startCamera();
      });
    }
  }

  async startCamera() {
    if (typeof Html5Qrcode === 'undefined') {
      if (window.showToast) window.showToast('Scanner library not loaded', 'error');
      return;
    }

    try {
      if (!this.html5QrCode) {
        this.html5QrCode = new Html5Qrcode('qr-reader');
      }

      // Check available cameras
      if (this.cameras.length === 0) {
        try {
          this.cameras = await Html5Qrcode.getCameras();
          if (this.cameras && this.cameras.length > 1) {
            this.cameraSelect.innerHTML = this.cameras.map(c => `<option value="${c.id}">${c.label || 'Camera ' + c.id}</option>`).join('');
            this.cameraSelect.style.display = 'inline-block';
            this.selectedCameraId = this.cameras[0].id;
          }
        } catch (camErr) {
          console.warn('Could not enumerate cameras, falling back to facingMode', camErr);
        }
      }

      const cameraConfig = this.selectedCameraId 
        ? { deviceId: { exact: this.selectedCameraId } }
        : { facingMode: 'environment' };

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await this.html5QrCode.start(
        cameraConfig,
        config,
        (decodedText, decodedResult) => {
          this.onScanSuccess(decodedText, decodedResult);
        },
        (errorMessage) => {
          // Continuous scanning error, ignore in normal operation
        }
      );

      this.isCameraRunning = true;
      if (this.placeholderEl) this.placeholderEl.style.display = 'none';
      if (this.overlayEl) this.overlayEl.style.display = 'flex';
      if (this.actionBarEl) this.actionBarEl.style.display = 'flex';

    } catch (err) {
      console.error('Camera start error:', err);
      let msg = 'Unable to access camera. Please check permissions.';
      if (err?.name === 'NotAllowedError') {
        msg = 'Camera permission denied. Please allow access.';
      } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        msg = 'Camera requires HTTPS or localhost.';
      }
      if (window.showToast) window.showToast(msg, 'error');
      this.stopCamera();
    }
  }

  async stopCamera() {
    if (this.html5QrCode && this.isCameraRunning) {
      try {
        await this.html5QrCode.stop();
      } catch (e) {
        console.warn('Error stopping camera:', e);
      }
    }
    this.isCameraRunning = false;
    if (this.placeholderEl) this.placeholderEl.style.display = 'flex';
    if (this.overlayEl) this.overlayEl.style.display = 'none';
    if (this.actionBarEl) this.actionBarEl.style.display = 'none';
  }

  async scanImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      if (window.showToast) window.showToast('Please select a valid image file', 'error');
      return;
    }

    try {
      if (!this.html5QrCode) {
        this.html5QrCode = new Html5Qrcode('qr-reader');
      }

      // If camera is running, stop it first
      if (this.isCameraRunning) {
        await this.stopCamera();
      }

      if (window.showToast) window.showToast('Processing image...', 'info');
      const decodedText = await this.html5QrCode.scanFile(file, true);
      this.onScanSuccess(decodedText, null);
    } catch (err) {
      console.warn('File scan failed', err);
      if (window.showToast) window.showToast('No QR code detected in this image', 'error');
    }
  }

  onScanSuccess(decodedText, decodedResult) {
    // Immediately stop camera feed upon successful detection
    if (this.isCameraRunning) {
      if (navigator.vibrate) navigator.vibrate(120);
      this.stopCamera();
    }

    const parsed = this.parsePayload(decodedText);
    this.currentScanResult = {
      raw: decodedText,
      parsed: parsed,
      timestamp: new Date()
    };

    // Save to history
    if (window.historyManager) {
      window.historyManager.addRecord('scanned', parsed.typeLabel, decodedText);
    }

    this.displayResult(this.currentScanResult);

    if (window.showToast) {
      window.showToast('QR Code detected & camera paused!', 'success');
    }

    // Scroll to decoded result area smoothly on mobile
    if (window.innerWidth <= 900 && this.resultCard) {
      this.resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  parsePayload(text) {
    const t = text.trim();

    // URL Check
    if (/^https?:\/\//i.test(t) || /^www\.[a-z0-9\-]+(\.[a-z]{2,})+/i.test(t)) {
      const url = /^https?:\/\//i.test(t) ? t : 'https://' + t;
      return {
        type: 'url',
        typeLabel: 'URL / Link',
        icon: 'fa-globe',
        actionUrl: url,
        displayHtml: `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: underline;">${this.escapeHtml(t)}</a>`
      };
    }

    // Wi-Fi Check (WIFI:S:ssid;T:WPA;P:pass;;)
    if (/^WIFI:/i.test(t)) {
      const ssidMatch = t.match(/S:([^;]+)/i);
      const passMatch = t.match(/P:([^;]*)/i);
      const typeMatch = t.match(/T:([^;]+)/i);
      const ssid = ssidMatch ? ssidMatch[1] : 'Unknown';
      const pass = passMatch ? passMatch[1] : '(None)';
      const sec = typeMatch ? typeMatch[1] : 'Open';

      return {
        type: 'wifi',
        typeLabel: 'Wi-Fi Network',
        icon: 'fa-wifi',
        displayHtml: `
          <div><strong>Network (SSID):</strong> ${this.escapeHtml(ssid)}</div>
          <div><strong>Security:</strong> ${this.escapeHtml(sec)}</div>
          <div><strong>Password:</strong> <span style="font-family:monospace; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px;">${this.escapeHtml(pass)}</span></div>
        `
      };
    }

    // vCard Check
    if (/BEGIN:VCARD/i.test(t)) {
      const fnMatch = t.match(/FN:([^\n\r]+)/i);
      const telMatch = t.match(/TEL[^:]*:([^\n\r]+)/i);
      const emailMatch = t.match(/EMAIL[^:]*:([^\n\r]+)/i);
      const orgMatch = t.match(/ORG:([^\n\r]+)/i);

      let html = `<div style="font-weight:bold; margin-bottom:4px;">${this.escapeHtml(fnMatch ? fnMatch[1] : 'Contact Card')}</div>`;
      if (orgMatch) html += `<div>🏢 ${this.escapeHtml(orgMatch[1])}</div>`;
      if (telMatch) html += `<div>📞 <a href="tel:${telMatch[1]}" style="color:#60a5fa;">${this.escapeHtml(telMatch[1])}</a></div>`;
      if (emailMatch) html += `<div>✉️ <a href="mailto:${emailMatch[1]}" style="color:#60a5fa;">${this.escapeHtml(emailMatch[1])}</a></div>`;

      return {
        type: 'vcard',
        typeLabel: 'Contact (vCard)',
        icon: 'fa-address-card',
        actionUrl: telMatch ? `tel:${telMatch[1]}` : (emailMatch ? `mailto:${emailMatch[1]}` : null),
        actionLabel: telMatch ? 'Call Contact' : (emailMatch ? 'Send Email' : null),
        displayHtml: html
      };
    }

    // Phone Check
    if (/^tel:/i.test(t)) {
      const num = t.replace(/^tel:/i, '');
      return {
        type: 'phone',
        typeLabel: 'Phone Call',
        icon: 'fa-phone',
        actionUrl: t,
        actionLabel: 'Call Phone',
        displayHtml: `<a href="${t}" style="color: #60a5fa;">${this.escapeHtml(num)}</a>`
      };
    }

    // Email Check
    if (/^mailto:/i.test(t)) {
      return {
        type: 'email',
        typeLabel: 'Email Message',
        icon: 'fa-envelope',
        actionUrl: t,
        actionLabel: 'Compose Email',
        displayHtml: `<a href="${t}" style="color: #60a5fa;">${this.escapeHtml(t)}</a>`
      };
    }

    // Fallback: Plain Text
    return {
      type: 'text',
      typeLabel: 'Plain Text',
      icon: 'fa-align-left',
      displayHtml: this.escapeHtml(t)
    };
  }

  displayResult(result) {
    if (!result) return;
    const { parsed, raw } = result;

    if (this.emptyState) this.emptyState.style.display = 'none';
    if (this.resultBox) this.resultBox.style.display = 'block';

    if (this.resultBadge) this.resultBadge.textContent = 'Decoded';
    if (this.resultTitle) this.resultTitle.textContent = parsed.typeLabel;
    if (this.resultTimestamp) this.resultTimestamp.textContent = 'Just now';

    if (this.resultIcon) {
      this.resultIcon.innerHTML = `<i class="fa-solid ${parsed.icon}"></i>`;
    }

    if (this.resultRawText) {
      this.resultRawText.innerHTML = parsed.displayHtml;
    }

    if (this.btnOpen) {
      if (parsed.actionUrl) {
        this.btnOpen.style.display = 'inline-flex';
        this.btnOpen.innerHTML = `<i class="fa-solid fa-arrow-up-right-from-square"></i> ${parsed.actionLabel || 'Open Link'}`;
        this.btnOpen.onclick = () => {
          window.open(parsed.actionUrl, '_blank', 'noopener,noreferrer');
        };
      } else {
        this.btnOpen.style.display = 'none';
      }
    }
  }

  resetResultView() {
    this.currentScanResult = null;
    if (this.emptyState) this.emptyState.style.display = 'block';
    if (this.resultBox) this.resultBox.style.display = 'none';
    if (this.resultBadge) this.resultBadge.textContent = 'Awaiting Scan';
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
}

window.qrScanner = new QRScanner();
