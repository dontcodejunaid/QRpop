/**
 * QR Code Generator Logic using qr-code-styling
 */

class QRGenerator {
  constructor() {
    this.currentType = 'text';
    this.qrCodeInstance = null;
    this.debounceTimer = null;
    this.lastGeneratedPayload = '';

    this.options = {
      width: 300,
      height: 300,
      type: 'svg',
      data: 'Welcome to QRpop!',
      dotsOptions: {
        color: '#000000',
        type: 'square'
      },
      backgroundOptions: {
        color: '#ffffff'
      },
      cornersSquareOptions: {
        type: 'square',
        color: '#000000'
      },
      cornersDotOptions: {
        type: 'square',
        color: '#000000'
      }
    };
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.initTypeSelector();
    this.initFormInputs();
    this.initCustomizations();
    this.initActionButtons();

    // Initialize QR Code Styling instance
    if (typeof QRCodeStyling !== 'undefined') {
      this.qrCodeInstance = new QRCodeStyling(this.options);
      const container = document.getElementById('qr-output');
      if (container) {
        container.innerHTML = '';
        this.qrCodeInstance.append(container);
      }
    }

    // Trigger initial generation
    this.updateQR(false);
  }

  saveCurrentQRToHistory() {
    const payload = this.buildPayload();
    if (window.historyManager && payload && payload.trim()) {
      window.historyManager.addRecord('generated', this.currentType.toUpperCase(), payload.trim());
    }
  }

