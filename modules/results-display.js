// modules/results-display.js - Fact Check Results Display with Theme Toggle (Fixed)
(function() {
  'use strict';
  
  class ResultsDisplay {
    constructor() {
      this.currentTheme = 'light'; // Default to light mode
      this.setupAccordionToggle();
      this.loadThemePreference();
    }
    
    // Load theme preference from chrome.storage
    async loadThemePreference() {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.local.get(['fctr-theme']);
          this.currentTheme = result['fctr-theme'] || 'light';
        }
      } catch (error) {
        console.warn('Could not load theme preference:', error);
        this.currentTheme = 'light';
      }
    }
    
    // Save theme preference to chrome.storage
    async saveThemePreference() {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          await chrome.storage.local.set({ 'fctr-theme': this.currentTheme });
        }
      } catch (error) {
        console.warn('Could not save theme preference:', error);
      }
    }
    
    // Toggle between light and dark themes
    async toggleTheme() {
      this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
      await this.saveThemePreference();
      this.applyTheme();
    }
    
    // Apply theme styles to the modal
    applyTheme() {
      const modal = document.getElementById('fctr-result-popup');
      if (!modal) return;
      
      const resultsModal = modal.querySelector('.results-modal');
      const header = modal.querySelector('.modal-header');
      const content = modal.querySelector('.modal-content');
      const themeToggle = modal.querySelector('#fctr-theme-toggle');
      const copyBtn = modal.querySelector('#fctr-copy-btn');
      const headerTitle = modal.querySelector('h2');
      const closeBtn = modal.querySelector('#fctr-close-result-btn');
      
      if (this.currentTheme === 'dark') {
        // Dark theme
        if (resultsModal) {
          resultsModal.style.background = 'black';
          resultsModal.style.borderColor = '#374151';
        }
        if (header) {
          header.style.background = 'black';
          header.style.color = 'white';
        }
        if (content) {
          content.style.background = 'black';
          content.style.color = 'white';
        }
        
        // Update header title color (results from fctr)
        if (headerTitle) {
          headerTitle.style.color = 'white';
          // Update the "fctr" span specifically
          const fctrSpan = headerTitle.querySelector('span');
          if (fctrSpan) {
            fctrSpan.style.color = 'white';
          }
        }
        
        // Update close button
        if (closeBtn) {
          closeBtn.style.color = 'white';
          const closeIcon = closeBtn.querySelector('.feather-icon');
          if (closeIcon) {
            closeIcon.style.stroke = 'white';
          }
        }
        
        // Update copy button to always match export/print buttons (white background, black text)
        if (copyBtn) {
          copyBtn.style.background = 'white';
          copyBtn.style.color = 'black';
          copyBtn.style.borderColor = 'white';
          const copyIcon = copyBtn.querySelector('.feather-icon');
          if (copyIcon) {
            copyIcon.style.stroke = 'black';
          }
        }
        
        // Update section headers to white
        modal.querySelectorAll('h3').forEach(h3 => {
          h3.style.color = 'white';
          // Update the icons in section headers to white
          const icon = h3.querySelector('.feather-icon');
          if (icon) {
            icon.style.stroke = 'white';
          }
        });
        
        // Fix white card content text (assessment cards) - ensure always dark text on white background
        modal.querySelectorAll('div[style*="background: white"][style*="border: 1px solid #e5e7eb"][style*="text-align: center"]').forEach(card => {
          card.querySelectorAll('div').forEach(div => {
            const style = div.getAttribute('style') || '';
            if (style.includes('font-size: 1.25rem') || style.includes('font-size: 2.5rem')) {
              div.style.color = '#1f2937'; // Dark text for main numbers (both regular and large)
            }
            if (style.includes('font-size: 0.875rem')) {
              div.style.color = '#6b7280'; // Grey text for labels
            }
          });
        });
        
        // Update theme toggle icon to sun (since we're in dark mode)
        if (themeToggle) {
          themeToggle.innerHTML = `
            <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: white;">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          `;
        }
        
      } else {
        // Light theme
        if (resultsModal) {
          resultsModal.style.background = 'white';
          resultsModal.style.borderColor = '#e5e7eb';
        }
        if (header) {
          header.style.background = 'white';
          header.style.color = '#1f2937';
        }
        if (content) {
          content.style.background = 'white';
          content.style.color = '#1f2937';
        }
        
        // Update header title color (results from fctr)
        if (headerTitle) {
          headerTitle.style.color = '#1f2937';
          // Update the "fctr" span specifically
          const fctrSpan = headerTitle.querySelector('span');
          if (fctrSpan) {
            fctrSpan.style.color = '#1f2937';
          }
        }
        
        // Update close button
        if (closeBtn) {
          closeBtn.style.color = '#1f2937';
          const closeIcon = closeBtn.querySelector('.feather-icon');
          if (closeIcon) {
            closeIcon.style.stroke = '#1f2937';
          }
        }
        
        // Update copy button to always match export/print buttons (white background, black text)
        if (copyBtn) {
          copyBtn.style.background = 'white';
          copyBtn.style.color = 'black';
          copyBtn.style.borderColor = 'white';
          const copyIcon = copyBtn.querySelector('.feather-icon');
          if (copyIcon) {
            copyIcon.style.stroke = 'black';
          }
        }
        
        // Update section headers to dark
        modal.querySelectorAll('h3').forEach(h3 => {
          h3.style.color = '#1f2937';
          // Update the icons in section headers to dark
          const icon = h3.querySelector('.feather-icon');
          if (icon) {
            icon.style.stroke = '#1f2937';
          }
        });
        
        // Fix white card content text (assessment cards) - ensure always dark text on white background
        modal.querySelectorAll('div[style*="background: white"][style*="border: 1px solid #e5e7eb"][style*="text-align: center"]').forEach(card => {
          card.querySelectorAll('div').forEach(div => {
            const style = div.getAttribute('style') || '';
            if (style.includes('font-size: 1.25rem') || style.includes('font-size: 2.5rem')) {
              div.style.color = '#1f2937'; // Dark text for main numbers (both regular and large)
            }
            if (style.includes('font-size: 0.875rem')) {
              div.style.color = '#6b7280'; // Grey text for labels
            }
          });
        });
        
        // Update theme toggle icon to moon (since we're in light mode)
        if (themeToggle) {
          themeToggle.innerHTML = `
            <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: #1f2937;">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          `;
        }
      }
    }
    
    setupAccordionToggle() {
      // Accordion toggle function (add to window scope)
      window.toggleAccordion = function(trigger) {
        try {
          const content = trigger.nextElementSibling;
          const icon = trigger.querySelector('.feather-icon:last-child');
          
          if (!content) {
            console.error('No accordion content found');
            return;
          }
          
          const isCollapsed = content.classList.contains('collapsed');
          
          if (isCollapsed) {
            // Expand
            content.classList.remove('collapsed');
            if (icon) {
              icon.innerHTML = '<polyline points="6,9 12,15 18,9"></polyline>';
            }
          } else {
            // Collapse
            content.classList.add('collapsed');
            if (icon) {
              icon.innerHTML = '<polyline points="9,18 15,12 9,6"></polyline>';
            }
          }
          
        } catch (error) {
          console.error('Error toggling accordion:', error);
        }
      };
    }
    
    async showResult(markdownContent, originalClaim) {
      // Load theme preference first
      await this.loadThemePreference();
      
      // Store for debugging
      window.lastFactCheckResponse = markdownContent;
      
      // Remove any existing modal first
      const existingModal = document.getElementById('fctr-result-popup');
      if (existingModal) {
        existingModal.remove();
      }
      
      // Parse the markdown response into structured data
      const parsedData = this.parseFactCheckResponse(markdownContent);
      
      // Create modal overlay
      const modal = document.createElement("div");
      modal.id = 'fctr-result-popup';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        z-index: 2147483646;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      `;

      // Create the complete modern modal HTML
      modal.innerHTML = this.createModalHTML(parsedData, originalClaim);
      document.body.appendChild(modal);
      
      // Apply theme after modal is added to DOM
      setTimeout(() => this.applyTheme(), 10);
      
      // Setup event listeners with native functionality
      this.setupModalEventListeners(modal, markdownContent, originalClaim, parsedData);
    }
    
    createModalHTML(parsedData, originalClaim) {
      const ModalStyles = window.FCTR.modules.ModalStyles;
      
      // Base styles that will be overridden by theme
      const modalBg = this.currentTheme === 'dark' ? 'black' : 'white';
      const modalBorder = this.currentTheme === 'dark' ? '#374151' : '#e5e7eb';
      const headerColor = this.currentTheme === 'dark' ? 'white' : '#1f2937';
      const contentColor = this.currentTheme === 'dark' ? 'white' : '#1f2937';
      
      return `
        <div class="results-modal" style="
          background: ${modalBg};
          border: 1px solid ${modalBorder};
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        ">
          ${ModalStyles ? ModalStyles.getResultsModalStyles() : ''}

          <!-- Header -->
          <div class="modal-header" style="
            padding: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            background: ${modalBg};
            position: sticky;
            top: 0;
            z-index: 10;
            border: none !important;
            border-bottom: none !important;
          ">
            <h2 style="
              font-size: 1.875rem;
              font-weight: 400;
              color: ${headerColor};
              margin: 0;
              margin-left: 60px;
              flex-grow: 1;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              border: none !important;
              border-bottom: none !important;
              text-decoration: none !important;
              box-shadow: none !important;
              outline: none !important;
            ">
              <span style="
                font-weight: 900; 
                letter-spacing: -8.5px; 
                font-size: 7.5rem; 
                color: ${headerColor};
                border: none !important;
                border-bottom: none !important;
                text-decoration: none !important;
                box-shadow: none !important;
                outline: none !important;
              ">fctr</span>
            </h2>

            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <button id="fctr-copy-btn" class="btn btn-secondary btn-sm" style="background: white; color: black; border: 1px solid white;">
                <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: black;">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
              </button>
              <button id="fctr-export-btn" class="btn btn-primary btn-sm" style="background: white; color: black; border: 1px solid white;">
                <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: black;">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7,10 12,15 17,10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export HTML
              </button>
              <button id="fctr-print-btn" class="btn btn-primary btn-sm" style="background: white; color: black; border: 1px solid white;">
                <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: black;">
                  <polyline points="6,9 6,2 18,2 18,9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <polyline points="6,14 6,22 18,22 18,14"></polyline>
                </svg>
                Print/PDF
              </button>
              <button id="fctr-theme-toggle" class="btn btn-ghost btn-sm" style="background: transparent; color: ${headerColor};" title="Toggle theme">
                ${this.currentTheme === 'dark' ? `
                  <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: ${headerColor};">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                ` : `
                  <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: ${headerColor};">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                `}
              </button>
              <button id="fctr-close-result-btn" class="btn btn-ghost btn-sm" style="background: transparent; color: ${headerColor};">
                <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: ${headerColor};">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="modal-content" style="padding: 1.5rem; overflow-y: auto; flex: 1; border: none !important; border-top: none !important; background: ${modalBg};">
            ${this.createContentSections(parsedData, originalClaim)}
          </div>
        </div>
      `;
    }
    
    createContentSections(parsedData, originalClaim) {
      const Utils = window.FCTR.modules.Utils;
      const headerColor = this.currentTheme === 'dark' ? 'white' : '#1f2937';
      
      return `
        <div style="border: none; border-top: none;">
        <!-- Original Claim -->
        <div style="margin-bottom: 1.5rem; border-top: none; border: none;">
          <h3 style="
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            color: ${headerColor};
            display: flex;
            align-items: center;
            gap: 0.5rem;
            border: none;
          ">
            <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: ${headerColor};">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            Original Claim
          </h3>
          <div style="
            background: white;
            border: 1px solid #e5e7eb;
            border-left: 4px solid #1f2937;
            border-radius: 0.5rem;
            padding: 1rem;
          ">
            <p style="
              color: #1f2937;
              font-size: 0.95rem;
              font-style: italic;
              line-height: 1.6;
              margin: 0;
            ">
              "${originalClaim || parsedData.claim || 'No claim provided'}"
            </p>
          </div>
        </div>

        <!-- Overall Assessment -->
        <div style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        ">
          <div style="
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          ">
            <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.25rem;">
              ${Utils ? Utils.getVerdictBadge(parsedData.verdict) : parsedData.verdict || 'Unknown'}
            </div>
            <div style="font-size: 1.125rem; color: #6b7280;">Overall Verdict</div>
          </div>
          <div style="
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          ">
            <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.25rem;">
              ${parsedData.confidence || 'N/A'}
            </div>
            <div style="font-size: 1.125rem; color: #6b7280;">Confidence Score</div>
            <div style="margin-top: 0.5rem;">
              <div class="progress">
                <div class="progress-bar" style="width: ${Utils ? Utils.getConfidenceWidth(parsedData.confidence) : 50}%"></div>
              </div>
            </div>
          </div>
          <div style="
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          ">
            <div style="
              width: 40px;
              height: 40px;
              background: #1f2937;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 0.5rem;
            ">
              <span style="
                color: white;
                font-size: 1.125rem;
                font-weight: 600;
              ">
                ${parsedData.sources.length}
              </span>
            </div>
            <div style="font-size: 1.125rem; color: #6b7280;">Sources Found</div>
          </div>
        </div>

        ${this.createDetailedSections(parsedData)}
      `;
    }
    
    createDetailedSections(parsedData) {
      const headerColor = this.currentTheme === 'dark' ? 'white' : '#1f2937';
      const Utils = window.FCTR.modules.Utils; // Add Utils reference here
      
      return `
        <!-- Individual Claims (if available) -->
        ${parsedData.individualClaims && parsedData.individualClaims.length > 0 ? `
        <div style="margin-bottom: 1.5rem;">
          <h3 style="
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            color: ${headerColor};
            display: flex;
            align-items: center;
            gap: 0.5rem;
          ">
            <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: ${headerColor};">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            Individual Claims Breakdown
          </h3>
          <div style="padding-left: 1rem;">
            ${parsedData.individualClaims.map(claim => `
              <div class="claim-item" style="
                margin-bottom: 1rem; 
                padding: 1.5rem; 
                background: white; 
                border: 1px solid #e5e7eb; 
                border-radius: 0.5rem;
                position: relative;
              ">
                <!-- Verdict Badge moved to top-right -->
                <div style="
                  position: absolute;
                  top: 1rem;
                  right: 1rem;
                  z-index: 1;
                ">
                  ${Utils ? Utils.getVerdictBadge(claim.verdict) : claim.verdict}
                </div>
  
                <!-- Claim Title moved up to fill space -->
                <div style="
                  font-size: 1.125rem;
                  font-weight: 700;
                  color: #1f2937;
                  margin-bottom: 0.75rem;
                  padding-right: 6rem;
                ">
                  ${claim.title}
                </div>
                
                <!-- Key Components -->
                ${claim.keyComponents ? `
                <div style="margin-bottom: 0.75rem;">
                  <span style="font-weight: 700; color: #1f2937;">Key components:</span>
                  <span style="font-style: italic; color: #374151;"> ${claim.keyComponents}</span>
                </div>
                ` : ''}
                
                <!-- Confidence -->
                ${claim.confidence ? `
                <div style="margin-bottom: 0.75rem;">
                  <span style="font-weight: 700; color: #1f2937;">Confidence:</span>
                  <span style="color: #374151;"> ${claim.confidence}</span>
                </div>
                ` : ''}
                
                <!-- Explanation -->
                ${claim.explanation ? `
                <div style="margin-bottom: 0;">
                  <span style="font-weight: 700; color: #1f2937;">Explanation:</span>
                  <span style="color: #374151;"> ${claim.explanation}</span>
                </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Detailed Analysis -->
        <div style="margin-bottom: 1.5rem;">
          <h3 style="
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            color: ${headerColor};
            display: flex;
            align-items: center;
            gap: 0.5rem;
          ">
            <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: ${headerColor};">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            Detailed Analysis
          </h3>
          <div style="padding-left: 1rem;">
            ${this.createAccordionSection('Explanation', parsedData.explanation || 'No detailed explanation available.')}
            
            ${parsedData.mostCredibleSource ? this.createAccordionSection('Most Credible Source', parsedData.mostCredibleSource) : ''}
            
            ${parsedData.limitations ? this.createAccordionSection('Limitations', parsedData.limitations) : ''}
          </div>
        </div>

        <!-- Sources -->
        ${parsedData.sources && parsedData.sources.length > 0 ? `
        <div style="margin-bottom: 1.5rem;">
          <h3 style="
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            color: ${headerColor};
            display: flex;
            align-items: center;
            gap: 0.5rem;
          ">
            <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: ${headerColor};">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            Sources (${parsedData.sources.length})
          </h3>
          <div style="padding-left: 1rem;">
            ${parsedData.sources.map((source, index) => {
              return this.createSourceAccordionSection(index + 1, source);
            }).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Additional Information -->
        ${parsedData.dateOfInformation || parsedData.recentDevelopments || parsedData.notes ? `
        <div style="margin-bottom: 1.5rem;">
          <h3 style="
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            color: ${headerColor};
            display: flex;
            align-items: center;
            gap: 0.5rem;
          ">
            <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: ${headerColor};">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6"></path>
              <path d="m21 12-6 0m-6 0-6 0"></path>
            </svg>
            Additional Information
          </h3>
          <div style="padding-left: 1rem;">
            
            ${parsedData.dateOfInformation ? this.createAdditionalInfoAccordion('Date of Information', parsedData.dateOfInformation) : ''}
            
            ${parsedData.recentDevelopments ? this.createAdditionalInfoAccordion('Recent Developments', parsedData.recentDevelopments) : ''}
            
            ${parsedData.notes ? this.createAdditionalInfoAccordion('Notes', parsedData.notes) : ''}
            
          </div>
        </div>
        ` : ''}
        </div>
      `;
    }
    
    createAccordionSection(title, content) {
      // Format content with bold labels and proper styling like Individual Claims cards
      let formattedContent = '';
      
      if (title === 'Explanation') {
        formattedContent = `
          <div style="margin-bottom: 0;">
            <span style="font-weight: 700; color: #1f2937; font-size: 1rem;">Explanation:</span>
            <div style="color: #374151; font-size: 1.125rem; font-weight: 500; line-height: 1.6; margin-top: 0.5rem;">${content}</div>
          </div>
        `;
      } else if (title === 'Most Credible Source') {
        formattedContent = `
          <div style="margin-bottom: 0;">
            <span style="font-weight: 700; color: #1f2937; font-size: 1rem;">Most Credible Source:</span>
            <div style="color: #374151; font-size: 1.125rem; font-weight: 500; line-height: 1.6; margin-top: 0.5rem;">${content}</div>
          </div>
        `;
      } else if (title === 'Limitations') {
        formattedContent = `
          <div style="margin-bottom: 0;">
            <span style="font-weight: 700; color: #1f2937; font-size: 1rem;">Limitations:</span>
            <div style="color: #374151; font-size: 1.125rem; font-weight: 500; line-height: 1.6; margin-top: 0.5rem;">${content}</div>
          </div>
        `;
      } else {
        // Generic formatting for any other detailed analysis content
        formattedContent = `
          <div style="margin-bottom: 0;">
            <span style="font-weight: 700; color: #1f2937; font-size: 1rem;">${title}:</span>
            <div style="color: #374151; font-size: 1.125rem; font-weight: 500; line-height: 1.6; margin-top: 0.5rem;">${content}</div>
          </div>
        `;
      }
      
      return `
        <div class="accordion-item" style="margin-bottom: 0.5rem;">
          <button class="accordion-trigger" onclick="window.toggleAccordion && window.toggleAccordion(this)" style="background: white; color: #1f2937;">
            <span>${title}</span>
            <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: #1f2937;">
              <polyline points="9,18 15,12 9,6"></polyline>
            </svg>
          </button>
          <div class="accordion-content collapsed" style="background: white; color: #1f2937; padding: 1rem; margin: 0;">
            ${formattedContent}
          </div>
        </div>
      `;
    }
    
    createAdditionalInfoAccordion(title, content) {
      // Format content with bold labels and proper styling like Individual Claims cards
      let formattedContent = '';
      
      if (title === 'Date of Information') {
        formattedContent = `
          <div style="margin-bottom: 0;">
            <span style="font-weight: 700; color: #1f2937; font-size: 1rem;">Information Date:</span>
            <span style="color: #374151; font-style: italic; font-size: 1.125rem; font-weight: 500;"> ${content}</span>
          </div>
        `;
      } else if (title === 'Recent Developments') {
        formattedContent = `
          <div style="margin-bottom: 0;">
            <span style="font-weight: 700; color: #1f2937; font-size: 1rem;">Recent Developments:</span>
            <span style="color: #374151; font-size: 1.125rem; font-weight: 500; line-height: 1.5;"> ${content}</span>
          </div>
        `;
      } else if (title === 'Notes') {
        formattedContent = `
          <div style="margin-bottom: 0;">
            <span style="font-weight: 700; color: #1f2937; font-size: 1rem;">Additional Notes:</span>
           <span style="color: #374151; font-size: 1.125rem; font-weight: 500; line-height: 1.5;"> ${content}</span>
          </div>
        `;
      } else {
        // Generic formatting for any other content
        formattedContent = `
          <div style="margin-bottom: 0;">
            <span style="font-weight: 700; color: #1f2937; font-size: 1rem;">${title}:</span>
            <span style="color: #374151; font-size: 1.125rem; font-weight: 500; line-height: 1.5;"> ${content}</span>
          </div>
        `;
      }
      
      return `
        <div class="accordion-item" style="margin-bottom: 0.5rem;">
          <button class="accordion-trigger" onclick="window.toggleAccordion && window.toggleAccordion(this)" style="background: white; color: #1f2937;">
            <span>${title}</span>
            <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: #1f2937;">
              <polyline points="9,18 15,12 9,6"></polyline>
            </svg>
          </button>
          <div class="accordion-content collapsed" style="background: white; color: #1f2937; padding: 1rem; margin: 0;">
            ${formattedContent}
          </div>
        </div>
      `;
    }
    
    createSourceAccordionSection(sourceNumber, source) {
      try {
        const sourceName = this.extractSourceName(source);
        const rating = this.getSourceRating(source);
        const stars = this.generateStarRating(rating);
        const cleanedSource = this.cleanAndLinkifySource(source);
        
        return `
          <div class="accordion-item" style="margin-bottom: 0.5rem;">
            <button class="accordion-trigger" onclick="window.toggleAccordion && window.toggleAccordion(this)" style="background: white; color: #1f2937;">
              <span>Source ${sourceNumber} - ${sourceName} - ${stars}</span>
              <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: #1f2937;">
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </button>
            <div class="accordion-content collapsed" style="background: white; color: #1f2937; padding: 0.75rem; margin: 0; font-size: 1.125rem; font-weight: 500;">
              ${cleanedSource}
            </div>
          </div>
        `;
      } catch (error) {
        console.error(`Error creating source accordion ${sourceNumber}:`, error);
        // Fallback to simple version
        const testStars = '⭐⭐⭐⭐⭐';
        const testName = 'Test Source';
        const cleanedSource = this.cleanAndLinkifySource(source);
        
        return `
          <div class="accordion-item">
            <button class="accordion-trigger" onclick="window.toggleAccordion && window.toggleAccordion(this)" style="background: white; color: #1f2937;">
              <span>Source ${sourceNumber} - ${testName} - ${testStars}</span>
              <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: #1f2937;">
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </button>
            <div class="accordion-content collapsed" style="background: white; color: #1f2937;">
              ${cleanedSource}
            </div>
          </div>
        `;
      }
    }
    
    setupModalEventListeners(modal, markdownContent, originalClaim, parsedData) {
      const NativeUtils = window.FCTR.modules.NativeUtils;
      const Utils = window.FCTR.modules.Utils;
      
      // Add direct event listeners for accordion functionality
      modal.querySelectorAll('.accordion-trigger').forEach(trigger => {
        trigger.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const content = this.nextElementSibling;
          const icon = this.querySelector('.feather-icon:last-child');
          
          if (content) {
            const isCollapsed = content.classList.contains('collapsed');
            
            if (isCollapsed) {
              content.classList.remove('collapsed');
              if (icon) {
                icon.innerHTML = '<polyline points="6,9 12,15 18,9"></polyline>';
              }
            } else {
              content.classList.add('collapsed');
              if (icon) {
                icon.innerHTML = '<polyline points="9,18 15,12 9,6"></polyline>';
              }
            }
          }
        });
      });
      
      // Theme toggle button
      const themeToggle = modal.querySelector('#fctr-theme-toggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', () => {
          this.toggleTheme();
        });
      }
      
      // Close button
      const closeBtn = modal.querySelector('#fctr-close-result-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          document.body.removeChild(modal);
        });
      }

      // Copy button (native clipboard API)
      const copyBtn = modal.querySelector('#fctr-copy-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
          const success = NativeUtils ? 
            await NativeUtils.copyToClipboard(markdownContent) : 
            await this.fallbackCopyToClipboard(markdownContent);
          
          const originalHTML = copyBtn.innerHTML;
          copyBtn.innerHTML = success ? '<span>Copied!</span>' : '<span>Failed</span>';
          setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
          }, 2000);
          
          if (Utils) {
            Utils.showPopup(success ? 'Copied to clipboard!' : 'Copy failed', success ? 'success' : 'error');
          }
        });
      }

      // Export HTML button (native download)
      const exportBtn = modal.querySelector('#fctr-export-btn');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          if (NativeUtils) {
            try {
              const formattedContent = NativeUtils.formatFactCheckForDisplay(parsedData, originalClaim);
              NativeUtils.exportAsHtml(formattedContent, 'fctr-analysis-report.html');
              if (Utils) {
                Utils.showPopup('Report exported successfully!', 'success');
              }
            } catch (error) {
              console.error('Export failed:', error);
              if (Utils) {
                Utils.showPopup('Export failed. Please try again.', 'error');
              }
            }
          } else {
            if (Utils) {
              Utils.showPopup('Export feature not available', 'error');
            }
          }
        });
      }

      // Print button (native print API with popup blocker detection)
      const printBtn = modal.querySelector('#fctr-print-btn');
      if (printBtn) {
        printBtn.addEventListener('click', () => {
          if (NativeUtils) {
            try {
              const formattedContent = NativeUtils.formatFactCheckForDisplay(parsedData, originalClaim);
              const printResult = NativeUtils.printContent(formattedContent, 'FCTR Analysis Report');
              
              // Check if print window was blocked (this is a basic check)
              setTimeout(() => {
                if (printResult === false) {
                  if (Utils) {
                    Utils.showPopup('Popup blocker detected. Please allow popups for this site and try again.', 'warning');
                  }
                }
              }, 1000);
              
            } catch (error) {
              console.error('Print failed:', error);
              if (Utils) {
                Utils.showPopup('Print failed. Please try again.', 'error');
              }
            }
          } else {
            // Fallback: try browser print
            try {
              window.print();
            } catch (error) {
              if (Utils) {
                Utils.showPopup('Print feature not available', 'error');
              }
            }
          }
        });
      }

      // Close modal when clicking outside
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });
    }
    
    // Fallback clipboard function
    async fallbackCopyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        
        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
          document.execCommand('copy');
          document.body.removeChild(textArea);
          return true;
        } catch (fallbackErr) {
          document.body.removeChild(textArea);
          return false;
        }
      }
    }
    
    // Keep all the existing helper methods for source processing
    cleanAndLinkifySource(source) {
      // Parse markdown-style links: [Title](URL) - rating
      const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/;
      
      let cleaned = source.trim();
      
      // Check if it's a markdown link
      const match = markdownLinkRegex.exec(source);
      if (match) {
        const title = match[1];
        const url = match[2];
        
        // Create compact HTML structure without rating
        cleaned = `<div style="margin: 0; padding: 0; line-height: 1.3;">
<strong style="color: #1f2937; display: block; margin: 0 0 2px 0; font-size: 0.95em; font-weight: 600;">${title}</strong>
<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #0693E3; text-decoration: underline; word-break: break-all; font-size: 0.875em; margin: 0; display: block;">${url}</a>
</div>`;
      } else {
        // Fallback for non-markdown content
        cleaned = source
          .replace(/[\[\]()]/g, '') // Remove brackets and parentheses
          .replace(/^\d+\.\s*/, '') // Remove leading numbers like "1. "
          .replace(/\s*-\s*\d+\s*stars?\s*$/i, '') // Remove star ratings from the end
          .trim();
        
        // Simple line breaks for plain text
        cleaned = cleaned
          .replace(/\.\s+/g, '.<br>')
          .replace(/\s*;\s*/g, '<br>')
          .replace(/\s*\|\s*/g, '<br>');
        
        // Convert URLs to clickable links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        cleaned = cleaned.replace(urlRegex, (url) => {
          const cleanUrl = url.replace(/[.,;:!?]+$/, '');
          return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" style="color: #0693E3; text-decoration: underline; word-break: break-all; margin: 0; line-height: 1.3;">${cleanUrl}</a>`;
        });
        
        // Wrap in container with tight spacing
        cleaned = `<div style="margin: 0; padding: 0; line-height: 1.3;">${cleaned}</div>`;
      }
      
      return cleaned;
    }
    
    extractSourceName(source) {
      // Check if it's markdown format first: [Title](URL)
      const markdownLinkRegex = /\[([^\]]+)\]/;
      const markdownMatch = source.match(markdownLinkRegex);
      
      if (markdownMatch) {
        // Extract title from markdown
        const title = markdownMatch[1];
        
        // If title contains " – " split on that and take the last part (organization name)
        if (title.includes(' – ')) {
          const result = title.split(' – ').pop().trim();
          return result;
        }
        // If title contains " - " split on that and take the last part
        if (title.includes(' - ')) {
          const result = title.split(' - ').pop().trim();
          return result;
        }
        // Otherwise return the whole title, but limit length
        const result = title.length > 30 ? title.substring(0, 30) + '...' : title;
        return result;
      }
      
      // Fallback to URL-based extraction
      const urlMatch = source.match(/https?:\/\/(?:www\.)?([^\/\s]+)/);
      if (urlMatch) {
        const domain = urlMatch[1].toLowerCase();
        
        // Map common domains to readable names
        if (domain.includes('mountvernon')) return 'Mount Vernon';
        if (domain.includes('reuters')) return 'Reuters';
        if (domain.includes('bbc')) return 'BBC';
        if (domain.includes('cnn')) return 'CNN';
        if (domain.includes('nytimes')) return 'New York Times';
        if (domain.includes('washingtonpost')) return 'Washington Post';
        if (domain.includes('theguardian')) return 'The Guardian';
        if (domain.includes('ap.org') || domain.includes('apnews')) return 'Associated Press';
        if (domain.includes('npr')) return 'NPR';
        if (domain.includes('bloomberg')) return 'Bloomberg';
        if (domain.includes('wsj') || domain.includes('wallstreetjournal')) return 'Wall Street Journal';
        if (domain.includes('forbes')) return 'Forbes';
        if (domain.includes('time.com')) return 'Time';
        if (domain.includes('economist')) return 'The Economist';
        if (domain.includes('politico')) return 'Politico';
        if (domain.includes('axios')) return 'Axios';
        if (domain.includes('ft.com')) return 'Financial Times';
        if (domain.includes('usatoday')) return 'USA Today';
        if (domain.includes('cbsnews')) return 'CBS News';
        if (domain.includes('abcnews')) return 'ABC News';
        if (domain.includes('nbcnews')) return 'NBC News';
        if (domain.includes('foxnews')) return 'Fox News';
        if (domain.includes('wikipedia')) return 'Wikipedia';
        if (domain.includes('britannica')) return 'Britannica';
        if (domain.includes('history.com')) return 'History.com';
        if (domain.includes('encyclopediavirginia')) return 'Encyclopedia Virginia';
        if (domain.includes('gov')) return 'Government Source';
        if (domain.includes('edu')) return 'Academic Source';
        
        // Fallback: capitalize domain name
        return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
      }
      
      // If no URL, try to extract from beginning of text
      const words = source.split(' ').slice(0, 3).join(' ');
      return words.length > 30 ? words.substring(0, 30) + '...' : words;
    }
    
    getSourceRating(source) {
      // Check if rating is already in the source text (markdown format)
      const ratingMatch = source.match(/(\d+)\s*stars?/i);
      
      if (ratingMatch) {
        const rating = parseInt(ratingMatch[1]);
        return rating;
      }
      
      // Fallback to algorithm
      const sourceText = source.toLowerCase();
      let rating = 3; // Base rating
      
      // High-credibility sources
      if (sourceText.includes('mountvernon') || sourceText.includes('reuters') || 
          sourceText.includes('ap.org') || sourceText.includes('bbc') || 
          sourceText.includes('npr')) {
        rating = 5;
      }
      // Major newspapers
      else if (sourceText.includes('nytimes') || sourceText.includes('washingtonpost') || 
               sourceText.includes('wsj') || sourceText.includes('theguardian') || 
               sourceText.includes('economist')) {
        rating = 5;
      }
      // Government and academic sources
      else if (sourceText.includes('.gov') || sourceText.includes('.edu') || 
               sourceText.includes('academic') || sourceText.includes('university')) {
        rating = 4;
      }
      // History and educational sites
      else if (sourceText.includes('history.com') || sourceText.includes('encyclopedia') ||
               sourceText.includes('britannica')) {
        rating = 4;
      }
      // Other major news outlets
      else if (sourceText.includes('cnn') || sourceText.includes('bloomberg') || 
               sourceText.includes('forbes') || sourceText.includes('time.com') || 
               sourceText.includes('politico') || sourceText.includes('axios')) {
        rating = 4;
      }
      // Wikipedia and reference sources
      else if (sourceText.includes('wikipedia')) {
        rating = 3;
      }
      // Social media or blog sources
      else if (sourceText.includes('twitter') || sourceText.includes('facebook') || 
               sourceText.includes('blog') || sourceText.includes('medium.com')) {
        rating = 2;
      }
      
      return Math.max(1, Math.min(5, rating)); // Ensure rating is between 1-5
    }
    
    generateStarRating(rating) {
      const totalStars = 5;
      let stars = '';
      
      for (let i = 1; i <= totalStars; i++) {
        if (i <= rating) {
          // Filled star
          stars += `<svg style="width: 12px; height: 12px; margin: 0 1px; vertical-align: middle;" viewBox="0 0 24 24" fill="#1f2937" stroke="#1f2937" stroke-width="1">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
          </svg>`;
        } else {
          // Empty star (outline only)
          stars += `<svg style="width: 12px; height: 12px; margin: 0 1px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#1f2937" stroke-width="1">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
          </svg>`;
        }
      }
      
      return stars;
    }
    
    // Basic parsing fallback (in case results-parsing.js doesn't load)
    parseFactCheckResponse(markdownContent) {
      return {
        claim: '',
        verdict: 'See analysis',
        confidence: 'N/A',
        explanation: markdownContent,
        sources: [],
        mostCredibleSource: '',
        limitations: '',
        individualClaims: []
      };
    }

    // NEW: Show AI Origin detection results - MATCHES existing modal behavior
    async showAiOriginResult(responseData, originalClaim) {
      console.log('Showing AI origin detection results');
      
      // Load theme preference first
      await this.loadThemePreference();
      
      // Remove existing modal
      const existingModal = document.getElementById('fctr-result-popup');
      if (existingModal) existingModal.remove();
      
      // Parse AI detection response
      const parsedData = this.parseAiDetectionResponse(responseData);
      
      // Create modal with same styling as fact check
      const modal = document.createElement("div");
      modal.id = 'fctr-result-popup';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        z-index: 2147483646;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      `;
      
      modal.innerHTML = this.createAiDetectionModalHTML(parsedData, originalClaim);
      document.body.appendChild(modal);
      
      // Apply theme after modal is added to DOM
      setTimeout(() => this.applyTheme(), 10);
      
      // Setup event listeners
      this.setupAiDetectionEventListeners(modal, responseData, originalClaim, parsedData);
      
      console.log('AI origin detection modal displayed successfully');
    }

    // NEW: Create AI detection modal HTML - MATCHES existing fact check styling
    createAiDetectionModalHTML(parsedData, originalClaim) {
      const AiDetectionIcons = window.FCTR.modules.AiDetectionIcons;
      const ModalStyles = window.FCTR.modules.ModalStyles;
      const selectedIcon = AiDetectionIcons ? AiDetectionIcons[parsedData.icon] || AiDetectionIcons.analysisFailed : '🤖';
      
      // Use same theme-aware styling as fact check
      const modalBg = this.currentTheme === 'dark' ? 'black' : 'white';
      const modalBorder = this.currentTheme === 'dark' ? '#374151' : '#e5e7eb';
      const headerColor = this.currentTheme === 'dark' ? 'white' : '#1f2937';
      const contentColor = this.currentTheme === 'dark' ? 'white' : '#1f2937';
      
      return `
        <div class="results-modal" style="
          background: ${modalBg};
          border: 1px solid ${modalBorder};
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        ">
          ${ModalStyles ? ModalStyles.getResultsModalStyles() : ''}

          <!-- SAME HEADER AS FACT CHECK -->
          <div class="modal-header" style="
            padding: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            background: ${modalBg};
            position: sticky;
            top: 0;
            z-index: 10;
            border: none !important;
            border-bottom: none !important;
          ">
            <h2 style="
              font-size: 1.875rem;
              font-weight: 400;
              color: ${headerColor};
              margin: 0;
              margin-left: 60px;
              flex-grow: 1;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              border: none !important;
              border-bottom: none !important;
              text-decoration: none !important;
              box-shadow: none !important;
              outline: none !important;
            ">
              <span style="
                font-weight: 900; 
                letter-spacing: -8.5px; 
                font-size: 7.5rem; 
                color: ${headerColor};
                border: none !important;
                border-bottom: none !important;
                text-decoration: none !important;
                box-shadow: none !important;
                outline: none !important;
              ">fctr</span>
            </h2>

            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <button id="fctr-copy-btn" class="btn btn-secondary btn-sm" style="background: white; color: black; border: 1px solid white;">
                <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: black;">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
              </button>
              <button id="fctr-export-btn" class="btn btn-primary btn-sm" style="background: white; color: black; border: 1px solid white;">
                <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: black;">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7,10 12,15 17,10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export HTML
              </button>
              <button id="fctr-print-btn" class="btn btn-primary btn-sm" style="background: white; color: black; border: 1px solid white;">
                <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: black;">
                  <polyline points="6,9 6,2 18,2 18,9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <polyline points="6,14 6,22 18,22 18,14"></polyline>
                </svg>
                Print/PDF
              </button>
              <button id="fctr-theme-toggle" class="btn btn-ghost btn-sm" style="background: transparent; color: ${headerColor};" title="Toggle theme">
                ${this.currentTheme === 'dark' ? `
                  <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: ${headerColor};">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                ` : `
                  <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: ${headerColor};">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                `}
              </button>
              <button id="fctr-close-result-btn" class="btn btn-ghost btn-sm" style="background: transparent; color: ${headerColor};">
                <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: ${headerColor};">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- AI Detection Content -->
          <div class="modal-content" style="padding: 1.5rem; overflow-y: auto; flex: 1; border: none !important; border-top: none !important; background: ${modalBg};">
            ${this.createAiDetectionContentSections(parsedData, originalClaim)}
          </div>
        </div>
      `;
    }

    // NEW: Create AI detection content sections
    createAiDetectionContentSections(parsedData, originalClaim) {
      const AiDetectionIcons = window.FCTR.modules.AiDetectionIcons;
      const selectedIcon = AiDetectionIcons ? AiDetectionIcons[parsedData.icon] || AiDetectionIcons.analysisFailed : '🤖';
      const headerColor = this.currentTheme === 'dark' ? 'white' : '#1f2937';
      
      return `
        <!-- Original Text -->
        <div style="margin-bottom: 1.5rem;">
          <h3 style="
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            color: ${headerColor};
            display: flex;
            align-items: center;
            gap: 0.5rem;
          ">
            <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: ${headerColor};">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            Analyzed Text
          </h3>
          <div style="
            background: white;
            border: 1px solid #e5e7eb;
            border-left: 4px solid #3b82f6;
            border-radius: 0.5rem;
            padding: 1rem;
          ">
            <p style="
              color: #1f2937;
              font-size: 0.95rem;
              font-style: italic;
              line-height: 1.6;
              margin: 0;
            ">
              "${originalClaim.length > 200 ? originalClaim.substring(0, 200) + '...' : originalClaim}"
            </p>
          </div>
        </div>

        <!-- AI Detection Results -->
        <div style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        ">
          <div style="
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1.5rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          ">
            <div style="margin-bottom: 0.75rem; color: #1f2937;">
              ${selectedIcon}
            </div>
            <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.25rem; color: #1f2937;">
              ${parsedData.classification}
            </div>
            <div style="font-size: 0.875rem; color: #6b7280;">Classification</div>
          </div>
          <div style="
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          ">
            <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.25rem; color: #1f2937;">
              ${parsedData.confidence}
            </div>
            <div style="font-size: 0.875rem; color: #6b7280;">Confidence Level</div>
          </div>
        </div>

        <!-- Classification Description -->
        <div style="margin-bottom: 1.5rem;">
          <div style="
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1.5rem;
          ">
            <h4 style="
              margin: 0 0 0.75rem 0;
              font-size: 1rem;
              font-weight: 600;
              color: #1f2937;
            ">
              What This Means
            </h4>
            <p style="
              margin: 0;
              font-size: 0.9rem;
              color: #374151;
              line-height: 1.5;
            ">
              ${this.getClassificationDescription(parsedData.classification)}
            </p>
          </div>
        </div>

        <!-- Detailed Analysis -->
        <div style="margin-bottom: 1.5rem;">
          <h3 style="
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            color: ${headerColor};
            display: flex;
            align-items: center;
            gap: 0.5rem;
          ">
            <svg class="feather-icon" viewBox="0 0 24 24" style="stroke: ${headerColor};">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            Detailed Analysis
          </h3>
          <div style="padding-left: 1rem;">
            ${this.createAccordionSection('Analysis Report', parsedData.analysisText || 'No detailed analysis available.')}
          </div>
        </div>
      `;
    }

    // NEW: Get description text for each classification
    getClassificationDescription(classification) {
      const descriptions = {
        'AI Generated': 'This content appears to be primarily generated by artificial intelligence systems with typical AI writing patterns.',
        'Human Written': 'This content shows clear signs of human authorship with natural writing patterns and personal voice.',
        'Mixed Content': 'This content shows characteristics of both AI generation and human writing, possibly AI-assisted.',
        'Partial': 'Some portions of this content may have been AI-assisted while others appear human-written.',
        'Unknown': 'Unable to determine the origin of this content with sufficient confidence.',
        'Analysis Failed': 'The analysis could not be completed due to technical issues or insufficient content.'
      };
      
      // Try exact match first, then partial match
      if (descriptions[classification]) {
        return descriptions[classification];
      }
      
      const classLower = classification.toLowerCase();
      if (classLower.includes('ai') || classLower.includes('generated')) {
        return descriptions['AI Generated'];
      } else if (classLower.includes('human') || classLower.includes('written')) {
        return descriptions['Human Written'];
      } else if (classLower.includes('mixed') || classLower.includes('partial')) {
        return descriptions['Mixed Content'];
      }
      
      return 'Classification analysis complete. See detailed analysis for more information.';
    }

    // NEW: Setup AI detection event listeners - MATCHES existing behavior
    setupAiDetectionEventListeners(modal, responseData, originalClaim, parsedData) {
      const NativeUtils = window.FCTR.modules.NativeUtils;
      const Utils = window.FCTR.modules.Utils;
      
      // Accordion functionality (same as fact check)
      modal.querySelectorAll('.accordion-trigger').forEach(trigger => {
        trigger.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const content = this.nextElementSibling;
          const icon = this.querySelector('.feather-icon:last-child');
          
          if (content) {
            const isCollapsed = content.classList.contains('collapsed');
            
            if (isCollapsed) {
              content.classList.remove('collapsed');
              if (icon) {
                icon.innerHTML = '<polyline points="6,9 12,15 18,9"></polyline>';
              }
            } else {
              content.classList.add('collapsed');
              if (icon) {
                icon.innerHTML = '<polyline points="9,18 15,12 9,6"></polyline>';
              }
            }
          }
        });
      });
      
      // Theme toggle (same as fact check)
      const themeToggle = modal.querySelector('#fctr-theme-toggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', () => {
          this.toggleTheme();
        });
      }
      
      // Close button (same as fact check)
      const closeBtn = modal.querySelector('#fctr-close-result-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          document.body.removeChild(modal);
        });
      }

      // Copy button (adapted for AI detection)
      const copyBtn = modal.querySelector('#fctr-copy-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
          const fullText = `AI Origin Analysis Report

Classification: ${parsedData.classification}
Confidence: ${parsedData.confidence}

Description: ${this.getClassificationDescription(parsedData.classification)}

Detailed Analysis:
${parsedData.analysisText}

Original Text:
"${originalClaim}"

Report generated on ${new Date().toLocaleString()}
Generated by fctr - https://totmailabs.com`;
          
          const success = NativeUtils ? 
            await NativeUtils.copyToClipboard(fullText) : 
            await this.fallbackCopyToClipboard(fullText);
          
          const originalHTML = copyBtn.innerHTML;
          copyBtn.innerHTML = success ? '<span>Copied!</span>' : '<span>Failed</span>';
          setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
          }, 2000);
          
          if (Utils) {
            Utils.showPopup(success ? 'Copied to clipboard!' : 'Copy failed', success ? 'success' : 'error');
          }
        });
      }

      // Export button (adapted for AI detection)
      const exportBtn = modal.querySelector('#fctr-export-btn');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          try {
            const htmlContent = this.formatAiDetectionForExport(parsedData, originalClaim);
            
            if (NativeUtils) {
              NativeUtils.exportAsHtml(htmlContent, 'fctr-ai-origin-report.html');
            } else {
              // Fallback download method
              const blob = new Blob([htmlContent], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `fctr-ai-origin-${Date.now()}.html`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
            
            if (Utils) {
              Utils.showPopup('Report exported successfully!', 'success');
            }
          } catch (error) {
            console.error('Export failed:', error);
            if (Utils) {
              Utils.showPopup('Export failed. Please try again.', 'error');
            }
          }
        });
      }

      // Print button (adapted for AI detection)
      const printBtn = modal.querySelector('#fctr-print-btn');
      if (printBtn) {
        printBtn.addEventListener('click', () => {
          try {
            const htmlContent = this.formatAiDetectionForExport(parsedData, originalClaim);
            
            if (NativeUtils) {
              const printResult = NativeUtils.printContent(htmlContent, 'FCTR AI Origin Analysis Report');
              
              setTimeout(() => {
                if (printResult === false && Utils) {
                  Utils.showPopup('Popup blocker detected. Please allow popups for this site and try again.', 'warning');
                }
              }, 1000);
            } else {
              // Fallback: try browser print
              window.print();
            }
          } catch (error) {
            console.error('Print failed:', error);
            if (Utils) {
              Utils.showPopup('Print failed. Please try again.', 'error');
            }
          }
        });
      }

      // Close on outside click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });
    }

    // NEW: Format AI detection results for export
    formatAiDetectionForExport(parsedData, originalClaim) {
      return `
<!DOCTYPE html>
<html>
<head>
  <title>FCTR AI Origin Analysis Report</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
      margin: 2rem; 
      line-height: 1.6;
    }
    .header { 
      border-bottom: 2px solid #1f2937; 
      padding-bottom: 1rem; 
      margin-bottom: 2rem; 
    }
    .result { 
      background: #f8f9fa; 
      padding: 1.5rem; 
      border-radius: 8px; 
      margin: 1rem 0; 
      border-left: 4px solid #3b82f6;
    }
    .classification { 
      font-size: 1.5rem; 
      font-weight: bold; 
      color: #1f2937; 
      margin-bottom: 0.5rem;
    }
    .confidence {
      font-size: 1.125rem;
      color: #6b7280;
      margin-bottom: 1rem;
    }
    .description {
      font-size: 1rem;
      color: #374151;
      margin-bottom: 1rem;
    }
    .analysis { 
      white-space: pre-wrap; 
      margin: 1rem 0; 
      line-height: 1.6; 
      background: white;
      padding: 1rem;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .original { 
      background: #e7f3ff; 
      padding: 1.5rem; 
      border-left: 4px solid #0066cc; 
      border-radius: 6px;
      margin: 1rem 0;
    }
    .icon {
      font-size: 2rem;
      margin-right: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 FCTR AI Origin Analysis Report</h1>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  </div>
  
  <div class="result">
    <div class="classification">
      <span class="icon">${this.getIconForClassification(parsedData.classification)}</span>
      Classification: ${parsedData.classification}
    </div>
    <div class="confidence">Confidence: ${parsedData.confidence}</div>
    <div class="description">${this.getClassificationDescription(parsedData.classification)}</div>
  </div>
  
  <h2>Detailed Analysis</h2>
  <div class="analysis">${parsedData.analysisText}</div>
  
  <h2>Original Text Analyzed</h2>
  <div class="original">
    <strong>Text:</strong><br>
    "${originalClaim}"
  </div>
  
  <footer style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; font-size: 0.875rem; color: #6b7280;">
    <p>Report generated by <strong>fctr</strong> extension</p>
    <p>Visit <a href="https://totmailabs.com">totmailabs.com</a> for more information</p>
  </footer>
</body>
</html>
      `;
    }

    // Helper method to get emoji icon for classification
    getIconForClassification(classification) {
      const classLower = classification.toLowerCase();
      if (classLower.includes('ai') || classLower.includes('generated')) {
        return '🤖';
      } else if (classLower.includes('human') || classLower.includes('written')) {
        return '✍️';
      } else if (classLower.includes('mixed') || classLower.includes('partial')) {
        return '🔄';
      }
      return '❓';
    }
  }
  
  // Register module
  if (!window.FCTR) window.FCTR = { modules: {} };
  window.FCTR.modules.ResultsDisplay = ResultsDisplay;
  
})();