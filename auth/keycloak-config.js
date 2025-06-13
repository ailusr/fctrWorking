// auth/keycloak-config.js - Keycloak Configuration and Auth Class

/* 
 * ============================================================================
 * AI CODING ASSISTANT NOTE:
 * This file contains the Keycloak configuration and authentication class.
 * When making changes, ensure that the KEYCLOAK_CONFIG object and 
 * KeycloakAuth class remain properly defined and exported.
 * ============================================================================
 */

// ============================================================================
// KEYCLOAK CONFIGURATION
// ============================================================================

const KEYCLOAK_CONFIG = {
  url: 'https://usw2.auth.ac/auth',
  realm: 'totm',
  clientId: 'totm-browser-extension',
  redirectUri: chrome.runtime.getURL('auth/callback.html')
};

// ============================================================================
// PKCE HELPER FUNCTIONS
// ============================================================================

function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

function base64URLEncode(buffer) {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(digest));
}

// ============================================================================
// KEYCLOAK AUTH CLASS
// ============================================================================

class KeycloakAuth {
  constructor(config) {
    this.config = config;
    this.codeVerifier = null;
    this.state = null;
  }

  async initiateLogin() {
    try {
      console.log('KeycloakAuth: Initiating login process...');
      
      // Generate PKCE parameters
      this.codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(this.codeVerifier);
      this.state = generateCodeVerifier(); // Reuse function for random string

      console.log('KeycloakAuth: Generated PKCE parameters');

      // Store PKCE parameters
      await chrome.storage.local.set({
        'totm-pkce-verifier': this.codeVerifier,
        'totm-oauth-state': this.state
      });

      console.log('KeycloakAuth: Stored PKCE parameters in storage');

      // Build authorization URL
      const authUrl = new URL(`${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/auth`);
      authUrl.searchParams.set('client_id', this.config.clientId);
      authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'openid email profile');
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      authUrl.searchParams.set('state', this.state);
      // Force GitHub OAuth provider
      authUrl.searchParams.set('kc_idp_hint', 'github');

      console.log('KeycloakAuth: Opening login window:', authUrl.toString());

      // Open login window
      const loginWindow = window.open(
        authUrl.toString(),
        'keycloak-login',
        'width=500,height=700,scrollbars=yes,resizable=yes'
      );

      if (!loginWindow) {
        throw new Error('Failed to open login window. Please allow popups for this site.');
      }

      // Monitor for window close or callback
      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (loginWindow.closed) {
            clearInterval(checkClosed);
            reject(new Error('Login window closed by user'));
          }
        }, 1000);

        // Listen for callback message
        const messageListener = (event) => {
          console.log('KeycloakAuth: Received message:', event.data);
          
          if (event.origin !== window.location.origin) {
            console.warn('KeycloakAuth: Ignored message from different origin:', event.origin);
            return;
          }
          
          if (event.data.type === 'keycloak-callback') {
            console.log('KeycloakAuth: Processing callback');
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            loginWindow.close();
            
            if (event.data.error) {
              console.error('KeycloakAuth: Login error:', event.data.error);
              reject(new Error(event.data.error));
            } else {
              console.log('KeycloakAuth: Login successful');
              resolve(event.data);
            }
          }
        };

        window.addEventListener('message', messageListener);
        
        // Set a timeout for the entire process
        setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          if (!loginWindow.closed) {
            loginWindow.close();
          }
          reject(new Error('Login process timed out after 5 minutes'));
        }, 5 * 60 * 1000); // 5 minutes timeout
      });

    } catch (error) {
      console.error('KeycloakAuth: Failed to initiate login:', error);
      throw error;
    }
  }

  async logout() {
    try {
      console.log('KeycloakAuth: Initiating logout...');
      
      // Clear stored PKCE parameters
      await chrome.storage.local.remove([
        'totm-pkce-verifier',
        'totm-oauth-state',
        'totm-auth',
        'totm-auth-timestamp',
        'totm-access-token',
        'totm-refresh-token'
      ]);
      
      console.log('KeycloakAuth: Logout completed');
      
    } catch (error) {
      console.error('KeycloakAuth: Logout error:', error);
      throw error;
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Helper function to check if user is authenticated
async function isAuthenticated() {
  try {
    const authData = await chrome.storage.local.get(['totm-auth', 'totm-auth-timestamp']);
    
    if (authData['totm-auth'] && authData['totm-auth'].user) {
      // Check if auth is still valid (24 hours)
      const authTime = authData['totm-auth-timestamp'] || 0;
      const isExpired = Date.now() - authTime > 24 * 60 * 60 * 1000;
      
      return !isExpired;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
}

// Helper function to get current user info
async function getCurrentUser() {
  try {
    const authData = await chrome.storage.local.get(['totm-auth']);
    return authData['totm-auth']?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export for use in other files
if (typeof window !== 'undefined') {
  window.KeycloakAuth = KeycloakAuth;
  window.KEYCLOAK_CONFIG = KEYCLOAK_CONFIG;
  window.isAuthenticated = isAuthenticated;
  window.getCurrentUser = getCurrentUser;
}

console.log('Keycloak configuration loaded successfully');