  initTypeSelector() {
    const typeButtons = document.querySelectorAll('#qr-type-selector .type-btn');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        typeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.currentType = btn.getAttribute('data-type');

        // Toggle active form
        document.querySelectorAll('.type-form').forEach(form => form.classList.remove('active'));
        const activeForm = document.getElementById(`form-${this.currentType}`);
        if (activeForm) {
          activeForm.classList.add('active');
        }

        this.updateQR(false);
      });
    });
  }

  initFormInputs() {
    // Attach input listeners to all form controls for live updating
    const inputs = document.querySelectorAll('.form-body input, .form-body textarea, .form-body select');
    inputs.forEach(input => {
      input.addEventListener('input', () => this.debouncedUpdate());
      input.addEventListener('change', () => this.debouncedUpdate());
    });
  }

  initCustomizations() {
    const fgInput = document.getElementById('qr-fg-color');
    const bgInput = document.getElementById('qr-bg-color');
    const fgHex = document.getElementById('fg-color-hex');
    const bgHex = document.getElementById('bg-color-hex');
    const dotStyleSelect = document.getElementById('qr-dot-style');

    if (fgInput) {
      fgInput.addEventListener('input', (e) => {
        const color = e.target.value;
        if (fgHex) fgHex.textContent = color;
        this.options.dotsOptions.color = color;
        this.options.cornersSquareOptions.color = color;
        this.options.cornersDotOptions.color = color;
        this.updateStyling();
      });
    }

    if (bgInput) {
      bgInput.addEventListener('input', (e) => {
        const color = e.target.value;
        if (bgHex) bgHex.textContent = color;
        this.options.backgroundOptions.color = color;
        this.updateStyling();
      });
    }

    if (dotStyleSelect) {
      dotStyleSelect.addEventListener('change', (e) => {
        const style = e.target.value;
        this.options.dotsOptions.type = style;
        this.options.cornersSquareOptions.type = (style === 'dots' || style === 'rounded' || style === 'classy-rounded') ? 'extra-rounded' : 'square';
        this.options.cornersDotOptions.type = (style === 'dots' || style === 'rounded' || style === 'classy-rounded') ? 'dot' : 'square';
        this.updateStyling();
      });
    }

    // Palette Chips
    const chips = document.querySelectorAll('.palette-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const fg = chip.getAttribute('data-fg');
        const bg = chip.getAttribute('data-bg');

        if (fgInput) fgInput.value = fg;
        if (bgInput) bgInput.value = bg;
        if (fgHex) fgHex.textContent = fg;
        if (bgHex) bgHex.textContent = bg;

        this.options.dotsOptions.color = fg;
        this.options.cornersSquareOptions.color = fg;
        this.options.cornersDotOptions.color = fg;
        this.options.backgroundOptions.color = bg;

        this.updateStyling();
      });
    });
  }

  initActionButtons() {
    const btnDownloadPng = document.getElementById('btn-download-png');
    const btnDownloadSvg = document.getElementById('btn-download-svg');
    const btnCopyQr = document.getElementById('btn-copy-qr');
    const btnShareQr = document.getElementById('btn-share-qr');

    if (btnDownloadPng) {
      btnDownloadPng.addEventListener('click', (e) => {
        e.preventDefault();
        this.downloadQR('png');
      });
    }

    if (btnDownloadSvg) {
      btnDownloadSvg.addEventListener('click', (e) => {
        e.preventDefault();
        this.downloadQR('svg');
      });
    }

    if (btnCopyQr) {
      btnCopyQr.addEventListener('click', (e) => {
        e.preventDefault();
        this.copyQRImage();
      });
    }

    if (btnShareQr) {
      btnShareQr.addEventListener('click', (e) => {
        e.preventDefault();
        this.shareQR();
      });
    }
  }

  debouncedUpdate() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.updateQR(true);
    }, 400);
  }

  buildPayload() {
    switch (this.currentType) {
      case 'text': {
        const text = document.getElementById('input-text')?.value.trim();
        return text || 'https://github.com/dontcodejunaid/QRpop';
      }
      case 'url': {
        let url = document.getElementById('input-url')?.value.trim();
        if (!url) return 'https://github.com/dontcodejunaid/QRpop';
        if (!/^https?:\/\//i.test(url)) {
          url = 'https://' + url;
        }
        return url;
      }
      case 'wifi': {
        const ssid = document.getElementById('input-wifi-ssid')?.value.trim() || 'MyWiFiNetwork';
        const password = document.getElementById('input-wifi-password')?.value || '';
        const auth = document.getElementById('select-wifi-auth')?.value || 'WPA';
        const hidden = document.getElementById('input-wifi-hidden')?.checked ? 'true' : 'false';
        return `WIFI:S:${ssid};T:${auth};P:${password};H:${hidden};;`;
      }
      case 'vcard': {
        const fn = document.getElementById('input-vcard-fn')?.value.trim() || 'John';
        const ln = document.getElementById('input-vcard-ln')?.value.trim() || 'Doe';
        const org = document.getElementById('input-vcard-org')?.value.trim() || '';
        const phone = document.getElementById('input-vcard-phone')?.value.trim() || '';
        const email = document.getElementById('input-vcard-email')?.value.trim() || '';
        const url = document.getElementById('input-vcard-url')?.value.trim() || '';

        let vcard = `BEGIN:VCARD\nVERSION:3.0\nN:${ln};${fn};;;\nFN:${fn} ${ln}`;
        if (org) vcard += `\nORG:${org}`;
        if (phone) vcard += `\nTEL;TYPE=CELL:${phone}`;
        if (email) vcard += `\nEMAIL:${email}`;
        if (url) vcard += `\nURL:${url}`;
        vcard += `\nEND:VCARD`;
        return vcard;
      }
      case 'phone': {
        const phone = document.getElementById('input-phone')?.value.trim();
        return phone ? `tel:${phone}` : 'tel:+1234567890';
      }
      case 'email': {
        const to = document.getElementById('input-email-to')?.value.trim() || 'hello@example.com';
        const subject = document.getElementById('input-email-subject')?.value.trim() || '';
        const body = document.getElementById('input-email-body')?.value.trim() || '';
        let mailto = `mailto:${to}`;
        const params = [];
        if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
        if (body) params.push(`body=${encodeURIComponent(body)}`);
        if (params.length > 0) mailto += `?${params.join('&')}`;
        return mailto;
      }
      default:
        return 'QRpop';
    }
  }

  saveCurrentQRToHistory() {
    const payload = this.buildPayload();
    if (window.historyManager && payload) {
      window.historyManager.addRecord('generated', this.currentType.toUpperCase(), payload);
    }
  }

  updateQR(saveToHist = false) {
    const payload = this.buildPayload();
    this.options.data = payload;

    if (this.qrCodeInstance) {
      this.qrCodeInstance.update({
        data: payload
      });
    }

    if (saveToHist && payload !== this.lastGeneratedPayload) {
      this.lastGeneratedPayload = payload;
      if (window.historyManager) {
        window.historyManager.addRecord('generated', this.currentType.toUpperCase(), payload);
      }
    }
  }

  updateStyling() {
    if (this.qrCodeInstance) {
      this.qrCodeInstance.update({
        dotsOptions: this.options.dotsOptions,
        backgroundOptions: this.options.backgroundOptions,
        cornersSquareOptions: this.options.cornersSquareOptions,
        cornersDotOptions: this.options.cornersDotOptions
      });
    }
  }

  downloadQR(extension = 'png') {
    if (!this.qrCodeInstance) return;
    const res = parseInt(document.getElementById('qr-res-select')?.value || '600', 10);
    
    // Always sync current payload
    const payload = this.buildPayload();
    this.options.data = payload;

    // Ensure the instance has the exact payload and dimension before download
    this.qrCodeInstance.update({
      data: payload,
      dotsOptions: this.options.dotsOptions,
      backgroundOptions: this.options.backgroundOptions,
      cornersSquareOptions: this.options.cornersSquareOptions,
      cornersDotOptions: this.options.cornersDotOptions
    });

    this.saveCurrentQRToHistory();

    this.qrCodeInstance.download({
      name: `qrpop-${this.currentType}-${Date.now()}`,
      extension: extension,
      width: res,
      height: res
    });

    if (window.showToast) {
      window.showToast(`Downloaded QR Code (${extension.toUpperCase()})`, 'success');
    }
  }

  async copyQRImage() {
    try {
      if (!this.qrCodeInstance) return;
      const payload = this.buildPayload();
      this.options.data = payload;
      this.qrCodeInstance.update({ data: payload });

      this.saveCurrentQRToHistory();

      const rawBlob = await this.qrCodeInstance.getRawData('png');
      if (rawBlob && navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ 'image/png': rawBlob });
        await navigator.clipboard.write([item]);
        if (window.showToast) window.showToast('QR Code image copied to clipboard!', 'success');
      } else {
        // Fallback to copying content text
        await navigator.clipboard.writeText(payload);
        if (window.showToast) window.showToast('QR payload text copied to clipboard!', 'info');
      }
    } catch (err) {
      console.warn('Clipboard write failed', err);
      // Fallback
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(this.buildPayload());
        if (window.showToast) window.showToast('QR text copied to clipboard', 'info');
      }
    }
  }

  async shareQR() {
    const payload = this.buildPayload();
    this.saveCurrentQRToHistory();

    if (navigator.share) {
      try {
        const rawBlob = await this.qrCodeInstance?.getRawData('png');
        if (rawBlob && navigator.canShare && navigator.canShare({ files: [new File([rawBlob], 'qr.png', { type: 'image/png' })] })) {
          const file = new File([rawBlob], `qrpop-${Date.now()}.png`, { type: 'image/png' });
          await navigator.share({
            title: 'QRpop Code',
            text: payload,
            files: [file]
          });
        } else {
          await navigator.share({
            title: 'QRpop Code',
            text: payload,
            url: payload.startsWith('http') ? payload : undefined
          });
        }
        if (window.showToast) window.showToast('Shared successfully!', 'success');
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.warn('Share error', e);
        }
      }
    } else {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(payload);
        if (window.showToast) window.showToast('Link copied to clipboard (Sharing not supported)', 'info');
      }
    }
  }
}

window.qrGenerator = new QRGenerator();
