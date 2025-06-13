// AI Detection Icons Module
// Clean, minimal black icons for AI origin detection

(function() {
  'use strict';
  
  const AiDetectionIcons = {
    // Robot icon for AI-Generated content
    aiGenerated: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="9" cy="9" r="1"/>
      <circle cx="15" cy="9" r="1"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>`,
    
    // User/Person icon for Human-Written content
    humanWritten: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>`,
    
    // Balance/Mix icon for Partial/Mixed content
    partialMixed: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="m9 12 2 2 4-4"/>
      <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1"/>
      <path d="M3 12c-.552 0-1-.448-1-1s.448-1 1-1"/>
    </svg>`,
    
    // Alert/X icon for Analysis Failed
    analysisFailed: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>`,
    
    // Brain icon for sophisticated AI detection
    brainAnalysis: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
    </svg>`,
    
    // Pen icon for human creativity 
    creativeWriting: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      <path d="m15 5 4 4"/>
    </svg>`
  };
  
  // Register module globally
  if (!window.FCTR) window.FCTR = { modules: {} };
  window.FCTR.modules.AiDetectionIcons = AiDetectionIcons;
  
  console.log('🔍 FCTR: AI Detection Icons module loaded');
  
})();