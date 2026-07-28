import React from 'react';
import { useAuth } from '../context/AuthContext';
import './ViewModeSwitcher.css';

export default function ViewModeSwitcher() {
  const { actualIsAdmin, viewMode, setViewMode } = useAuth();

  if (!actualIsAdmin) return null;

  return (
    <div className="view-mode-switcher" aria-label="Testa hur sidan ser ut ur olika perspektiv">
      <div className="switcher-label">
        <span>👁️ Testvy:</span>
      </div>
      <div className="switcher-buttons">
        <button
          type="button"
          className={`switcher-btn admin ${viewMode === 'admin' ? 'active' : ''}`}
          onClick={() => setViewMode('admin')}
          title="Full administratörsbehörighet"
        >
          👑 Admin
        </button>
        <button
          type="button"
          className={`switcher-btn member ${viewMode === 'member' ? 'active' : ''}`}
          onClick={() => setViewMode('member')}
          title="Se hur sidan ser ut för en inloggad klubbmedlem"
        >
          🏍️ Medlem
        </button>
        <button
          type="button"
          className={`switcher-btn guest ${viewMode === 'guest' ? 'active' : ''}`}
          onClick={() => setViewMode('guest')}
          title="Se hur sidan ser ut för en besökare som INTE är medlem"
        >
          👤 Gäst
        </button>
      </div>
    </div>
  );
}
