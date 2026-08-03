import React from 'react';
import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

interface Page404Props {
  onBackToHome: () => void;
}

export default function Page404({ onBackToHome }: Page404Props) {
  const { isRTL, language, t } = useLanguage();

  return (
    <div className="min-h-[75vh] bg-navy text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gold/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-gold/5 rounded-full blur-xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
      
      <div className="max-w-md space-y-6 relative z-10">
        
        <div className="w-20 h-20 bg-gold/15 border border-gold/30 rounded-full flex items-center justify-center mx-auto text-gold animate-bounce">
          <AlertCircle className="w-10 h-10" />
        </div>

        <h2 className="text-8xl font-bold text-gold font-mono tracking-widest selection:bg-white select-all">404</h2>
        
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-bold font-sans">
            {isRTL ? 'الصفحة التي تبحث عنها غير موجودة!' : (language === 'fr' ? 'La page recherchée n\'existe pas !' : 'The page you are looking for does not exist!')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans font-medium">
            {isRTL 
              ? 'عذراً، قد يكون الرابط الذي اتبعته غير صالح أو تم إزالته مؤقتاً لمعدلات هندسية أو صيانة. يرجى العودة لصفحة الأكاديمية الرئيسية.' 
              : (language === 'fr'
                ? 'Désolé, le lien suivi est peut-être invalide ou la page a été temporairement supprimée. Veuillez retourner à l\'accueil.'
                : 'Sorry, the link you followed might be invalid or the page has been temporarily removed. Please return to the homepage.')}
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={onBackToHome}
            className="px-6 py-3 bg-gold text-[#12386a] hover:bg-[#b49218] font-bold text-xs sm:text-sm rounded-[10px] transition-all shadow-sm flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            {isRTL ? <ArrowLeft className="w-4 h-4 shrink-0" /> : <ArrowRight className="w-4 h-4 shrink-0" />}
            <span>
              {isRTL ? 'العودة للصفحة الرئيسية للأكاديمية' : (language === 'fr' ? 'Retour à la page d\'accueil' : 'Return to Homepage')}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
