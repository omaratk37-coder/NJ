import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';
import ToastContainer from './components/Toast';

// Public views
import HomeView from './components/public/HomeView';
import CoursesView from './components/public/CoursesView';
import GalleryView from './components/public/GalleryView';
import AboutView from './components/public/AboutView';
import ContactView from './components/public/ContactView';
import LegalViews from './components/public/LegalViews';
import Page404 from './components/public/Page404';
import StudentPortal from './components/public/StudentPortal';

// Admin views
import AdminLogin from './components/admin/AdminLogin';
import AdminSidebar from './components/admin/AdminSidebar';
import AdminHeader from './components/admin/AdminHeader';
import AdminHome from './components/admin/AdminHome';
import AdminBookings from './components/admin/AdminBookings';
import AdminCourses from './components/admin/AdminCourses';
import AdminStudents from './components/admin/AdminStudents';
import AdminEnrolledStudents from './components/admin/AdminEnrolledStudents';
import AdminReviews from './components/admin/AdminReviews';
import AdminMedia from './components/admin/AdminMedia';
import AdminAnalytics from './components/admin/AdminAnalytics';
import AdminSettings from './components/admin/AdminSettings';
import AdminFAQ from './components/admin/AdminFAQ';

import { db, subscribeToRealtime } from './lib/supabase';
import { AdminUser } from './types';
import { ArrowUp, BookOpen, MessageSquare, ShieldCheck } from 'lucide-react';

