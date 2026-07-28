import React, { useEffect } from 'react';
import './ConfirmModal.css';

export default function ConfirmModal({
  isOpen,
  title = "Bekräfta åtgärd",
  message = "Är du säker på att du vill genomföra detta?",
  confirmText = "Bekräfta",
  cancelText = "Avbryt",
  type = "danger", // "danger", "warning", "success", "info"
  onConfirm,
  onCancel,
  customIcon
}) {
  // Stäng med Escape eller bekräfta med Enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel && onCancel();
      } else if (e.key === 'Enter') {
        onConfirm && onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  // Bestäm ikon baserat på typ om customIcon ej angavs
  const getIcon = () => {
    if (customIcon) return customIcon;
    switch (type) {
      case 'danger': return '⚠️';
      case 'warning': return '⚡';
      case 'success': return '🚀';
      case 'info': return 'ℹ️';
      default: return '❓';
    }
  };

  return (
    <div 
      className="confirm-modal-overlay" 
      onClick={(e) => {
        // Om användaren klickar på bakgrunden, stäng
        if (e.target === e.currentTarget && onCancel) {
          onCancel();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={`confirm-modal-box ${type}`}>
        <div className="confirm-modal-icon-wrapper">
          <span>{getIcon()}</span>
        </div>

        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-message">{message}</p>

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
            {type === 'danger' && '🗑️ '}
            {type === 'success' && '✉️ '}
            {type === 'warning' && '🚀 '}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
