// background.js - FCTR background script (FIXED DUPLICATE CASE)

/* 
 * ============================================================================
 * AI CODING ASSISTANT NOTE:
 * When working on this codebase, ALWAYS use the safeRuntimeMessage() helper
 * function instead of direct chrome.runtime.sendMessage() calls to prevent 
 * "Receiving end does not exist" errors. This helper handles connection 
 * failures gracefully and avoids unhandled promise rejections.
 * 
 * USAGE: Replace chrome.runtime.sendMessage(msg) with safeRuntimeMessage(msg)
 * For expected responses: safeRuntimeMessage(msg, true)
 * ============================================================================
 */
 
// Keep track of auth popup state
let authPopupVisible = false;

// Track search tabs for debugging
let searchTabs = new Map(); // tabId -> {query, provider, timestamp}

// ============================================================================
// SAFE CHROME RUNTIME MESSAGE HELPER
// ============================================================================

/**
 * Safe wrapper for chrome.runtime.sendMessage that handles connection errors
 * @param {Object} message - The message to send
 * @param {boolean} expectResponse - Whether to expect a response
 * @returns {Promise} - Promise that resolves with response or void
 */
function safeRuntimeMessage(message, expectResponse = false) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        const error = chrome.runtime.lastError.message;
        if (!error.includes('Receiving end does not exist')) {
          console.warn('Chrome runtime message error:', error);
        }
        resolve(expectResponse ? { success: false, error } : undefined);
      } else {
        resolve(response);
      }
    });
  });
}

// ============================================================================
// SERVICE WORKER SETUP
// ============================================================================

// Service worker installation and context menu setup
chrome.runtime.onInstalled.addListener((details) => {
  console.log('FCTR: Extension installed/updated');
  
  // Add context menus for fact checking
  chrome.contextMenus.create({
    id: "factCheck",
    title: "fact check with fctr",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "sourceCheck",
    title: "source trace with fctr",
    contexts: ["selection"]
  });
  // ADD THIS as the third context menu item (after sourceCheck)
  chrome.contextMenus.create({
    id: "aiOrigin",
    title: "ai origin with fctr",
    contexts: ["selection"]
  });
  if (details.reason === "install") {
    chrome.tabs.create({ url: "https://totmailabs.com/welcome" });
  }
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    await ensureContentScriptLoaded(tab.id);
    let type;
    switch(info.menuItemId) {
      case "factCheck": type = "factCheck"; break;
      case "sourceCheck": type = "sourceCheck"; break;
      case "aiOrigin": type = "aiOrigin"; break;
      default: type = "factCheck";
    }
    chrome.tabs.sendMessage(tab.id, { action: "getSelection", type, url: tab.url });
  } catch (error) {
    console.error('FCTR: Failed to handle context menu click:', error);
  }
});

// Keyboard shortcut handler
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === "fact-check") {
    try {
      await ensureContentScriptLoaded(tab.id);
      chrome.tabs.sendMessage(tab.id, { action: "getSelection", type: "factCheck", url: tab.url });
    } catch (error) {
      console.error('FCTR: Failed to handle keyboard shortcut:', error);
    }
  }
});

// ============================================================================
// CREDIT MANAGEMENT HELPER FUNCTIONS (PHASE 2)
// ============================================================================

async function updateStoredCredits(creditInfo) {
  try {
    await chrome.storage.local.set({
      'user-credits': creditInfo.credits_remaining,
      'credit-warning-level': creditInfo.warning_level
    });
    
    console.log('FCTR: Credit storage updated:', creditInfo.credits_remaining);
    // Note: Auth object will be updated automatically by storage listener
  } catch (error) {
    console.error('FCTR: Error updating credit storage:', error);
  }
}

// FIXED: Use callback-based approach to avoid promise rejection
function updatePopupCredits(creditInfo) {
  safeRuntimeMessage({
    action: 'credit-update',
    credits: creditInfo
  });
}

function showCreditWarning(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'FCTR Credits',
    message: message
  });
}

// ============================================================================
// CONTENT SCRIPT INJECTION
// ============================================================================

