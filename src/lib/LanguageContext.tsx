import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ar' | 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Navbar & Footer Links
    'home': 'الرئيسية',
    'courses': 'دوراتنا',
    'about': 'من نحن',
    'gallery': 'معرضنا',
    'contact': 'تواصل معنا',
    'student_portal': 'بوابة الطالب',
    'book_now': 'احجز مقعدك',
    'book_now_cta': 'احجز مقعدك الآن',
    'academy_support': 'دعم الأكاديمية',
    'copyright': 'جميع الحقوق محفوظة لأكاديمية ناجي لتمكين اللغات والمهارات ©',

    // Hero / Home View
    'hero_title': 'أكاديمية ناجي للتمكين المعرفي والمهاري',
    'hero_subtitle': 'بوابتك الذهبية لتعلم اللغات وتطوير المهارات القيادية والتقنية بأحدث المناهج التعليمية وتحت إشراف كوكبة من الأساتذة المتميزين.',
    'explore_courses': 'استكشف دوراتنا',
    'our_features': 'ميزاتنا الفريدة',
    'learn_more': 'اقرأ المزيد',

    // Contact Page
    'contact_us': 'تواصل معنا',
    'contact_desc': 'نحن هنا للإجابة على استفساراتك ومساعدتك في اختيار الدورة الأنسب لك.',
    'your_name': 'الاسم الكامل',
    'email': 'البريد الإلكتروني',
    'phone': 'رقم الهاتف',
    'subject': 'الموضوع',
    'message': 'رسالتك',
    'send': 'إرسال الرسالة',

    // Student Portal
    'portal_title': 'بوابة الطلاب الإلكترونية',
    'portal_desc': 'يرجى تسجيل الدخول للوصول إلى بطاقتك الدراسية وسجلات حضورك واشتراكاتك.',
    'student_id': 'رقم بطاقة الطالب أو الهوية الرقمية',
    'login': 'تسجيل الدخول',
    'logout': 'تسجيل الخروج',

    // Common Phrases
    'loading': 'جاري التحميل...',
    'success': 'تمت العملية بنجاح',
    'error': 'حدث خطأ ما',
    'warning': 'تنبيه',
    'export': 'تصدير البيانات',
    'close': 'إغلاق',
    'no_data': 'لا توجد بيانات حالياً',
    'back_to_home': 'العودة للرئيسية',
    'privacy_policy': 'سياسة الخصوصية',
    'terms_of_service': 'شروط الخدمة',
  },
  en: {
    // Navbar & Footer Links
    'home': 'Home',
    'courses': 'Our Courses',
    'about': 'About Us',
    'gallery': 'Gallery',
    'contact': 'Contact Us',
    'student_portal': 'Student Portal',
    'book_now': 'Book Now',
    'book_now_cta': 'Book Your Seat Now',
    'academy_support': 'Academy Support',
    'copyright': 'All Rights Reserved to Naji Academy for Languages and Skills ©',

    // Hero / Home View
    'hero_title': 'Naji Academy for Cognitive & Skill Empowerment',
    'hero_subtitle': 'Your golden gate to learn languages and develop leadership & technical skills with the latest curricula, under the supervision of outstanding professors.',
    'explore_courses': 'Explore Our Courses',
    'our_features': 'Our Unique Features',
    'learn_more': 'Learn More',

    // Contact Page
    'contact_us': 'Contact Us',
    'contact_desc': 'We are here to answer your questions and help you choose the most suitable course.',
    'your_name': 'Full Name',
    'email': 'Email Address',
    'phone': 'Phone Number',
    'subject': 'Subject',
    'message': 'Your Message',
    'send': 'Send Message',

    // Student Portal
    'portal_title': 'Electronic Student Portal',
    'portal_desc': 'Please sign in to access your student card, attendance records, and active subscriptions.',
    'student_id': 'Student ID Card / Digital Identity',
    'login': 'Login',
    'logout': 'Logout',

    // Common Phrases
    'loading': 'Loading...',
    'success': 'Operation completed successfully',
    'error': 'Something went wrong',
    'warning': 'Warning',
    'export': 'Export Data',
    'close': 'Close',
    'no_data': 'No data available currently',
    'back_to_home': 'Back to Home',
    'privacy_policy': 'Privacy Policy',
    'terms_of_service': 'Terms of Service',
  },
  fr: {
    // Navbar & Footer Links
    'home': 'Accueil',
    'courses': 'Nos Cours',
    'about': 'À Propos',
    'gallery': 'Galerie',
    'contact': 'Contactez-nous',
    'student_portal': 'Portail Étudiant',
    'book_now': 'S\'inscrire',
    'book_now_cta': 'Réservez Votre Place Maintenant',
    'academy_support': 'Support de l\'Académie',
    'copyright': 'Tous droits réservés à l\'Académie Naji pour les langues et compétences ©',

    // Hero / Home View
    'hero_title': 'Académie Naji d\'autonomisation cognitive et de compétences',
    'hero_subtitle': 'Votre porte dorée pour apprendre les langues et développer des compétences de leadership et techniques avec les derniers programmes, sous la direction de professeurs exceptionnels.',
    'explore_courses': 'Explorer Nos Cours',
    'our_features': 'Nos Caractéristiques Uniques',
    'learn_more': 'En savoir plus',

    // Contact Page
    'contact_us': 'Contactez-nous',
    'contact_desc': 'Nous sommes là pour répondre à vos questions et vous aider à choisir le cours le plus adapté.',
    'your_name': 'Nom Complet',
    'email': 'Adresse E-mail',
    'phone': 'Numéro de Téléphone',
    'subject': 'Sujet',
    'message': 'Votre Message',
    'send': 'Envoyer le Message',

    // Student Portal
    'portal_title': 'Portail Étudiant Électronique',
    'portal_desc': 'Veuillez vous connecter pour accéder à votre carte d\'étudiant, vos registres de présence et vos abonnements actifs.',
    'student_id': 'Carte d\'étudiant ou identité numérique',
    'login': 'Se Connecter',
    'logout': 'Se Déconnecter',

    // Common Phrases
    'loading': 'Chargement...',
    'success': 'Opération réussie',
    'error': 'Une erreur est survenue',
    'warning': 'Avertissement',
    'export': 'Exporter les données',
    'close': 'Fermer',
    'no_data': 'Aucune donnée disponible actuellement',
    'back_to_home': 'Retour à l\'accueil',
    'privacy_policy': 'Politique de confidentialité',
    'terms_of_service': 'Conditions d\'utilisation',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('naji_app_lang');
    return (saved as Language) || 'ar';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('naji_app_lang', lang);
  };

  const isRTL = language === 'ar';

  useEffect(() => {
    // Set direction of body and HTML element
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['ar']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
