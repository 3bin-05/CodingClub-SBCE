import React, { useState, useEffect } from 'react';
import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import Logo from '../assets/images/Logo.png';

interface HeaderProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function Header({ currentTab, setTab, isAuthenticated, onLogout }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'events', label: 'Event' },
    { id: 'about', label: 'Execom' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (id: string) => {
    setTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 px-4 sm:px-6 pt-4 relative" id="site-header">
      <div
        className={`
          max-w-[1500px] mx-auto h-20 px-6 md:px-8 flex items-center justify-between
          rounded-2xl border transition-all duration-500
          ${scrolled
            ? 'bg-black/50 border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.45)]'
            : 'bg-white/[0.03] border-white/5 backdrop-blur-md'
          }
        `}
        id="header-shell"
      >
        <button
          onClick={() => setTab('home')}
          className="flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105 shrink-0"
          id="header-logo-btn"
        >
          <img src={Logo} alt="SBCE Coding Club" className="h-10 w-auto object-contain" draggable={false} />
        </button>

        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-full p-1.5 backdrop-blur-sm" id="nav-menu">
          {navItems.map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`relative px-5 py-2 rounded-full text-[13px] font-['Inter'] font-medium tracking-wide transition-all duration-300 focus:outline-none ${active ? 'text-white' : 'text-white/60 hover:text-white'}`}
              >
                {active && <span className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-600/90 to-orange-500/80 shadow-[0_0_18px_rgba(255,107,0,0.45)] -z-10" id={`nav-active-pill-${item.id}`} />}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3 shrink-0" id="header-actions">
          {isAuthenticated ? (
            <>
              <button id="header-admin-dash-btn" onClick={() => setTab('admin')} className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium font-['Inter'] text-white bg-white/[0.06] border border-white/15 backdrop-blur-sm hover:bg-white hover:text-black hover:border-white transition-all duration-300 focus:outline-none cursor-pointer">
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </button>
              <button id="header-logout-btn" onClick={onLogout} className="flex items-center gap-1.5 px-3 py-2 text-white/60 hover:text-orange-500 transition-colors duration-300 font-['Inter'] text-sm focus:outline-none">
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </>
          ) : (
            <button id="header-login-btn" onClick={() => setTab('admin')} className="relative px-6 py-2 rounded-full text-sm font-medium font-['Inter'] text-white bg-white/[0.06] border border-white/20 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-orange-500/60 hover:bg-orange-500/10 hover:shadow-[0_0_24px_rgba(255,107,0,0.25)] focus:outline-none">
              Admin
            </button>
          )}
        </div>

        <button
          id="mobile-hamburger-btn"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="
            md:hidden flex items-center justify-center w-10 h-10 rounded-xl
            bg-white/[0.06] border border-white/15 backdrop-blur-sm
            hover:bg-white/10 hover:border-orange-500/40
            transition-all duration-300 focus:outline-none text-white
          "
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Drawer */}
      <div
        id="mobile-drawer"
        className={`
          md:hidden absolute left-4 right-4 mt-2
          bg-black/85 backdrop-blur-2xl border border-white/10 rounded-2xl p-3
          flex flex-col gap-1 shadow-[0_16px_48px_rgba(0,0,0,0.6)]
          transition-all duration-300 origin-top
          ${isMobileMenuOpen
            ? 'opacity-100 scale-y-100 pointer-events-auto'
            : 'opacity-0 scale-y-95 pointer-events-none'
          }
        `}
        style={{ top: '100%' }}
      >
        {navItems.map((item) => {
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-item-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`
                w-full text-left px-4 py-3 rounded-xl text-sm font-['Inter'] font-medium
                tracking-wide transition-all duration-200 focus:outline-none
                ${active
                  ? 'text-white bg-gradient-to-r from-orange-600/80 to-orange-500/70 shadow-[0_0_16px_rgba(255,107,0,0.3)]'
                  : 'text-white/70 hover:text-white hover:bg-white/[0.07]'
                }
              `}
            >
              {item.label}
            </button>
          );
        })}
        <div className="h-px bg-white/10 my-1" />
        {isAuthenticated ? (
          <button
            onClick={() => { setTab('admin'); setIsMobileMenuOpen(false); }}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-['Inter'] font-medium text-white hover:bg-white/[0.07] transition-all duration-200"
          >
            Dashboard
          </button>
        ) : (
          <button
            onClick={() => { setTab('admin'); setIsMobileMenuOpen(false); }}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-['Inter'] font-medium text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 transition-all duration-200"
          >
            Admin Login
          </button>
        )}
      </div>
    </header>
  );
}