// Helper function to ensure content script is loaded with new module order
async function ensureContentScriptLoaded(tabId) {
  try {
    console.log(`FCTR: Checking if content script is loaded in tab ${tabId}`);
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    console.log(`FCTR: Content script already loaded in tab ${tabId}`);
    return true;
  } catch (error) {
    console.log(`FCTR: Content script not loaded in tab ${tabId}, injecting...`);
    const tab = await chrome.tabs.get(tabId);
    
    if (tab.url.startsWith('chrome://') || 
        tab.url.startsWith('chrome-extension://') || 
        tab.url.startsWith('edge://') || 
        tab.url.startsWith('moz-extension://')) {
      throw new Error('Cannot inject into restricted page: ' + tab.url);
    }
    
    try {
      console.log(`FCTR: Injecting content scripts into tab ${tabId} (${tab.url})`);
      
      // UPDATED: New file order with split auth modules
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: [
          'modules/modal-styles.js',
          'modules/native-utils.js', 
          'modules/utils.js',
          'modules/auth-popup-ui.js',           // NEW: UI module first
          'modules/auth-popup-interactions.js', // NEW: Interactions module second  
          'modules/auth-manager.js',            // UPDATED: Core manager last
          'modules/results-display.js',
          'modules/results-parsing.js',
          'content-script.js'
        ]
      });
      
      console.log(`FCTR: Scripts injected, waiting for initialization...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await chrome.tabs.sendMessage(tabId, { action: 'ping' });
      console.log(`FCTR: Content script successfully loaded in tab ${tabId}`);
      
      return true;
      
    } catch (injectError) {
      console.error(`FCTR: Failed to inject content script into tab ${tabId}:`, injectError);
      throw injectError;
    }
  }
}

// ============================================================================
// PHASE 3A: BACKGROUND CONFIG MANAGEMENT
// ============================================================================

// Config cache constants
const CONFIG_CACHE_TTL_HOURS = 4;
const CONFIG_CACHE_KEY = 'fctr-config-cache';
const CONFIG_API_ENDPOINT = 'https://api.totmailabs.com:5001/api/v1/config/default-credits';

// PHASE 3A: NEW - Background config fetch with caching
async function fetchConfigInBackground() {
  try {
    console.log('FCTR Background: Fetching config...');
    
    // Check cache first
    const cached = await chrome.storage.local.get([CONFIG_CACHE_KEY]);
    const cachedConfig = cached[CONFIG_CACHE_KEY];
    
    if (cachedConfig && cachedConfig.timestamp) {
      const cacheAge = Date.now() - cachedConfig.timestamp;
      const maxAge = CONFIG_CACHE_TTL_HOURS * 60 * 60 * 1000;
      
      if (cacheAge < maxAge) {
        console.log('FCTR Background: Using cached config');
        return { success: true, config: cachedConfig.config };
      }
    }
    
    // Fetch fresh config
    const response = await fetch(CONFIG_API_ENDPOINT);
    if (!response.ok) {
      throw new Error(`Config API failed: ${response.status}`);
    }
    
    const config = await response.json();
    
    // Cache the result
    await chrome.storage.local.set({
      [CONFIG_CACHE_KEY]: {
        config: config,
        timestamp: Date.now()
      }
    });
    
    console.log('FCTR Background: Fresh config fetched and cached');
    return { success: true, config: config };
    
  } catch (error) {
    console.warn('FCTR Background: Config fetch failed:', error);
    // PHASE 3 PART 2: Return failure without hardcoded fallback
    return { 
      success: false, 
      error: error.message
      // Removed fallback object with hardcoded values
    };
  }
}
// PHASE 3A: Helper function to get just the default credits
async function fetchDefaultCreditsConfig() {
  try {
    const configResult = await fetchConfigInBackground();
    if (configResult.success) {
      return configResult.config.default_credits;
    } else {
      console.error('FCTR: Config fetch failed, no fallback available');
      return null; // Signal failure instead of defaulting to 25
    }
  } catch (error) {
    console.error('FCTR: Error fetching default credits:', error);
    return null; // Signal error instead of defaulting to 25
  }
}
// FIXED: Authentication check that supports both OAuth and API key
function validateAuthData(authData) {
  // OAuth users: need JWT token
  if (authData.jwtToken) {
    console.log('FCTR: Using OAuth Bearer token authentication');
    return true;
  }
  
  // Manual users: need API key
  if (authData.apiKey) {
    console.log('FCTR: Using API key authentication');
    return true;
  }
  
  // No valid authentication method
  console.log('FCTR: No valid authentication found');
  return false;
}
// ============================================================================
// MESSAGE HANDLING - AUTHENTICATION MESSAGE HANDLERS
// Used by BOTH hover popup and standalone popup - keep in sync!
// ============================================================================

// Main message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    switch (request.action) {
      case 'create-search-tab':
        try {
          chrome.tabs.create({ url: request.url, active: true }, (tab) => {
            if (chrome.runtime.lastError) {
              console.error('FCTR: Failed to create tab:', chrome.runtime.lastError.message);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              console.log(`FCTR: Created search tab ${tab.id} for query: ${request.query}`);
              handleShowSearchPopup(tab.id, request.query, request.provider)
                .then(() => sendResponse({ success: true, tabId: tab.id }))
                .catch(error => {
                  console.error('FCTR: Failed to show search popup:', error);
                  sendResponse({ success: false, error: error.message, tabId: tab.id });
                });
            }
          });
        } catch (error) {
          console.error('FCTR: Failed to create search tab:', error);
          sendResponse({ success: false, error: error.message });
        }
        return true; // Keep message channel open for async response
        
      case 'auth-callback':
        handleAuthCallback(request.code, request.state)
          .then(result => sendResponse({ success: true, result }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
        
      case 'get-auth-status':
        checkAuthStatus()
          .then(status => sendResponse({ success: true, status }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
        
      case 'logout':
        handleLogout()
          .then(() => sendResponse({ success: true }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
        
      case 'initiate-login':
        handleInitiateLogin()
          .then(result => sendResponse({ success: true, result }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true;

      case 'show-search-popup':
        console.log(`FCTR: Received show-search-popup message:`, request);
        
        if (request.tabId) {
          handleShowSearchPopup(request.tabId, request.query, request.provider)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        } else {
          console.error('FCTR: No tabId provided in show-search-popup message');
          sendResponse({ success: false, error: 'No tabId provided' });
        }
        return true;

      case "factCheck":
        postFactCheck(request.text, sender.tab.id, sender.tab.url)
          .then(() => sendResponse({ success: true }))
          .catch(error => {
            console.error('FCTR: Fact check failed:', error);
            sendResponse({ success: false, error: error.message });
          });
        return true;
        
      case "sourceCheck":
        postSourceCheck(request.text, sender.tab.id, sender.tab.url)
          .then(() => sendResponse({ success: true }))
          .catch(error => {
            console.error('FCTR: Source check failed:', error);
            sendResponse({ success: false, error: error.message });
          });
        return true;
      
      // ADD this case in the switch statement
      case "aiOrigin":
        postAiOrigin(request.text, sender.tab.id, sender.tab.url)
          .then(() => sendResponse({ success: true }))
          .catch(error => {
            console.error('FCTR: AI Origin detection failed:', error);
            sendResponse({ success: false, error: error.message });
          });
        return true;  
      
      case "validateApiKey":
        validateApiKeyHandler(request.apiKey, sendResponse);
        return true;
       
      // PHASE 3A: NEW - Handle config fetch requests
      case 'fetch-config':
        fetchConfigInBackground().then(result => {
          if (result.success) {
            sendResponse({ 
              success: true, 
              config: result.config 
            });
          } else {
            // PHASE 3 PART 2: Return failure without hardcoded fallback
            sendResponse({ 
              success: false, 
              error: result.error
              // Removed fallback property with hardcoded values
            });
          }
        });
        return true; // Keep message channel open for async response
       
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('FCTR: Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  return true;
});

// ============================================================================
// BROWSER ACTION HANDLING
// ============================================================================

// Handle browser action click (extension icon)
chrome.action.onClicked.addListener(async (tab) => {
  console.log(`FCTR: Extension icon clicked on tab ${tab.id} (${tab.url})`);
  
  if (tab.url.startsWith('chrome://') || 
      tab.url.startsWith('chrome-extension://') || 
      tab.url.startsWith('edge://') || 
      tab.url.startsWith('moz-extension://')) {
    console.log('FCTR: Opening standalone popup for restricted page');
    chrome.tabs.create({
      url: chrome.runtime.getURL('auth/auth-popup.html'),
      active: true
    });
    return;
  }
  
  try {
    await ensureContentScriptLoaded(tab.id);
    const response = await chrome.tabs.sendMessage(tab.id, { 
      action: 'toggle-auth-popup' 
    });
    console.log('FCTR: Toggle popup response:', response);
    
  } catch (error) {
    console.error('FCTR: Failed to handle icon click:', error);
    console.log('FCTR: Opening standalone popup as fallback');
    chrome.tabs.create({
      url: chrome.runtime.getURL('auth/auth-popup.html'),
      active: true
    });
  }
});

// FIXED: Single implementation of handleInitiateLogin
async function handleInitiateLogin() {
  try {
    console.log('FCTR: Opening standalone auth popup...');
    const tab = await chrome.tabs.create({
      url: chrome.runtime.getURL('auth/auth-popup.html'),
      active: true
    });
    return { message: 'Login initiated successfully', tabId: tab.id };
  } catch (error) {
    console.error('FCTR: Failed to initiate login:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Enhanced message sending with retry logic
async function sendMessageToTab(tabId, message, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await ensureContentScriptLoaded(tabId);
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`FCTR: Message failed, retrying... (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Enhanced search popup handler
async function handleShowSearchPopup(tabId, query, provider) {
  console.log(`FCTR: ========== STARTING SEARCH POPUP FLOW ==========`);
  console.log(`FCTR: Target tab: ${tabId}`);
  console.log(`FCTR: Search query: "${query}"`);
  console.log(`FCTR: Search provider: ${provider}`);
  
  try {
    // Track this search tab
    searchTabs.set(tabId, {
      query: query,
      provider: provider,
      timestamp: Date.now(),
      status: 'processing'
    });
    
    // Wait for tab to be ready
    console.log(`FCTR: Waiting for tab ${tabId} to be ready...`);
    let attempts = 0;
    const maxAttempts = 8;
    
    while (attempts < maxAttempts) {
      try {
        const tab = await chrome.tabs.get(tabId);
        console.log(`FCTR: Tab ${tabId} attempt ${attempts + 1}/${maxAttempts} - Status: ${tab.status}, URL: ${tab.url}`);
        
        if (tab.url && !tab.url.startsWith('chrome://') && 
            (tab.status === 'complete' || tab.url.includes('google.com') || tab.url.includes('duckduckgo.com'))) {
          console.log(`FCTR: Tab ${tabId} is ready! Proceeding with content script injection...`);
          break;
        }
        
        console.log(`FCTR: Tab ${tabId} not ready yet, waiting 1.5s...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        attempts++;
        
      } catch (error) {
        console.error(`FCTR: Tab ${tabId} may have been closed:`, error);
        searchTabs.delete(tabId);
        return;
      }
    }
    
    if (attempts >= maxAttempts) {
      console.warn(`FCTR: Tab ${tabId} proceeding after timeout...`);
    }
    
    // Update search tab status
    if (searchTabs.has(tabId)) {
      searchTabs.get(tabId).status = 'injecting_script';
    }
    
    // Add delay for page settlement, then inject
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Ensure content script is loaded
    console.log(`FCTR: Ensuring content script is loaded in tab ${tabId}...`);
    await ensureContentScriptLoaded(tabId);
    
    // Update search tab status
    if (searchTabs.has(tabId)) {
      searchTabs.get(tabId).status = 'sending_message';
    }
    
    // Additional delay before showing popup to ensure scripts are ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Send message to show the popup with search context
    console.log(`FCTR: Sending show-search-popup message to tab ${tabId}...`);
    const response = await chrome.tabs.sendMessage(tabId, { 
      action: 'show-search-popup',
      query: query,
      provider: provider
    });
    
    console.log(`FCTR: Response from tab ${tabId}:`, response);
    
    if (response && response.success) {
      console.log(`FCTR: ✅ Search popup shown successfully in tab ${tabId}`);
      if (searchTabs.has(tabId)) {
        searchTabs.get(tabId).status = 'success';
      }
    } else {
      console.warn(`FCTR: ⚠️ Search popup response not successful:`, response);
      if (searchTabs.has(tabId)) {
        searchTabs.get(tabId).status = 'failed';
      }
    }
    
  } catch (error) {
    console.error(`FCTR: ❌ Failed to show search popup in tab ${tabId}:`, error);
    
    if (searchTabs.has(tabId)) {
      searchTabs.get(tabId).status = 'error';
      searchTabs.get(tabId).error = error.message;
    }
    
    // Try fallback approach: just inject and show popup without search context
    try {
      console.log(`FCTR: Trying fallback approach for tab ${tabId}...`);
      await ensureContentScriptLoaded(tabId);
      await chrome.tabs.sendMessage(tabId, { action: 'toggle-auth-popup' });
      console.log(`FCTR: Fallback popup shown in tab ${tabId}`);
    } catch (fallbackError) {
      console.error(`FCTR: Fallback also failed for tab ${tabId}:`, fallbackError);
    }
  }
  
  console.log(`FCTR: ========== SEARCH POPUP FLOW COMPLETE ==========`);
}

// ============================================================================
// TAB MONITORING
// ============================================================================

chrome.tabs.onCreated.addListener((tab) => {
  console.log(`FCTR: New tab created: ${tab.id} (${tab.url || 'about:blank'})`);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only log meaningful updates
  if (changeInfo.status || changeInfo.url) {
    console.log(`FCTR: Tab ${tabId} updated:`, {
      status: changeInfo.status,
      url: changeInfo.url || tab.url,
      title: tab.title?.substring(0, 30) + '...'
    });
  }
  
  // Check if this is a tracked search tab
  if (searchTabs.has(tabId)) {
    const searchInfo = searchTabs.get(tabId);
    console.log(`FCTR: Tracked search tab ${tabId} updated. Status: ${searchInfo.status}, Query: "${searchInfo.query}"`);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (searchTabs.has(tabId)) {
    console.log(`FCTR: Tracked search tab ${tabId} closed`);
    searchTabs.delete(tabId);
  }
});

// ============================================================================
// API CALLS (FACT CHECKING & SOURCE CHECKING)
// ============================================================================

async function getAuthTokens() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const authData = await chrome.storage.local.get(['totm-auth', 'totm-access-token']);
      
      // OAuth user with JWT token
      if (authData['totm-auth'] && (authData['totm-access-token'] || authData['totm-auth'].accessToken)) {
        return {
          apiKey: authData['totm-auth'].apiKey || null, // May be null for OAuth users
          jwtToken: authData['totm-access-token'] || authData['totm-auth'].accessToken,
          authMethod: 'oauth'
        };
      }
      
      // User with stored API key but no JWT
      if (authData['totm-auth'] && authData['totm-auth'].apiKey) {
        return {
          apiKey: authData['totm-auth'].apiKey,
          jwtToken: null,
          authMethod: 'apikey'
        };
      }
    }
    
    // Fallback to sync storage for manual API key
    return new Promise((resolve) => {
      chrome.storage.sync.get("apiKey", (d) => {
        resolve({
          apiKey: d.apiKey || null,
          jwtToken: null,
          authMethod: 'manual'
        });
      });
    });
  } catch (error) {
    console.error('FCTR: Error getting auth tokens:', error);
    return { apiKey: null, jwtToken: null, authMethod: 'none' };
  }
}
// FIXED: Fact checking with proper auth validation
async function postFactCheck(text, tabId, textURL) {
  try {
    const authData = await getAuthTokens();
    
    if (!validateAuthData(authData)) {
      throw new Error("Authentication required. Please login with SSO or set an API key in extension options.");
    }
    
    const t = new Date().toISOString();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 300000);
    
    // Build headers - use JWT token if available, otherwise include API key in body
    const headers = { "Content-Type": "application/json" };
    if (authData.jwtToken) {
      headers.Authorization = `Bearer ${authData.jwtToken}`;
    }
    
    // Build request body
    const requestBody = {
      messages: [{ 
        role: "user", 
        content: `The current date and time is ${t}. Please fact check the following text: ${text} from URL: ${textURL}.` 
      }]
    };
    
    // Include API key in body only if no JWT token (for manual API key users)
    if (!authData.jwtToken && authData.apiKey) {
      requestBody.api_key = authData.apiKey;
    }
    
    const response = await fetch("https://api.totmailabs.com:5001/api/v1/fact_checking", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timer);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('FCTR: API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
        authMethod: authData.authMethod
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Handle successful response
    const responseData = await response.json();
    const content = responseData.choices[0].message.content;
    
    // Handle credit updates for OAuth users
    if (responseData.user_credits) {
      await updateStoredCredits(responseData.user_credits);
      updatePopupCredits(responseData.user_credits);
      
      // Handle credit warnings
      if (responseData.user_credits.warning_level === 'critical') {
        showCreditWarning(`Only ${responseData.user_credits.credits_remaining} credits remaining!`);
      } else if (responseData.user_credits.warning_level === 'low') {
        showCreditWarning(`Running low: ${responseData.user_credits.credits_remaining} credits left`);
      }
    }
    
    await sendMessageToTab(tabId, { action: "showResult", result: content, originalClaim: text });
    
  } catch (e) {
    console.error('FCTR: Fact check error:', e);
    try {
      await sendMessageToTab(tabId, { action: "showError", error: e.message });
    } catch (msgError) {
      console.error('FCTR: Failed to send error message to tab:', msgError);
    }
  }
}

// FIXED: Source checking with proper auth validation
async function postSourceCheck(text, tabId, textURL) {
  try {
    const authData = await getAuthTokens();
    
    if (!validateAuthData(authData)) {
      throw new Error("Authentication required. Please login with SSO or set an API key in extension options.");
    }
    
    const t = new Date().toISOString();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 300000);
    
    const headers = { "Content-Type": "application/json" };
    if (authData.jwtToken) {
      headers.Authorization = `Bearer ${authData.jwtToken}`;
    }
    
    const requestBody = {
      messages: [{ 
        role: "user", 
        content: `The current date and time is ${t}. Please source check the following text: ${text} from URL: ${textURL}.` 
      }]
    };
    
    if (!authData.jwtToken && authData.apiKey) {
      requestBody.api_key = authData.apiKey;
    }
    
    const response = await fetch("https://api.totmailabs.com:5001/api/v1/source_checking", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timer);
    if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);
    
    const responseData = await response.json();
    const content = responseData.choices[0].message.content;
    
    if (responseData.user_credits) {
      await updateStoredCredits(responseData.user_credits);
      updatePopupCredits(responseData.user_credits);
      
      if (responseData.user_credits.warning_level === 'critical') {
        showCreditWarning(`Only ${responseData.user_credits.credits_remaining} credits remaining!`);
      } else if (responseData.user_credits.warning_level === 'low') {
        showCreditWarning(`Running low: ${responseData.user_credits.credits_remaining} credits left`);
      }
    }
    
    await sendMessageToTab(tabId, { action: "showResult", result: content, originalClaim: text });
    
  } catch (e) {
    console.error('FCTR: Source check error:', e);
    try {
      await sendMessageToTab(tabId, { action: "showError", error: e.message });
    } catch (msgError) {
      console.error('FCTR: Failed to send error message to tab:', msgError);
    }
  }
}
// FIXED: AI Origin detection with proper auth validation
async function postAiOrigin(text, tabId, textURL) {
  try {
    const authData = await getAuthTokens();
    
    if (!validateAuthData(authData)) {
      throw new Error("Authentication required. Please login with SSO or set an API key in extension options.");
    }
    
    const t = new Date().toISOString();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 300000);
    
    const headers = { "Content-Type": "application/json" };
    if (authData.jwtToken) {
      headers.Authorization = `Bearer ${authData.jwtToken}`;
    }
    
    const requestBody = {
      messages: [{ 
        role: "user", 
        content: `The current date and time is ${t}. Please analyze the following text for AI vs human origin: ${text} from URL: ${textURL}.` 
      }]
    };
    
    if (!authData.jwtToken && authData.apiKey) {
      requestBody.api_key = authData.apiKey;
    }
    
    const response = await fetch("https://api.totmailabs.com:5001/api/v1/ai_detection", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timer);
    if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);
    
    const responseData = await response.json();
    const content = responseData.choices[0].message.content;
    
    if (responseData.user_credits) {
      await updateStoredCredits(responseData.user_credits);
      updatePopupCredits(responseData.user_credits);
    }
    
    await sendMessageToTab(tabId, { action: "showAiResult", result: content, originalClaim: text });
    
  } catch (e) {
    console.error('FCTR: AI Origin error:', e);
    try {
      await sendMessageToTab(tabId, { action: "showError", error: e.message });
    } catch (msgError) {
      console.error('FCTR: Failed to send error message to tab:', msgError);
    }
  }
}

// ============================================================================
// AUTHENTICATION HANDLERS (FIXED: Proper OAuth token exchange)
// ============================================================================

async function handleAuthCallback(code, state) {
  try {
    console.log('FCTR: Processing auth callback with code:', !!code);
    
    // Step 1: Get stored PKCE parameters
    const pkceData = await chrome.storage.local.get(['totm-pkce-verifier', 'totm-oauth-state']);
    
    if (!pkceData['totm-pkce-verifier'] || !pkceData['totm-oauth-state']) {
      throw new Error('Missing PKCE parameters. Please try logging in again.');
    }
    
    if (state !== pkceData['totm-oauth-state']) {
      throw new Error('Invalid state parameter. Possible CSRF attack.');
    }

    // 🔧 NEW: Clear stale credit storage before fresh login
    console.log('FCTR: Clearing stale storage before fresh login...');
    await chrome.storage.local.remove(['user-credits', 'credit-warning-level']);
    
    // Step 2: Exchange authorization code for access token with Keycloak
    console.log('FCTR: Exchanging authorization code for access token...');
    
    const tokenResponse = await fetch('https://usw2.auth.ac/auth/realms/totm/protocol/openid-connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: 'totm-browser-extension',
        code: code,
        redirect_uri: chrome.runtime.getURL('auth/callback.html'),
        code_verifier: pkceData['totm-pkce-verifier']
      })
    }); 
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('FCTR: Token exchange failed:', errorData);
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log('FCTR: Token exchange successful');
    
    // Step 3: Use the access token to call our API server
    console.log('FCTR: Calling API server with access token...');
    
    const apiResponse = await fetch('https://api.totmailabs.com:5001/auth/link-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`
      },
      body: JSON.stringify({
        // The token contains all the user info, so we don't need to send code/state
        token_type: 'access_token'
      })
    });
    
    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error('FCTR: API server call failed:', errorData);
      throw new Error(errorData.error || `API server error: ${apiResponse.status}`);
    }
    
    const result = await apiResponse.json();
    console.log('FCTR: Auth callback successful');
    
    // Step 4: Store auth data including both tokens
    // Store auth data
    // ✅ PHASE 2: Get credits from response or use default
    // Step 4: Get user info from Keycloak token
    console.log('FCTR: Getting user info from Keycloak...');

    const userInfoResponse = await fetch('https://usw2.auth.ac/auth/realms/totm/protocol/openid-connect/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!userInfoResponse.ok) {
      throw new Error(`Failed to get user info: ${userInfoResponse.status}`);
    }

    const userInfo = await userInfoResponse.json();

    // Step 6: Fetch user's actual credit balance
    console.log('FCTR: Fetching user credit balance...');
    let userCredits = await fetchDefaultCreditsConfig(); // Dynamic default from config
        if (userCredits === null) {
      console.warn('FCTR: Could not fetch default credits from config - will use server balance only');
      userCredits = 0; // Temporary placeholder, will be replaced by server call
    }
    
    try {
      const creditResponse = await fetch('https://api.totmailabs.com:5001/api/v1/user/budget', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (creditResponse.ok) {
        const creditData = await creditResponse.json();
        userCredits = creditData.user_credits?.credits_remaining || userCredits;
        console.log('FCTR: Real credit balance fetched or using config default:', userCredits);
      } else {
        console.warn('FCTR: Could not fetch credit balance from server');
        if (userCredits === 0) {
          // Both config and server failed - this is a real problem
          throw new Error('Cannot determine user credits - server communication failed');
        }
      }
      } catch (creditError) {
        console.error('FCTR: Credit fetch failed:', creditError);
        if (userCredits === 0) {
          // Both config and server failed
          throw new Error('Cannot determine user credits - server communication failed');
        }
      }

    const authData = {
      user: {
        id: userInfo.sub,
        name: userInfo.name || userInfo.preferred_username,
        email: userInfo.email,
        credits: userCredits
      },

      apiKey: result.apiKey || result.key,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token
    };

    await chrome.storage.local.set({
      'totm-auth': authData,
      'totm-auth-timestamp': Date.now(),
      'totm-access-token': tokenData.access_token,
      'totm-refresh-token': tokenData.refresh_token,
      // ✅ PHASE 2: Initialize credit storage from auth object
      'user-credits': userCredits
    });

    // Clean up PKCE parameters
    await chrome.storage.local.remove(['totm-pkce-verifier', 'totm-oauth-state']);

    return authData;

      } catch (error) {
        console.error('FCTR: Auth callback error:', error);
    
        // Clean up any stored PKCE parameters on error
        await chrome.storage.local.remove(['totm-pkce-verifier', 'totm-oauth-state']);
    
        throw error;
      }
    }

// ============================================================================
// API KEY UTILITIES
// ============================================================================

async function getApiKey() {
  try {
    const authData = await chrome.storage.local.get(['totm-auth']);
    if (authData['totm-auth'] && authData['totm-auth'].apiKey) {
      return authData['totm-auth'].apiKey;
    }
    
    return new Promise((resolve) => 
      chrome.storage.sync.get("apiKey", (d) => resolve(d.apiKey))
    );
  } catch (error) {
    console.error('FCTR: Error getting API key:', error);
    return null;
  }
}

async function validateApiKeyHandler(apiKey, sendResponse) {
  try {
    const isValid = await validateApiKey(apiKey);
    sendResponse({ valid: isValid });
  } catch (e) {
    console.error("FCTR: Error during API-key validation:", e);
    sendResponse({ valid: false });
  }
}

async function validateApiKey(apiKey) {
  try {
    const r = await fetch("https://api.totmailabs.com:5001/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-3.5-turbo", messages: [{ role: "user", content: "Hello" }] })
    });
    await r.text();
    return r.status === 200;
  } catch {
    return false;
  }
}

