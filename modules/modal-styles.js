// modules/modal-styles.js - CSS Styles for Modals
(function() {
  'use strict';
  
  class ModalStyles {
    static getAuthPopupStyles() {
      return `
        <style>
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .fctr-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
            text-decoration: none;
            width: 100%;
          }
          .fctr-btn-toggle {
            background: #1f2937;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            position: relative;
            overflow: hidden;
          }
          .fctr-btn-toggle:hover {
            background: #374151;
          }
          .fctr-btn-toggle.connected {
            background: #16a34a;
            color: white;
          }
          .fctr-btn-toggle.connected:hover {
            background: #15803d;
          }
          .fctr-status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #16a34a;
            margin-left: auto;
          }
          .fctr-btn-close {
            background: transparent;
            color: #6b7280;
            padding: 8px;
            border: none;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.2s;
          }
          .fctr-btn-close:hover {
            background: #f3f4f6;
            color: #374151;
          }
          .fctr-user-info {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
            text-align: left;
          }
          .fctr-user-name {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
            font-size: 14px;
          }
          .fctr-user-email {
            color: #6b7280;
            font-size: 12px;
            margin-bottom: 4px;
          }
          .fctr-credits {
            color: #374151;
            font-size: 12px;
          }
          .fctr-welcome-message {
            color: #374151;
            margin-bottom: 20px;
            font-size: 14px;
            line-height: 1.6;
            text-align: center;
          }
          .fctr-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid transparent;
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 8px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .fctr-title {
            font-weight: 700;
            color: #1f2937;
            font-size: 18px;
            letter-spacing: -0.5px;
            margin: 0;
          }
          .fctr-subtitle {
            color: #6b7280;
            font-size: 12px;
            font-weight: 400;
            margin: 0;
          }
        </style>
      `;
    }
    
    static getResultsModalStyles() {
      return `
        <style>
          #fctr-result-popup * { box-sizing: border-box; }
          #fctr-result-popup .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.75rem;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.025em;
          }
          #fctr-result-popup .badge-success {
            background: rgba(34, 197, 94, 0.1);
            color: #16a34a;
            border: 1px solid rgba(34, 197, 94, 0.2);
          }
          #fctr-result-popup .badge-warning {
            background: rgba(245, 158, 11, 0.1);
            color: #d97706;
            border: 1px solid rgba(245, 158, 11, 0.2);
          }
          #fctr-result-popup .badge-destructive {
            background: rgba(239, 68, 68, 0.1);
            color: #dc2626;
            border: 1px solid rgba(239, 68, 68, 0.2);
          }
          #fctr-result-popup .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.25rem;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            text-decoration: none;
            border: 1px solid transparent;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
            background: none;
          }
          #fctr-result-popup .btn-primary {
            background: #1f2937;
            color: white;
            border-color: #1f2937;
          }
          #fctr-result-popup .btn-primary:hover {
            background: #374151;
          }
          #fctr-result-popup .btn-secondary {
            background: #f9fafb;
            color: #374151;
            border-color: #d1d5db;
          }
          #fctr-result-popup .btn-secondary:hover {
            background: #f3f4f6;
          }
          #fctr-result-popup .btn-ghost {
            background: transparent;
            color: #374151;
          }
          #fctr-result-popup .btn-ghost:hover {
            background: #f3f4f6;
          }
          #fctr-result-popup .btn-sm {
            padding: 0.25rem 0.75rem;
            font-size: 0.75rem;
          }
          #fctr-result-popup .feather-icon {
            width: 1rem;
            height: 1rem;
            display: inline-block;
            vertical-align: middle;
            stroke: currentColor;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
          }
          #fctr-result-popup .progress {
            width: 100%;
            height: 0.5rem;
            background: #e5e7eb;
            border-radius: 0.375rem;
            overflow: hidden;
          }
          #fctr-result-popup .progress-bar {
            height: 100%;
            background: #1f2937;
            transition: width 0.3s ease;
          }
          #fctr-result-popup .accordion-item {
            border: 1px solid #e5e7eb;
            border-radius: 0.375rem;
            margin-bottom: 0.5rem;
          }
          #fctr-result-popup .accordion-trigger {
            width: 100%;
            padding: 1rem;
            text-align: left;
            background: transparent;
            border: none;
            font-size: 1rem;
            font-weight: 700;
           cursor: pointer;
           display: flex;
            align-items: center;
            justify-content: space-between;
          }
          #fctr-result-popup .accordion-trigger:hover {
            background: #f9fafb;
          }
          #fctr-result-popup .accordion-content {
            padding: 0 1rem 1rem;
            font-size: 1.125rem;
            font-weight: 500;
            line-height: 1.6;
            color: #374151;
            white-space: pre-wrap;
          }
          #fctr-result-popup .accordion-content.collapsed {
            display: none;
          }
          #fctr-result-popup .claim-item {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 0.375rem;
            padding: 1rem;
            margin-bottom: 0.75rem;
          }
          #fctr-result-popup .claim-title {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.5rem;
          }
        </style>
      `;
    }
  }
  
  // Register module
  if (!window.FCTR) window.FCTR = { modules: {} };
  window.FCTR.modules.ModalStyles = ModalStyles;
  
})();