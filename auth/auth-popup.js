// auth/auth-popup.js - Standalone Auth Popup (FIXED - Added Missing handleLogout Function)

/* 
 * ============================================================================
 * AI CODING ASSISTANT NOTE:
 * When working on this file, ALWAYS wrap chrome.runtime.sendMessage() calls
 * in Promise-based patterns or use callbacks to avoid "Receiving end does not
 * exist" errors. Never use bare await chrome.runtime.sendMessage().
 * 
 * SAFE PATTERN: 
 * const response = await safeRuntimeMessage(msg, true);
 * 
 * OR:
 * chrome.runtime.sendMessage(msg, callback);
 * ============================================================================
 */
 
 /* 
 * ============================================================================ 
 * DUAL AUTH FLOW WARNING: This is the STANDALONE popup auth flow.
 * Changes here must stay synchronized with the HOVER popup auth flow.
 * See modules/auth-popup-interactions.js for the other auth system.
 * Both must use same background script messages and storage keys.
 * ============================================================================
 */


// ============================================================================
// MISSING CONSTANTS (FIXED)
// ============================================================================

const PRIVACY_POLICY_CONTENT = `
<h3>Privacy Policy</h3>
<p>At FCTR, we are committed to protecting your privacy and ensuring the security of your personal information.</p>

<h3>Information We Collect</h3>
<p>We collect only the information necessary to provide our fact-checking services:</p>
<ul>
  <li>Account information (name, email) when you sign up</li>
  <li>Text that you submit for fact-checking</li>
  <li>Usage statistics to improve our service</li>
  <li>Technical information (browser type, IP address) for security purposes</li>
</ul>

<h3>How We Use Your Information</h3>
<p>Your information is used to:</p>
<ul>
  <li>Provide fact-checking and source verification services</li>
  <li>Maintain and improve our platform</li>
  <li>Send important service updates</li>
  <li>Ensure security and prevent abuse</li>
</ul>

<h3>Information Sharing</h3>
<p>We do not sell your personal information. We may share information only in the following circumstances:</p>
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

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

// Global variables
let authState = 'disconnected'; // disconnected, connecting, connected
let userInfo = null;
let apiKey = '';
let keycloakAuth = null;
let previousAuthState = null;

// DOM elements (FIXED: Updated to match actual HTML IDs)
let authContainer, authView, privacyPolicyView;
let disconnectedState, connectedState, loginBtn, loginText, loginSpinner;
let logoutBtn, userNameEl, userEmailEl, userCreditsEl, lockIcon;
let privacyPolicyLink, privacyCloseBtn;

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
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      resolve(expectResponse ? { success: false, error: 'Chrome runtime not available' } : undefined);
      return;
    }
    
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
// INITIALIZATION
// ============================================================================
// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Auth popup DOM loaded');
  
  // Get DOM elements
  getDOMElements();
  
  // Initialize components
  initializeKeycloak();
  initializePrivacyPolicy();
  ensureCorrectInitialState();
  
  // Setup event listeners
  setupEventListeners();
  
  // Check auth status
  checkAuthStatus();
  
  // PHASE 3A: Update welcome message with dynamic config
  await updateStandaloneWelcomeMessage();
  
  console.log('Auth popup initialization complete');
});

function getDOMElements() {
  // FIXED: Updated to match actual HTML IDs from the working version
  authContainer = document.getElementById('auth-container');
  authView = document.getElementById('auth-view');
  privacyPolicyView = document.getElementById('privacy-policy-view');
  
  disconnectedState = document.getElementById('disconnected-state');
  connectedState = document.getElementById('connected-state');
  loginBtn = document.getElementById('login-btn');
  loginText = document.getElementById('login-text');
  loginSpinner = document.getElementById('login-spinner');
  
  logoutBtn = document.getElementById('logout-btn');
  userNameEl = document.getElementById('user-name');
  userEmailEl = document.getElementById('user-email');
  userCreditsEl = document.getElementById('user-credits');
  lockIcon = document.getElementById('lock-icon');
  
  privacyPolicyLink = document.getElementById('privacy-policy-link');
  privacyCloseBtn = document.getElementById('privacy-close-btn');
  
  console.log('DOM elements retrieved:', {
    authContainer: !!authContainer,
    authView: !!authView,
    privacyPolicyView: !!privacyPolicyView,
    disconnectedState: !!disconnectedState,
    connectedState: !!connectedState,
    loginBtn: !!loginBtn,
    loginText: !!loginText,
    loginSpinner: !!loginSpinner,
    logoutBtn: !!logoutBtn,
    userNameEl: !!userNameEl,
    userEmailEl: !!userEmailEl,
    userCreditsEl: !!userCreditsEl,
    lockIcon: !!lockIcon,
    privacyPolicyLink: !!privacyPolicyLink,
    privacyCloseBtn: !!privacyCloseBtn
  });

  // Check for required elements
  if (!loginBtn) {
    console.error('Critical: login-btn element not found!');
    console.log('Available elements with IDs:', 
      Array.from(document.querySelectorAll('[id]')).map(el => el.id)
    );
    return;
  }
}

function initializeKeycloak() {
  try {
    if (typeof KEYCLOAK_CONFIG !== 'undefined') {
      keycloakAuth = new KeycloakAuth(KEYCLOAK_CONFIG);
      console.log('Keycloak auth initialized');
    } else {
      console.error('KEYCLOAK_CONFIG not found');
    }
  } catch (error) {
    console.error('Failed to initialize Keycloak:', error);
  }
}

function initializePrivacyPolicy() {
  const privacyContent = document.getElementById('privacy-content');
  if (privacyContent) {
    privacyContent.innerHTML = PRIVACY_POLICY_CONTENT;
  }
}

function ensureCorrectInitialState() {
  // Make sure auth view is visible and privacy view is hidden on load
  if (authView) {
    authView.classList.remove('hidden');
    authView.style.display = 'block';
  }
  
  if (privacyPolicyView) {
    privacyPolicyView.classList.add('hidden');
    privacyPolicyView.style.display = 'none';
  }
  
  // Make sure container is in auth mode, not privacy mode
  if (authContainer) {
    authContainer.classList.remove('privacy-view');
  }
  
  console.log('Initial state set: auth view visible, privacy view hidden');
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
  if (!loginBtn) {
    console.error('Cannot setup event listeners: loginBtn is null');
    return;
  }

  // Login button click
  loginBtn.addEventListener('click', () => {
    console.log('Login button clicked');
    handleLogin();
  });

  // Logout button click
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      console.log('Logout button clicked');
      handleLogout();
    });
  }
  
  // Privacy policy event listeners
  if (privacyPolicyLink) {
    privacyPolicyLink.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Privacy policy link clicked');
      showPrivacyPolicy();
    });
  }
  
  if (privacyCloseBtn) {
    privacyCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Privacy policy close button clicked');
      hidePrivacyPolicy();
    });
  }
  
  console.log('Event listeners setup complete');
}

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

async function checkAuthStatus() {
  try {
    console.log('Checking auth status...');
    
    // FIXED: Use safe runtime message wrapper
    const response = await safeRuntimeMessage({ action: 'get-auth-status' }, true);
    console.log('Auth status response:', response);
    
    if (response && response.success && response.status && response.status.authenticated) {
      console.log('User is authenticated');
      setAuthState('connected', response.status.user, response.status.apiKey);
      return;
    }
    
    // Fallback: check localStorage
    console.log('Checking localStorage for auth data...');
    const stored = localStorage.getItem('totm-auth');
    if (stored) {
      console.log('Found stored auth data');
      const authData = JSON.parse(stored);
      setAuthState('connected', authData.user, authData.apiKey);
    } else {
      console.log('No stored auth data found');
      setAuthState('disconnected');
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    setAuthState('disconnected');
  }
}

async function handleLogin() {
  console.log('Starting login process...');
  setAuthState('connecting');
  
  try {
    console.log('Starting Keycloak login...');
    
    if (!keycloakAuth) {
      throw new Error('Keycloak auth not initialized');
    }
    
    // Initiate Keycloak OAuth flow
    const callbackData = await keycloakAuth.initiateLogin();
    
    console.log('Login callback received:', callbackData);
    
    // Use safe runtime message wrapper
    const response = await safeRuntimeMessage({
      action: 'auth-callback',
      code: callbackData.code,
      state: callbackData.state
    }, true);
    
    console.log('Background script response:', response);
    
    if (response && response.success) {
      console.log('Login successful');
      
      const userData = {
        ...response.result.user,
        credits: response.result.user.credits || 25
      };
      
      // ENHANCED: Store auth state in Chrome storage for content script sync
      try {
        const userCredits = userData.credits || 25;
        await chrome.storage.local.set({
          'totm-auth': {
            user: userData,
            apiKey: response.result.apiKey
          },
          'totm-auth-timestamp': Date.now(),
          // ✅ PHASE 2: Initialize credit storage from auth response
          'user-credits': userCredits
        });
        console.log('Auth state stored in Chrome storage for content script sync');
      } catch (storageError) {
        console.error('Failed to store auth state:', storageError);
      }
      
      setAuthState('connected', userData, response.result.apiKey);
      
      // ENHANCED: Close window after delay to allow storage sync
      setTimeout(() => {
        console.log('Login complete, closing window...');
        window.close();
      }, 1000);
      
    } else {
      throw new Error(response?.error || 'Authentication failed');
    }
    
  } catch (error) {
    console.error('Login failed:', error);
    setAuthState('disconnected');
    
    // Show error to user
    alert(`Login failed: ${error.message}`);
  }
}

// ============================================================================
// FIXED: ADDED MISSING handleLogout() FUNCTION
// ============================================================================

async function handleLogout() {
  console.log('Standalone popup: Starting logout process...');
  setAuthState('connecting');
  
  try {
    // FIXED: Use safe runtime message wrapper to call background script
    const response = await safeRuntimeMessage({ action: 'logout' }, true);
    
    console.log('Standalone popup: Background script logout response:', response);
    
    if (response && response.success !== false) {
      console.log('Standalone popup: Logout successful');
      
      // Clear local storage for consistency
      try {
        localStorage.removeItem('totm-auth');
        console.log('Standalone popup: Cleared localStorage');
      } catch (localStorageError) {
        console.warn('Standalone popup: Failed to clear localStorage:', localStorageError);
      }
      
      // Update UI to disconnected state
      setAuthState('disconnected');
      
      console.log('Standalone popup: Logout completed successfully');
      
    } else {
      throw new Error(response?.error || 'Logout failed');
    }
    
  } catch (error) {
    console.error('Standalone popup: Logout failed:', error);
    
    // Still try to clear local state on error
    try {
      localStorage.removeItem('totm-auth');
      setAuthState('disconnected');
      console.log('Standalone popup: Cleared local state after logout error');
    } catch (clearError) {
      console.error('Standalone popup: Failed to clear local state:', clearError);
    }
    
    // Show error to user but don't block the logout
    alert(`Logout encountered an issue: ${error.message}\n\nLocal session has been cleared.`);
  }
}

// ============================================================================
// UI STATE MANAGEMENT
// ============================================================================

function setAuthState(state, user = null, key = '') {
  console.log('Setting auth state:', state, user ? 'with user' : 'no user');
  
  authState = state;
  userInfo = user;
  apiKey = key;

  // Update UI visibility based on state
  if (state === 'connected') {
    // Show connected state, hide disconnected state
    if (disconnectedState) disconnectedState.classList.add('hidden');
    if (connectedState) connectedState.classList.remove('hidden');
    
    // Update user info
    if (userNameEl && user) userNameEl.textContent = user.name || 'Unknown User';
    if (userEmailEl && user) userEmailEl.textContent = user.email || 'No email';
    if (userCreditsEl) userCreditsEl.textContent = `Credits: ${user?.credits || '25'} remaining`;
    
    // Hide privacy policy link when connected
    if (privacyPolicyLink) {
      privacyPolicyLink.classList.add('hidden');
      privacyPolicyLink.style.display = 'none';
      console.log('Privacy policy link hidden');
    }
    
    // Update lock icon to locked state
    if (lockIcon) {
      lockIcon.innerHTML = `
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <circle cx="12" cy="16" r="1"></circle>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      `;
    }
  } else {
    // Show disconnected state, hide connected state
    if (disconnectedState) disconnectedState.classList.remove('hidden');
    if (connectedState) connectedState.classList.add('hidden');
    
    // Show privacy policy link when disconnected
    if (privacyPolicyLink) {
      privacyPolicyLink.classList.remove('hidden');
      privacyPolicyLink.style.display = 'block';
      console.log('Privacy policy link shown');
    }
    
    // Update lock icon to unlocked state
    if (lockIcon) {
      lockIcon.innerHTML = `
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <circle cx="12" cy="16" r="1"></circle>
        <path d="M7 11V7a5 5 0 0 1 10 0"></path>
      `;
    }
  }

  // Update button loading state
  if (state === 'connecting') {
    if (loginBtn) loginBtn.disabled = true;
    if (loginText) loginText.textContent = 'Connecting...';
    if (loginSpinner) loginSpinner.classList.remove('hidden');
    if (logoutBtn) logoutBtn.disabled = true;
  } else {
    if (loginBtn) loginBtn.disabled = false;
    if (loginText) loginText.textContent = 'Login with SSO';
    if (loginSpinner) loginSpinner.classList.add('hidden');
    if (logoutBtn) logoutBtn.disabled = false;
  }
}

// ============================================================================
// PRIVACY POLICY FUNCTIONS
// ============================================================================

function showPrivacyPolicy() {
  console.log('Showing privacy policy');
  
  // Store current auth state
  previousAuthState = {
    authState,
    userInfo,
    apiKey
  };
  
  // Hide auth view and show privacy policy
  if (authView) {
    authView.classList.add('hidden');
    authView.style.display = 'none';
  }
  if (privacyPolicyView) {
    privacyPolicyView.classList.remove('hidden');
    privacyPolicyView.style.display = 'block';
  }
  
  // Update container for privacy view
  if (authContainer) {
    authContainer.classList.add('privacy-view');
  }
  
  console.log('Privacy policy view should now be visible');
}

function hidePrivacyPolicy() {
  console.log('Hiding privacy policy');
  
  // Show auth view and hide privacy policy
  if (authView) {
    authView.classList.remove('hidden');
    authView.style.display = 'block';
  }
  if (privacyPolicyView) {
    privacyPolicyView.classList.add('hidden');
    privacyPolicyView.style.display = 'none';
  }
  
  // Remove privacy view styling
  if (authContainer) {
    authContainer.classList.remove('privacy-view');
  }
  
  // Restore previous auth state if it exists
  if (previousAuthState) {
    authState = previousAuthState.authState;
    userInfo = previousAuthState.userInfo;
    apiKey = previousAuthState.apiKey;
    previousAuthState = null;
    
    // Update UI to reflect restored state
    updateAuthUI();
  }
  
  console.log('Auth view should now be visible');
}

function updateAuthUI() {
  // Update the UI based on current auth state
  setAuthState(authState, userInfo, apiKey);
}
// ============================================================================
// PHASE 3A: CONFIG MANAGEMENT FOR STANDALONE POPUP
// ============================================================================

// Config constants (same as hover popup)
const CONFIG_CACHE_TTL_HOURS = 4;
const CONFIG_CACHE_KEY = 'fctr-config-cache';

// Fetch config via background script
async function fetchStandaloneConfig() {
  try {
    console.log('FCTR Standalone: Fetching config via background script...');
    
    // Check cache first
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        const cached = await chrome.storage.local.get([CONFIG_CACHE_KEY]);
        const cachedConfig = cached[CONFIG_CACHE_KEY];
        
        if (cachedConfig && cachedConfig.timestamp) {
          const cacheAge = Date.now() - cachedConfig.timestamp;
          const maxAge = CONFIG_CACHE_TTL_HOURS * 60 * 60 * 1000;
          
          if (cacheAge < maxAge) {
            console.log('FCTR Standalone: Using cached config');
            return cachedConfig.config;
          }
        }
      } catch (storageError) {
        console.warn('FCTR Standalone: Cache check failed:', storageError);
      }
    }
    
    // Request config from background script
    const response = await chrome.runtime.sendMessage({ action: 'fetch-config' });
    
    if (response && response.success) {
      console.log('FCTR Standalone: Fresh config fetched:', response.config);
      return response.config;
    } else {
      console.warn('FCTR Standalone: Config fetch failed:', response?.error);
      console.error('FCTR Standalone: Config fetch failed:', response?.error);
      // PHASE 3 PART 2: Return null instead of hardcoded fallback
      return null;
    }
    
  } catch (error) {
    console.error('FCTR Standalone: Config fetch error:', error);
    // PHASE 3 PART 2: Return null instead of hardcoded fallback
    return null;
  }
}

// Update welcome message with dynamic config
async function updateStandaloneWelcomeMessage() {
  try {
    const welcomeElement = document.getElementById('standalone-welcome-message');
    if (!welcomeElement) return;
    
    console.log('FCTR Standalone: Updating welcome message...');
    
    // Show loading state
    welcomeElement.textContent = 'Loading...';
    
    // Get config and update message
    const config = await fetchStandaloneConfig();

    if (!config) {
      // Config fetch failed - show error message
      welcomeElement.textContent = 'Error loading welcome message - please refresh';
      welcomeElement.style.color = '#ef4444'; // Red color for error
      console.error('FCTR Standalone: Config fetch failed');
      return;
    }

    const welcomeMessage = config.welcome_message_template.replace(
      '{credits}', 
      config.default_credits
    );

    welcomeElement.textContent = welcomeMessage;
    welcomeElement.style.color = ''; // Reset color
    console.log('FCTR Standalone: Welcome message updated to:', welcomeMessage);
    
  } catch (error) {
    const welcomeElement = document.getElementById('standalone-welcome-message');
    if (welcomeElement) {
      welcomeElement.textContent = 'Error communicating with server';
      welcomeElement.style.color = '#ef4444'; // Red color for error
    }
  }
}
// ============================================================================
// CHROME STORAGE EVENT LISTENER
// ============================================================================

// Listen for storage changes (credit updates from background script)
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes['user-credits']) {
      const newCredits = changes['user-credits'].newValue;
      console.log('Credits updated:', newCredits);
      
      // Update the UI if user is connected
      if (authState === 'connected' && userCreditsEl) {
        userCreditsEl.textContent = `Credits: ${newCredits} remaining`;
      }
    }
  });
} else {
  console.warn('Chrome storage API not available for event listening');
}

console.log('fctr Auth popup loaded with Keycloak integration and FIXED logout functionality');