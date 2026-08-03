import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Phone, Globe, ChevronDown } from 'lucide-react';
import { LogoHorizontal } from './Logo';
import { useLanguage, Language } from '../lib/LanguageContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenBooking: () => void;
  siteSettings?: { [key: string]: string };
}

export default function Navbar({ activeTab, setActiveTab, onOpenBooking, siteSettings }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const { language, setLanguage, isRTL, t } = useLanguage();

  const navLinks = [
    { key: 'home', label: t('home') },
    { key: 'courses', label: t('courses') },
    { key: 'about', label: t('about') },
    { key: 'gallery', label: t('gallery') },
    { key: 'contact', label: t('contact') }
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLinkClick = (key: string) => {
    setActiveTab(key);
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogoClick = () => {
    const now = Date.now();
    handleLinkClick('home');

    if (now - lastClickTime < 800) {
      const nextClicks = logoClicks + 1;
      if (nextClicks >= 5) {
        handleLinkClick('dashboard_portal');
        setLogoClicks(0);
      } else {
        setLogoClicks(nextClicks);
      }
    } else {
      setLogoClicks(1);
    }
    setLastClickTime(now);
  };

  const languagesList: { code: Language; name: string; flag: string }[] = [
    { code: 'ar', name: 'العربية', flag: '🇩🇿' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  const currentLanguageObj = languagesList.find(l => l.code === language) || languagesList[0];

  return (
    <header className="sticky top-0 z-[100] w-full bg-navy text-white border-b border-navy-dark shadow-md font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Right side: Brand Logo representation */}
        <div 
          onClick={handleLogoClick}
          className="cursor-pointer select-none group shrink-0"
          title={siteSettings?.academy_name || "أكاديمية ناجي لتمكين اللغات والمهارات"}
        >
          <LogoHorizontal 
            size={44} 
            variant="light" 
            academyName={siteSettings?.academy_name} 
          />
        </div>

        {/* Center: List of navigable tabs (Desktop) */}
        <nav className="hidden md:flex items-center gap-7 font-sans">
          {navLinks.map((link) => (
            <button
              key={link.key}
              onClick={() => handleLinkClick(link.key)}
              className={`text-sm font-medium transition-colors cursor-pointer relative py-1.5 ${
                activeTab === link.key ? 'text-gold' : 'text-slate-200 hover:text-white'
              }`}
            >
              {link.label}
              {activeTab === link.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Left: Button Action trigger (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          
          {/* Custom Language Dropdown Selector */}
          <div className="relative" ref={langDropdownRef}>
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="px-3 py-2 text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10 cursor-pointer select-none"
            >
              <Globe className="w-4 h-4 text-gold" />
              <span>{currentLanguageObj.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangDropdownOpen && (
              <div className={`absolute top-full mt-2 w-36 bg-navy border border-navy-dark rounded-xl shadow-2xl py-1.5 z-[200] overflow-hidden ${isRTL ? 'left-0' : 'right-0'}`}>
                {languagesList.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-right text-xs font-bold transition-colors flex items-center justify-between hover:bg-white/10 cursor-pointer ${
                      language === lang.code ? 'text-gold bg-white/5' : 'text-slate-200'
                    }`}
                  >
                    <span>{lang.name}</span>
                    <span className="text-sm">{lang.flag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => handleLinkClick('student_portal')}
            className={`px-4 py-2 border-2 text-xs sm:text-sm font-bold rounded-[10px] tracking-wide transition-all duration-300 cursor-pointer ${
              activeTab === 'student_portal' 
                ? 'bg-gold text-navy border-gold shadow-md' 
                : 'border-gold text-gold bg-transparent hover:bg-gold hover:text-navy'
            }`}
          >
            {t('student_portal')}
          </button>
          <button
            onClick={onOpenBooking}
            className="px-6 py-2.5 bg-gold text-[#12386a] font-bold rounded-[10px] hover:bg-[#b49218] text-sm tracking-wide transition-colors shadow-sm cursor-pointer"
          >
            {t('book_now')}
          </button>
        </div>

        {/* Hamburger Toggle button (Mobile / Tablet) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-lg text-slate-200 hover:text-white hover:bg-navy-dark focus:outline-none transition-colors cursor-pointer"
          aria-label="القائمة الجانبية"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

      </div>

      {/* Mobile Drawer (Overlay and Menu Panel) */}
      {isOpen && (
        <div className="fixed inset-0 z-[150] md:hidden" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
          {/* Backdrop screen */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Nav Links Slide-in Drawer */}
          <div className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} w-72 max-w-[85vw] h-full bg-navy text-white p-6 shadow-2xl flex flex-col justify-between border-l border-navy-dark animate-slide-in-right`}>
            
            <div className="space-y-8">
              {/* Drawer Brand */}
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <LogoHorizontal 
                  size={36} 
                  variant="light" 
                  academyName={siteSettings?.academy_name} 
                />
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-300" />
                </button>
              </div>

              {/* Navigation Items (Mobile Grid) */}
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <button
                    key={link.key}
                    onClick={() => handleLinkClick(link.key)}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${
                      activeTab === link.key 
                        ? 'bg-gold text-slate-950 font-bold' 
                        : 'text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <span>{link.label}</span>
                    {activeTab === link.key && <span className="w-1.5 h-1.5 bg-navy rounded-full" />}
                  </button>
                ))}
              </nav>
            </div>

            {/* CTA action bottom drawers */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              
              {/* Language switcher for Mobile */}
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-white/5 rounded-xl border border-white/10">
                {languagesList.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      language === lang.code ? 'bg-gold text-navy shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="block text-sm mb-0.5">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLinkClick('student_portal');
                }}
                className={`w-full py-3 border-2 font-bold rounded-xl text-center text-sm tracking-wide transition-all duration-350 flex items-center justify-center ${
                  activeTab === 'student_portal'
                    ? 'bg-gold text-slate-950 border-gold shadow-md'
                    : 'border-gold/70 text-gold bg-transparent hover:bg-gold hover:text-navy'
                }`}
              >
                {t('student_portal')}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenBooking();
                }}
                className="w-full py-3.5 bg-gold text-slate-950 font-bold rounded-xl text-center text-sm tracking-wide transition-all duration-200 shadow hover:bg-gold-dark"
              >
                {t('book_now_cta')}
              </button>
              <div className="text-center">
                <a
                  href={`tel:${siteSettings?.phone || '+213550123456'}`}
                  className="text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-gold" />
                  <span>{t('academy_support')}: {siteSettings?.phone || '+213 550 12 34 56'}</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
