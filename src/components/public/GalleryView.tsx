import React, { useState, useEffect } from 'react';
import { db, subscribeToRealtime } from '../../lib/supabase';
import { GalleryImage } from '../../types';
import { X, ChevronRight, ChevronLeft, Share2, Sparkles } from 'lucide-react';
import { showToast } from '../Toast';
import { useLanguage } from '../../lib/LanguageContext';

export default function GalleryView() {
  const { isRTL, language, t } = useLanguage();
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);


  // Lightbox view state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const fetchGallery = async () => {
    try {
      const res = await db.gallery.list();
      setGallery(res);
    } catch (err) {
      console.error('Error fetching gallery details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();

    const unsubscribe = subscribeToRealtime((key) => {
      if (key === 'naji_gallery') {
        fetchGallery();
      }
    });

    return () => unsubscribe();
  }, []);

  const categories = [
    { key: 'all', label: 'الكل' },
    { key: 'قاعات', label: 'قاعات الدراسة' },
    { key: 'فعاليات', label: 'فعاليات وورشات' },
    { key: 'طلاب', label: 'طلابنا التربويون' },
    { key: 'مناسبات', label: 'مناسبات وتخرج' }
  ];

  // Helper filters
  const filteredGallery = gallery.filter(img => {
    if (activeCategory === 'all') return true;
    return img.category === activeCategory;
  });

  // Lightbox handlers
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && filteredGallery.length > 0) {
      setLightboxIndex((lightboxIndex - 1 + filteredGallery.length) % filteredGallery.length);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && filteredGallery.length > 0) {
      setLightboxIndex((lightboxIndex + 1) % filteredGallery.length);
    }
  };

  const handleShare = (e: React.MouseEvent, img: GalleryImage) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: img.title || 'صورة من أكاديمية ناجي سيدي بلعباس',
        text: 'تفقد هذه الصورة من قاعات التدريس وفعاليات أكاديمية ناجي بسيدي بلعباس!',
        url: img.image_url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(img.image_url);
      showToast('✓ تم نسخ رابط الصورة بنجاح لتشاركه مع عائلتك وأصدقائك!', 'success');
    }
  };

  return (
    <div className="font-sans text-slate-800" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      
      {/* Title head banner with decorative geometric circles */}
      <section className="bg-navy py-12 text-white text-center relative overflow-hidden border-b border-gold/20">
        <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-gold/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <h2 className="text-3xl font-bold font-sans">
            {isRTL ? 'معرض الأكاديمية' : (language === 'fr' ? 'Galerie de l\'Académie' : 'Academy Gallery')}
          </h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            {isRTL 
              ? 'عدسة تسجل بيئة الدراسة والورشات ومناسبات توزيع شهادات أكاديميتنا بسيدي بلعباس.' 
              : (language === 'fr'
                ? 'Une lentille capturant l\'environnement d\'étude, les ateliers et la remise des diplômes à Sidi Bel Abbès.'
                : 'A lens capturing our study environment, workshops, and certificate awards in Sidi Bel Abbes.')}
          </p>
        </div>
      </section>

      {/* Tabs list filter category */}
      <section className="bg-white border-b border-[#12386a]/10 py-4 shadow-sm sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center overflow-x-auto no-scrollbar gap-2 sm:gap-4">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => {
                setActiveCategory(cat.key);
                setLightboxIndex(null); // Clear active lightbox to escape index exceptions
              }}
              className={`px-4 py-2 rounded-[10px] text-xs sm:text-sm font-bold shrink-0 transition-all cursor-pointer ${
                activeCategory === cat.key
                  ? 'bg-gold text-[#12386a] shadow-sm'
                  : 'text-slate-600 hover:text-navy hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Grid Images portfolio */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(idx => (
              <div key={idx} className="bg-slate-200 rounded-[16px] h-64 animate-pulse" />
            ))}
          </div>
        ) : filteredGallery.length === 0 ? (
          <div className="text-center py-20 text-slate-400 max-w-sm mx-auto space-y-3 font-sans">
            <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-navy">المعرض خالٍ حالياً</h4>
            <p className="text-xs leading-relaxed text-slate-500">
              لم نقم بتصنيف أي محتوى صور تحت هذا القسم حالياً. يمكنك تصفح الأقسام الأخرى للاطلاع على أروع لحظاتنا!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGallery.map((img, idx) => (
              <div
                key={img.id}
                onClick={() => setLightboxIndex(idx)}
                className="group relative h-64 rounded-[16px] overflow-hidden border border-[#12386a]/10 shadow-sm cursor-pointer"
              >
                <img
                  src={img.image_url}
                  alt={img.title || 'أكاديمية ناجي'}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Visual Gradation cover */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 flex flex-col justify-end text-right">
                  <span className="text-[10px] font-bold text-gold bg-gold/15 border border-gold/30 px-2 py-0.5 rounded-full inline-block w-fit mb-2">
                    {img.category || 'عام'}
                  </span>
                  <h4 className="text-xs font-bold text-white leading-normal line-clamp-2">{img.title}</h4>
                </div>

                {/* Left floating share trigger */}
                <button
                  onClick={(e) => handleShare(e, img)}
                  className="absolute top-4 left-4 p-2 bg-white/85 text-[#12386a] rounded-[10px] shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  title="مشاركة الصورة"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

      </section>

      {/* Lightbox full interactive popup */}
      {lightboxIndex !== null && filteredGallery[lightboxIndex] && (
        <div
          className="fixed inset-0 bg-black/98 z-[9000] flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Panel Controls */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between text-white z-10">
            <span className="text-xs font-bold font-sans">
              صورة {lightboxIndex + 1} من {filteredGallery.length} · {filteredGallery[lightboxIndex].category}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => handleShare(e, filteredGallery[lightboxIndex])}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="مشاركة"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Left Navigation control */}
          <button
            onClick={handlePrev}
            className="absolute left-4 p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-white transition-all cursor-pointer z-10"
            title="الصورة السابقة"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          {/* Core visual image frame */}
          <div className="max-w-4xl max-h-[75vh] w-full flex items-center justify-center p-4 relative select-none">
            <img
              src={filteredGallery[lightboxIndex].image_url}
              alt={filteredGallery[lightboxIndex].title}
              className="max-w-full max-h-[75vh] object-contain rounded-xl border border-white/5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Right Navigation control */}
          <button
            onClick={handleNext}
            className="absolute right-4 p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-white transition-all cursor-pointer z-10"
            title="الصورة التالية"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          {/* Bottom title display */}
          <div className="absolute bottom-6 left-6 right-6 text-center max-w-2xl mx-auto space-y-1">
            <h4 className="text-white text-base font-bold font-sans line-clamp-2">
              {filteredGallery[lightboxIndex].title}
            </h4>
            <p className="text-xs text-slate-400 font-medium">انقر في أي مكان بالشاشة للمغادرة</p>
          </div>

        </div>
      )}

    </div>
  );
}
