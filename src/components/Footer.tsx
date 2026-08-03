import React from 'react';
import { Facebook, Instagram, Youtube, Phone, Mail, MapPin, Clock, ArrowUpRight } from 'lucide-react';
import { LogoHorizontal } from './Logo';
import { useLanguage } from '../lib/LanguageContext';

interface FooterProps {
  setActiveTab: (tab: string) => void;
  siteSettings?: { [key: string]: string };
}

export default function Footer({ setActiveTab, siteSettings }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const { language, isRTL, t } = useLanguage();

  const handleLinkClick = (tabKey: string) => {
    setActiveTab(tabKey);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const facebookLink = siteSettings?.facebook ? (siteSettings.facebook.startsWith('http') ? siteSettings.facebook : `https://facebook.com/${siteSettings.facebook}`) : 'https://facebook.com/naji.academy.sidibelabbes';
  const instagramLink = siteSettings?.instagram ? (siteSettings.instagram.startsWith('http') ? siteSettings.instagram : `https://instagram.com/${siteSettings.instagram}`) : 'https://instagram.com/najiacademy_sidibelabbes';
  const youtubeLink = siteSettings?.youtube ? (siteSettings.youtube.startsWith('http') ? siteSettings.youtube : `https://youtube.com/${siteSettings.youtube}`) : 'https://youtube.com/@najiacademy';
  const whatsappNumber = (siteSettings?.whatsapp || '213550123456').replace(/[\s\+\-]/g, '').trim();

  // Translated local column headers and text
  const quickLinksHeader = isRTL ? 'روابط سريعة' : (language === 'fr' ? 'Liens Rapides' : 'Quick Links');
  const coursesHeader = isRTL ? 'الدورات التدريبية' : (language === 'fr' ? 'Cours Offerts' : 'Featured Courses');
  const contactHeader = isRTL ? 'معلومات التواصل' : (language === 'fr' ? 'Contactez-nous' : 'Contact Info');
  const footerIntro = isRTL 
    ? 'مؤسسة تعليمية وتدريبية معتمدة وسط سيدي بلعباس، متخصصة في تمكين الطلاب والمهنيين من إتقان اللغات الأجنبية واكتساب المهارات العملية لدخول سوق العمل بجدارة.'
    : (language === 'fr' 
      ? 'Établissement d\'enseignement et de formation agréé au centre de Sidi Bel Abbès, spécialisé dans l\'autonomisation des étudiants et des professionnels pour maîtriser les langues étrangères.'
      : 'Accredited educational and training institution in the center of Sidi Bel Abbes, specializing in empowering students and professionals to master foreign languages.');

  const linksData = [
    { label: isRTL ? 'الرئيسية والخدمات' : (language === 'fr' ? 'Accueil et Services' : 'Home & Services'), key: 'home' },
    { label: isRTL ? 'كل الدورات الدراسية' : (language === 'fr' ? 'Tous les Cours' : 'All Courses'), key: 'courses' },
    { label: isRTL ? 'من نحن وقصتنا' : (language === 'fr' ? 'À Propos de Nous' : 'About Our Story'), key: 'about' },
    { label: isRTL ? 'معرض الصور المعماري' : (language === 'fr' ? 'Galerie Photos' : 'Photo Gallery'), key: 'gallery' },
    { label: isRTL ? 'اتصل بنا والوصول' : (language === 'fr' ? 'Contact & Accès' : 'Contact & Directions'), key: 'contact' }
  ];

  const coursesList = [
    { label: isRTL ? 'اللغة الفرنسية (beginner - B2)' : 'Français (Débutant - B2)' },
    { label: isRTL ? 'اللغة الإنجليزية لتطوير المحادثة' : 'English for Conversation' },
    { label: isRTL ? 'اللغة الإسبانية للمبتدئين' : 'Español para principiantes' },
    { label: isRTL ? 'مهارات التواصل وإدارة المشاريع' : 'Communication & Project Management' }
  ];

  return (
    <footer className="bg-navy-dark text-slate-300 border-t border-navy font-sans" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      
      {/* Top Footer Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        
        {/* Column 1: Monogram brand & Intro */}
        <div className="space-y-5">
          <LogoHorizontal 
            size={38} 
            variant="light" 
            academyName={siteSettings?.academy_name} 
          />
          <p className="text-sm text-slate-400 leading-relaxed font-sans">
            {footerIntro}
          </p>
          <div className="flex items-center gap-3.5">
            <a 
              href={facebookLink}
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-slate-500/20 text-slate-300 hover:text-gold transition-all flex items-center justify-center"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a 
              href={instagramLink}
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-slate-500/20 text-slate-300 hover:text-gold transition-all flex items-center justify-center"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a 
              href={youtubeLink}
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-slate-500/20 text-slate-300 hover:text-gold transition-all flex items-center justify-center"
              aria-label="Youtube"
            >
              <Youtube className="w-4 h-4" />
            </a>
            <a 
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-slate-500/20 text-slate-300 hover:text-gold transition-all flex items-center justify-center font-bold text-xs"
              aria-label="WhatsApp"
            >
              WA
            </a>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div className="space-y-4">
          <h4 className={`text-white text-base font-bold border-gold ${isRTL ? 'border-r-2 pr-3' : 'border-l-2 pl-3'}`}>
            {quickLinksHeader}
          </h4>
          <ul className="space-y-2.5 text-sm">
            {linksData.map((link) => (
              <li key={link.key}>
                <button
                  onClick={() => handleLinkClick(link.key)}
                  className="hover:text-gold transition-colors flex items-center gap-1 cursor-pointer hover:underline text-right"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                  <span>{link.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Featured Courses */}
        <div className="space-y-4">
          <h4 className={`text-white text-base font-bold border-gold ${isRTL ? 'border-r-2 pr-3' : 'border-l-2 pl-3'}`}>
            {coursesHeader}
          </h4>
          <ul className="space-y-2.5 text-sm">
            {coursesList.map((item, index) => (
              <li key={index}>
                <button
                  onClick={() => handleLinkClick('courses')}
                  className="hover:text-gold transition-colors cursor-pointer text-right"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Location & Contacts */}
        <div className="space-y-4">
          <h4 className={`text-white text-base font-bold border-gold ${isRTL ? 'border-r-2 pr-3' : 'border-l-2 pl-3'}`}>
            {contactHeader}
          </h4>
          <ul className="space-y-3.5 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <span className="text-slate-400">
                {siteSettings?.address || (isRTL 
                  ? 'شارع بومدين، قرب ساحة أول نوفمبر، وسط مدينة سيدي بلعباس، الجزائر' 
                  : 'Rue Boumediene, Sidi Bel Abbes, Algerie')}
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-gold shrink-0" />
              {siteSettings?.phone ? (
                <span className="[direction:ltr]">{siteSettings.phone}</span>
              ) : (
                <a href="tel:+213550123456" className="hover:text-white [direction:ltr]">043 27 18 19 / 0550 12 34 56</a>
              )}
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-gold shrink-0" />
              <a href={`mailto:${siteSettings?.email || 'contact@najiacademy.dz'}`} className="hover:text-white [direction:ltr]">
                {siteSettings?.email || 'contact@najiacademy.dz'}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <span className="text-xs text-slate-400">
                {siteSettings?.working_hours || (isRTL ? 'السبت - الخميس: 9:00 - 19:00' : 'Samedi - Jeudi: 9:00 - 19:00')}
              </span>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Copyright bar */}
      <div className="border-t border-slate-800 bg-black/20 text-xs py-6 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {currentYear} {siteSettings?.academy_name || 'أكاديمية ناجي (NAJI ACADEMY)'}. {isRTL ? 'جميع الحقوق محفوظة.' : 'All Rights Reserved.'}</p>
          <div className="flex gap-6">
            <button 
              onClick={() => handleLinkClick('privacy')} 
              className="hover:text-white cursor-pointer hover:underline"
            >
              {t('privacy_policy')}
            </button>
            <button 
              onClick={() => handleLinkClick('terms')} 
              className="hover:text-white cursor-pointer hover:underline"
            >
              {t('terms_of_service')}
            </button>
          </div>
        </div>
      </div>

    </footer>
  );
}
