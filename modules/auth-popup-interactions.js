/* 
 * ============================================================================
 * DUAL AUTH FLOW WARNING: This is the HOVER popup auth flow.
 * Changes here must stay synchronized with the STANDALONE popup auth flow.
 * See auth/auth-popup.js for the other auth system.
 * Both must use same background script messages and storage keys.
 * ============================================================================
 */

// modules/auth-popup-interactions.js - Authentication Popup Interactions Management (FIXED LOGOUT + DEBOUNCING)
(function() {
  'use strict';
  
  class AuthPopupInteractions {
    constructor(authManager, authPopupUI) {
      this.authManager = authManager;
      this.authPopupUI = authPopupUI;
      
      // DEBOUNCING: Prevent rapid login/logout calls
      this.authActionInProgress = false;
      this.authActionDebounceTime = 2000; // 2 seconds
      
      // Search functionality - sync with AuthManager
      this.currentSearchProvider = authManager.currentSearchProvider || 'google';
      this.searchProviders = {
        google: {
          name: 'google',
          url: 'https://www.google.com/search?q='
        },
        brave: {
          name: 'brave search',
          url: 'https://search.brave.com/search?q='
        },
        duckduckgo: {
          name: 'duck duck go',
          url: 'https://duckduckgo.com/?q='
        },
        perplexity: {
          name: 'perplexity.ai',
          url: 'https://www.perplexity.ai/search?q='
        },
        openai: {
          name: 'openai',
          url: 'https://chat.openai.com'
        },
        claude: {
          name: 'claude',
          url: 'https://claude.ai'
        }
      };
      
      // DRAG FUNCTIONALITY PROPERTIES
      this.isDragging = false;
      this.dragOffset = { x: 0, y: 0 };
      this.dragStartPos = { x: 0, y: 0 };
      this.lastMoveTime = 0;
      this.moveThrottle = 16; // ~60fps
      
      // Bound methods for event listeners
      this.handleDragStart = this.handleDragStart.bind(this);
      this.handleDragMove = this.handleDragMove.bind(this);
      this.handleDragEnd = this.handleDragEnd.bind(this);
      this.handleTouchStart = this.handleTouchStart.bind(this);
      this.handleTouchMove = this.handleTouchMove.bind(this);
      this.handleTouchEnd = this.handleTouchEnd.bind(this);
      
      console.log('AuthPopupInteractions initialized with drag support, debouncing, and search provider:', this.currentSearchProvider);
    }
    
    setupEventListeners(popupElement) {
      // ENHANCED SAFETY CHECK
      if (!popupElement) {
        console.error('FCTR: setupEventListeners called with undefined popupElement');

        // Try multiple fallback methods to find the popup element
        if (this.authPopupUI && this.authPopupUI.authPopupContainer) {
          // Try different selectors
          popupElement = this.authPopupUI.authPopupContainer.querySelector('div[style*="position: fixed"]') ||
                     this.authPopupUI.authPopupContainer.querySelector('[id*="popup"]') ||
                     this.authPopupUI.authPopupContainer.firstElementChild;
  
         if (popupElement) {
            console.log('FCTR: ✅ Found popup element via enhanced fallback');
          } else {
            console.error('FCTR: ❌ Could not find popup element with any method');
            console.log('FCTR: Available container HTML:', this.authPopupUI.authPopupContainer.innerHTML.substring(0, 200));
            return;
          }
        } else {
          console.error('FCTR: ❌ AuthPopupUI container not available');
          return;
        }
      }

      const closeBtn = popupElement.querySelector('#fctr-close-btn');
      const authToggleBtn = popupElement.querySelector('#fctr-auth-toggle-btn');
      const privacyPolicyLink = popupElement.querySelector('#fctr-privacy-policy-link');
      const privacyCloseBtn = popupElement.querySelector('#fctr-privacy-close-btn');
  
      // ADD PROPER CLEANUP TO CLOSE BUTTON
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          if (this.authPopupUI.authPopupContainer) {
            this.authPopupUI.authPopupContainer.style.display = 'none';
        
            // IMPORTANT: Reset the injection flag so popup can be recreated cleanly
           this.authPopupUI.authPopupInjected = false;
            console.log('FCTR: Popup closed and injection flag reset for clean reopening');
          }
        });
      }
  
      if (authToggleBtn) {
        authToggleBtn.addEventListener('click', async () => {
          // DEBOUNCING: Prevent rapid clicks
          if (this.authActionInProgress) {
            console.log('FCTR: Auth action already in progress, ignoring click');
            return;
          }

          const isConnected = authToggleBtn.classList.contains('connected');
      
          if (isConnected) {
            await this.handleLogout();
          } else {
            await this.handleLogin();
          }
        });
      }
      
      // Privacy policy event listeners
      if (privacyPolicyLink) {
        privacyPolicyLink.addEventListener('click', (e) => {
          e.preventDefault();
          this.authPopupUI.showPrivacyPolicy();
        });
      }
  
      if (privacyCloseBtn) {
        privacyCloseBtn.addEventListener('click', () => {
          this.authPopupUI.hidePrivacyPolicy();
          // Update auth state after closing privacy policy
          this.authManager.updateAuthState();
        });
      }
  
      // Setup search event listeners
      this.setupSearchEventListeners(popupElement);
  
      // SETUP DRAG EVENT LISTENERS
      this.setupDragEventListeners(popupElement);
    }
    
    // ================================
    // FIXED AUTH METHODS WITH DEBOUNCING AND ERROR HANDLING
    // ================================
    
    async handleLogin() {
      // DEBOUNCING: Check if already in progress
      if (this.authActionInProgress) {
        console.log('FCTR: Login already in progress, skipping...');
        return;
      }

      try {
        console.log('FCTR Hover: Starting login process...');
        
        // DEBOUNCING: Set in-progress flag
        this.authActionInProgress = true;
    
        // Update UI to connecting state
        const authToggleBtn = this.authPopupUI.authPopupContainer?.querySelector('#fctr-auth-toggle-btn');
        const authBtnText = this.authPopupUI.authPopupContainer?.querySelector('#fctr-auth-btn-text');
        const authSpinner = this.authPopupUI.authPopupContainer?.querySelector('#fctr-auth-spinner');
    
        if (authToggleBtn) authToggleBtn.disabled = true;
        if (authBtnText) authBtnText.textContent = 'Connecting...';
        if (authSpinner) authSpinner.style.display = 'block';
    
        if (this.authManager.extensionContextValid) {
          // Use background script for seamless auth
          const response = await chrome.runtime.sendMessage({ action: 'initiate-login' });
      
          if (response && response.success) {
            console.log('FCTR Hover: Login successful');
            // Let storage listener handle UI update
            setTimeout(() => {
              this.authManager.updateAuthState();
            }, 500);
          } else {
            throw new Error(response?.error || 'Authentication failed');
          }
        } else {
          throw new Error('Extension context not available');
        }
    
      } catch (error) {
        console.error('FCTR Hover: Login failed:', error);
    
        // ERROR HANDLING: Re-enable button on failure
        const authToggleBtn = this.authPopupUI.authPopupContainer?.querySelector('#fctr-auth-toggle-btn');
        const authBtnText = this.authPopupUI.authPopupContainer?.querySelector('#fctr-auth-btn-text');
        const authSpinner = this.authPopupUI.authPopupContainer?.querySelector('#fctr-auth-spinner');
    
        if (authToggleBtn) authToggleBtn.disabled = false;
        if (authBtnText) authBtnText.textContent = 'Login with SSO';
        if (authSpinner) authSpinner.style.display = 'none';
        
        // Show error to user
        if (window.FCTR.modules.Utils) {
          window.FCTR.modules.Utils.showPopup(`Login failed: ${error.message}`, 'error');
        }
        
      } finally {
        // DEBOUNCING: Clear in-progress flag after delay
        setTimeout(() => {
          this.authActionInProgress = false;
          console.log('FCTR: Login debounce period ended');
        }, this.authActionDebounceTime);
      }
    }
    
    async handleLogout() {
      // DEBOUNCING: Check if already in progress
      if (this.authActionInProgress) {
        console.log('FCTR: Logout already in progress, skipping...');
        return;
      }

      try {
        console.log('FCTR Hover: Starting logout process...');
        
        // DEBOUNCING: Set in-progress flag
        this.authActionInProgress = true;

        // Update UI to connecting state
        const authToggleBtn = this.authPopupUI.authPopupContainer?.querySelector('#fctr-auth-toggle-btn');
        const authBtnText = this.authPopupUI.authPopupContainer?.querySelector('#fctr-auth-btn-text');
        const authSpinner = this.authPopupUI.authPopupContainer?.querySelector('#fctr-auth-spinner');
    
        if (authToggleBtn) authToggleBtn.disabled = true;
        if (authBtnText) authBtnText.textContent = 'Logging out...';
        if (authSpinner) authSpinner.style.display = 'block';

        if (this.authManager.extensionContextValid) {
          await chrome.runtime.sendMessage({ action: 'logout' });
          console.log('FCTR Hover: Logout request sent');
        }

        // Force UI update
        setTimeout(() => {
          this.authManager.updateAuthState();
        }, 200);
        
        // FIXED: Re-enable button after logout completes
        setTimeout(() => {
          console.log('FCTR Hover: Re-enabling logout button after successful logout');
          const authToggleBtn = this.authPopupUI.authPopupContainer?.querySelector('#fctr-auth-toggle-btn');
          const authBtnText = this.authPopupUI.authPopupContainer?.querySelector('#fctr-auth-btn-text');
          const authSpinner = this.authPopupUI.authPopupContainer?.querySelector('#fctr-auth-spinner');
          
          if (authToggleBtn) authToggleBtn.disabled = false;
          if (authBtnText) authBtnText.textContent = 'Login with SSO';
          if (authSpinner) authSpinner.style.display = 'none';
        }, 1000);
    
      } catch (error) {
        console.error('FCTR Hover: Logout failed:', error);
        
        // ERROR HANDLING: Re-enable button on failure
        const authToggleBtn = this.authPopupUI.authPopupContainer?.querySelector('#fctr-auth-toggle-btn');
        const authBtnText = this.authPopupUI.authPopupContainer?.querySelector('#fctr-auth-btn-text');
        const authSpinner = this.authPopupUI.authPopupContainer?.querySelector('#fctr-auth-spinner');
        
        if (authToggleBtn) authToggleBtn.disabled = false;
        if (authBtnText) authBtnText.textContent = 'Logout';  // Keep as logout since they're still connected
        if (authSpinner) authSpinner.style.display = 'none';
        
        // Show error to user
        if (window.FCTR.modules.Utils) {
          window.FCTR.modules.Utils.showPopup(`Logout failed: ${error.message}`, 'error');
        }
        
      } finally {
        // DEBOUNCING: Clear in-progress flag after delay
        setTimeout(() => {
          this.authActionInProgress = false;
          console.log('FCTR: Logout debounce period ended');
        }, this.authActionDebounceTime);
      }
    }
    
    // ================================
    // DRAG FUNCTIONALITY IMPLEMENTATION (UNCHANGED)
    // ================================
    
    setupDragEventListeners(popupElement) {
      const dragHandle = popupElement.querySelector('#fctr-drag-header');
      const closeBtn = popupElement.querySelector('#fctr-close-btn');
      
      if (!dragHandle) {
        console.warn('FCTR: Drag handle not found');
        return;
      }
      
      // Mouse events for desktop
      dragHandle.addEventListener('mousedown', this.handleDragStart);
      
      // Touch events for mobile/tablet
      dragHandle.addEventListener('touchstart', this.handleTouchStart, { passive: false });
      
      // Prevent dragging when clicking the close button
      if (closeBtn) {
        closeBtn.addEventListener('mousedown', (e) => e.stopPropagation());
        closeBtn.addEventListener('touchstart', (e) => e.stopPropagation());
      }
      
      console.log('FCTR: Drag event listeners setup complete');
    }
    
    handleDragStart(e) {
      e.preventDefault();
      e.stopPropagation();
      
      this.startDrag(e.clientX, e.clientY);
      
      // Add global mouse event listeners
      document.addEventListener('mousemove', this.handleDragMove);
      document.addEventListener('mouseup', this.handleDragEnd);
      
      console.log('FCTR: Drag started (mouse)');
    }
    
    handleTouchStart(e) {
      e.preventDefault();
      e.stopPropagation();
      
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        this.startDrag(touch.clientX, touch.clientY);
        
        // Add global touch event listeners
        document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd);
        
        console.log('FCTR: Drag started (touch)');
      }
    }
    
    startDrag(clientX, clientY) {
      if (!this.authPopupUI.authPopupContainer) return;
      
      const popupElement = this.authPopupUI.authPopupContainer.querySelector('div[style*="position: fixed"]');
      if (!popupElement) return;
      
      this.isDragging = true;
      
      // Get current popup position
      const rect = popupElement.getBoundingClientRect();
      
      // Calculate offset from click point to popup top-left
      this.dragOffset = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
      
      this.dragStartPos = { x: clientX, y: clientY };
      
      // Apply visual feedback
      this.applyDragVisuals(true);
      
      // Disable transitions during drag
      popupElement.style.transition = 'none';
    }
    
    handleDragMove(e) {
      if (!this.isDragging) return;
      
      this.performDrag(e.clientX, e.clientY);
    }
    
    handleTouchMove(e) {
      if (!this.isDragging || e.touches.length !== 1) return;
      
      e.preventDefault(); // Prevent scrolling
      const touch = e.touches[0];
      this.performDrag(touch.clientX, touch.clientY);
    }
    
    performDrag(clientX, clientY) {
      // Throttle move events for performance
      const now = Date.now();
      if (now - this.lastMoveTime < this.moveThrottle) return;
      this.lastMoveTime = now;
      
      if (!this.authPopupUI.authPopupContainer) return;
      
      const popupElement = this.authPopupUI.authPopupContainer.querySelector('div[style*="position: fixed"]');
      if (!popupElement) return;
      
      // Calculate new position
      const newX = clientX - this.dragOffset.x;
      const newY = clientY - this.dragOffset.y;
      
      // Constrain to viewport with boundary checking
      const constrainedPos = this.authPopupUI.constrainToViewport(
        window.innerWidth - newX - 300, // Convert left position to right offset
        newY
      );
      
      // Update UI position
      this.authPopupUI.currentPosition = constrainedPos;
      this.authPopupUI.updatePopupPosition();
    }
    
    handleDragEnd(e) {
      this.endDrag();
      
      // Remove global mouse event listeners
      document.removeEventListener('mousemove', this.handleDragMove);
      document.removeEventListener('mouseup', this.handleDragEnd);
      
      console.log('FCTR: Drag ended (mouse)');
    }
    
    handleTouchEnd(e) {
      this.endDrag();
      
      // Remove global touch event listeners
      document.removeEventListener('touchmove', this.handleTouchMove);
      document.removeEventListener('touchend', this.handleTouchEnd);
      
      console.log('FCTR: Drag ended (touch)');
    }
    
    endDrag() {
      if (!this.isDragging) return;
      
      this.isDragging = false;
      
      // Remove visual feedback
      this.applyDragVisuals(false);
      
      // Re-enable transitions
      if (this.authPopupUI.authPopupContainer) {
        const popupElement = this.authPopupUI.authPopupContainer.querySelector('div[style*="position: fixed"]');
        if (popupElement) {
          popupElement.style.transition = '';
        }
      }
      
      // Save final position
      this.authPopupUI.savePosition();
      
      // Check if popup moved significantly (for analytics/debugging)
      const totalMove = Math.abs(this.dragStartPos.x - this.dragOffset.x) + 
                       Math.abs(this.dragStartPos.y - this.dragOffset.y);
      
      if (totalMove > 5) {
        console.log('FCTR: Popup repositioned to:', this.authPopupUI.currentPosition);
      }
    }
    
    applyDragVisuals(isDragging) {
      if (!this.authPopupUI.authPopupContainer) return;
      
      const popupElement = this.authPopupUI.authPopupContainer.querySelector('div[style*="position: fixed"]');
      const dragHeader = this.authPopupUI.authPopupContainer.querySelector('#fctr-drag-header');
      
      if (!popupElement || !dragHeader) return;
      
      if (isDragging) {
        // Apply dragging styles
        popupElement.classList.add('fctr-dragging');
        dragHeader.classList.add('fctr-header-dragging');
        dragHeader.style.cursor = 'grabbing';
        
        // Slightly reduce opacity during drag
        popupElement.style.opacity = '0.9';
        
      } else {
        // Remove dragging styles
        popupElement.classList.remove('fctr-dragging');
        dragHeader.classList.remove('fctr-header-dragging');
        dragHeader.style.cursor = 'grab';
        
        // Restore full opacity
        popupElement.style.opacity = '1';
      }
    }
    
    // ================================
    // SEARCH FUNCTIONALITY (UNCHANGED)
    // ================================
    
    // Setup search event listeners
    setupSearchEventListeners(popupElement) {
      const searchInput = popupElement.querySelector('#fctr-search-input');
      const searchButton = popupElement.querySelector('#fctr-search-button');
      const dropdownButton = popupElement.querySelector('#fctr-dropdown-button');
      const searchDropdown = popupElement.querySelector('#fctr-search-dropdown');
      
      if (!searchInput || !dropdownButton) return;
      
      // Enter key in search input
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.performSearch(searchInput.value.trim());
        }
      });
      
      // Search button click
      if (searchButton) {
        searchButton.addEventListener('click', (e) => {
          e.preventDefault();
          this.performSearch(searchInput.value.trim());
        });
      }
      
      // Dropdown toggle
      dropdownButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSearchDropdown(searchDropdown, dropdownButton);
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (searchDropdown && !searchDropdown.contains(e.target) && !dropdownButton.contains(e.target)) {
          this.hideSearchDropdown(searchDropdown);
        }
      });
      
      console.log('Search event listeners setup complete');
    }
    
    // Perform search with current provider
    performSearch(query) {
      if (!query) {
        console.log('No search query entered');
        return;
      }
      
      const provider = this.searchProviders[this.currentSearchProvider];
      
      let searchUrl;
      
      if (this.currentSearchProvider === 'openai' || this.currentSearchProvider === 'claude') {
        searchUrl = provider.url;
      } else {
        searchUrl = provider.url + encodeURIComponent(query);
      }
      
      console.log('Opening search:', provider.name, 'with query:', query);
      
      // FIXED: Content scripts can't use chrome.tabs, so send message to background script
      if (this.authManager.extensionContextValid && typeof chrome !== 'undefined' && chrome.runtime) {
        try {
          // Send message to background script to create tab and show popup
          chrome.runtime.sendMessage({
            action: 'create-search-tab',
            url: searchUrl,
            query: query,
            provider: this.currentSearchProvider
          }, (response) => {
            console.log('Background response:', response);
            if (response && response.success) {
              console.log('Search tab created successfully with ID:', response.tabId);
            } else {
              console.warn('Failed to create search tab:', response?.error);
              // Fallback to window.open
              window.open(searchUrl, '_blank');
            }
          });
        } catch (error) {
          console.warn('Background message failed, using window.open:', error);
          window.open(searchUrl, '_blank');
        }
      } else {
        window.open(searchUrl, '_blank');
      }
      
      const searchInput = this.authPopupUI.authPopupContainer?.querySelector('#fctr-search-input');
      if (searchInput) {
        searchInput.value = '';
      }
    }
    
    // Search dropdown methods
    toggleSearchDropdown(dropdown, button) {
      if (!dropdown) return;
      
      const isVisible = dropdown.style.display === 'block';
      
      if (isVisible) {
        this.hideSearchDropdown(dropdown);
      } else {
        this.showSearchDropdown(dropdown);
      }
    }
    
    showSearchDropdown(dropdown) {
      if (!dropdown) return;
      
      // FIXED: Sync current provider from AuthManager before building dropdown
      this.syncCurrentProviderFromManager();
      
      dropdown.innerHTML = '';
      
      console.log('FCTR: Building search dropdown, current provider:', this.currentSearchProvider);
      
      Object.keys(this.searchProviders).forEach(key => {
        const provider = this.searchProviders[key];
        const option = document.createElement('div');
        option.className = 'fctr-dropdown-option';
        option.textContent = provider.name;
        option.dataset.provider = key;
        
        if (key === this.currentSearchProvider) {
          option.classList.add('selected');
          console.log('FCTR: Marked provider as selected:', provider.name);
        }
        
        option.addEventListener('click', () => {
          console.log('FCTR: User clicked provider:', provider.name);
          this.selectSearchProvider(key);
          this.hideSearchDropdown(dropdown);
        });
        
        dropdown.appendChild(option);
      });
      
      dropdown.style.display = 'block';
      console.log('Search dropdown shown with', Object.keys(this.searchProviders).length, 'options');
    }
    
    hideSearchDropdown(dropdown) {
      if (!dropdown) return;
      dropdown.style.display = 'none';
    }
    
    selectSearchProvider(providerKey) {
      this.currentSearchProvider = providerKey;
      
      // Use AuthManager's comprehensive method to save the provider
      if (this.authManager && this.authManager.setSearchProvider) {
        this.authManager.setSearchProvider(providerKey);
      } else {
        // Fallback to direct save method
        if (this.authManager && this.authManager.saveSearchProvider) {
          this.authManager.saveSearchProvider();
        }
      }
      
      console.log('Selected search provider:', this.searchProviders[providerKey].name);
    }
    
    // Update search context in UI
    updateSearchContext(query, provider) {
      if (!this.authPopupUI.authPopupContainer) return;
      
      const contextHeader = this.authPopupUI.authPopupContainer.querySelector('#fctr-search-context-header');
      const contextQuery = this.authPopupUI.authPopupContainer.querySelector('#fctr-search-context-query');
      const searchInput = this.authPopupUI.authPopupContainer.querySelector('#fctr-search-input');
      
      if (contextHeader && contextQuery && query) {
        contextQuery.textContent = query;
        contextHeader.style.display = 'block';
      }
      
      if (searchInput && query) {
        searchInput.value = query;
      }
      
      if (provider) {
        this.currentSearchProvider = provider;
        // Also update AuthManager to keep in sync
        if (this.authManager) {
          this.authManager.currentSearchProvider = provider;
        }
      }
    }
    
    // FIXED: Add method to sync current provider when dropdown is built
    syncCurrentProviderFromManager() {
      if (this.authManager && this.authManager.currentSearchProvider) {
        this.currentSearchProvider = this.authManager.currentSearchProvider;
        console.log('FCTR: 🔄 Synced current provider from AuthManager:', this.currentSearchProvider);
      }
    }
  }
  
  // Register module
  if (!window.FCTR) window.FCTR = { modules: {} };
  window.FCTR.modules.AuthPopupInteractions = AuthPopupInteractions;
  
})();