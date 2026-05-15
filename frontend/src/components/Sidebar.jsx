// src/components/Sidebar.jsx
// ─────────────────────────────────────────────────────────────────
// Left sidebar: navigation, user info, dark mode toggle, new note button.
// ─────────────────────────────────────────────────────────────────

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FileText, BarChart2, Archive, LogOut,
  Sun, Moon, Plus, Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ onNewNote }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard',  icon: FileText,  label: 'My Notes' },
    { to: '/insights',   icon: BarChart2, label: 'Insights' },
    { to: '/dashboard?archived=true', icon: Archive, label: 'Archive' },
  ];

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-screen
                      bg-white dark:bg-dark-800
                      border-r border-gray-100 dark:border-dark-600
                      py-5 px-3 animate-slide-in">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700
                        flex items-center justify-center shadow-glow-sm">
          <Sparkles size={16} className="text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-gray-900 dark:text-white">Peblo</span>
          <span className="text-base font-light text-brand-500"> Notes</span>
        </div>
      </div>

      {/* New Note Button */}
      <button
        onClick={onNewNote}
        id="btn-new-note"
        className="btn-primary mx-1 mb-5 justify-center"
      >
        <Plus size={16} />
        New Note
      </button>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="space-y-1 border-t border-gray-100 dark:border-dark-600 pt-3 mt-3">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          id="btn-toggle-theme"
          className="sidebar-item w-full"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* User info */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600
                          flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          id="btn-logout"
          className="sidebar-item w-full text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut size={16} />
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
