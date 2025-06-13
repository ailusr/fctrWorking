// modules/utils.js - Utility Functions (Production Clean)
(function() {
  'use strict';
  
  class Utils {
    static showPopup(message, type = 'info') {
      const popup = document.createElement("div");
      popup.textContent = message;
      popup.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : type === 'warning' ? '#d97706' : '#3b82f6'};
        color: white;
        padding: 1rem;
        border-radius: 0.5rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        z-index: 2147483647;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
      `;
      document.body.appendChild(popup);
      setTimeout(() => {
        if (popup.parentNode) {
          popup.parentNode.removeChild(popup);
        }
      }, 5000);
    }
    
    static getVerdictBadge(verdict) {
      if (!verdict) return `<span style="background: #1f2937; color: white; border: 1px solid #1f2937; display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.025em;">UNKNOWN</span>`;
      
      const v = verdict.toUpperCase();
      
      if (v.includes('TRUE') && !v.includes('PARTIALLY') && !v.includes('MOSTLY FALSE')) {
        return `<span style="background: #1f2937; color: white; border: 1px solid #1f2937; display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.025em;">
          <svg style="width: 1rem; height: 1rem; stroke: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
          TRUE
        </span>`;
      } else if (v.includes('PARTIALLY') || v.includes('MOSTLY TRUE')) {
        return `<span style="background: #1f2937; color: white; border: 1px solid #1f2937; display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.025em;">
          <svg style="width: 1rem; height: 1rem; stroke: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          PARTIALLY TRUE
        </span>`;
      } else if (v.includes('FALSE') || v.includes('INCORRECT')) {
        return `<span style="background: #1f2937; color: white; border: 1px solid #1f2937; display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.025em;">
          <svg style="width: 1rem; height: 1rem; stroke: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          FALSE
        </span>`;
      } else if (v.includes('MISLEADING')) {
        return `<span style="background: #1f2937; color: white; border: 1px solid #1f2937; display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.025em;">
          <svg style="width: 1rem; height: 1rem; stroke: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <path d="M12 9v4"></path>
            <path d="m12 17 .01 0"></path>
          </svg>
          MISLEADING
        </span>`;
      }
      
      return `<span style="background: #1f2937; color: white; border: 1px solid #1f2937; display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.025em;">${verdict.toUpperCase()}</span>`;
    }
    
    static getConfidenceWidth(confidence) {
      if (!confidence) return 0;
      
      // Extract percentage
      const percentMatch = confidence.match(/(\d+)(?:-(\d+))?%/);
      if (percentMatch) {
        const low = parseInt(percentMatch[1]);
        const high = percentMatch[2] ? parseInt(percentMatch[2]) : low;
        return Math.round((low + high) / 2);
      }
      
      // Handle word-based confidence
      const confLower = confidence.toLowerCase();
      if (confLower.includes('very high')) return 95;
      if (confLower.includes('high')) return 80;
      if (confLower.includes('medium') || confLower.includes('moderate')) return 60;
      if (confLower.includes('low')) return 30;
      if (confLower.includes('very low')) return 15;
      
      return 50; // Default
    }
    
    static normalizeContent(content) {
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '\n')
        .replace(/\n/g, '<br>');
    }
    
    // Native clipboard function (no external dependencies)
    static async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        
        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          return successful;
        } catch (fallbackErr) {
          document.body.removeChild(textArea);
          return false;
        }
      }
    }
  }
  
  // Register module
  if (!window.FCTR) window.FCTR = { modules: {} };
  window.FCTR.modules.Utils = Utils;
  
})();