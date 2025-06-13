// modules/results-parsing.js - Fact Check Response Parsing (Fixed Individual Claims)
(function() {
  'use strict';
  
  // Extend the ResultsDisplay class with parsing functionality only
  if (window.FCTR && window.FCTR.modules.ResultsDisplay) {
    const ResultsDisplayProto = window.FCTR.modules.ResultsDisplay.prototype;
    
    // Enhanced parseFactCheckResponse function
    ResultsDisplayProto.parseFactCheckResponse = function(markdownContent) {
      console.log('Parsing response:', markdownContent);
      
      const result = {
        claim: '',
        verdict: '',
        confidence: '',
        explanation: '',
        sources: [],
        mostCredibleSource: '',
        recentDevelopments: '',
        dateOfInformation: '',
        limitations: '',
        notes: '',
        individualClaims: []
      };

      try {
        // First, let's try to extract common patterns regardless of exact formatting
        const content = markdownContent.replace(/\*\*/g, ''); // Remove markdown bold markers
        
        // Try multiple verdict patterns
        const verdictPatterns = [
          /(?:verdict|assessment|conclusion|finding):\s*([^.\n]+)/i,
          /(?:overall|final)\s+(?:verdict|assessment):\s*([^.\n]+)/i,
          /the\s+claim\s+is\s+([^.\n]+)/i,
          /this\s+(?:statement|claim)\s+is\s+([^.\n]+)/i,
          /(true|false|partially true|mostly true|mostly false|misleading|unverified|unknown)/i
        ];
        
        for (const pattern of verdictPatterns) {
          const match = content.match(pattern);
          if (match) {
            result.verdict = match[1].trim();
            break;
          }
        }
        
        // Try multiple confidence patterns
        const confidencePatterns = [
          /confidence(?:\s+score)?:\s*([^.\n]+)/i,
          /(\d+(?:-\d+)?%)/,
          /(very\s+high|high|medium|low|very\s+low)\s+confidence/i,
          /confidence\s+level:\s*([^.\n]+)/i
        ];
        
        for (const pattern of confidencePatterns) {
          const match = content.match(pattern);
          if (match) {
            result.confidence = match[1].trim();
            break;
          }
        }
        
        // Extract explanation - look for the main body of text
        const explanationPatterns = [
          /(?:explanation|analysis|assessment):\s*([\s\S]*?)(?:\n\n|$)/i,
          /(?:detailed\s+analysis):\s*([\s\S]*?)(?:\n\n|$)/i,
        ];
        
        for (const pattern of explanationPatterns) {
          const match = content.match(pattern);
          if (match && match[1].trim().length > 50) {
            result.explanation = match[1].trim();
            break;
          }
        }
        
        // Extract sources - look for URLs, numbered lists, or reference patterns
        const sourcePatterns = [
          /sources?:\s*([\s\S]*?)(?:\n\n|$)/i,
          /references?:\s*([\s\S]*?)(?:\n\n|$)/i,
          /(?:https?:\/\/[^\s]+)/g,
          /\d+\.\s+([^\n]+)/g
        ];
        
        const allSources = new Set();
        
        for (const pattern of sourcePatterns) {
          const matches = content.match(pattern);
          if (matches) {
            if (Array.isArray(matches)) {
              matches.forEach(match => {
                if (match.trim().length > 10) {
                  allSources.add(match.trim());
                }
              });
            } else if (matches[1]) {
              // Split by newlines and clean up
              const sources = matches[1].split('\n')
                .map(s => s.trim())
                .filter(s => s.length > 10)
                .map(s => s.replace(/^\d+\.\s*/, '')); // Remove numbering
              
              sources.forEach(source => allSources.add(source));
            }
          }
        }
        
        result.sources = Array.from(allSources).slice(0, 10); // Limit to 10 sources
        
        // Extract individual claims if present - FIXED VERSION
        const claimMatches = content.match(/claim\s+\d+:([^]*?)(?=claim\s+\d+:|$)/gi);
        if (claimMatches) {
          result.individualClaims = this.parseIndividualClaims(content);
        }
        
        // Extract most credible source
        const credibleSourceMatch = content.match(/(?:most\s+credible|primary|authoritative)\s+source:\s*([^.\n]+)/i);
        if (credibleSourceMatch) {
          result.mostCredibleSource = credibleSourceMatch[1].trim();
        }
        
        // Extract limitations
        const limitationsMatch = content.match(/limitations?:\s*([\s\S]*?)(?:\n\n|$)/i);
        if (limitationsMatch) {
          result.limitations = limitationsMatch[1].trim();
        }
        
        // ENHANCED: Parse markdown sections with ## headers and ** bold headers
        const lines = markdownContent.split('\n');
        let currentSection = '';
        let currentContent = [];

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // Handle ## markdown headers
          if (trimmedLine.startsWith('## ')) {
            if (currentSection) this.saveSection(result, currentSection, currentContent);
            const headerText = trimmedLine.substring(3).toLowerCase().trim();
            currentSection = this.mapHeaderToSection(headerText);
            currentContent = [];
          }
          // Handle **BOLD** headers
          else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
            if (currentSection) this.saveSection(result, currentSection, currentContent);
            const headerText = trimmedLine.replace(/\*\*/g, '').toLowerCase().trim();
            currentSection = this.mapHeaderToSection(headerText);
            currentContent = [];
          }
          // Handle specific **SECTION** patterns
          else if (trimmedLine.startsWith('**CLAIM**')) {
            if (currentSection) this.saveSection(result, currentSection, currentContent);
            currentSection = 'claim';
            currentContent = [];
          } else if (trimmedLine.startsWith('**OVERALL VERDICT**')) {
            if (currentSection) this.saveSection(result, currentSection, currentContent);
            currentSection = 'verdict';
            currentContent = [];
          } else if (trimmedLine.startsWith('**CONFIDENCE SCORE**')) {
            if (currentSection) this.saveSection(result, currentSection, currentContent);
            currentSection = 'confidence';
            currentContent = [];
          } else if (trimmedLine.startsWith('**EXPLANATION**')) {
            if (currentSection) this.saveSection(result, currentSection, currentContent);
            currentSection = 'explanation';
            currentContent = [];
          } else if (trimmedLine.startsWith('**SOURCES**')) {
            if (currentSection) this.saveSection(result, currentSection, currentContent);
            currentSection = 'sources';
            currentContent = [];
          } else if (trimmedLine.startsWith('**MOST CREDIBLE SOURCE**')) {
            if (currentSection) this.saveSection(result, currentSection, currentContent);
            currentSection = 'mostCredibleSource';
            currentContent = [];
          } else if (trimmedLine.startsWith('**INDIVIDUAL CLAIMS BREAKDOWN**')) {
            if (currentSection) this.saveSection(result, currentSection, currentContent);
            currentSection = 'individualClaims';
            currentContent = [];
          } else if (trimmedLine.startsWith('**LIMITATIONS**')) {
            if (currentSection) this.saveSection(result, currentSection, currentContent);
            currentSection = 'limitations';
            currentContent = [];
          } else if (trimmedLine.startsWith('**NOTES**')) {
            if (currentSection) this.saveSection(result, currentSection, currentContent);
            currentSection = 'notes';
            currentContent = [];
          } else if (trimmedLine.startsWith('**')) {
            // Other sections
            if (currentSection) this.saveSection(result, currentSection, currentContent);
            currentSection = 'other';
            currentContent = [];
          } else if (currentSection && trimmedLine.length > 0) {
            currentContent.push(line);
          }
        }

        // Handle the last section
        if (currentSection) {
          this.saveSection(result, currentSection, currentContent);
        }

        // If still no structured data found, put everything in explanation
        if (!result.explanation && !result.claim && !result.verdict) {
          result.explanation = markdownContent;
          result.verdict = 'See detailed analysis';
          result.confidence = 'N/A';
        }

      } catch (error) {
        console.error('Error parsing fact check response:', error);
        result.explanation = markdownContent;
        result.verdict = 'Unknown';
        result.confidence = 'N/A';
      }

      console.log('Parsed result:', result);
      return result;
    };

    // Helper function to map header text to section names
    ResultsDisplayProto.mapHeaderToSection = function(headerText) {
      const headerLower = headerText.toLowerCase();
      
      if (headerLower.includes('claim')) return 'claim';
      if (headerLower.includes('verdict')) return 'verdict';
      if (headerLower.includes('confidence')) return 'confidence';
      if (headerLower.includes('explanation') || headerLower.includes('analysis')) return 'explanation';
      if (headerLower.includes('source')) {
        if (headerLower.includes('credible') || headerLower.includes('primary')) {
          return 'mostCredibleSource';
        }
        return 'sources';
      }
      if (headerLower.includes('limitation')) return 'limitations';
      if (headerLower.includes('note')) return 'notes';
      if (headerLower.includes('individual') || headerLower.includes('breakdown')) return 'individualClaims';
      if (headerLower.includes('development')) return 'recentDevelopments';
      if (headerLower.includes('date')) return 'dateOfInformation';
      
      return 'other';
    };

    // Helper function to save section content
    ResultsDisplayProto.saveSection = function(result, section, content) {
      const text = content.join('\n').trim();
      
      switch (section) {
        case 'claim':
          result.claim = text;
          break;
        case 'verdict':
          result.verdict = text;
          break;
        case 'confidence':
          result.confidence = text;
          break;
        case 'explanation':
          result.explanation = text;
          break;
        case 'sources':
          // Parse numbered sources
          result.sources = text.split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => line.replace(/^\d+\.\s*/, '').trim());
          break;
        case 'mostCredibleSource':
          result.mostCredibleSource = text;
          break;
        case 'recentDevelopments':
          result.recentDevelopments = text;
          break;
        case 'dateOfInformation':
          result.dateOfInformation = text;
          break;
        case 'limitations':
          result.limitations = text;
          break;
        case 'notes':
          result.notes = text;
          break;
        case 'individualClaims':
          result.individualClaims = this.parseIndividualClaims(text);
          break;
      }
    };

    // FIXED: Parse individual claims with proper bullet-point parsing
    ResultsDisplayProto.parseIndividualClaims = function(text) {
      console.log('=== PARSING INDIVIDUAL CLAIMS (FIXED) ===');
      console.log('Raw text length:', text.length);
      console.log('Raw text:', text);
      
      const claims = [];
      
      // Split by "Claim X:" pattern - more robust approach
      const claimRegex = /Claim\s+(\d+):\s*([^\n]*)([\s\S]*?)(?=Claim\s+\d+:|$)/gi;
      let match;
      
      while ((match = claimRegex.exec(text)) !== null) {
        const claimNumber = match[1];
        const claimTitle = match[2].trim();
        const claimContent = match[3].trim();
        
        console.log(`\n--- Processing Claim ${claimNumber} ---`);
        console.log('Title:', claimTitle);
        console.log('Content:', claimContent);
        
        // Parse the bullet-separated components
        const lines = claimContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        let keyComponents = '';
        let verdict = '';
        let confidence = '';
        let explanation = '';
        
        lines.forEach((line, idx) => {
          console.log(`Line ${idx}:`, line);
          
          // Handle bullet points
          if (line.startsWith('•')) {
            const content = line.substring(1).trim();
            const lowerContent = content.toLowerCase();
            
            if (lowerContent.startsWith('key components:')) {
              keyComponents = content.replace(/^key components:\s*/i, '');
              console.log('Found key components:', keyComponents);
            } else if (lowerContent.startsWith('verdict:')) {
              verdict = content.replace(/^verdict:\s*/i, '');
              console.log('Found verdict:', verdict);
            } else if (lowerContent.startsWith('confidence score:') || lowerContent.startsWith('confidence:')) {
              confidence = content.replace(/^confidence(?:\s+score)?:\s*/i, '');
              console.log('Found confidence:', confidence);
            } else if (lowerContent.startsWith('explanation:')) {
              explanation = content.replace(/^explanation:\s*/i, '');
              console.log('Found explanation:', explanation);
            }
          }
          // Handle non-bullet lines that might contain the same info
          else {
            const lowerLine = line.toLowerCase();
            if (lowerLine.startsWith('verdict:')) {
              verdict = line.replace(/^verdict:\s*/i, '');
              console.log('Found verdict (no bullet):', verdict);
            } else if (lowerLine.startsWith('confidence score:') || lowerLine.startsWith('confidence:')) {
              confidence = line.replace(/^confidence(?:\s+score)?:\s*/i, '');
              console.log('Found confidence (no bullet):', confidence);
            } else if (lowerLine.startsWith('explanation:')) {
              explanation = line.replace(/^explanation:\s*/i, '');
              console.log('Found explanation (no bullet):', explanation);
            }
          }
        });
        
        // Default to neutral if no verdict found
        if (!verdict) {
          verdict = 'UNKNOWN';
          console.log('No verdict found, defaulting to UNKNOWN');
        }
        
        const claimObj = {
          title: `Claim ${claimNumber}: ${claimTitle}`,
          keyComponents: keyComponents,
          verdict: verdict.toUpperCase(),
          confidence: confidence,
          explanation: explanation
        };
        
        console.log('Final claim object:', claimObj);
        claims.push(claimObj);
      }
      
      console.log('=== FINAL PARSED CLAIMS ===', claims);
      return claims;
    };

    // NEW: Parse AI detection specific response
    ResultsDisplayProto.parseAiDetectionResponse = function(responseData) {
      const result = {
        classification: 'Unknown',
        confidence: 'N/A', 
        icon: 'analysisFailed',
        analysisText: '',
        detectionSummary: null,
        rawResponse: responseData
      };
      
      try {
        console.log('Parsing AI detection response:', responseData);
        
        // Extract the main analysis text from choices
        if (responseData.choices && responseData.choices[0]) {
          result.analysisText = responseData.choices[0].message.content;
          
          // Try to extract structured data from the analysis text
          const content = result.analysisText;
          
          // Look for classification patterns
          const classificationMatch = content.match(/(?:classification|origin|assessment):\s*([^\n.]+)/i);
          if (classificationMatch) {
            const classification = classificationMatch[1].trim();
            result.classification = classification;
            
            // Map classification to icon
            if (classification.toLowerCase().includes('ai') || classification.toLowerCase().includes('generated')) {
              result.icon = 'aiGenerated';
            } else if (classification.toLowerCase().includes('human') || classification.toLowerCase().includes('written')) {
              result.icon = 'humanWritten';  
            } else if (classification.toLowerCase().includes('mixed') || classification.toLowerCase().includes('partial')) {
              result.icon = 'partialMixed';
            }
          }
          
          // Look for confidence patterns
          const confidenceMatch = content.match(/confidence:\s*([^\n.]+)/i);
          if (confidenceMatch) {
            result.confidence = confidenceMatch[1].trim();
          }
        }
        
        // If there's a detection_summary object (future API enhancement)
        if (responseData.detection_summary) {
          const summary = responseData.detection_summary;
          result.detectionSummary = summary;
          result.classification = summary.classification || result.classification;
          result.confidence = summary.confidence || result.confidence;
          
          // Map API icons if provided
          const iconMap = {
            '🤖': 'aiGenerated',
            '👤': 'humanWritten', 
            '🔄': 'partialMixed',
            '❓': 'analysisFailed'
          };
          result.icon = iconMap[summary.icon] || result.icon;
        }
        
      } catch (error) {
        console.error('Error parsing AI detection response:', error);
        result.analysisText = 'Failed to parse AI detection response';
        result.classification = 'Analysis Failed';
      }
      
      console.log('Parsed AI detection result:', result);
      return result;
    };

    console.log('✅ Results parsing module loaded with FIXED Individual Claims parsing');
  }
})();