import React from 'react';
import { LogOut, ArrowLeft, Save, FileText, User as UserIcon } from 'lucide-react';

function Header({ user, onLogout, onBack, showBack = false, onSave, showSave = false, saveLabel = 'Save Invoice' }) {
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      onLogout();
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md shadow-soft border-b border-gray-200/50 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-brand-secondary hover:bg-blue-50 rounded-xl transition-all duration-200 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          {!showBack && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-secondary rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Invoice<span className="text-gradient">Pro</span></h2>
                <p className="text-xs text-gray-500">Professional invoicing</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showSave && (
            <button
              onClick={onSave}
              className="btn-success flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{saveLabel}</span>
              <span className="sm:hidden">Save</span>
            </button>
          )}

          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="w-9 h-9 bg-gradient-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{user.fullName}</div>
                <div className="text-xs text-gray-600">{user.email}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;