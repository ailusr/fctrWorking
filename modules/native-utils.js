// modules/native-utils.js - Native Chrome extension utilities
(function() {
  'use strict';
  
  class NativeUtils {
    
    // Simple markdown parser using only built-in JavaScript
    static parseMarkdown(markdown) {
      if (!markdown) return '';
      
      return markdown
        // Headers
        .replace(/^### (.*$)/gim, '<h3 style="font-size: 1.2em; font-weight: bold; margin: 16px 0 8px 0; color: #1f2937;">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 style="font-size: 1.4em; font-weight: bold; margin: 18px 0 10px 0; color: #1f2937;">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 style="font-size: 1.6em; font-weight: bold; margin: 20px 0 12px 0; color: #1f2937;">$1</h1>')
        
        // Bold and italic
        .replace(/\*\*(.*?)\*\*/gim, '<strong style="font-weight: bold;">$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em style="font-style: italic;">$1</em>')
        
        // Lists
        .replace(/^\* (.*$)/gim, '<li style="margin: 4px 0; padding-left: 8px;">$1</li>')
        .replace(/^- (.*$)/gim, '<li style="margin: 4px 0; padding-left: 8px;">$1</li>')
        .replace(/^\d+\. (.*$)/gim, '<li style="margin: 4px 0; padding-left: 8px; list-style-type: decimal;">$1</li>')
        
        // Line breaks and paragraphs
        .replace(/\n\n/g, '</p><p style="margin: 12px 0; line-height: 1.6;">')
        .replace(/\n/g, '<br>')
        
        // Wrap in paragraph if not already wrapped
        .replace(/^(?!<[h|l|p])/gim, '<p style="margin: 12px 0; line-height: 1.6;">')
        .replace(/(?<![>])$/gim, '</p>');
    }
    
    // Export content as HTML file using Chrome Downloads API
    static exportAsHtml(content, filename = 'fctr-report.html') {
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FCTR Analysis Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #0693E3;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #0693E3;
            margin: 0;
        }
        .section {
            margin: 30px 0;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge.true { background: #d4edda; color: #155724; }
        .badge.false { background: #f8d7da; color: #721c24; }
        .badge.partial { background: #fff3cd; color: #856404; }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>FCTR Fact Check Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="content">
        ${content}
    </div>
    
    <div class="no-print" style="margin-top: 40px; text-align: center; color: #666;">
        <p>Use Ctrl+P or Cmd+P to print or save as PDF</p>
    </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Use Chrome downloads API if available
      if (chrome.downloads) {
        chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: true
        });
      } else {
        // Fallback: create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
    
    // Copy content to clipboard using native API
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
    
    // Print content using Chrome's print API
    static printContent(content, title = 'FCTR Report') {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                line-height: 1.6;
              }
              h1, h2, h3 { color: #1f2937; }
              .header { text-align: center; margin-bottom: 30px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${title}</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Auto-trigger print dialog
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
    
    // Format fact check data using native parsing
    static formatFactCheckForDisplay(parsedData, originalClaim) {
      const sections = [];
      
      // Header
      sections.push(`<h1>FCTR Fact Check Results</h1>`);
      
      // Original Claim
      if (originalClaim || parsedData.claim) {
        sections.push(`<h2>Original Claim</h2>`);
        sections.push(`<blockquote style="border-left: 4px solid #0693E3; padding-left: 16px; margin: 16px 0; font-style: italic;">${originalClaim || parsedData.claim}</blockquote>`);
      }
      
      // Verdict with badge
      if (parsedData.verdict) {
        const verdictClass = parsedData.verdict.toLowerCase().includes('true') ? 'true' : 
                           parsedData.verdict.toLowerCase().includes('false') ? 'false' : 'partial';
        sections.push(`<h2>Verdict</h2>`);
        sections.push(`<p><span class="badge ${verdictClass}">${parsedData.verdict}</span></p>`);
      }
      
      // Confidence
      if (parsedData.confidence) {
        sections.push(`<h2>Confidence Level</h2>`);
        sections.push(`<p>${parsedData.confidence}</p>`);
      }
      
      // Explanation
      if (parsedData.explanation) {
        sections.push(`<h2>Analysis</h2>`);
        sections.push(`<div>${this.parseMarkdown(parsedData.explanation)}</div>`);
      }
      
      // Sources
      if (parsedData.sources && parsedData.sources.length > 0) {
        sections.push(`<h2>Sources (${parsedData.sources.length})</h2>`);
        sections.push('<ol>');
        parsedData.sources.forEach(source => {
          sections.push(`<li>${source}</li>`);
        });
        sections.push('</ol>');
      }
      
      // Most Credible Source
      if (parsedData.mostCredibleSource) {
        sections.push(`<h2>Most Credible Source</h2>`);
        sections.push(`<p>${parsedData.mostCredibleSource}</p>`);
      }
      
      // Limitations
      if (parsedData.limitations) {
        sections.push(`<h2>Limitations</h2>`);
        sections.push(`<p>${parsedData.limitations}</p>`);
      }
      
      return sections.join('\n');
    }
    
    // Show popup notification (native browser notification)
    static showNotification(message, type = 'info') {
      // Try to use Chrome notifications API if available
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/icon48.png'),
          title: 'FCTR',
          message: message
        });
      } else {
        // Fallback: in-page notification
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: ${type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : '#0693E3'};
          color: white;
          padding: 16px 20px;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          z-index: 2147483647;
          max-width: 300px;
          animation: slideIn 0.3s ease-out;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
              }
            }, 300);
          }
        }, 4000);
      }
    }
  }
  
  // Register module
  if (!window.FCTR) window.FCTR = { modules: {} };
  window.FCTR.modules.NativeUtils = NativeUtils;
  
  console.log('📦 NativeUtils module loaded - no external dependencies!');
  
})();