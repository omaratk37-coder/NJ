import React, { useState, useEffect, useRef } from 'react';
import { Award, BookOpen, Clock, Users, Star, ArrowLeft, Play, ArrowDown, ChevronLeft, ChevronRight, Share2, Sparkles, MessageSquare, Send, X } from 'lucide-react';
import { db, subscribeToRealtime } from '../../lib/supabase';
import { Course, Review, GalleryImage, Video, Teacher } from '../../types';
import { showToast } from '../Toast';
import { useLanguage } from '../../lib/LanguageContext';

interface HomeViewProps {
  onOpenBooking: (courseId?: string) => void;
  setActiveTab: (tab: string) => void;
}

export default function HomeView({ onOpenBooking, setActiveTab }: HomeViewProps) {
  const { isRTL, language, t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [video, setVideo] = useState<Video[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [siteSettings, setSiteSettings] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);


  // Lightbox overlay state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Review submission state
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewCourse, setReviewCourse] = useState('الفرنسية');
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Counter animations state
  const [studentsCount, setStudentsCount] = useState(0);
  const [customLanguages, setCustomLanguages] = useState<{ id: string; name: string }[]>([]);

  // Fetch initial home content
  const fetchAllData = async () => {
    try {
      const [cRes, rRes, gRes, vRes, sRes, tRes] = await Promise.all([
        db.courses.list(),
        db.reviews.list(),
        db.gallery.list(),
        db.videos.list(),
        db.settings.get(),
        db.teachers.list()
      ]);
      setCourses(cRes.filter(c => c.status === 'active').slice(0, 4));
      setReviews(rRes.filter(r => r.status === 'approved'));
      setGallery(gRes.slice(0, 6)); // Display latest 6 images
      setVideo(vRes);
      setTeachers(tRes || []);
      setSiteSettings(sRes || {});

      const langsStr = sRes?.custom_languages || JSON.stringify([
        { id: 'French', name: 'الفرنسية' },
        { id: 'English', name: 'الإنجليزية' },
        { id: 'Spanish', name: 'الإسبانية' },
        { id: 'Skills', name: 'مهارات مهنية' }
      ]);
      try {
        setCustomLanguages(JSON.parse(langsStr));
      } catch {}
    } catch (err) {
      console.error('Error fetching Home page contents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Subscribe to realtime seats changes if any are updated in admin panel!
    const unsubscribe = subscribeToRealtime((key) => {
      if (key === 'naji_courses' || key === 'naji_reviews' || key === 'naji_gallery' || key === 'naji_videos' || key === 'naji_site_settings' || key === 'naji_teachers') {
        fetchAllData();
      }
    });

    return () => unsubscribe();
  }, []);

  // Stats counting-up simulation
  useEffect(() => {
    const target = parseInt(siteSettings.stats_students_count || '540') || 540;
    // reset count-up when target changes to prevent getting stuck
    setStudentsCount(0);
    const step = Math.max(1, Math.ceil(target / 45));
    const interval = setInterval(() => {
      setStudentsCount(prev => {
        if (prev >= target) {
          clearInterval(interval);
          return target;
        }
        return prev + step;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [siteSettings.stats_students_count]);

  // Submit test review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim()) {
      showToast('الرجاء إدخال اسمك الكريم لتتم المراجعة الحية', 'warning');
      return;
    }
    if (!reviewText.trim()) {
      showToast('الرجاء كتابة تعليق حقيقي لمشاركة رأيك', 'warning');
      return;
    }

    setReviewSubmitting(true);
    try {
      await db.reviews.create({
        student_name: reviewName.trim(),
        rating: reviewRating,
        course_name: reviewCourse,
        review_text: reviewText.trim()
      });

      showToast('✓ شكراً على مشاركتنا رأيك! سيتم مراجعته واعتماده قريباً', 'success');
      // Reset form variables
      setReviewName('');
      setReviewRating(5);
      setReviewText('');
    } catch (err: any) {
      showToast(err.message || 'فشل إرسال تقييمك. يرجى المحاولة لاحقاً', 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Lightbox navigational controls
  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && gallery.length > 0) {
      setLightboxIndex((lightboxIndex + 1) % gallery.length);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && gallery.length > 0) {
      setLightboxIndex((lightboxIndex - 1 + gallery.length) % gallery.length);
    }
  };

  const handleShareImage = (e: React.MouseEvent, img: GalleryImage) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: img.title || 'صورة من أكاديمية ناجي',
        text: 'شاهد هذه الصورة الرائعة من أكاديمية ناجي لتمكين اللغات والمهارات بسيدي بلعباس!',
        url: img.image_url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(img.image_url);
      showToast('تم نسخ رابط الصورة بجدارة لمشاركتها مع أصدقائك!', 'success');
    }
  };

  const featuredVideo = video.find(v => v.is_featured) || video[0];

  return (
    <div className="font-sans text-slate-800" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      
      {/* ══ SECTION 1: HERO ══ */}
      <section className="relative bg-navy text-white overflow-hidden py-20 lg:py-28 border-b border-gold/20 flex items-center min-h-[480px]">
        {/* Geometric Balance Background patterns (Left/Right portion depending on LTR/RTL) */}
        <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} bottom-0 top-0 w-2/5 hidden lg:block overflow-hidden pointer-events-none`}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] border border-gold/10 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border-2 border-gold/25 rounded-full animate-[spin_60s_linear_infinite]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] bg-gold/5 rounded-full flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-gold rotate-45 animate-[pulse_3s_ease-in-out_infinite]"></div>
          </div>
        </div>
        
        {/* Subtle blur to soften dark slate contrast */}
        <div className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} w-[500px] h-[500px] bg-gold/5 rounded-full blur-3xl -translate-y-1/2 ${isRTL ? 'translate-x-1/3' : '-translate-x-1/3'} pointer-events-none`} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className={`w-full lg:w-3/5 ${isRTL ? 'text-right' : 'text-left'} space-y-6`}>
            
            {/* Badge indicator info */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/30 text-gold rounded-full text-xs sm:text-sm font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
              <span>{isRTL ? 'تعليم حضوري · سيدي بلعباس، الجزائر' : (language === 'fr' ? 'Présentiel · Sidi Bel Abbès, Algérie' : 'In-Person · Sidi Bel Abbes, Algeria')}</span>
            </div>

            {/* Main Title Heading standard styling */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-sans leading-[1.1] text-white whitespace-pre-line">
              {language === 'ar' ? (siteSettings.home_hero_title || 'تعلّم اللغات الأجنبية وطوّر مهاراتك الفعالة') : t('hero_title')}
            </h2>

            <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-xl leading-relaxed">
              {language === 'ar' ? (siteSettings.home_hero_subtitle || 'انضم إلى أكاديمية ناجي لتمكين اللغات بمقرها الشارح بسيدي بلعباس، واحصل على تكوينات تفاعلية حية تمنحك الثقة للتميز المهني والأكاديمي.') : t('hero_subtitle')}
            </p>

            {/* Call to actions following the required rounded-[10px] theme */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 max-w-md">
              <button
                onClick={() => onOpenBooking()}
                className="w-full sm:w-auto px-8 py-3.5 bg-gold text-[#12386a] font-bold rounded-[10px] hover:bg-[#b49218] transition-colors shadow-sm cursor-pointer"
              >
                {t('book_now_cta')}
              </button>
              <button
                onClick={() => {
                  setActiveTab('courses');
                  window.scrollTo({ top: 350, behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-8 py-3.5 bg-transparent text-white font-bold rounded-[10px] border border-white/30 hover:bg-white/5 transition-colors cursor-pointer text-center"
              >
                {t('explore_courses')}
              </button>
            </div>

          </div>
        </div>
      </section>


      {/* ══ SECTION 2: STATS BAR ══ */}
      <section className="bg-white py-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-100">
          
          <div className="py-2.5">
            <p className="text-3xl sm:text-4xl font-extrabold text-navy font-mono">+{studentsCount}</p>
            <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">
              {language === 'ar' 
                ? (siteSettings.stats_students_label || 'طالب متخرج ودخل سوق العمل') 
                : (language === 'fr' ? 'Étudiants diplômés' : 'Graduated students')}
            </p>
          </div>

          <div className="py-2.5 md:border-r border-slate-100">
            <p className="text-3xl sm:text-4xl font-extrabold text-navy font-mono">
              {siteSettings.stats_active_courses || '04'}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">
              {language === 'ar'
                ? (siteSettings.stats_active_courses_label || 'دورات رئيسية نشطة بالتعاقد')
                : (language === 'fr' ? 'Cours principaux actifs' : 'Active main courses')}
            </p>
          </div>

          <div className="py-2.5 md:border-r border-slate-100">
            <div className="flex items-center justify-center gap-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-navy font-mono">
                {siteSettings.stats_overall_rating || '4.9'}
              </p>
              <Star className="w-6 h-6 fill-gold text-gold" />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">
              {language === 'ar'
                ? (siteSettings.stats_overall_rating_label || 'تقييم الأكاديمية العام من الطلاب')
                : (language === 'fr' ? 'Évaluation globale' : 'Overall student rating')}
            </p>
          </div>

        </div>
      </section>


      {/* ══ SECTION 3: COURSES PREVIEW ══ */}
      <section className="py-20 bg-brand-bg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-right max-w-xl space-y-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-navy font-sans py-0.5 border-r-4 border-gold pr-4">الدورات التدريبية المتاحة</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              اختر لغتك أو مهاراتك المستهدفة، وتفقد مقاعدك الشاغرة بفضل الحسابات التفاعلية المباشرة.
            </p>
          </div>

          {loading ? (
            /* Loading skeletons state */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200/50 p-6 space-y-4 animate-pulse">
                  <div className="h-6 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="pt-4 h-10 bg-slate-200 rounded w-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {courses.map(course => {
                  const seatsRemaining = course.max_seats - course.enrolled_count;
                  const ratio = Math.min(100, Math.round((course.enrolled_count / course.max_seats) * 100));

                  return (
                    <div 
                      key={course.id}
                      className="bg-white rounded-[16px] border border-[#12386a]/10 shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]"
                      style={{ borderRightWidth: '4px', borderRightColor: 'hsl(47, 72%, 49%)' }}
                    >
                      
                      {/* Top Header details */}
                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between gap-2.5">
                          <div>
                            <span className="px-2.5 py-1 text-[11px] font-bold bg-navy-light text-navy rounded-md border border-navy/10">
                              {customLanguages.find(l => l.id === course.language || l.name === course.language)?.name || course.language}
                            </span>
                            <span className="mr-2 px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-600 rounded-md">
                              {course.level === 'beginner' ? 'مبتدئ' : 
                               course.level === 'intermediate' ? 'متوسط' : 
                               course.level === 'advanced' ? 'متقدم' : 'كل المستويات'}
                            </span>
                          </div>
                          
                          {/* Duration Badge */}
                          <span className="text-xs font-bold text-gold-dark bg-gold-light px-2.5 py-1 rounded-md border border-gold/10">
                            المدة: {course.duration}
                          </span>
                        </div>

                        <h4 className="text-lg font-bold text-navy leading-snug">{course.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{course.description}</p>

                        <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100 text-slate-600">
                          <div>
                            <span className="font-bold block text-slate-400 mb-0.5">الجدول الزمني:</span>
                            {course.schedule}
                          </div>
                          <div>
                            <span className="font-bold block text-slate-400 mb-0.5">بداية الدورة:</span>
                            {new Date(course.start_date).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        </div>

                        {/* Capacity indicators as requested */}
                        <div className="space-y-1.5 pt-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-600">المقاعد الممتلئة: {course.enrolled_count} / {course.max_seats}</span>
                            {seatsRemaining > 5 ? (
                              <span className="text-emerald-600 font-bold">✓ {seatsRemaining} مقعد شاغر</span>
                            ) : seatsRemaining > 0 ? (
                              <span className="text-amber-600 font-bold animate-pulse">متبقى {seatsRemaining} مقاعد فقط!</span>
                            ) : (
                              <span className="text-rose-600 font-bold">مكتمل تماماً</span>
                            )}
                          </div>

                          {/* Progress capacity bar stats */}
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                seatsRemaining === 0 ? 'bg-rose-500' :
                                seatsRemaining <= 5 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                        </div>

                      </div>

                      {/* Foot Action Button trigger */}
                      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                        <div>
                          <span className="text-xs text-slate-400 block font-bold">رسوم استثمار الدورة:</span>
                          <span className="text-base font-black text-navy font-sans">{course.price} دج <span className="text-xs font-normal text-slate-500">/ شاملة</span></span>
                        </div>

                        <button
                          onClick={() => onOpenBooking(course.id)}
                          className={`px-5 py-2.5 rounded-[10px] font-bold text-xs transition-all shadow-sm cursor-pointer ${
                            seatsRemaining === 0 
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 cursor-not-allowed hover:bg-rose-100' 
                              : 'bg-gold hover:bg-[#b49218] text-slate-950 font-bold hover:scale-[1.01]'
                          }`}
                        >
                          {seatsRemaining === 0 ? 'انضم للإحتياط' : 'حجز مقعد الآن'}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* View all courses button link direction */}
              <div className="text-center pt-4">
                <button
                  onClick={() => setActiveTab('courses')}
                  className="inline-flex items-center gap-1.5 px-6 py-3 border border-navy/20 text-navy hover:text-gold hover:bg-navy rounded-[10px] text-sm font-bold transition-all cursor-pointer"
                >
                  <span>عرض جميع دورات وتفاصيل الأكاديمية</span>
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </>
          )}

        </div>
      </section>


      {/* ══ SECTION 4: WHY US ══ */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-right max-w-xl space-y-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-navy font-sans border-r-4 border-gold pr-4">لماذا أكاديمية ناجي لتمكين القدرات؟</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-sans">
              نوفر لك الضمانات والبيئة التعليمية الفائقة لتتحصل على غايتك الحقيقية في نيل التميز اللغوي والأكاديمي.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <BookOpen className="w-6 h-6 text-gold" />,
                title: 'بيئة تعليمية محفزة',
                text: 'قاعات مكيفة بالكامل مجهزة بسبورات تفاعلية ووسائل سمعية تضمن الاندماج الذهني التام.'
              },
              {
                icon: <Users className="w-6 h-6 text-gold" />,
                title: 'مدرسون متخصصون وذوو خبرة',
                text: 'طاقم تربوي متميز يملك كفاءات جامعية جزائرية ودولية طويلة الأجل في إدارة وتدريس المناهج الحية.'
              },
              {
                icon: <Clock className="w-6 h-6 text-gold" />,
                title: 'جداول مرنة تناسب الجميع',
                text: 'حصص صباحية ومسائية مكثفة تتماشى مع التزامات الطلاب المهنية والدراسية المتعددة.'
              },
              {
                icon: <Award className="w-6 h-6 text-gold" />,
                title: 'شهادات معتمدة عند الإتمام',
                text: 'تتوج دورتك بشهادة مهاراتية ترفع من شأن سيرتك الذاتية وتسهل نيل فرص الشراكة والوظائف.'
              }
            ].map((card, idx) => (
              <div 
                key={idx} 
                className="p-6 rounded-[16px] bg-slate-50/50 border border-[#12386a]/10 hover:bg-slate-50 hover:border-slate-300/60 transition-all text-right space-y-3.5"
              >
                <div className="w-12 h-12 bg-navy rounded-[10px] flex items-center justify-center shadow">
                  {card.icon}
                </div>
                <h4 className="text-base font-bold text-navy">{card.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ══ SECTION 5: VIDEO ══ */}
      <section className="py-20 bg-navy text-white text-right relative border-b border-navy-dark overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
          
          <div className="text-right max-w-xl space-y-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-white border-r-4 border-gold pr-4">تعرّف على أكاديميتنا</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              أجواء دراسية ممتعة تضمن التطور المستمر لجميع الفئات والأعمار بهدف الوصول للاحترافية.
            </p>
          </div>

          <div className="w-full aspect-video rounded-[16px] overflow-hidden border border-white/10 shadow-2xl bg-navy-dark relative flex items-center justify-center">
            {featuredVideo ? (
              <iframe
                title={featuredVideo.title}
                src={featuredVideo.embed_url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              /* Custom Video component fallback styling requested */
              <div className="p-8 text-center space-y-4">
                <div className="w-20 h-20 bg-gold text-navy rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
                  <Play className="w-10 h-10 fill-navy ml-1" />
                </div>
                <h4 className="text-lg font-bold text-slate-200">الترويج للأكاديمية والبناء قيد التجهيز</h4>
                <p className="text-xs text-slate-400">سوف يتوفر هنا فيديو غني بمجرد تحميل الرابط على لوحة التحكم.</p>
              </div>
            )}
          </div>

        </div>
      </section>


      {/* ══ SECTION 6: GALLERY PREVIEW ══ */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-right max-w-xl space-y-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-navy font-sans border-r-4 border-gold pr-4">لحظات مميزة من أكاديميتنا</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-sans">
              تصفح صوراً واقعية وشفافة لحصص التعليم، النشاطات، الحفلات وطلابنا المتوجين بشهادات النجاح.
            </p>
          </div>

          {gallery.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">جديد الصور سينخرط هنا قريباً...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery.map((img, idx) => (
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
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 flex flex-col justify-end text-right">
                    <span className="text-[10px] font-bold text-gold bg-gold/15 border border-gold/30 px-2 py-0.5 rounded-full inline-block w-fit mb-2">
                      {img.category || 'عام'}
                    </span>
                    <h5 className="text-sm font-bold text-white leading-snug line-clamp-2">{img.title}</h5>
                  </div>
                  
                  {/* Share button overlay */}
                  <button
                    onClick={(e) => handleShareImage(e, img)}
                    className="absolute top-4 left-4 p-2 bg-white/80 hover:bg-white text-navy rounded-lg shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    title="مشاركة الصورة"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="text-center pt-4">
            <button
               onClick={() => {
                 setActiveTab('gallery');
                 window.scrollTo({ top: 350, behavior: 'smooth' });
               }}
               className="px-6 py-3 bg-navy text-white hover:bg-gold hover:text-slate-950 font-bold text-xs rounded-[10px] shadow-sm transition-all cursor-pointer"
            >
              تصفح كامل معرض الأكاديمية
            </button>
          </div>

        </div>
      </section>


      {/* ══ SECTION 7: TESTIMONIALS ══ */}
      <section className="py-20 bg-brand-bg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-right max-w-xl space-y-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-navy font-sans border-r-4 border-gold pr-4">ماذا يقول طلابنا عنا؟</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-sans">
              صدق ورضا طلابنا هو رأس مالنا الفعلي. اقرأ شهادات الطلاب المتخرجين من أكاديمية ناجي.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map(review => (
              <div 
                key={review.id}
                className="bg-white p-6 rounded-[16px] border border-[#12386a]/10 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3 font-sans">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 shrink-0 ${
                          i < review.rating ? 'fill-gold text-gold' : 'text-slate-200'
                        }`} 
                      />
                    ))}
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed font-sans font-medium text-right select-all">
                    "{review.review_text}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                  <div>
                    <span className="font-extrabold text-slate-800 block text-right">{review.student_name}</span>
                    <span className="text-slate-400 font-medium block mt-0.5">طالب(ة) متميز(ة)</span>
                  </div>
                  {review.course_name && (
                    <span className="px-2.5 py-1 font-bold bg-navy-light text-navy rounded-md">
                      دورة: {review.course_name}
                    </span>
                  )}
                </div>

              </div>
            ))}
          </div>

          
          {/* ══ SECTION 8: STAR SUBMISSION FORM ══ */}
          <div className="max-w-2xl mx-auto bg-white rounded-[16px] border border-[#12386a]/10 p-6 md:p-8 space-y-6 mt-16 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 bg-gold flex items-center justify-center rounded-[10px] text-slate-950 font-bold shrink-0">
                <Sparkles className="w-5 h-5 text-navy" />
              </div>
              <div className="text-right">
                <h4 className="text-lg font-bold text-navy font-sans">شاركنا رأيك وتجربتك</h4>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">رأيك يساعدنا على الارتقاء ويهدي الزملاء الجدد في خياراتهم</p>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 font-sans">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">الاسم واللقب</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أمين سفيان"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full p-2.5 rounded-[10px] border border-[#12386a]/20 bg-white text-sm focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">الدورة التي التحقت بها</label>
                  <select
                    value={reviewCourse}
                    onChange={(e) => setReviewCourse(e.target.value)}
                    className="w-full p-2.5 rounded-[10px] border border-[#12386a]/20 bg-white text-sm focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-all"
                  >
                    <option value="الفرنسية">اللغة الفرنسية</option>
                    <option value="الإنجليزية">اللغة الإنجليزية</option>
                    <option value="الإسبانية">اللغة الإسبانية</option>
                    <option value="مهارات مهنية">مهارات مهنية وتواصل</option>
                  </select>
                </div>
              </div>

              {/* Interactive stars selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">تقييمك للأكاديمية والأساتذة</label>
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const starsCount = idx + 1;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReviewRating(starsCount)}
                        className="p-1 focus:outline-none transform hover:scale-110 active:scale-95 transition-all text-gold cursor-pointer"
                        title={`${starsCount} نجوم`}
                      >
                        <Star 
                          className={`w-7 h-7 ${
                            starsCount <= reviewRating ? 'fill-gold text-gold' : 'text-slate-200'
                          }`} 
                        />
                      </button>
                    );
                  })}
                  <span className="text-xs font-bold text-slate-500 mr-2">
                    {reviewRating === 5 ? 'ممتاز جداً!' : 
                     reviewRating === 4 ? 'جيد جداً' : 
                     reviewRating === 3 ? 'متوسط ومقبول' : 
                     reviewRating === 2 ? 'بحاجة لتحسين' : 'ضعيف'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">تعليقك أو رسالتك</label>
                <textarea
                  required
                  placeholder="حدثنا باختصار عن مستواك التدريسي، علاقة الأساتذة معك، والمهارات التي نلتها بالأكاديمية..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-[10px] border border-[#12386a]/20 bg-white text-sm focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-all leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-6 py-2.5 rounded-[10px] bg-navy text-white hover:bg-navy-dark text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {reviewSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جاري إرسال رأيك...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      إرسال التقييم للمراجعة والاعتماد
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

        </div>
      </section>


      {/* ══ SECTION 8.5: TEACHERS OF THE MONTH BY BRANCH ══ */}
      {teachers.filter(t => t.is_of_the_month).length > 0 && (
        <section className="py-20 bg-slate-50 border-b border-slate-200 overflow-hidden relative">
          {/* Decorative shapes to add visual interest */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#12386a]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
            
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold/15 border border-gold/30 rounded-full text-gold-dark text-xs font-bold animate-[pulse_2s_infinite]">
                <Sparkles className="w-3.5 h-3.5 text-gold-dark fill-gold" />
                <span>لوحة شرف الأكاديمية</span>
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-navy font-sans tracking-tight">
                أساتذة الشهر المتميزين في كل شعبة 🌟
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">
                نفخر بنخبة الكفاءات التدريبية والتربوية التي تقود مسيرة النجاح، ونكرّم تميزهم الأكاديمي ودعمهم المستمر لأبنائنا الطلبة.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
              {teachers.filter(t => t.is_of_the_month).map((teacher) => {
                const branchName = customLanguages.find(l => l.id === teacher.branch_id || l.name === teacher.branch_id)?.name || 'شعبة عامة';
                
                return (
                  <div 
                    key={teacher.id} 
                    className="bg-white rounded-2xl border border-gold/40 shadow-md p-6 relative flex flex-col items-center text-center space-y-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ring-4 ring-gold/10"
                  >
                    {/* Golden Star Banner Badge */}
                    <div className="absolute -top-3.5 right-4 bg-navy text-gold text-[10px] font-black px-3.5 py-1.5 rounded-full border border-gold flex items-center gap-1 shadow-md">
                      <Sparkles className="w-3 h-3 fill-gold text-gold" />
                      <span>{teacher.month_text || 'أستاذ الشهر 🌟'}</span>
                    </div>

                    {/* Branch Ribbon Badge */}
                    <span className="px-3 py-1 bg-gold-dark/15 text-gold-dark rounded-md text-xs font-black uppercase tracking-wider border border-gold/25 mt-2">
                       {branchName}
                    </span>

                    {/* Image with fancy double border */}
                    <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-gold to-navy-light shadow-md relative group">
                      <div className="w-full h-full rounded-full overflow-hidden bg-slate-100">
                        <img 
                          src={teacher.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=250'} 
                          alt={teacher.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-navy">{teacher.name}</h4>
                      <p className="text-xs text-navy/70 font-semibold">{teacher.role}</p>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed font-sans pt-3 border-t border-slate-100 w-full">
                      {teacher.exp}
                    </p>
                  </div>
                );
              })}
            </div>

          </div>
        </section>
      )}


      {/* ══ SECTION 9: CTA BOOKING ══ */}
      <section className="py-24 bg-navy text-white relative overflow-hidden border-b border-navy-dark text-center">
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-gold/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-100 font-sans tracking-tight">هل أنت مستعد لمستقبل حافل بالفرص؟</h3>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            التحق بالدفعة القادمة من طلاب اللغات والمهارات بأكاديمية ناجي بسيدي بلعباس. المقاعد محدودة لنظام استيعابي يضمن الفعالية التامة لكل طالب.
          </p>
          <div className="pt-5">
            <button
              onClick={() => onOpenBooking()}
              className="px-8 py-4 bg-gold text-slate-950 font-black text-sm tracking-wide rounded-xl shadow-lg hover:bg-gold-dark hover:scale-105 transition-all text-center cursor-pointer inline-flex items-center gap-1.5"
            >
              احجز مقعدك الآن واحصل على استشارة مجانية
            </button>
          </div>
        </div>
      </section>


      {/* ══ LIGHTBOX OVERLAY GRAPHIC ══ */}
      {lightboxIndex !== null && gallery.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/95 z-[999] flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Panel Controls */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between text-white z-10">
            <span className="text-xs text-slate-300 font-bold font-sans">
              صورة {lightboxIndex + 1} من {gallery.length} · {gallery[lightboxIndex].category}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => handleShareImage(e, gallery[lightboxIndex])}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="مشاركة"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Left Arrow */}
          <button
            onClick={handlePrevImage}
            className="absolute left-4 p-2 md:p-3 rounded-full bg-white/5 hover:bg-white/15 text-white transition-all cursor-pointer z-10"
            title="الصورة السابقة"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          {/* Image Display */}
          <div className="max-w-4xl max-h-[75vh] w-full flex items-center justify-center p-4 relative select-none">
            <img 
              src={gallery[lightboxIndex].image_url} 
              alt={gallery[lightboxIndex].title} 
              className="max-w-full max-h-[75vh] object-contain rounded-xl border border-white/5 shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Prevent closing on image click
            />
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleNextImage}
            className="absolute right-4 p-2 md:p-3 rounded-full bg-white/5 hover:bg-white/15 text-white transition-all cursor-pointer z-10"
            title="الصورة التالية"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          {/* Bottom Title Text panel */}
          <div className="absolute bottom-6 left-6 right-6 text-center max-w-2xl mx-auto space-y-1">
            <h4 className="text-white text-base font-bold font-sans line-clamp-2">
              {gallery[lightboxIndex].title}
            </h4>
            <p className="text-xs text-slate-400 font-medium">انقر في محيط الشاشة للعودة للمعرض</p>
          </div>

        </div>
      )}

    </div>
  );
}
