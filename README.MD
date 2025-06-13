##**THIS IS THE LAST WORKING REPOSITORY OF CODE__USE THIS FOR REFERENCE TO FIGURE OUT WHAT BROKE IN THE NEWER VERSION OF THE CODE!**##

# fctr – Fact Checking & Source Verification Extension

<div align="center">

![fctr Logo](icons/icon128.png)

**Instantly fact-check and trace sources for any text on the web**

[![Version](https://img.shields.io/badge/version-2.5.0-blue.svg)](https://github.com/your-org/fctr-extension)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-green.svg)](#)
[![License](https://img.shields.io/badge/license-GPL%20v3-blue.svg)](LICENSE)
[![Manifest](https://img.shields.io/badge/manifest-v3-orange.svg)](#)

</div>

## 🎯 What is fctr?

**fctr** (pronounced "factor") is a Chrome extension that provides instant fact-checking and source verification for any text you encounter on the web. Simply highlight text, right-click, and get AI-powered analysis with credible sources in seconds.

### ⚡ Key Features

- **🔍 Instant Fact Checking** - Right-click any text for immediate verification
- **📚 Source Tracing** - Identify primary sources and reliability indicators  
- **🔐 Secure OAuth Login** - GitHub SSO integration via Keycloak
- **🎯 Smart Search** - Integrated search across Google, DuckDuckGo, Brave, Perplexity, and AI tools
- **📱 Draggable Interface** - Repositionable popup that remembers your preferences
- **📄 Export & Print** - Save reports as HTML or print directly
- **⚡ Native Performance** - Zero external dependencies, pure browser APIs

## 🚀 Quick Start

### Installation

1. **Chrome Web Store** (Recommended)
   ```
   Visit: chrome://extensions/ → Search "fctr" → Install
   ```

2. **Developer Mode** (For testing)
   ```bash
   git clone https://github.com/your-org/fctr-extension
   cd fctr-extension
   # Load unpacked in chrome://extensions/
   ```

### First Use

1. **Click the fctr icon** in your Chrome toolbar
2. **Login with SSO** - Connect via GitHub (first-time users get 25 free credits)
3. **Start fact-checking** - Right-click any text → "fact check with fctr"

## 📖 Usage Guide

### Fact Checking Text

**Method 1: Context Menu**
1. Highlight any text on a webpage
2. Right-click → **"fact check with fctr"**
3. View detailed analysis in the popup modal

**Method 2: Keyboard Shortcut**
1. Highlight text
2. Press **Ctrl+Shift+Y** (Cmd+Shift+Y on Mac)
3. Get instant fact-check results

**Method 3: Source Tracing**
1. Highlight text
2. Right-click → **"source trace with fctr"**
3. See source reliability and citation analysis

### Search Integration

The fctr popup includes smart search functionality:

- **Integrated Providers**: Google, DuckDuckGo, Brave Search, Perplexity.ai
- **AI Tools**: OpenAI ChatGPT, Claude
- **Context Aware**: Searches open with your fact-check query pre-filled
- **Provider Memory**: Remembers your preferred search engine

### Interface Features

- **🎯 Draggable Popup** - Click and drag the header to reposition
- **💾 Position Memory** - Popup remembers where you placed it
- **📱 Responsive Design** - Works on any screen size
- **🎨 Native Styling** - Matches your system's look and feel

## 🔧 Technical Details

### Architecture

- **Manifest V3** - Modern Chrome extension standard
- **Modular JavaScript** - Clean, maintainable codebase
- **Native APIs** - No external dependencies
- **OAuth 2.0 + PKCE** - Secure authentication flow
- **Chrome Storage API** - Encrypted credential storage

### File Structure

```
fctr-extension/
├── manifest.json           # Extension configuration
├── background.js           # Service worker
├── content-script.js       # Page interaction
├── modules/
│   ├── auth-manager.js     # Authentication logic
│   ├── auth-popup-ui.js    # Popup interface
│   ├── results-display.js  # Results modal
│   ├── native-utils.js     # Browser API utilities
│   └── utils.js           # Shared utilities
├── auth/
│   ├── auth-popup.html     # Standalone auth page
│   ├── callback.html       # OAuth callback
│   └── keycloak-config.js  # SSO configuration
└── icons/                  # Extension icons
```

### API Integration

- **Authentication**: `https://usw2.auth.ac/auth` (Keycloak)
- **Fact Checking**: `https://api.totmailabs.com:5001/api/v1/fact_checking`
- **Source Checking**: `https://api.totmailabs.com:5001/api/v1/source_checking`

### Browser Permissions

```json
{
  "permissions": [
    "storage",      // Save user preferences
    "activeTab",    // Access current page content
    "identity",     // OAuth authentication
    "contextMenus", // Right-click menu items
    "downloads",    // Export HTML reports
    "notifications" // Credit warnings
  ]
}
```

## 🛠️ Development

### Prerequisites

- **Chrome Browser** (v88+)
- **Node.js** (v16+) - For development tools
- **Git** - Version control

### Setup

```bash
# Clone repository
git clone https://github.com/your-org/fctr-extension
cd fctr-extension

# Load extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the fctr-extension folder
```

### Development Workflow

```bash
# Make changes to source files
# Extension auto-reloads in Chrome

# Test authentication
# 1. Click fctr icon → Login with SSO
# 2. Verify OAuth flow completes

# Test fact-checking
# 1. Highlight text on any webpage
# 2. Right-click → "fact check with fctr"
# 3. Verify results display correctly
```

### Module System

The extension uses a modular architecture:

```javascript
// modules/auth-manager.js
class AuthManager {
  constructor() { /* Authentication logic */ }
}

// modules/results-display.js  
class ResultsDisplay {
  showResult(content, claim) { /* Display results */ }
}

// All modules register globally
window.FCTR = { modules: {} };
window.FCTR.modules.AuthManager = AuthManager;
```

## 🔒 Privacy & Security

### Data Collection

fctr collects minimal data to provide fact-checking services:

- **Account Info**: Email address (from GitHub OAuth)
- **Usage Data**: Text submitted for fact-checking + source URLs
- **Technical Data**: Basic browser/extension analytics

### Data Protection

- **Encrypted Storage**: All credentials stored via Chrome's encrypted storage
- **OAuth 2.0 + PKCE**: Industry-standard secure authentication
- **HTTPS Only**: All API communication encrypted in transit
- **No Tracking**: No user behavior tracking or analytics

### Your Rights

- **Access**: View your account data anytime
- **Deletion**: Delete your account and all associated data
- **Portability**: Export your data in standard formats

## 📊 Version History

### v2.5.0 (Current)
- ✅ **Performance**: Removed legacy PDF libraries, 100% native APIs
- ✅ **Architecture**: Cleaned up unused fonts and CSS dependencies  
- ✅ **UI/UX**: Improved popup positioning and drag functionality
- ✅ **Stability**: Enhanced error handling and connection resilience

### v2.3.0 
- ✅ **Branding**: Unified color scheme and modern design
- ✅ **Search**: Multi-provider search integration
- ✅ **Export**: Native HTML export and print functionality

### v2.0.0
- ✅ **Authentication**: OAuth 2.0 + GitHub SSO integration
- ✅ **Manifest V3**: Modern Chrome extension architecture
- ✅ **Modular Design**: Clean, maintainable codebase

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Links

- **🐛 Report Bugs**: [GitHub Issues](https://github.com/your-org/fctr-extension/issues)
- **💡 Feature Requests**: [GitHub Discussions](https://github.com/your-org/fctr-extension/discussions)
- **📧 Contact**: [support@totmailabs.com](mailto:support@totmailabs.com)

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🏢 About TOTMai Labs

fctr is developed by [TOTMai Labs](https://totmailabs.com), dedicated to building AI tools that promote information literacy and critical thinking.

---

<div align="center">

**Made with ❤️ by TOTMai Labs**

[Website](https://totmailabs.com) • [Privacy Policy](https://totmailabs.com/privacy) • [Terms of Service](https://totmailabs.com/terms)

</div>
