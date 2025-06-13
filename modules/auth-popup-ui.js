// modules/auth-popup-ui.js - Authentication Popup UI Management (FIXED BUTTON STATE)
(function() {
  'use strict';
  
  class AuthPopupUI {
    constructor(authManager) {
      this.authManager = authManager;
      this.authPopupContainer = null;
      this.authPopupInjected = false;
      
      // Drag functionality properties
      this.currentPosition = { x: 20, y: 20 }; // Default top-right offset
      this.defaultPosition = { x: 20, y: 20 };
      // PHASE 3A: Config management constants
      this.CONFIG_CACHE_TTL_HOURS = 4;
      this.CONFIG_CACHE_KEY = 'fctr-config-cache';
      this.CONFIG_API_ENDPOINT = 'https://api.totmailabs.com:5001/api/v1/config/default-credits';
      
      // Load saved position
      this.loadSavedPosition();
      // PHASE 1: Setup credit listening
      this.setupCreditListener();
      // PHASE 3A: Setup config listening
      this.setupConfigListener();
    }
    
    // Load saved popup position from storage
    async loadSavedPosition() {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.local.get(['fctr-popup-position']);
          if (result['fctr-popup-position']) {
            this.currentPosition = result['fctr-popup-position'];
            console.log('FCTR: Loaded saved popup position:', this.currentPosition);
          }
        }
      } catch (error) {
        console.warn('FCTR: Could not load saved position:', error);
        this.currentPosition = { ...this.defaultPosition };
      }
    }
    
    // Save popup position to storage
    async savePosition() {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          await chrome.storage.local.set({ 'fctr-popup-position': this.currentPosition });
          console.log('FCTR: Saved popup position:', this.currentPosition);
        }
      } catch (error) {
        console.warn('FCTR: Could not save position:', error);
      }
    }
    
    // Validate and constrain position to viewport
    constrainToViewport(x, y) {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      const popupWidth = 300; // Our fixed popup width
      const popupHeight = 400; // Estimated popup height
      const minVisibility = 50; // Minimum pixels that must remain visible
      
      // Constrain X (horizontal)
      const minX = -(popupWidth - minVisibility); // Allow mostly off-screen left
      const maxX = viewport.width - minVisibility; // Keep 50px visible on right
      
      // Constrain Y (vertical) 
      const minY = 0; // Don't go above viewport
      const maxY = viewport.height - minVisibility; // Keep 50px visible at bottom
      
      return {
        x: Math.max(minX, Math.min(maxX, x)),
        y: Math.max(minY, Math.min(maxY, y))
      };
    }
    
    // Check if popup is currently off-screen (not enough visible)
    isPopupOffScreen() {
      if (!this.authPopupContainer) return false;
      
      const popup = this.authPopupContainer.querySelector('div[style*="position: fixed"]');
      if (!popup) return false;
      
      const rect = popup.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      const minVisibility = 50;
      
      // Check if less than minimum visibility on any edge
      const visibleLeft = Math.max(0, rect.left);
      const visibleRight = Math.min(viewport.width, rect.right);
      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(viewport.height, rect.bottom);
      
      const visibleWidth = Math.max(0, visibleRight - visibleLeft);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      
      return visibleWidth < minVisibility || visibleHeight < minVisibility;
    }
    
    // Reset popup to default position (top-right)
    async resetPopupPosition() {
      this.currentPosition = { ...this.defaultPosition };
      await this.savePosition();
      
      if (this.authPopupContainer) {
        this.updatePopupPosition();
        console.log('FCTR: Reset popup to default position');
      }
    }
    
    // Update popup DOM position based on currentPosition
    updatePopupPosition() {
      if (!this.authPopupContainer) return;
      
      const popupElement = this.authPopupContainer.querySelector('div[style*="position: fixed"]');
      if (!popupElement) return;
      
      // Convert right-offset to left-offset for positioning
      const leftPosition = window.innerWidth - 300 - this.currentPosition.x;
      
      popupElement.style.left = `${leftPosition}px`;
      popupElement.style.top = `${this.currentPosition.y}px`;
      popupElement.style.right = 'auto'; // Remove right positioning
    }
    
    // Handle window resize - ensure popup stays visible
    handleWindowResize() {
      if (!this.authPopupContainer) return;
      
      // Re-constrain position to new viewport size
      const constrainedPos = this.constrainToViewport(this.currentPosition.x, this.currentPosition.y);
      
      if (constrainedPos.x !== this.currentPosition.x || constrainedPos.y !== this.currentPosition.y) {
        this.currentPosition = constrainedPos;
        this.updatePopupPosition();
        this.savePosition();
        console.log('FCTR: Adjusted popup position for window resize');
      }
    }
    
    // Setup window resize handler
    setupWindowResize() {
      this.resizeHandler = () => this.handleWindowResize();
      window.addEventListener('resize', this.resizeHandler);
    }

    async injectAuthPopup() {
      if (this.authPopupInjected) return;

      try {
        console.log('Injecting auth popup...');
    
        // Create container
        this.authPopupContainer = document.createElement('div');
        this.authPopupContainer.id = 'fctr-auth-popup-container';
        this.authPopupContainer.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 2147483647;
          display: block;
        `;
    
        // Create the popup element - DRAGGABLE POSITIONING
        const popupElement = document.createElement('div');
        
        // Calculate initial left position from right offset
        const initialLeft = window.innerWidth - 300 - this.currentPosition.x;
        
        popupElement.style.cssText = `
          position: fixed;
          top: ${this.currentPosition.y}px;
          left: ${initialLeft}px;
          width: 300px;
          pointer-events: auto;
          z-index: 2147483647;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          transition: none;
          display: block;
          overflow: hidden;
        `;
    
        // Get popup HTML
        const popupHTML = this.getPopupHTML();
        popupElement.innerHTML = popupHTML;
    
        this.authPopupContainer.appendChild(popupElement);
        document.body.appendChild(this.authPopupContainer);
    
        // ADD NO-WRAP STYLING AFTER INJECTION
        this.applyNoWrapStyling(popupElement);
        
        // Setup window resize handler
        this.setupWindowResize();
    
        // Initialize privacy policy content
        this.initializePrivacyPolicy();
    
        this.authPopupInjected = true;
        console.log('Auth popup injected successfully with drag support');
    
        return popupElement;
    
      } catch (error) {
        console.error('Failed to inject auth popup:', error);
        throw error;
      }
    }

    applyNoWrapStyling(popupElement) {
      // Create and inject additional CSS for no-wrap styling + drag support
      const noWrapStyles = document.createElement('style');
      noWrapStyles.textContent = `
        /* Prevent text wrapping in FCTR popup */
        #fctr-auth-popup-container .fctr-no-wrap {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        #fctr-auth-popup-container .fctr-welcome-text {
          white-space: normal;
          line-height: 1.4;
          font-size: 13px;
        }
        
        #fctr-auth-popup-container .fctr-user-info-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        
        #fctr-auth-popup-container .fctr-button-text {
          white-space: nowrap;
          font-size: 13px;
        }
        
        #fctr-auth-popup-container .fctr-title-text {
          white-space: nowrap;
          letter-spacing: -2.2px;
          font-size: 32px;
        }
        
        #fctr-auth-popup-container .fctr-subtitle-text {
          white-space: nowrap;
          font-size: 11px;
        }
        
        #fctr-auth-popup-container .fctr-search-input {
          font-size: 13px;
        }
        
        #fctr-auth-popup-container .fctr-privacy-link {
          white-space: nowrap;
          font-size: 11px;
        }
        
        /* Ensure containers don't grow beyond popup width */
        #fctr-auth-popup-container > div > div {
          max-width: 100%;
          box-sizing: border-box;
        }
        
        /* Tighter padding for narrower design */
        #fctr-auth-popup-container .fctr-content-padding {
          padding: 16px !important;
        }
        
        #fctr-auth-popup-container .fctr-header-padding {
          padding: 16px 16px 12px !important;
        }
        
        /* DRAG SUPPORT STYLES */
        #fctr-auth-popup-container .fctr-drag-handle {
          cursor: grab;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        
        #fctr-auth-popup-container .fctr-drag-handle:active {
          cursor: grabbing;
        }
        
        #fctr-auth-popup-container .fctr-dragging {
          cursor: grabbing !important;
          opacity: 0.9;
          transition: none !important;
        }
        
        #fctr-auth-popup-container .fctr-header-dragging {
          background: white !important;
          color: #1f2937 !important;
        }
        
        #fctr-auth-popup-container .fctr-header-dragging .fctr-title-text {
          color: #1f2937 !important;
        }
        
        #fctr-auth-popup-container .fctr-header-dragging .fctr-subtitle-text {
          color: #1f2937 !important;
        }
        
        #fctr-auth-popup-container .fctr-header-dragging #fctr-close-btn {
          color: #1f2937 !important;
        }
        
        #fctr-auth-popup-container .fctr-header-dragging #fctr-close-btn svg {
          stroke: #1f2937 !important;
        }
        
        #fctr-auth-popup-container .fctr-header-dragging #fctr-lock-icon {
          color: #1f2937 !important;
          stroke: #1f2937 !important;
        }
      `;
      
      document.head.appendChild(noWrapStyles);
      
      // Apply classes to specific elements
      setTimeout(() => {
        const welcomeMsg = popupElement.querySelector('#fctr-welcome-message');
        if (welcomeMsg) welcomeMsg.className += ' fctr-welcome-text';
        
      // PHASE 1: REMOVED user email and credits styling (no longer exist)

      // PHASE 1: NEW - Add styling for credits text in button
        const creditsText = popupElement.querySelector('#fctr-auth-credits-text');
        if (creditsText) creditsText.className += ' fctr-button-text fctr-no-wrap';
        
        const buttonText = popupElement.querySelector('#fctr-auth-btn-text');
        if (buttonText) buttonText.className += ' fctr-button-text fctr-no-wrap';
        
        const searchInput = popupElement.querySelector('#fctr-search-input');
        if (searchInput) {
          searchInput.className += ' fctr-search-input';
          searchInput.placeholder = 'strt yr fct srch hre';
        }
        
        const privacyLink = popupElement.querySelector('#fctr-privacy-policy-link');
        if (privacyLink) privacyLink.className += ' fctr-privacy-link fctr-no-wrap';
        
        // Apply padding classes
        const contentDiv = popupElement.querySelector('[style*="padding: 20px"]');
        if (contentDiv) contentDiv.className += ' fctr-content-padding';
        
        const headerDiv = popupElement.querySelector('[style*="padding: 20px 20px 16px"]');
        if (headerDiv) headerDiv.className += ' fctr-header-padding';
        
        // IMPORTANT: Add drag handle class to header
        const dragHandle = popupElement.querySelector('#fctr-drag-header');
        if (dragHandle) {
          dragHandle.className += ' fctr-drag-handle';
        }
        
      }, 50);
    }
    
    initializePrivacyPolicy() {
      if (!this.authPopupContainer) return;
      
      const privacyContent = this.authPopupContainer.querySelector('#fctr-privacy-content');
      if (privacyContent) {
        privacyContent.innerHTML = this.getPrivacyPolicyContent();
      }
    }
    
    showPrivacyPolicy() {
      if (!this.authPopupContainer) return;

      console.log('Showing privacy policy in hover popup');

      const authView = this.authPopupContainer.querySelector('#fctr-auth-view');
      const privacyView = this.authPopupContainer.querySelector('#fctr-privacy-policy-view');
      const popupElement = this.authPopupContainer.querySelector('div[style*="width: 300px"]');

      if (authView) authView.style.display = 'none';
      if (privacyView) privacyView.style.display = 'block';

      // FIXED: Keep narrower width for privacy policy too
      if (popupElement) {
        popupElement.style.width = '320px';  // Slightly wider for privacy policy readability
        popupElement.style.maxHeight = '80vh';
      }
    }

    hidePrivacyPolicy() {
      if (!this.authPopupContainer) return;

      console.log('Hiding privacy policy in hover popup');

      const authView = this.authPopupContainer.querySelector('#fctr-auth-view');
      const privacyView = this.authPopupContainer.querySelector('#fctr-privacy-policy-view');
      const popupElement = this.authPopupContainer.querySelector('div[style*="width: 320px"], div[style*="width: 300px"]');

      if (authView) authView.style.display = 'block';
      if (privacyView) privacyView.style.display = 'none';

      // FIXED: Return to narrow width
      if (popupElement) {
        popupElement.style.width = '300px';
        popupElement.style.maxHeight = 'none';
      }
    }
    
    updateAuthState(authStatus) {
      // FIXED: Don't update if popup is not properly injected or not visible
      if (!this.authPopupContainer || !this.authManager.extensionContextValid) return;

      // FIXED: Don't update if popup is currently hidden (prevents interference)
      if (this.authPopupContainer.style.display === 'none') return;

      const elements = this.getUIElements();
      
      if (authStatus && authStatus.authenticated) {
        this.setConnectedState(elements, authStatus);
      } else {
        this.setDisconnectedState(elements);
      }
    }
    // ============================================================================
    // PHASE 1: NEW CREDIT MANAGEMENT METHODS
    // ============================================================================

    // PHASE 1: NEW - Method to update credits display
    // PHASE 1: NEW - Method to update credits display
    async updateCreditsDisplay(creditsElement, authStatus) {
      try {
        console.log('FCTR: Updating credits display, authStatus:', authStatus);
    
        // Try to get credits from storage first (most current)
        if (typeof chrome !== 'undefined' && chrome.storage) {
          try {
            const storageResult = await chrome.storage.local.get(['user-credits']);
            console.log('FCTR: Storage result:', storageResult);
        
            // PHASE 2: Enhanced debugging for credit flow
            if (authStatus && authStatus.user && authStatus.user.credits) {
              console.log('FCTR: Auth object has credits:', authStatus.user.credits);
              if (storageResult['user-credits'] && storageResult['user-credits'] !== authStatus.user.credits) {
                console.warn('FCTR: Credit mismatch - Storage:', storageResult['user-credits'], 'Auth:', authStatus.user.credits);
              }
            }
    
            if (storageResult && storageResult['user-credits']) {
              creditsElement.textContent = `${storageResult['user-credits']} credits remaining`;
              console.log('FCTR: Used storage credits:', storageResult['user-credits']);
              return;
            }
          } catch (storageError) {
            console.warn('FCTR: Storage access failed:', storageError);
          }
        }

        // Fallback to auth user object
        if (authStatus && authStatus.user) {
          console.log('FCTR: Auth user object:', authStatus.user);
  
          if (authStatus.user.credits) {
            creditsElement.textContent = `${authStatus.user.credits} credits remaining`;
            console.log('FCTR: Used auth object credits:', authStatus.user.credits);
            return;
          }
        }

        // PHASE 3A: ENHANCED FALLBACK - Use loading state then fetch config
        console.log('FCTR: No credits found, using enhanced fallback');
        creditsElement.textContent = 'Loading credits...';
    
        try {
          // Get dynamic default credits from config
          const defaultCredits = await this.getDefaultCredits();
          creditsElement.textContent = `${defaultCredits} credits remaining`;
          console.log('FCTR: Used dynamic default credits:', defaultCredits);
        } catch (configError) {
          console.warn('FCTR: Config fallback failed:', configError);
          creditsElement.textContent = 'Server error - please refresh';
          creditsElement.style.color = '#ef4444'; // Red color for error
        }

      } catch (error) {
        console.error('FCTR: Error updating credits display:', error);
        creditsElement.textContent = 'Loading credits...';
      }
    }
  

    // PHASE 1: NEW - Setup credit listening
    setupCreditListener() {
      if (!this.authManager.extensionContextValid) return;
  
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
          chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && changes['user-credits']) {
              const newCredits = changes['user-credits'].newValue;
              console.log('FCTR Hover: Credits updated:', newCredits);
          
              // Update the hover popup credits display immediately
              this.updateHoverPopupCredits(newCredits);
            }
          });
      
          console.log('FCTR Hover: Credit storage listener setup complete');
        }
      } catch (error) {
        console.warn('FCTR Hover: Failed to setup credit listener:', error);
      }
    }




    // PHASE 1: NEW - Update hover popup credits
    updateHoverPopupCredits(newCredits) {
      if (!this.authPopupContainer) return;
  
      try {
        const creditsElement = this.authPopupContainer.querySelector('#fctr-auth-credits-text');
        if (creditsElement && creditsElement.style.display !== 'none') {
          creditsElement.textContent = `${newCredits} credits remaining`;
          console.log('FCTR Hover: Credits display updated to:', newCredits);
        }
      } catch (error) {
        console.error('FCTR Hover: Error updating credits display:', error);
      }
    }
 
    getUIElements() {
      if (!this.authPopupContainer) return {};
  
      return {
        welcomeMessage: this.authPopupContainer.querySelector('#fctr-welcome-message'),
        // PHASE 1: REMOVED userInfo, userEmailEl, userCreditsEl
        authToggleBtn: this.authPopupContainer.querySelector('#fctr-auth-toggle-btn'),
        authBtnText: this.authPopupContainer.querySelector('#fctr-auth-btn-text'),
        authSpinner: this.authPopupContainer.querySelector('#fctr-auth-spinner'),
        connectedIndicator: this.authPopupContainer.querySelector('#fctr-connected-indicator'),
        creditsText: this.authPopupContainer.querySelector('#fctr-auth-credits-text'), // PHASE 1: NEW
        lockIcon: this.authPopupContainer.querySelector('#fctr-lock-icon'),
        privacyPolicyLink: this.authPopupContainer.querySelector('#fctr-privacy-policy-link'),
        searchContainer: this.authPopupContainer.querySelector('#fctr-search-container')
      };
    }
    
    setConnectedState(elements, authStatus) {
      if (elements.welcomeMessage) elements.welcomeMessage.style.display = 'none';
  
      // PHASE 1: REMOVED user info card logic

      // PHASE 1: Update button to show logout with credits
      if (elements.authToggleBtn) {
        elements.authToggleBtn.classList.add('connected');
        elements.authToggleBtn.disabled = false;
        elements.authToggleBtn.style.justifyContent = 'flex-start'; // Left-align for [Logout ●] [Credits]
      }
      if (elements.authBtnText) elements.authBtnText.textContent = 'Logout';
      if (elements.authSpinner) elements.authSpinner.style.display = 'none';
      if (elements.connectedIndicator) elements.connectedIndicator.style.display = 'block';
  
      // PHASE 1: NEW - Show and update credits text
      if (elements.creditsText) {
        elements.creditsText.style.display = 'block';
        this.updateCreditsDisplay(elements.creditsText, authStatus);
      }

        if (elements.privacyPolicyLink) {
          elements.privacyPolicyLink.style.display = 'none';
        }

        if (elements.searchContainer) {
          elements.searchContainer.style.display = 'block';
        }

        if (elements.lockIcon) {
          elements.lockIcon.innerHTML = this.getLockedIconSVG();
        }
  
        console.log('FCTR: Set connected state - button enabled:', !elements.authToggleBtn?.disabled);
      }
    
    async setDisconnectedState(elements = null) {
      if (!elements) {
        elements = this.getUIElements();
      }
      
      // PHASE 1: NEW - Hide credits text when disconnected
      if (elements.creditsText) {
        elements.creditsText.style.display = 'none';
      }
      
      if (elements.welcomeMessage) elements.welcomeMessage.style.display = 'block';
      if (elements.userInfo) elements.userInfo.style.display = 'none';
      
      // FIXED: Always ensure button is enabled and in correct state for disconnected
      if (elements.authToggleBtn) {
        elements.authToggleBtn.classList.remove('connected');
        elements.authToggleBtn.disabled = false;  // FIXED: Always enable in disconnected state
        elements.authToggleBtn.style.justifyContent = 'center'; // Center-align for "Login with SSO"
      }
      if (elements.authBtnText) elements.authBtnText.textContent = 'Login with SSO';
      if (elements.authSpinner) elements.authSpinner.style.display = 'none';
      if (elements.connectedIndicator) elements.connectedIndicator.style.display = 'none';
      if (elements.privacyPolicyLink) elements.privacyPolicyLink.style.display = 'block';
      if (elements.searchContainer) elements.searchContainer.style.display = 'none';
      
      if (elements.lockIcon) {
        elements.lockIcon.innerHTML = this.getUnlockedIconSVG();
      }
      // PHASE 3A: Update welcome message with dynamic config
      await this.updateWelcomeMessage(this.authPopupContainer);
      
      console.log('FCTR: Set disconnected state - button enabled:', !elements.authToggleBtn?.disabled);
    }
    
    togglePopupVisibility() {
      if (this.authPopupContainer) {
        const isVisible = this.authPopupContainer.style.display !== 'none';
        
        // FIXED: Only hide if explicitly requested, don't auto-hide for search contexts
        if (isVisible && !this.authManager.searchContext) {
          this.authPopupContainer.style.display = 'none';
        } else {
          this.authPopupContainer.style.display = 'block';
          // Ensure position is updated when showing
          this.updatePopupPosition();
        }
        
        return this.authPopupContainer.style.display !== 'none';
      }
      return false;
    }
    
    cleanup() {
      // Remove window resize listener
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
        this.resizeHandler = null;
      }
      
      if (this.authPopupContainer) {
        this.authPopupContainer.remove();
        this.authPopupContainer = null;
        this.authPopupInjected = false;
      }
    }
    
    // Icon SVG generators
    getUnlockedIconSVG() {
      return `
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <circle cx="12" cy="16" r="1"></circle>
        <path d="M7 11V7a5 5 0 0 1 10 0"></path>
      `;
    }
    
    getLockedIconSVG() {
      return `
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <circle cx="12" cy="16" r="1"></circle>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      `;
    }
    
    getPrivacyPolicyContent() {
      return `
        <h3>Information We Collect</h3>
        <p>When you use fctr, we collect the following information:</p>
        <ul>
          <li><strong>Account Information:</strong> When you sign in through our Single Sign-On (SSO) system, we collect your email address and name from your GitHub account.</li>
          <li><strong>Usage Data:</strong> We collect information about the text you submit for fact-checking and source verification, along with the URLs where this text was found.</li>
          <li><strong>Technical Data:</strong> Basic browser and extension usage information to ensure proper functionality.</li>
        </ul>

        <h3>How We Use Your Information</h3>
        <p>We use your information to:</p>
        <ul>
          <li>Provide fact-checking and source verification services</li>
          <li>Maintain your account and track credit usage</li>
          <li>Improve our AI models and service quality</li>
          <li>Communicate important updates about the service</li>
        </ul>

        <h3>Information Sharing</h3>
        <p>We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:</p>
        <ul>
          <li>With your explicit consent</li>
          <li>To comply with legal obligations</li>
          <li>To protect our rights and safety</li>
        </ul>

        <h3>Data Security</h3>
        <p>We implement appropriate security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. All data transmission is encrypted using industry-standard protocols.</p>

        <h3>Your Rights</h3>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal information</li>
          <li>Correct inaccurate information</li>
          <li>Delete your account and associated data</li>
          <li>Withdraw consent for data processing</li>
        </ul>

        <h3>Contact Us</h3>
        <p>If you have questions about this Privacy Policy or your data, please contact us at privacy@totmailabs.com.</p>

        <p><em>Last updated: January 2025</em></p>
      `;
    }
    
    getPopupHTML() {
      // Create search context header if available
      const searchContextHeader = this.authManager.searchContext ? `
        <div id="fctr-search-context-header" style="
          padding: 8px 20px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        ">
          fact checking: <span id="fctr-search-context-query">${this.authManager.searchContext.query}</span>
        </div>
      ` : '';

      return `
        <div style="
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          border: 2px solid #e5e7eb;
          overflow: hidden;
          animation: slideIn 0.3s ease-out;
        ">
          ${window.FCTR.modules.ModalStyles ? window.FCTR.modules.ModalStyles.getAuthPopupStyles() : ''}
          
          <!-- Main Auth View -->
          <div id="fctr-auth-view">
            <!-- DRAGGABLE Header -->
            <div id="fctr-drag-header" style="
              padding: 20px 20px 16px;
              background: black;
              border-bottom: 1px solid #e5e7eb;
              display: flex;
              align-items: center;
              justify-content: space-between;
              cursor: grab;
              user-select: none;
            ">
              <div style="display: flex; align-items: center; gap: 12px; pointer-events: none;">
                <div style="
                  width: 40px;
                  height: 40px;
                  background: white;
                  border: 2px solid #1f2937;
                  border-radius: 8px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #1f2937;
                  font-size: 16px;
                ">
                  <svg id="fctr-lock-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <circle cx="12" cy="16" r="1"></circle>
                    <path d="M7 11V7a5 5 0 0 1 10 0"></path>
                  </svg>
                </div>
                <div>
                  <div class="fctr-title-text" style="font-weight: 900; color: white; font-size: 36px; letter-spacing: -2.7px; margin: 0;">fctr</div>
                  <div class="fctr-subtitle-text" style="color: white; font-size: 12px; font-weight: 400; margin: 0;">from TOTMai labs.</div>
                </div>
              </div>
              <button id="fctr-close-btn" style="background: transparent; color: white; padding: 8px; border: none; cursor: pointer; border-radius: 6px; transition: all 0.2s; pointer-events: auto;" title="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            ${searchContextHeader}
            
            <!-- Content -->
            <div style="padding: 20px;">              
              <!-- Welcome Message for Disconnected State -->
              <div id="fctr-welcome-message" style="color: #374151; margin-bottom: 20px; font-size: 14px; line-height: 1.6; text-align: center;">
                Loading welcome message...
              </div>
              
              <!-- User Info for Connected State -->
              <div id="fctr-user-info" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: left; display: none;">
                <div id="fctr-user-email" style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">Loading...</div>
                <div id="fctr-user-credits" style="color: #374151; font-size: 12px;">Credits: Loading...</div>
              </div>
              
                   <!-- Single Toggle Button - PHASE 1: Updated Layout [Logout ●] [Credits] -->
            <button id="fctr-auth-toggle-btn" style="background: #1f2937; color: white; display: flex; align-items: center; justify-content: center; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; text-decoration: none; width: 100%; gap: 0;">
              <span id="fctr-auth-btn-text">Login with SSO</span>
              <div id="fctr-auth-spinner" style="width: 16px; height: 16px; border: 2px solid transparent; border-top: 2px solid currentColor; border-radius: 50%; animation: spin 1s linear infinite; margin-left: 8px; display: none;"></div>
              <div id="fctr-connected-indicator" style="width: 8px; height: 8px; border-radius: 50%; background: #16a34a; margin-left: 4px; display: none;"></div>
              <span id="fctr-auth-credits-text" style="
                font-size: 12px;
                font-weight: 600;
                color: white;
                margin-left: auto;
                display: none;
              ">Loading...</span>
            </button>
              
              <!-- Search Container -->
              <div id="fctr-search-container" style="margin-top: 16px; position: relative; display: none;">
                <div style="position: relative; display: flex; align-items: center; background: white; border: 1px solid #1f2937; border-radius: 8px; overflow: hidden;">
                  <input 
                    type="text" 
                    id="fctr-search-input" 
                    placeholder="start your fact search here"
                    autocomplete="off"
                    spellcheck="false"
                    style="flex: 1; padding: 12px 16px; border: none; background: transparent; font-size: 14px; color: #1f2937; outline: none; font-family: inherit;"
                  >
                  <div style="display: flex; align-items: center; padding-right: 4px;">
                    <button id="fctr-search-button" title="Search" style="padding: 8px; background: transparent; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: background-color 0.2s;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                      </svg>
                    </button>
                    <button id="fctr-dropdown-button" title="Choose search provider" style="padding: 8px; background: transparent; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 4px; margin-left: 4px; transition: background-color 0.2s;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6,9 12,15 18,9"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <!-- Custom Dropdown -->
                <div id="fctr-search-dropdown" style="position: absolute; bottom: 100%; right: 0; background: white; border: 1px solid #1f2937; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); min-width: 150px; z-index: 1000; display: none; margin-bottom: 12px; max-height: 200px; overflow-y: auto;">
                  <!-- Options will be populated by JavaScript -->
                </div>
              </div>
              
              <!-- Privacy Policy Link -->
              <a href="#" id="fctr-privacy-policy-link" style="color: #6b7280; font-size: 12px; text-decoration: underline; cursor: pointer; margin-top: 12px; display: block; text-align: center; transition: color 0.2s;">Privacy Policy</a>
            </div>
          </div>
          
          <!-- Privacy Policy View -->
          <div id="fctr-privacy-policy-view" style="display: none;">
            <div style="
              padding: 20px 25px;
              border-bottom: 1px solid #e5e7eb;
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: white;
            ">
              <h2 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0;">Privacy Policy</h2>
              <button id="fctr-privacy-close-btn" style="background: none; border: none; font-size: 20px; color: #6b7280; cursor: pointer; padding: 5px; line-height: 1; transition: color 0.2s;">&times;</button>
            </div>
            
            <div id="fctr-privacy-content" style="
              padding: 25px;
              overflow-y: auto;
              max-height: 400px;
              background: white;
              color: #1f2937;
              line-height: 1.6;
              text-align: left;
              font-size: 14px;
            ">
              <!-- Content will be inserted by JavaScript -->
            </div>
          </div>
        </div>
        
        <style>
          #fctr-privacy-content h3 {
            margin-top: 20px;
            margin-bottom: 8px;
            font-size: 15px;
            font-weight: 600;
            color: #1f2937;
          }
          
          #fctr-privacy-content h3:first-child {
            margin-top: 0;
          }
          
          #fctr-privacy-content p {
            margin-bottom: 12px;
          }
          
          #fctr-privacy-content ul {
            margin-bottom: 12px;
            padding-left: 18px;
          }
          
          #fctr-privacy-content li {
            margin-bottom: 6px;
          }
          
          #fctr-privacy-policy-link:hover {
            color: #374151;
          }
          
          #fctr-privacy-close-btn:hover {
            color: #1f2937;
          }
          
          #fctr-search-button:hover {
            background: #f3f4f6;
          }
          
          #fctr-dropdown-button:hover {
            background: #f3f4f6;
          }
          
          .fctr-dropdown-option {
            padding: 12px 16px;
            font-size: 14px;
            color: #1f2937;
            cursor: pointer;
            transition: background-color 0.2s;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .fctr-dropdown-option:last-child {
            border-bottom: none;
          }
          
          .fctr-dropdown-option:hover {
            background: #f3f4f6;
          }
          
          .fctr-dropdown-option.selected {
            background: #1f2937;
            color: white;
          }
          
          .fctr-dropdown-option.selected:hover {
            background: #374151;
          }
        </style>
      `;
    }
  
    // PHASE 3A: NEW - Fetch configuration via background script
    async fetchConfig() {
      try {
        console.log('FCTR: Fetching config via background script...');
    
        // Check Chrome storage for cached config first
        if (typeof chrome !== 'undefined' && chrome.storage) {
          try {
            const cached = await chrome.storage.local.get([this.CONFIG_CACHE_KEY]);
            const cachedConfig = cached[this.CONFIG_CACHE_KEY];
        
            if (cachedConfig && cachedConfig.timestamp) {
              const cacheAge = Date.now() - cachedConfig.timestamp;
              const maxAge = this.CONFIG_CACHE_TTL_HOURS * 60 * 60 * 1000;
          
              if (cacheAge < maxAge) {
                console.log('FCTR: Using cached config, age:', Math.round(cacheAge / 1000 / 60), 'minutes');
                return cachedConfig.config;
              }
            }
          } catch (storageError) {
            console.warn('FCTR: Cache check failed:', storageError);
          }
        }
    
        // Request fresh config from background script
        const response = await chrome.runtime.sendMessage({ action: 'fetch-config' });
    
        if (response && response.success) {
          console.log('FCTR: Fresh config fetched via background:', response.config);
          return response.config;
        } else {
          console.warn('FCTR: Background config fetch failed:', response?.error);
          console.error('FCTR: Background config fetch failed:', response?.error);
          // PHASE 3 PART 2: Return null instead of fallback - let caller handle error
          return null;
        }
    
      } catch (error) {
        console.error('FCTR: Config fetch via background failed:', error);
    
        // Return hardcoded fallback
        // PHASE 3 PART 2: Return null instead of hardcoded fallback
        return null;
      }
    }
    // PHASE 3A: NEW - Get welcome message with dynamic credits
    async getWelcomeMessage() {
      try {
        const config = await this.fetchConfig();
    
        if (!config) {
          // Config fetch failed - return error message
          return "Error loading welcome message - please refresh";
        }
    
        // Replace {credits} placeholder with actual value
        const welcomeMessage = config.welcome_message_template.replace(
          '{credits}', 
          config.default_credits
        );
        
        console.log('FCTR: Generated welcome message:', welcomeMessage);
        return welcomeMessage;
        
      } catch (error) {
        console.error('FCTR: Error generating welcome message:', error);
        // Fallback to hardcoded message
        // PHASE 3 PART 2: Return error message instead of hardcoded fallback
        return "Error communicating with server";
      }
    }

    // PHASE 3A: NEW - Get default credits with fallback
    async getDefaultCredits() {
      try {
        const config = await this.fetchConfig();
        if (!config) {
          console.error('FCTR: Config fetch failed in getDefaultCredits');
          return null; // Signal that config fetch failed
        }
        return config.default_credits;
      } catch (error) {
        console.error('FCTR: Error getting default credits:', error);
        return null; // Signal error instead of defaulting to 25
      }
    }

    // PHASE 3A: NEW - Setup config change listener for cross-tab sync
    setupConfigListener() {
      if (!this.authManager.extensionContextValid) return;

      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
          chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && changes[this.CONFIG_CACHE_KEY]) {
              console.log('FCTR: Config cache updated across tabs');
              // Config was updated in another tab, no action needed since we fetch on-demand
            }
          });
          
          console.log('FCTR: Config change listener setup complete');
        }
      } catch (error) {
        console.warn('FCTR: Could not setup config listener:', error);
      }
    }
    
    // PHASE 3A: NEW - Update welcome message in popup
    async updateWelcomeMessage(container) {
      if (!container) return;
  
      try {
        console.log('FCTR: Updating welcome message with dynamic config...');
    
        // Find welcome message element
        const welcomeElement = container.querySelector('#fctr-welcome-message');
        if (welcomeElement) {
          // Show loading state first
          const originalText = welcomeElement.textContent;
          welcomeElement.textContent = 'Loading...';
      
          // Get dynamic welcome message
          const welcomeMessage = await this.getWelcomeMessage();
          welcomeElement.textContent = welcomeMessage;
      
          console.log('FCTR: Updated welcome message from:', originalText, 'to:', welcomeMessage);
        }
      } catch (error) {
        console.warn('FCTR: Could not update welcome message:', error);
      }
    }
  
  }
  // Register module
  if (!window.FCTR) window.FCTR = { modules: {} };
  window.FCTR.modules.AuthPopupUI = AuthPopupUI;
  
})();