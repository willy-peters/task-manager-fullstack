import { useEffect, useRef, useState } from 'react';
import useTheme from '../../hooks/useTheme.js';
import { getInitials } from '../../utils/formatters.js';

export default function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [menuOpen]);

  const initials = getInitials(user?.name);

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-40 pt-safe bg-surface/80 backdrop-blur-xl shadow-header">
      <div className="h-16 max-w-7xl mx-auto px-margin-sm sm:px-6 lg:px-12 flex items-center justify-between">
        {/* Left: Brand text only (no logo box, no Tasks tab) */}
        <div className="flex flex-col">
          <span className="text-headline-sm text-on-surface tracking-tight leading-tight">
            Task Manager
          </span>
          <span className="md:hidden text-label-sm text-on-surface-variant leading-none">
            Task Board
          </span>
        </div>

        {/* Right: Desktop theme toggle + user + logout */}
        <div className="hidden md:flex items-center gap-space-md">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="focus-ring w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <div className="flex items-center gap-space-sm">
            <div
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-label-md text-on-primary font-bold"
              aria-hidden="true"
            >
              {initials}
            </div>
            <span className="text-label-lg text-on-surface font-medium">{user?.name}</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="btn-ghost px-space-md py-space-sm"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">logout</span>
            <span>Logout</span>
          </button>
        </div>

        {/* Right: Mobile theme toggle + avatar + overflow dropdown */}
        <div className="flex md:hidden items-center gap-space-xs relative" ref={menuRef}>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="focus-ring w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <div
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-label-md text-on-primary font-bold"
            aria-hidden="true"
          >
            {initials}
          </div>
          <button
            type="button"
            aria-label="User menu"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="focus-ring w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">more_vert</span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-14 w-64 bg-surface-container-lowest rounded-xl shadow-level3 p-space-sm z-50 flex flex-col gap-space-xs border border-outline-variant/20 animate-scale-in"
            >
              <div className="px-space-sm py-space-sm bg-surface-container-low rounded-lg">
                <div className="flex items-center gap-space-sm">
                  <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-fixed text-label-lg flex items-center justify-center font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-label-lg text-on-surface truncate">{user?.name}</span>
                    <span className="text-body-sm text-on-surface-variant truncate">
                      {user?.email}
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-px bg-surface-container my-space-xs" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="flex items-center gap-space-sm px-space-sm min-h-[44px] rounded-lg text-error hover:bg-error-container/40 transition-colors text-label-lg w-full text-left"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-error text-[20px]">logout</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
