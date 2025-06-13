// content-script.js - FCTR functionality (PHASE 1: DIAGNOSTIC VERSION)
(function() {
  'use strict';
  
  // Prevent multiple loading
  if (window.FCTR_LOADED) {
    console.log('🔍 FCTR: Content script already loaded, skipping...');
    return;
  }
  
  console.log('🔍 FCTR: Starting content script initialization...');
  
  // Initialize namespace if not exists
  if (!window.FCTR) {
    window.FCTR = { modules: {} };
    console.log('🔍 FCTR: Created window.FCTR namespace');
  } else {
    console.log('🔍 FCTR: window.FCTR already exists:', window.FCTR);
  }
 
  // Add debouncing to prevent multiple rapid calls
  let searchPopupDebounce = null;
 
  // Function to count words in text
  function countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    
    // Split by whitespace and filter out empty strings
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }
  
  // Wait for modules to load and check status
  function waitAndCheck(attempt = 1, maxAttempts = 5) {
    const loadedModules = Object.keys(window.FCTR.modules);
    console.log(`🔍 FCTR: waitAndCheck attempt ${attempt}/${maxAttempts}, modules found:`, loadedModules);
    
    if (loadedModules.length > 0) {
      console.log('🔍 FCTR: Modules detected, calling initializeWithAvailableModules...');
      initializeWithAvailableModules();
    } else if (attempt < maxAttempts) {
      console.log(`🔍 FCTR: No modules yet, waiting 1s before attempt ${attempt + 1}`);
      setTimeout(() => waitAndCheck(attempt + 1, maxAttempts), 1000);
    } else {
      console.error('🔍 FCTR: ❌ No modules loaded after all attempts');
      console.log('🔍 FCTR: Final window.FCTR state:', window.FCTR);
    }
  }
  
  function initializeWithAvailableModules() {
    console.log('🔍 FCTR: 🚀 initializeWithAvailableModules() STARTED');
    const modules = window.FCTR.modules;
    console.log('🔍 FCTR: Available modules:', Object.keys(modules));
    
    // Initialize AuthManager if available
    if (modules.AuthManager) {
      console.log('🔍 FCTR: AuthManager module found, creating instance...');
      try {
        window.FCTR.authManager = new modules.AuthManager();
        console.log('🔍 FCTR: ✅ AuthManager instance created as window.FCTR.authManager');
        console.log('🔍 FCTR: AuthManager methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.FCTR.authManager)));
      } catch (error) {
        console.error('🔍 FCTR: ❌ AuthManager init failed:', error);
      }
    } else {
      console.log('🔍 FCTR: ❌ AuthManager module NOT found in modules object');
    }
    
    // Initialize ResultsDisplay if available
    if (modules.ResultsDisplay) {
      console.log('🔍 FCTR: ResultsDisplay module found, creating instance...');
      try {
        window.FCTR.results = new modules.ResultsDisplay();
        console.log('🔍 FCTR: ✅ ResultsDisplay instance created');
      } catch (error) {
        console.error('🔍 FCTR: ❌ ResultsDisplay init failed:', error);
      }
    } else {
      console.log('🔍 FCTR: ResultsDisplay module not found (this might be OK)');
    }
    
    window.FCTR.initialized = true;
    console.log('🔍 FCTR: ✅ Initialization complete, final FCTR state:', {
      initialized: window.FCTR.initialized,
      hasAuth: !!window.FCTR.auth,
      hasAuthManager: !!window.FCTR.authManager,
      hasResults: !!window.FCTR.results,
      modules: Object.keys(window.FCTR.modules)
    });
  }
// Force ResultsDisplay initialization if missing
if (!window.FCTR.results && window.FCTR.modules.ResultsDisplay) {
  console.log('🔍 FCTR: Force-creating ResultsDisplay instance...');
  try {
    window.FCTR.results = new window.FCTR.modules.ResultsDisplay();
    console.log('🔍 FCTR: ✅ ResultsDisplay force-created successfully');
  } catch (error) {
    console.error('🔍 FCTR: ❌ ResultsDisplay force-creation failed:', error);
  }
} 
// Message handler for extension communication
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log('🔍 FCTR: 📨 Message received:', request.action);
  console.log('🔍 FCTR: Current FCTR state when message arrived:', {
    loaded: !!window.FCTR,
    initialized: !!window.FCTR.initialized,
    modules: Object.keys(window.FCTR?.modules || {}),
    hasAuth: !!window.FCTR.auth,
    hasAuthManager: !!window.FCTR.authManager,
    hasResults: !!window.FCTR.results
  });
  
  switch (request.action) {
    case 'ping':
      const status = {
        loaded: !!window.FCTR,
        initialized: !!window.FCTR.initialized,
        modules: Object.keys(window.FCTR?.modules || {}),
        hasAuthManager: !!window.FCTR.authManager,
        hasResults: !!window.FCTR.results
      };
      console.log('🔍 FCTR: Ping response:', status);
      sendResponse(status);
      break;
      
  case 'toggle-auth-popup':
    console.log('🔍 FCTR: 🎯 TOGGLE-AUTH-POPUP handler started');
    
    // DIAGNOSTIC: Check what we have before doing anything
    console.log('🔍 FCTR: Pre-check state:', {
      'window.FCTR.auth': !!window.FCTR.auth,
      'window.FCTR.authManager': !!window.FCTR.authManager,
      'window.FCTR.modules.AuthManager': !!window.FCTR.modules.AuthManager,
      'auth has injectMethod': !!(window.FCTR.auth && window.FCTR.auth.injectAuthPopup),
      'auth has positionMethod': !!(window.FCTR.auth && window.FCTR.auth.checkAndResetIfOffScreen),
      'authManager has injectMethod': !!(window.FCTR.authManager && window.FCTR.authManager.injectAuthPopup),
      'authManager has positionMethod': !!(window.FCTR.authManager && window.FCTR.authManager.checkAndResetIfOffScreen)
    });
    
    // EXISTING LOGIC (now with fallback check)
    if (!window.FCTR.authManager && window.FCTR.modules.AuthManager) {
      console.log('🔍 FCTR: No authManager found, creating AuthManager instance...');
      window.FCTR.authManager = new window.FCTR.modules.AuthManager();
      console.log('🔍 FCTR: ✅ New AuthManager instance created as window.FCTR.authManager');
    }
    
    // FALLBACK: Check if we have .auth instead of .authManager
    if (!window.FCTR.authManager && window.FCTR.auth) {
      console.log('🔍 FCTR: Using existing window.FCTR.auth as authManager');
      window.FCTR.authManager = window.FCTR.auth;
    }
  
    // DIAGNOSTIC: Check what we have after creation attempt
    console.log('🔍 FCTR: Post-creation state:', {
      'window.FCTR.authManager exists': !!window.FCTR.authManager,
      'injectAuthPopup method exists': !!(window.FCTR.authManager && window.FCTR.authManager.injectAuthPopup),
      'checkAndResetIfOffScreen method exists': !!(window.FCTR.authManager && window.FCTR.authManager.checkAndResetIfOffScreen),
      'authManager methods': window.FCTR.authManager ? Object.getOwnPropertyNames(Object.getPrototypeOf(window.FCTR.authManager)) : 'N/A'
    });
  
    if (window.FCTR.authManager && window.FCTR.authManager.checkAndResetIfOffScreen && window.FCTR.authManager.injectAuthPopup) {
      console.log('🔍 FCTR: ✅ Checking popup position first...');
  
      try {
        await window.FCTR.authManager.checkAndResetIfOffScreen();
        console.log('🔍 FCTR: ✅ Position check complete, injecting popup...');
    
        await window.FCTR.authManager.injectAuthPopup();
        console.log('🔍 FCTR: ✅ Popup injection complete!');
    
        sendResponse({ success: true });
      } catch (error) {
        console.error('🔍 FCTR: Error in popup positioning/injection:', error);
        sendResponse({ success: false, error: error.message });
      }
    } else {
      console.error('🔍 FCTR: ❌ AuthManager or required methods not available');
      console.log('🔍 FCTR: Final diagnostic info:', {
        'window.FCTR': window.FCTR,
        'typeof window.FCTR.authManager': typeof window.FCTR.authManager,
        'authManager': window.FCTR.authManager,
        'modules': Object.keys(window.FCTR.modules || {}),
        'required methods missing': {
          'injectAuthPopup': !(window.FCTR.authManager && window.FCTR.authManager.injectAuthPopup),
          'checkAndResetIfOffScreen': !(window.FCTR.authManager && window.FCTR.authManager.checkAndResetIfOffScreen)
        }
      });
      sendResponse({ success: false, error: 'AuthManager or required methods not available' });
    }
    break;
      
    case 'show-search-popup':
      console.log('🔍 FCTR: show-search-popup handler');
      // ENHANCED: Ensure we have a working auth manager instance
      if (!window.FCTR.authManager && window.FCTR.modules.AuthManager) {
        console.log('🔍 FCTR: Creating AuthManager instance for search...');
        window.FCTR.authManager = new window.FCTR.modules.AuthManager();
      }
      
      // FALLBACK: Use .auth if .authManager not available
      if (!window.FCTR.authManager && window.FCTR.auth) {
        window.FCTR.authManager = window.FCTR.auth;
      }
      
      if (window.FCTR.authManager && window.FCTR.authManager.autoShowForSearch) {
        if (request.query && request.provider) {
          window.FCTR.authManager.autoShowForSearch(request.query, request.provider);
        } else {
          // Use the enhanced positioning logic here too
          if (window.FCTR.authManager.checkAndResetIfOffScreen && window.FCTR.authManager.injectAuthPopup) {
            try {
              await window.FCTR.authManager.checkAndResetIfOffScreen();
              await window.FCTR.authManager.injectAuthPopup();
            } catch (error) {
              console.error('🔍 FCTR: Error in search popup positioning:', error);
            }
          }
        }
        sendResponse({ success: true });
      } else {
        console.error('🔍 FCTR: AuthManager not available for search popup');
        sendResponse({ success: false, error: 'AuthManager not available' });
      }
      break;
      
    case 'getSelection':
      const selectedText = window.getSelection().toString().trim();
      if (selectedText) {
        const wordCount = selectedText.split(/\s+/).length;
        if (wordCount > 800) {
          if (window.FCTR.modules.Utils) {
            window.FCTR.modules.Utils.showPopup(`Text exceeds 800 word limit (${wordCount} words). Please reduce the word count and resubmit.`, 'warning');
          }
          sendResponse({ success: false, error: 'Word limit exceeded' });
          return;
        }
        
        const actionMap = {
          "factCheck": "factCheck",
          "sourceCheck": "sourceCheck", 
          "aiOrigin": "aiOrigin"
        };

        chrome.runtime.sendMessage({
          action: actionMap[request.type] || "factCheck",
          text: selectedText,
          url: window.location.href
        });
      } else {
        if (window.FCTR.modules.Utils) {
          window.FCTR.modules.Utils.showPopup('Please select some text first', 'warning');
        }
      }
      sendResponse({ success: true });
      break;
      
    case 'showResult':
      if (window.FCTR.results) {
        window.FCTR.results.showResult(request.result, request.originalClaim);
        sendResponse({ success: true });
      } else {
        console.error('🔍 FCTR: Results module not available');
        sendResponse({ success: false, error: 'Results module not loaded' });
      }
      break;
      
    // ADD this case in the switch statement (after 'showResult')
    case 'showAiOriginResult':
      if (window.FCTR.results) {
        window.FCTR.results.showAiOriginResult(request.result, request.originalClaim);
        sendResponse({ success: true });
      } else {
        console.error('🔍 FCTR: Results module not available');
        sendResponse({ success: false, error: 'Results module not loaded' });
      }
  break;  
    case 'showError':
      console.error('🔍 FCTR Extension error:', request.error);
      if (window.FCTR.modules.Utils) {
        window.FCTR.modules.Utils.showPopup(request.error, 'error');
      }
      sendResponse({ success: true });
      break;
      
    default:
      console.log('🔍 FCTR: Unknown action:', request.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  return true;
});
  
  // Start checking for modules
  console.log('🔍 FCTR: Setting up module check in 500ms...');
  setTimeout(() => {
    console.log('🔍 FCTR: Starting waitAndCheck...');
    waitAndCheck();
  }, 500);
  
  window.FCTR_LOADED = true;
  console.log('🔍 FCTR: ✅ Content script setup complete, FCTR_LOADED = true');
  
})();