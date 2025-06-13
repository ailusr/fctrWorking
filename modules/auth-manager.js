// modules/auth-manager.js - Authentication Management (WITH SEARCH PROVIDER STORAGE)
(function() {
  'use strict';
  
  class AuthManager {
    constructor() {
      this.authUpdateInterval = null;
      this.extensionContextValid = true;
      
      // Search functionality
      this.currentSearchProvider = 'google'; // Initial default
      this.searchProviderLoaded = false; // Track if we've loaded from storage
      this.searchContext = null;
      
      // Initialize sub-modules
      this.authPopupUI = null;
      this.authPopupInteractions = null;
      
      // Test extension context on startup
      this.testExtensionContext();
      
      // Setup storage listener for cross-popup sync
      this.setupStorageListener();
      
      // Load saved search provider IMMEDIATELY
      this.loadSearchProvider();
      
      console.log('AuthManager (Core) initialized with drag support and search provider storage');
    }
    
    // Test if extension context is valid
    testExtensionContext() {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
          // Test if we can call this function
          chrome.runtime.getURL('test');
          this.extensionContextValid = true;
        } else {
          this.extensionContextValid = false;
        }
      } catch (error) {
        console.warn('FCTR: Extension context invalid:', error);
        this.extensionContextValid = false;
      }
    }
    
    // ================================
    // SEARCH PROVIDER STORAGE METHODS
    // ================================
    
    // Load saved search provider from Chrome storage
    async loadSearchProvider() {
      try {
        if (this.extensionContextValid && typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.local.get(['fctr-search-provider']);
          
          if (result['fctr-search-provider']) {
            this.currentSearchProvider = result['fctr-search-provider'];
            this.searchProviderLoaded = true;
            console.log('FCTR: ✅ Loaded saved search provider:', this.currentSearchProvider);
            
            // Update AuthPopupInteractions if it exists
            if (this.authPopupInteractions) {
              this.authPopupInteractions.currentSearchProvider = this.currentSearchProvider;
              console.log('FCTR: ✅ Synced search provider to AuthPopupInteractions');
            }
          } else {
            // First time user - no saved preference yet, keep default
            console.log('FCTR: 🔄 No saved search provider found, using default:', this.currentSearchProvider);
            this.searchProviderLoaded = true;
            
            // Save the default so it persists
            await this.saveSearchProvider();
          }
        } else {
          console.warn('FCTR: ⚠️ Chrome storage not available, keeping default:', this.currentSearchProvider);
          this.searchProviderLoaded = true;
        }
      } catch (error) {
        console.warn('FCTR: ❌ Could not load search provider:', error);
        // DON'T reset to Google here - keep whatever we had
        this.searchProviderLoaded = true;
      }
    }
    
    // Save current search provider to Chrome storage
    async saveSearchProvider() {
      try {
        if (this.extensionContextValid && typeof chrome !== 'undefined' && chrome.storage) {
          // Get the current provider from AuthPopupInteractions if available
          const providerToSave = this.authPopupInteractions ? 
            this.authPopupInteractions.currentSearchProvider : 
            this.currentSearchProvider;
            
          await chrome.storage.local.set({ 'fctr-search-provider': providerToSave });
          this.currentSearchProvider = providerToSave;
          console.log('FCTR: ✅ Saved search provider to storage:', providerToSave);
        } else {
          console.warn('FCTR: ⚠️ Cannot save search provider - Chrome storage unavailable');
        }
      } catch (error) {
        console.warn('FCTR: ❌ Could not save search provider:', error);
      }
    }
    
    // Set search provider and save it
    async setSearchProvider(providerKey) {
      this.currentSearchProvider = providerKey;
      
      // Update AuthPopupInteractions if it exists
      if (this.authPopupInteractions) {
        this.authPopupInteractions.currentSearchProvider = providerKey;
      }
      
      // Save to storage
      await this.saveSearchProvider();
      
      console.log('FCTR: ✅ Search provider set and saved:', providerKey);
    }
    
    // Auto-show popup for search with better error handling
    async autoShowForSearch(query, provider) {
      console.log('FCTR: Auto-showing popup for search context:', query, provider);

      // Set search context
      this.searchContext = {
        query: query,
        provider: provider,
        timestamp: Date.now()
      };

      try {
        // FIXED: Ensure popup is shown, don't toggle if already visible
        if (!this.authPopupUI || !this.authPopupUI.authPopupInjected) {
          await this.injectAuthPopup();
        } else {
          // If already injected, just make sure it's visible
          if (this.authPopupUI.authPopupContainer && this.authPopupUI.authPopupContainer.style.display === 'none') {
            this.authPopupUI.authPopupContainer.style.display = 'block';
          }
          
          // Check if popup is off-screen and reset if needed
          await this.checkAndResetIfOffScreen();
        }
        
        // Update search context in UI
        if (this.authPopupInteractions) {
          this.authPopupInteractions.updateSearchContext(query, provider);
        }
        
      } catch (error) {
        console.error('FCTR: Failed to auto-show popup for search:', error);
      }
    }    
    
    setupStorageListener() {
      if (!this.extensionContextValid) return;
  
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
          chrome.storage.onChanged.addListener((changes, namespace) => {
            console.log('AuthManager: Storage changed:', namespace, Object.keys(changes));
        
            // Check for auth-related changes
            if (changes['totm-auth'] || changes['totm-auth-timestamp']) {
              console.log('AuthManager: Auth storage changed!');
          
              if (changes['totm-auth']) {
                const newValue = changes['totm-auth'].newValue;
                console.log('AuthManager: totm-auth changed to:', newValue ? `user: ${newValue.user?.email}` : 'null');
              }
          
              // ENHANCED: Immediate update + delayed backup update
              this.updateAuthState();
              setTimeout(() => {
                console.log('AuthManager: Delayed auth state update');
                this.updateAuthState();
              }, 500);
            }
        
            // Also listen for credit updates
            if (changes['user-credits']) {
              console.log('AuthManager: Credits updated:', changes['user-credits'].newValue);
              setTimeout(() => this.updateAuthState(), 100);
            }
            
            // Listen for search provider changes
            if (changes['fctr-search-provider']) {
              console.log('AuthManager: Search provider updated:', changes['fctr-search-provider'].newValue);
              this.currentSearchProvider = changes['fctr-search-provider'].newValue || 'google';
              if (this.authPopupInteractions) {
                this.authPopupInteractions.currentSearchProvider = this.currentSearchProvider;
              }
            }
          });
      
          console.log('AuthManager: Enhanced storage event listener setup complete');
        }
      } catch (error) {
        console.warn('AuthManager: Failed to setup storage listener:', error);
        this.extensionContextValid = false;
      }
    }
    
    // NEW: Check if popup is off-screen and reset if needed
    async checkAndResetIfOffScreen() {
      if (!this.authPopupUI || !this.authPopupUI.authPopupInjected) return false;
      
      try {
        const isOffScreen = this.authPopupUI.isPopupOffScreen();
        
        if (isOffScreen) {
          console.log('FCTR: Popup detected off-screen, auto-resetting position');
          await this.authPopupUI.resetPopupPosition();
          
          // Ensure popup is visible after reset
          if (this.authPopupUI.authPopupContainer) {
            this.authPopupUI.authPopupContainer.style.display = 'block';
          }
          
          this.updateAuthState();
          return true; // Popup was off-screen and has been reset
        }
        
        return false; // Popup was not off-screen
        
      } catch (error) {
        console.error('FCTR: Error checking popup position:', error);
        return false;
      }
    }
    
    async injectAuthPopup() {
      try {
        // Initialize UI module if not already done
        if (!this.authPopupUI) {
          this.authPopupUI = new window.FCTR.modules.AuthPopupUI(this);
        }
        
        // Load saved position before injection
        await this.authPopupUI.loadSavedPosition();
        
        // FIXED: Ensure search provider is loaded before creating AuthPopupInteractions
        if (!this.searchProviderLoaded) {
          console.log('FCTR: 🔄 Waiting for search provider to load...');
          await this.loadSearchProvider();
        }
        
        // Inject the popup
        const popupElement = await this.authPopupUI.injectAuthPopup();
        
        // Initialize interactions module if not already done
        if (!this.authPopupInteractions) {
          this.authPopupInteractions = new window.FCTR.modules.AuthPopupInteractions(this, this.authPopupUI);
          
          // FIXED: Ensure the loaded search provider is set in AuthPopupInteractions
          this.authPopupInteractions.currentSearchProvider = this.currentSearchProvider;
          console.log('FCTR: ✅ Set search provider in AuthPopupInteractions:', this.currentSearchProvider);
        }
        
        // Setup event listeners (including drag functionality)
        this.authPopupInteractions.setupEventListeners(popupElement);
        
        // Check auth status immediately
        setTimeout(() => {
          this.updateAuthState();
        }, 100);
        
        // FIXED: Reduced polling frequency to prevent interference
        if (!this.authUpdateInterval) {
          this.authUpdateInterval = setInterval(() => {
            this.updateAuthState();
          }, 30000); // Increased to 30 seconds to reduce interference
        }
        
        console.log('Auth popup injection and setup completed with drag support and search provider sync');
        
      } catch (error) {
        console.error('Failed to inject auth popup:', error);
        throw error;
      }
    }
    
    async updateAuthState() {
      if (!this.authPopupUI) return;
  
      console.log('AuthManager: Updating auth state...');
  
      try {
        // ENHANCED: Read directly from Chrome storage instead of background script
        if (this.extensionContextValid && typeof chrome !== 'undefined' && chrome.storage) {
          const authData = await chrome.storage.local.get(['totm-auth', 'totm-auth-timestamp']);
      
          if (authData['totm-auth'] && authData['totm-auth'].user) {
            // Check if auth is still valid (24 hours)
            const authTime = authData['totm-auth-timestamp'] || 0;
            const isExpired = Date.now() - authTime > 24 * 60 * 60 * 1000;
        
            if (!isExpired) {
              console.log('AuthManager: Found valid auth in storage:', authData['totm-auth'].user.email);
              const authStatus = {
                authenticated: true,
                user: authData['totm-auth'].user,
                apiKey: authData['totm-auth'].apiKey
              };
              this.authPopupUI.updateAuthState(authStatus);
              return;
            } else {
              console.log('AuthManager: Auth expired, clearing...');
              await chrome.storage.local.remove(['totm-auth', 'totm-auth-timestamp']);
            }
          }
        }
    
        // Fallback to background script if storage is empty
        console.log('AuthManager: No storage auth, checking with background script...');
        if (this.extensionContextValid) {
          try {
            const response = await chrome.runtime.sendMessage({ action: 'get-auth-status' });
        
            if (response && response.success && response.status && response.status.authenticated) {
              console.log('AuthManager: Background script reports authenticated');
              this.authPopupUI.updateAuthState(response.status);
            } else {
              console.log('AuthManager: Background script reports not authenticated');
              this.authPopupUI.setDisconnectedState();
            }
          } catch (error) {
            console.warn('AuthManager: Background script check failed:', error);
            this.authPopupUI.setDisconnectedState();
          }
        } else {
          this.authPopupUI.setDisconnectedState();
        }
      } catch (error) {
        console.error('AuthManager: Failed to update auth state:', error);
        this.authPopupUI.setDisconnectedState();
      }
    }
    
    cleanup() {
      if (this.authPopupUI) {
        this.authPopupUI.cleanup();
        this.authPopupUI = null;
      }
      
      if (this.authUpdateInterval) {
        clearInterval(this.authUpdateInterval);
        this.authUpdateInterval = null;
      }
      
      this.authPopupInteractions = null;
    }
  }
  
  // Register module
  if (!window.FCTR) window.FCTR = { modules: {} };
  window.FCTR.modules.AuthManager = AuthManager;
  
})();