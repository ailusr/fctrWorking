// modules/results-display-native.js - Results display with native Chrome APIs
(function() {
  'use strict';
  
  class ResultsDisplay {
    constructor() {
      console.log('ResultsDisplay initialized with native APIs');
      this.setupAccordionToggle();
    }
    
    setupAccordionToggle() {
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
          
          console.log('Accordion toggled:', isCollapsed ? 'expanded' : 'collapsed');
          
        } catch (error) {
          console.error('Error toggling accordion:', error);
        }
      };
    }
    
    showResult(markdownContent, originalClaim) {
      console.log('Showing fact check results with native APIs');
      
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
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        z-index: 2147483646;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;

      // Create the complete modern modal HTML
      modal.innerHTML = this.createModalHTML(parsedData, originalClaim);
      document.body.appendChild(modal);
      
      // Setup event listeners with native functionality
      this.setupModalEventListeners(modal, markdownContent, originalClaim, parsedData);
      
      console.log('Modal displayed successfully with native features');
    }
    
    createModalHTML(parsedData, originalClaim) {
      const Utils = window.FCTR.modules.Utils;
      const NativeUtils = window.FCTR.modules.NativeUtils;
      const ModalStyles = window.FCTR.modules.ModalStyles;
      
      return `
        <div class="results-modal" style="
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        ">
          ${ModalStyles ? ModalStyles.getResultsModalStyles() : ''}

          <!-- Header -->
          <div style="
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            background: white;
            position: sticky;
            top: 0;
            z-index: 10;
          ">
            <h2 style="
              font-size: 1.5rem;
              font-weight: 600;
              color: #1f2937;
              margin: 0;
              flex-grow: 1;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            ">
              <svg class="feather-icon" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              Fact Check Results
            </h2>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <button id="fctr-copy-btn" class="btn btn-secondary btn-sm">
                <svg class="feather-icon" viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
              </button>
              <button id="fctr-export-btn" class="btn btn-primary btn-sm">
                <svg class="feather-icon" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7,10 12,15 17,10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export HTML
              </button>
              <button id="fctr-print-btn" class="btn btn-secondary btn-sm">
                <svg class="feather-icon" viewBox="0 0 24 24">
                  <polyline points="6,9 6,2 18,2 18,9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <polyline points="6,14 6,22 18,22 18,14"></polyline>
                </svg>
                Print
              </button>
              <button id="fctr-close-result-btn" class="btn btn-ghost btn-sm">
                <svg class="feather-icon" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div style="padding: 1.5rem; overflow-y: auto; flex: 1;">
            ${this.createContentSections(parsedData, originalClaim)}
          </div>
        </div>
      `;
    }
    
    createContentSections(parsedData, originalClaim) {
      const Utils = window.FCTR.modules.Utils;
      
      return `
        <!-- Original Claim -->
        <div style="margin-bottom: 1.5rem;">
          <h3 style="
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            color: #1f2937;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          ">
            Original Claim
          </h3>
          <div style="
            background: rgba(59, 130, 246, 0.05);
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
          ">
            <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.25rem;">
              ${Utils ? Utils.getVerdictBadge(parsedData.verdict) : parsedData.verdict || 'Unknown'}
            </div>
            <div style="font-size: 0.875rem; color: #6b7280;">Overall Verdict</div>
          </div>
          <div style="
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1rem;
            text-align: center;
          ">
            <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.25rem;">
              ${parsedData.confidence || 'N/A'}
            </div>
            <div style="font-size: 0.875rem; color: #6b7280;">Confidence Score</div>
          </div>
          <div style="
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1rem;
            text-align: center;
          ">
            <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.25rem;">
              ${parsedData.sources.length}
            </div>
            <div style="font-size: 0.875rem; color: #6b7280;">Sources Found</div>
          </div>
        </div>

        <!-- Detailed Analysis -->
        <div style="margin-bottom: 1.5rem;">
          <h3 style="
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            color: #1f2937;
          ">
            Detailed Analysis
          </h3>
          <div style="padding-left: 1.5rem;">
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
            color: #1f2937;
          ">
            Sources (${parsedData.sources.length})
          </h3>
          <div style="padding-left: 1.5rem;">
            ${parsedData.sources.map((source, index) => 
              this.createAccordionSection(`Source ${index + 1}`, source)
            ).join('')}
          </div>
        </div>
        ` : ''}
      `;
    }
    
    createAccordionSection(title, content) {
      return `
        <div class="accordion-item">
          <button class="accordion-trigger" onclick="window.toggleAccordion && window.toggleAccordion(this)">
            <span>${title}</span>
            <svg class="feather-icon" viewBox="0 0 24 24">
              <polyline points="9,18 15,12 9,6"></polyline>
            </svg>
          </button>
          <div class="accordion-content collapsed">
            ${content}
          </div>
        </div>
      `;
    }
    
    // Setup modal event listeners with native functionality
    setupModalEventListeners(modal, markdownContent, originalClaim, parsedData) {
      const NativeUtils = window.FCTR.modules.NativeUtils;
      const Utils = window.FCTR.modules.Utils;
      
      // Accordion functionality
      modal.querySelectorAll('.accordion-trigger').forEach(trigger => {
        trigger.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          window.toggleAccordion(this);
        });
      });
      
      // Close button
      modal.querySelector('#fctr-close-result-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
      });

      // Copy button (native clipboard API)
      modal.querySelector('#fctr-copy-btn').addEventListener('click', async () => {
        const success = await (NativeUtils ? NativeUtils.copyToClipboard(markdownContent) : Utils.copyToClipboard(markdownContent));
        const btn = modal.querySelector('#fctr-copy-btn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = success ? '<span>Copied!</span>' : '<span>Failed</span>';
        setTimeout(() => {
          btn.innerHTML = originalHTML;
        }, 2000);
      });

      // Export HTML button (native download)
      modal.querySelector('#fctr-export-btn').addEventListener('click', () => {
        if (NativeUtils) {
          const formattedContent = NativeUtils.formatFactCheckForDisplay(parsedData, originalClaim);
          NativeUtils.exportAsHtml(formattedContent, 'fctr-analysis-report.html');
          Utils.showPopup('Report exported successfully!', 'success');
        } else {
          Utils.showPopup('Export feature not available', 'error');
        }
      });

      // Print button (native print API)
      modal.querySelector('#fctr-print-btn').addEventListener('click', () => {
        if (NativeUtils) {
          const formattedContent = NativeUtils.formatFactCheckForDisplay(parsedData, originalClaim);
          NativeUtils.printContent(formattedContent, 'FCTR Analysis Report');
        } else {
          Utils.showPopup('Print feature not available', 'error');
        }
      });

      // Close modal when clicking outside
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });
    }
    
    // Keep existing parsing functionality (this would come from results-parsing.js)
    parseFactCheckResponse(markdownContent) {
      // Basic parsing - you can enhance this
      const result = {
        claim: '',
        verdict: '',
        confidence: '',
        explanation: '',
        sources: [],
        mostCredibleSource: '',
        limitations: ''
      };

      try {
        const content = markdownContent.replace(/\*\*/g, '');
        
        // Extract verdict
        const verdictMatch = content.match(/(?:verdict|assessment):\s*([^.\n]+)/i);
        if (verdictMatch) {
          result.verdict = verdictMatch[1].trim();
        }
        
        // Extract confidence
        const confidenceMatch = content.match(/confidence:\s*([^.\n]+)/i);
        if (confidenceMatch) {
          result.confidence = confidenceMatch[1].trim();
        }
        
        // Extract explanation (everything else)
        result.explanation = markdownContent;
        
        // Extract sources (URLs)
        const urlMatches = content.match(/https?:\/\/[^\s]+/g);
        if (urlMatches) {
          result.sources = [...new Set(urlMatches)].slice(0, 5);
        }
        
      } catch (error) {
        console.error('Error parsing response:', error);
        result.explanation = markdownContent;
        result.verdict = 'See analysis';
      }

      return result;
    }
  }
  
  // Register module
  if (!window.FCTR) window.FCTR = { modules: {} };
  window.FCTR.modules.ResultsDisplay = ResultsDisplay;
  
})();