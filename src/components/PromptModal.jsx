import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmModal.css';

export default function PromptModal({
  isOpen,
  title = "Ange Meddelande",
  message = "Skriv ditt meddelande här under:",
  placeholder = "Ditt meddelande...",
  value,
  onChange,
  confirmText = "Skicka",
  cancelText = "Avbryt",
  type = "info", // "danger", "warning", "success", "info"
  onConfirm,
  onCancel,
  customIcon
}) {
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      document.body.style.overscrollBehaviorY = '';
      return;
    }
    
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehaviorY = 'none';
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel && onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      document.body.style.overscrollBehaviorY = '';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getIcon = () => {
    if (customIcon) return customIcon;
    switch (type) {
      case 'danger': return '⚠️';
      case 'warning': return '⚡';
      case 'success': return '🚀';
      case 'info': return '💬';
      default: return '❓';
    }
  };

  return createPortal(
    <div 
      className="confirm-modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget && onCancel) {
          onCancel();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={`confirm-modal-box ${type}`}>
        <div className="confirm-modal-icon-wrapper">
          <span>{getIcon()}</span>
        </div>

        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-message">{message}</p>
        
        <textarea 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #333',
            background: '#111',
            color: '#fff',
            fontFamily: 'inherit',
            resize: 'vertical',
            marginBottom: '1rem',
            boxSizing: 'border-box'
          }}
        />

        <div className="confirm-modal-actions">
          <button 
            type="button" 
            className="confirm-btn-cancel" 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            className="confirm-btn-confirm" 
            onClick={onConfirm}
          >
            {type === 'danger' && '📨 '}
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