// ============================================================================
// AUTHENTICATION STATUS FUNCTIONS  
// ============================================================================

async function checkAuthStatus() {
  try {
    const result = await chrome.storage.local.get(['totm-auth', 'totm-auth-timestamp']);
    
    if (result['totm-auth'] && result['totm-auth-timestamp']) {
      const tokenAge = Date.now() - result['totm-auth-timestamp'];
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (tokenAge < maxAge) {
        return {
          authenticated: true,
          user: result['totm-auth'].user,
          apiKey: result['totm-auth'].apiKey
        };
      } else {
        // Token expired, clear it
        await chrome.storage.local.remove(['totm-auth', 'totm-auth-timestamp']);
        return { authenticated: false };
      }
    }
    
    return { authenticated: false };
    
  } catch (error) {
    console.error('FCTR: Error checking auth status:', error);
    return { authenticated: false };
  }
}

async function handleLogout() {
  try {
    console.log('FCTR: Processing logout request...');
    
    await chrome.storage.local.remove([
      'totm-auth', 
      'totm-auth-timestamp',
      'totm-access-token',
      'totm-refresh-token',
      'totm-pkce-verifier',
      'totm-oauth-state'
    ]);
    
    // Also clear any search contexts
    await chrome.storage.session.remove(['fctr-search-context', 'fctr-search-provider']);
    
    console.log('FCTR: Logout completed successfully');
    
  } catch (error) {
    console.error('FCTR: Logout error:', error);
    throw error;
  }
}

// ============================================================================
// ERROR HANDLERS
// ============================================================================

// Handle service worker errors
self.addEventListener('error', (event) => {
  console.error('FCTR: Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('FCTR: Unhandled promise rejection:', event.reason);
});
self.addEventListener('unhandledrejection', (event) => {
  console.error('FCTR: Unhandled promise rejection:', event.reason);
});
// ============================================================================
// PHASE 2: BIDIRECTIONAL CREDIT SYNC SYSTEM
// ============================================================================

// Listen for storage changes to sync auth object with credit updates
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'local' && changes['user-credits']) {
    const newCredits = changes['user-credits'].newValue;
    
    if (newCredits !== undefined) {
      try {
        // Update auth object to match storage
        const authData = await chrome.storage.local.get(['totm-auth']);
        if (authData['totm-auth'] && authData['totm-auth'].user) {
          authData['totm-auth'].user.credits = newCredits;
          
          await chrome.storage.local.set({
            'totm-auth': authData['totm-auth']
          });
          
          console.log('FCTR: Auth object credits synced to storage value:', newCredits);
        }
      } catch (error) {
        console.error('FCTR: Error syncing auth object credits:', error);
      }
    }
  }
});