export default function App() {
  // Navigation states
  const [currentRoute, setCurrentRoute] = useState<'home' | 'courses' | 'gallery' | 'about' | 'contact' | 'privacy' | 'terms' | 'dashboard_portal' | 'student_portal' | '404'>('home');
  
  // Active booking modal states
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [preselectedCourseId, setPreselectedCourseId] = useState<string | undefined>(undefined);

  // Admin session states
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [adminTab, setAdminTab] = useState('ad_home');

  // Back to Top button scroll triggers
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Dynamic Site Settings state
  const [siteSettings, setSiteSettings] = useState<{ [key: string]: string }>({});

  const fetchSettings = async () => {
    try {
      const data = await db.settings.get();
      if (data) {
        setSiteSettings(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchSettings();

    const unsubscribe = subscribeToRealtime((key) => {
      if (key === 'naji_site_settings') {
        fetchSettings();
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Check if there is an active session stored in localStorage
    const saved = localStorage.getItem('naji_admin_session');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {}
    }

    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAdminLoginSuccess = (user: AdminUser) => {
    setCurrentUser(user);
    // Persist
    localStorage.setItem('naji_admin_session', JSON.stringify(user));
    setAdminTab('ad_home');
  };

  const handleAdminLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('naji_admin_session');
    setCurrentRoute('home');
  };

  const handleTriggerBooking = (courseId?: string) => {
    setPreselectedCourseId(courseId);
    setIsBookingOpen(true);
  };

  // Scroll to coordinates center
  const forceScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync route top scroll on change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentRoute, adminTab]);

  // Translate admin tab label for Header title
  const getAdminHeaderTitle = () => {
    switch (adminTab) {
      case 'ad_home': return 'لوحة التحكم والملخص الإداري';
      case 'ad_bookings': return 'دفاتر الحجوزات التدريبية المباشرة';
      case 'ad_courses': return 'إعداد وإدارة الدورات الدراسية';
      case 'ad_students': return 'ملفات وسجلات الطلاب الحضور';
      case 'ad_enrolled_students': return '🎓 الطلاب المسجلون والمستقيلون';
      case 'ad_reviews': return 'مراجعة واعتماد آراء الطلاب';
      case 'ad_media': return 'معرض صور وأفلام الأكاديمية';
      case 'ad_faq': return 'إدارة الأسئلة الشائعة وتثقيف الزوار';
      case 'ad_analytics': return 'التقارير والإحصائيات البنائية';
      case 'ad_settings': return 'الإعدادات وصلاحيات الفريق';
      default: return 'لوحة القيادة';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-800 antialiased selection:bg-gold-light selection:text-gold-dark flex flex-col font-sans">
      
      {/* Toast container always mounted */}
      <ToastContainer />

      {/* ══ RENDER PATHWAYS ══ */}
      {currentRoute === 'dashboard_portal' ? (
        
        currentUser ? (
          /* Locked Admin Cockpit dashboard panel */
          <div className="flex h-screen overflow-hidden text-right print:h-auto print:overflow-visible print:block" style={{ direction: 'rtl' }}>
            
            {/* Sidebar component */}
            <AdminSidebar 
              currentUser={currentUser}
              activeView={adminTab}
              setActiveView={setAdminTab}
              onLogout={handleAdminLogout}
            />

            {/* Dashboard core view container */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#F4F6F9] overflow-y-auto print:bg-white print:overflow-visible print:h-auto print:block">
              {/* Header standard panel */}
              <AdminHeader title={getAdminHeaderTitle()} />

              {/* Dynamic Subviews router according to active admin tab */}
              <main className="flex-1 min-h-0 bg-brand-bg print:bg-white print:overflow-visible print:block">
                {adminTab === 'ad_home' && <AdminHome currentUser={currentUser} onNavigate={setAdminTab} />}
                {adminTab === 'ad_bookings' && <AdminBookings />}
                {adminTab === 'ad_courses' && <AdminCourses />}
                {adminTab === 'ad_students' && <AdminStudents />}
                {adminTab === 'ad_enrolled_students' && <AdminEnrolledStudents />}
                {adminTab === 'ad_reviews' && <AdminReviews />}
                {adminTab === 'ad_media' && <AdminMedia />}
                {adminTab === 'ad_faq' && <AdminFAQ />}
                {adminTab === 'ad_analytics' && <AdminAnalytics />}
                {adminTab === 'ad_settings' && <AdminSettings currentUser={currentUser} />}
              </main>
            </div>

          </div>
        ) : (
          /* Login Card wrapper */
          <div className="flex-1 flex flex-col">
            <Navbar activeTab={currentRoute} setActiveTab={setCurrentRoute} onOpenBooking={() => handleTriggerBooking()} siteSettings={siteSettings} />
            <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />
            <Footer setActiveTab={setCurrentRoute} siteSettings={siteSettings} />
          </div>
        )

      ) : (
        /* ══ PUBLIC FACING WEBSITE LAYOUT ══ */
        <div className="flex-1 flex flex-col">
          
          {/* Header Navbar */}
          <Navbar 
            activeTab={currentRoute} 
            setActiveTab={setCurrentRoute} 
            onOpenBooking={() => handleTriggerBooking()}
            siteSettings={siteSettings}
          />

          {/* Main layout views panel router */}
          <main className="flex-grow">
            {currentRoute === 'home' && (
              <HomeView 
                onOpenBooking={handleTriggerBooking}
                setActiveTab={setCurrentRoute}
              />
            )}
            {currentRoute === 'courses' && (
              <CoursesView 
                onOpenBooking={handleTriggerBooking}
              />
            )}
            {currentRoute === 'gallery' && <GalleryView />}
            {currentRoute === 'about' && <AboutView />}
            {currentRoute === 'contact' && <ContactView siteSettings={siteSettings} />}
            {currentRoute === 'privacy' && <LegalViews type="privacy" />}
            {currentRoute === 'terms' && <LegalViews type="terms" />}
            {currentRoute === 'student_portal' && <StudentPortal setActiveTab={setCurrentRoute} siteSettings={siteSettings} />}
            {currentRoute === '404' && <Page404 onBackToHome={() => setCurrentRoute('home')} />}
          </main>

          {/* Multi column footer */}
          <Footer setActiveTab={setCurrentRoute} siteSettings={siteSettings} />

        </div>
      )}

      {/* ══ BOOK NOW MULTI FORM MODAL ══ */}
      {isBookingOpen && (
        <BookingModal 
          courseId={preselectedCourseId} 
          onClose={() => setIsBookingOpen(false)} 
        />
      )}

      {/* ══ FLOATING ACTION UTILITIES ══ */}
      
      {/* 1. Floating WhatsApp click office trigger */}
      <a
        href={`https://wa.me/${(siteSettings.whatsapp || '213550123456').replace(/[\s\+\-]/g, '').trim()}?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%20%D9%88%D8%B1%D8%AD%D9%85%D8%A9%20%D8%A7%D9%84%D9%84%D9%87...%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%AF%D9%88%D8%B1%D8%A7%D8%AA%20%D8%A3%D9%83%D8%A7%D8%AF%D9%8A%D9%85%D9%8A%D8%A9%20%D9%86%D8%A7%D8%AC%D9%8A%25`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 z-[4000]"
        title="تواصل معنا فوراً عبر واتساب"
      >
        <MessageSquare className="w-6 h-6 animate-pulse" />
      </a>

      {/* 2. Back to Top smooth scroll button */}
      {showBackToTop && (
        <button
          onClick={forceScrollTop}
          className="fixed bottom-6 left-6 w-10 h-10 bg-white hover:bg-slate-100 text-navy border border-slate-200 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 z-[4000] cursor-pointer"
          title="عد للأعلى"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

    </div>
  );
}
