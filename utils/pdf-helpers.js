// utils/pdf-helpers.js - PDF generation utilities for FCTR extension

// Check if required libraries are loaded
function checkPdfLibraries() {
  const missing = [];
  if (typeof pdfMake === 'undefined') missing.push('pdfMake');
  if (typeof marked === 'undefined') missing.push('marked');
  return missing;
}

// Convert markdown to structured PDF content
function convertMarkdownToPdfContent(markdownText, title = 'Document') {
  try {
    const missing = checkPdfLibraries();
    if (missing.length > 0) {
      throw new Error(`Missing required libraries: ${missing.join(', ')}`);
    }

    // Use marked library if available, otherwise use simple conversion
    let htmlContent;
    if (typeof marked !== 'undefined') {
      htmlContent = marked.parse(markdownText);
    } else {
      htmlContent = simpleMarkdownToHtml(markdownText);
    }

    // Convert HTML to PDF content structure
    return htmlToPdfContent(htmlContent, title);

  } catch (error) {
    console.error('Error converting markdown to PDF:', error);
    throw error;
  }
}

// Simple markdown to HTML converter (fallback)
function simpleMarkdownToHtml(markdown) {
  return markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Lists
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    // Line breaks
    .replace(/\n/gim, '<br>');
}

// Convert HTML content to pdfMake content structure
function htmlToPdfContent(html, title) {
  const content = [
    { text: title, style: 'header', alignment: 'center', margin: [0, 0, 0, 20] }
  ];

  // Simple HTML parsing for common elements
  const lines = html.split(/<br\s*\/?>/);
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.match(/<h1>(.*?)<\/h1>/)) {
      const text = trimmed.replace(/<h1>(.*?)<\/h1>/, '$1');
      content.push({ text, style: 'h1', margin: [0, 20, 0, 10] });
    } else if (trimmed.match(/<h2>(.*?)<\/h2>/)) {
      const text = trimmed.replace(/<h2>(.*?)<\/h2>/, '$1');
      content.push({ text, style: 'h2', margin: [0, 15, 0, 8] });
    } else if (trimmed.match(/<h3>(.*?)<\/h3>/)) {
      const text = trimmed.replace(/<h3>(.*?)<\/h3>/, '$1');
      content.push({ text, style: 'h3', margin: [0, 12, 0, 6] });
    } else if (trimmed.match(/<li>(.*?)<\/li>/)) {
      const text = trimmed.replace(/<li>(.*?)<\/li>/, '$1');
      content.push({ text: '• ' + text, margin: [20, 2, 0, 2] });
    } else if (trimmed.match(/<strong>(.*?)<\/strong>/)) {
      const text = trimmed.replace(/<strong>(.*?)<\/strong>/, '$1');
      content.push({ text, bold: true, margin: [0, 4, 0, 4] });
    } else if (trimmed.length > 0) {
      // Clean any remaining HTML tags
      const cleanText = trimmed.replace(/<[^>]*>/g, '');
      if (cleanText.trim()) {
        content.push({ text: cleanText, margin: [0, 4, 0, 4] });
      }
    }
  }

  return content;
}

// Generate PDF document definition
function createPdfDefinition(content, options = {}) {
  const defaultOptions = {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [40, 60, 40, 60],
    defaultStyle: {
      fontSize: 12,
      lineHeight: 1.3,
      font: 'Helvetica'
    },
    styles: {
      header: { 
        fontSize: 18, 
        bold: true, 
        color: '#1f2937',
        alignment: 'center'
      },
      h1: { 
        fontSize: 16, 
        bold: true, 
        color: '#1f2937' 
      },
      h2: { 
        fontSize: 14, 
        bold: true, 
        color: '#1f2937' 
      },
      h3: { 
        fontSize: 12, 
        bold: true, 
        color: '#1f2937' 
      }
    }
  };

  return {
    ...defaultOptions,
    ...options,
    content: content,
    info: {
      title: 'FCTR Analysis Report',
      author: 'FCTR Extension',
      subject: 'Fact Check Results',
      creator: 'FCTR Extension'
    }
  };
}

// Main PDF generation function
function generatePdf(markdownContent, filename = 'fctr-report.pdf', title = 'FCTR Analysis Report') {
  return new Promise((resolve, reject) => {
    try {
      const missing = checkPdfLibraries();
      if (missing.length > 0) {
        reject(new Error(`Cannot generate PDF: Missing libraries: ${missing.join(', ')}`));
        return;
      }

      const pdfContent = convertMarkdownToPdfContent(markdownContent, title);
      const docDefinition = createPdfDefinition(pdfContent);

      pdfMake.createPdf(docDefinition).download(filename);
      resolve(true);

    } catch (error) {
      console.error('PDF generation error:', error);
      reject(error);
    }
  });
}

// Utility function to format fact check data for PDF
function formatFactCheckForPdf(parsedData, originalClaim) {
  const sections = [];

  // Header
  sections.push('# FCTR Fact Check Report\n\n');

  // Original Claim
  sections.push('## Original Claim\n\n');
  sections.push(`> "${originalClaim || parsedData.claim || 'No claim provided'}"\n\n`);

  // Overall Assessment
  sections.push('## Overall Assessment\n\n');
  sections.push(`**Verdict:** ${parsedData.verdict || 'Unknown'}\n\n`);
  sections.push(`**Confidence Score:** ${parsedData.confidence || 'N/A'}\n\n`);
  sections.push(`**Sources Found:** ${parsedData.sources?.length || 0}\n\n`);

  // Detailed Analysis
  if (parsedData.explanation) {
    sections.push('## Detailed Analysis\n\n');
    sections.push(`${parsedData.explanation}\n\n`);
  }

  // Individual Claims
  if (parsedData.individualClaims && parsedData.individualClaims.length > 0) {
    sections.push('## Individual Claims Breakdown\n\n');
    parsedData.individualClaims.forEach((claim, index) => {
      sections.push(`### ${claim.title}\n\n`);
      sections.push(`${claim.content}\n\n`);
    });
  }

  // Sources
  if (parsedData.sources && parsedData.sources.length > 0) {
    sections.push('## Sources\n\n');
    parsedData.sources.forEach((source, index) => {
      sections.push(`${index + 1}. ${source}\n\n`);
    });
  }

  // Most Credible Source
  if (parsedData.mostCredibleSource) {
    sections.push('## Most Credible Source\n\n');
    sections.push(`${parsedData.mostCredibleSource}\n\n`);
  }

  // Limitations
  if (parsedData.limitations) {
    sections.push('## Limitations\n\n');
    sections.push(`${parsedData.limitations}\n\n`);
  }

  // Additional Notes
  if (parsedData.notes) {
    sections.push('## Additional Notes\n\n');
    sections.push(`${parsedData.notes}\n\n`);
  }

  // Footer
  sections.push('---\n\n');
  sections.push(`*Report generated by FCTR Extension on ${new Date().toLocaleDateString()}*`);

  return sections.join('');
}

// Export functions for use in content script
if (typeof window !== 'undefined') {
  window.FCTRPdfUtils = {
    generatePdf,
    formatFactCheckForPdf,
    convertMarkdownToPdfContent,
    createPdfDefinition,
    checkPdfLibraries
  };
}

// Also support module exports if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generatePdf,
    formatFactCheckForPdf,
    convertMarkdownToPdfContent,
    createPdfDefinition,
    checkPdfLibraries
  };
}