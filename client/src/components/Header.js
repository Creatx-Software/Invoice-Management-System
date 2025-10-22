import React from 'react';
import { LogOut, ArrowLeft, Save } from 'lucide-react';

function Header({ user, onLogout, onBack, showBack = false, onSave, showSave = false, saveLabel = 'Save Invoice' }) {
  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      onLogout();
    }
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-brand-primary hover:bg-green-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Invoices
            </button>
          )}
          {!showBack && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Invoice Generator</h2>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {showSave && (
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-4 py-2 bg-brand-secondary hover:bg-brand-hover text-brand-icon font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saveLabel}
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;