// auth/callback.js - OAuth Callback Handler (FIXED for Chrome Runtime Messages)

/* 
 * ============================================================================
 * AI CODING ASSISTANT NOTE:
 * This file handles OAuth callbacks. When sending chrome.runtime.sendMessage 
 * calls, always use callbacks to avoid "Receiving end does not exist" errors.
 * Never use await chrome.runtime.sendMessage() without proper error handling.
 * ============================================================================
 */

(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');
  const errorDescription = urlParams.get('error_description');

  console.log('Callback received:', { code: !!code, state: !!state, error });

  const statusEl = document.getElementById('status');
  const messageEl = document.getElementById('message');

  if (error) {
    // Handle OAuth error
    statusEl.className = 'error';
    statusEl.textContent = 'Authentication Failed';
    messageEl.textContent = errorDescription || error;
    
    // Send error to parent window
    if (window.opener) {
      window.opener.postMessage({
        type: 'keycloak-callback',
        error: errorDescription || error
      }, window.location.origin);
    }
    
    // FIXED: Use callback to avoid connection errors
    if (chrome.runtime) {
      chrome.runtime.sendMessage({
        action: 'auth-callback',
        error: errorDescription || error
      }, () => {
        // Handle any connection errors silently
        if (chrome.runtime.lastError) {
          console.warn('Background script not available:', chrome.runtime.lastError.message);
        }
      });
    }
    
    setTimeout(() => window.close(), 3000);
    return;
  }

  if (!code || !state) {
    const errorMsg = 'Missing authorization code or state parameter';
    statusEl.className = 'error';
    statusEl.textContent = 'Authentication Failed';
    messageEl.textContent = errorMsg;
    
    if (window.opener) {
      window.opener.postMessage({
        type: 'keycloak-callback',
        error: errorMsg
      }, window.location.origin);
    }
    
    // FIXED: Use callback to avoid connection errors
    if (chrome.runtime) {
      chrome.runtime.sendMessage({
        action: 'auth-callback',
        error: errorMsg
      }, () => {
        // Handle any connection errors silently
        if (chrome.runtime.lastError) {
          console.warn('Background script not available:', chrome.runtime.lastError.message);
        }
      });
    }
    
    setTimeout(() => window.close(), 3000);
    return;
  }

  // Success - send code to parent window only (not background script)
  statusEl.className = 'success';
  statusEl.textContent = 'Authentication Successful';
  messageEl.textContent = 'Completing login process...';

  // Send to parent window (for popup flow)
  if (window.opener) {
    window.opener.postMessage({
      type: 'keycloak-callback',
      code: code,
      state: state
    }, window.location.origin);
    
    // Close immediately since parent will handle the background communication
    messageEl.textContent = 'Login complete! Closing window...';
    setTimeout(() => window.close(), 1000);
  } else {
    // Only send to background script if no parent window (fallback case)
    if (chrome.runtime) {
      // FIXED: Use callback-based approach for consistency
      chrome.runtime.sendMessage({
        action: 'auth-callback',
        code: code,
        state: state
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Background script connection error:', chrome.runtime.lastError.message);
          statusEl.className = 'error';
          statusEl.textContent = 'Background Script Error';
          messageEl.textContent = 'Extension background script is not responding';
          setTimeout(() => window.close(), 3000);
          return;
        }
        
        if (response && response.success) {
          messageEl.textContent = 'Login complete! You can close this window.';
          setTimeout(() => window.close(), 2000);
        } else {
          statusEl.className = 'error';
          statusEl.textContent = 'Login Processing Failed';
          messageEl.textContent = response?.error || 'Unknown error occurred';
          setTimeout(() => window.close(), 3000);
        }
      });
    } else {
      // Not in extension context, just close
      messageEl.textContent = 'Login complete! Closing window...';
      setTimeout(() => window.close(), 2000);
    }
  }
})();