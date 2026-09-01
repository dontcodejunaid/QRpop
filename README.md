# QRpop ⚡

A modern, fast, responsive QR Code Generator & Scanner web application built with clean HTML5, CSS3, and JavaScript.

## ✨ Features

### 🖨️ QR Code Generator
- **Multiple Payload Formats**:
  - 📝 Plain Text
  - 🔗 Website URLs (auto-validates `http/https`)
  - 📶 Wi-Fi Credentials (SSID, Password, WPA/WEP/Open, Hidden networks)
  - 📇 Contact vCard 3.0 (Name, Phone, Organization, Email, Website)
  - 📞 Phone numbers (`tel:`)
  - ✉️ Email with subject and body (`mailto:`)
- **Live Real-time Preview**: Dynamically updates as you type.
- **Custom Styling**:
  - Foreground & Background color pickers + 6 curated quick themes
  - Corner & Dot patterns (Square, Rounded, Dots, Classy)
  - Resolution selector (Standard 300px, HD 600px, Ultra 1200px)
- **Instant Export**:
  - Download as **PNG**
  - Download as **SVG**
  - Copy QR Image to Clipboard
  - Native Device Share

### 📷 QR Code Scanner
- **Live Camera Feed**:
  - Camera permission handling with animated viewfinder overlay
  - Multi-camera switcher (front / back / external)
- **Image File Upload**:
  - Drag & drop or select PNG/JPG/SVG/WEBP files stored on the device
- **Smart Payload Parser**:
  - Automatically recognizes links, Wi-Fi networks, contacts, phone numbers, and emails
  - Dedicated contextual action buttons: **Open URL**, **Copy**, **Share**, and **Scan Again**

### 📜 Activity History
- Automatically records generated & scanned items in user-specific cloud history (MongoDB Atlas).
- Multi-user data isolation: Sign in to view and persist personal history across sessions.

---

## 🚀 Quick Start

Open `index.html` in any modern web browser or serve with any static HTTP server:

```bash
# Using Python
python -m http.server 8000

# Or using Node npx serve
npx serve .
```
