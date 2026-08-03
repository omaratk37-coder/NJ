import React, { useEffect, useState } from 'react';
import { Target, Eye, Compass, ShieldCheck, Award, Star, Loader2 } from 'lucide-react';
import { db, subscribeToRealtime } from '../../lib/supabase';
import { Teacher } from '../../types';
import { useLanguage } from '../../lib/LanguageContext';

export default function AboutView() {
  const { isRTL, language, t } = useLanguage();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [siteSettings, setSiteSettings] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);


  const fetchData = async () => {
    try {
      const [tList, settings] = await Promise.all([
        db.teachers.list(),
        db.settings.get()
      ]);
      setTeachers(tList);
      setSiteSettings(settings || {});
    } catch (err) {
      console.error('Error loading about page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const unsubscribe = subscribeToRealtime((key) => {
      if (key === 'naji_teachers' || key === 'naji_site_settings') {
        fetchData();
      }
    });

    return () => unsubscribe();
  }, []);

  // Settings values with defaults
  const heroTitle = siteSettings.about_hero_title || 'نبذة عن الأكاديمية';
  const heroSubtitle = siteSettings.about_hero_subtitle || 'قصتنا، مبادئنا، ونخبة الكفاءات القائمة على رعاية وتكوين أجيال المستقبل بسيدي بلعباس.';
  const storyBadge = siteSettings.about_story_badge || 'تأسست بدوافع وطنية وعلمية';
  const storyTitle = siteSettings.about_story_title || 'قصّة التأسيس والرسالة التربوية';
  const storyP1 = siteSettings.about_story_p1 || 'انطلقت أكاديمية ناجي لتمكين اللغات والمهارات بمدينة سيدي بلعباس البهية، الجزائر، من منطلق وعينا التام بضرورة كسر الحواجز الكلاسيكية التي تشوب برامج تدريس اللغات والعلوم المهارية المعاصرة.';
  const storyP2 = siteSettings.about_story_p2 || 'رأينا ندرة في المقرات التي توفر للطالب الجزائري بيئة تفاعلية تطبيقية حية تؤهله مباشرة لسوق العمل أو لإجراء الدراسات والامتحانات الفيدرالية بفرنسا وإسبانيا والدول الناطقة بالإنجليزية بثقة وفصاحة، فأسسنا هذا الصرح ليكون منارة للتطوير الفعلي للذات وبأفضل تكلفة ممكنة.';
  const visionText = siteSettings.about_vision_text || 'أن نصبح الخيار التدريبي الأول والمعياري المفضل للأسر والمهنيين على مستوى الغرب الجزائري لتعليم اللغات الحية.';
  const missionText = siteSettings.about_mission_text || 'توفير رعاية تكوينية وتوجيهية متطورة لكل طالب عبر قاعات حديثة ومناهج دراسية تفاعلية حية تخاطب عقله ونبوغه.';
  const valuesTitle = siteSettings.about_values_title || 'القيم التي نوجه بها قراراتنا';
  const valuesSubtitle = siteSettings.about_values_subtitle || 'تتركز عملياتنا التكوينية والإدارية حول منظومة من المبادئ الأخلاقية والمهنية السامية.';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
        <p className="text-xs text-slate-400 font-sans">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="font-sans text-slate-800" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      
      {/* Hero Banner header with decorative geometric balance shapes */}
      <section className="bg-navy py-16 text-white text-center relative overflow-hidden border-b border-gold/20">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gold/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-gold/5 rounded-full blur-xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        
        <div className="relative z-10 space-y-2 px-4">
          <h2 className="text-3xl font-bold font-sans">{heroTitle}</h2>
          <p className="text-xs text-slate-300 max-w-sm sm:max-w-xl mx-auto leading-relaxed">
            {heroSubtitle}
          </p>
        </div>
      </section>

      {/* Story & Vision sections */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold/10 border border-gold/30 rounded-[10px] text-gold-dark text-xs font-bold w-fit">
              <span>{storyBadge}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-navy leading-snug border-r-4 border-gold pr-4">
              {storyTitle}
            </h3>
            
            <p className="text-sm text-slate-600 leading-relaxed font-sans">
              {storyP1}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed font-sans">
              {storyP2}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <h4 className="font-bold text-navy flex items-center gap-1.5 text-sm">
                  <Target className="w-4 h-4 text-gold shrink-0" />
                  <span>رؤيتنا المستدامة</span>
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">{visionText}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-navy flex items-center gap-1.5 text-sm">
                  <Eye className="w-4 h-4 text-gold shrink-0" />
                  <span>مهمتنا اليومية</span>
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">{missionText}</p>
              </div>
            </div>
          </div>

          <div className="relative h-96 lg:h-full min-h-[350px] rounded-[16px] overflow-hidden border border-[#12386a]/10 shadow-sm bg-slate-100">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800" 
              alt="نشاطات وتوجيهات الطلاب بقاعة أكاديمية ناجي"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-navy/20" />
          </div>

        </div>
      </section>

      {/* Values panel */}
      <section className="py-20 bg-brand-bg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-right max-w-xl space-y-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-navy font-sans border-r-4 border-gold pr-4">{valuesTitle}</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-sans">
              {valuesSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <ShieldCheck className="w-6 h-6 text-gold" />,
                title: 'الأمانة والجدية الأكاديمية',
                text: 'نلتزم أمام كل طالب وأسرته بتقديم مادة علمية تفاعلية حقيقية وغير مجتزأة لضمان نيل النتائج والمهارات الكاملة.'
              },
              {
                icon: <Compass className="w-6 h-6 text-gold" />,
                title: 'التوجيه والإرشاد المستمر',
                text: 'لا يتوقف دور طاقمنا عند إلقاء الدرس، بل نمتد للتوجيه وصقل شخصية الطالب لمواجهة مقابلات العمل بذكاء وفطنة.'
              },
              {
                icon: <Award className="w-6 h-6 text-gold" />,
                title: 'الجودة والتطوير الدائم',
                text: 'نواكب بشكل موسمي كل المواد التدريسية وأدوات التقنية الذكية ونطور كفاءات أساتذتنا لنبقى دائماً في الصدارة.'
              }
            ].map((value, idx) => (
              <div 
                key={idx} 
                className="bg-white p-6 rounded-[16px] border border-[#12386a]/10 shadow-sm text-right space-y-4"
              >
                <div className="w-12 h-12 rounded-[10px] bg-navy flex items-center justify-center">
                  {value.icon}
                </div>
                <h4 className="text-base font-bold text-navy">{value.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{value.text}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Dynamic educational team list */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-right max-w-xl space-y-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-navy font-sans border-r-4 border-gold pr-4">مؤسسو وأعضاء الهيئة التعليمية</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-sans">
              طاقم متلاحم ومتناغم يضع خبراته وضميره المهني في خدمة نجاحكم ومستقبل مهاراتكم الأكاديمية.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teachers.map((member) => (
              <div 
                key={member.id} 
                className={`bg-slate-50 rounded-[16px] border p-6 text-center space-y-4 relative transition-all duration-300 hover:shadow-md ${
                  member.is_of_the_month 
                    ? 'border-gold ring-2 ring-gold/20' 
                    : 'border-[#12386a]/10'
                }`}
              >
                {member.is_of_the_month && (
                  <div className="absolute top-4 left-4 bg-gold hover:scale-105 transition-transform text-navy text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-navy text-navy" />
                    <span>{member.month_text || 'أستاذ الشهر 🌟'}</span>
                  </div>
                )}

                <div className="w-24 h-24 rounded-full border-2 border-gold mx-auto overflow-hidden bg-slate-200 relative">
                  <img 
                    src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=250'} 
                    alt={member.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-base font-bold text-navy">{member.name}</h4>
                  <p className="text-xs text-gold-dark font-medium mt-0.5">{member.role}</p>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-200/60 pt-3">{member.exp}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
}
