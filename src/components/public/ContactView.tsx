import React, { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import { FAQ } from '../../types';
import { Phone, Mail, MapPin, Clock, Send, Facebook, Instagram, Youtube, Sparkles, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { showToast } from '../Toast';
import { useLanguage } from '../../lib/LanguageContext';

export default function ContactView({ siteSettings }: { siteSettings?: { [key: string]: string } }) {
  const { isRTL, language, t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);


  // FAQ state variables
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        const list = await db.faq.list();
        // Sort by sort_order ascending
        setFaqs(list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      } catch (err) {
        console.error('Failed to load FAQs:', err);
      }
    };
    loadFaqs();
  }, []);

  const toggleFaq = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('يرجى إدخال اسمك الكريم للتواصل معنا', 'warning');
      return;
    }
    if (!phone.replace(/\s+/g, '')) {
      showToast('يرجى إدخال رقم الهاتف الصالح', 'warning');
      return;
    }
    if (!message.trim()) {
      showToast('الرجاء كتابة رسالتك أو شكواك أو استفسارك', 'warning');
      return;
    }

    setLoading(true);
    try {
      await db.contact.submit({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        message: message.trim()
      });

      showToast('✓ تم إرسال رسالتك بنجاح! سيقوم فريق القبول بالتواصل معك هاتفياً قريباً', 'success');
      // Reset form variables
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      showToast(err.message || 'فشل إرسال رسالتك. يرجى المحاولة لاحقاً', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans text-slate-800" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      
      {/* Tiny Navy hero header with decorative circles */}
      <section className="bg-navy py-12 text-white text-center relative overflow-hidden border-b border-gold/20">
        <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-gold/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <h2 className="text-3xl font-bold font-sans">{t('contact_us')}</h2>
          <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
            {isRTL 
              ? 'نسعد دوماً بالرد على اقتراحاتكم، اتصالاتكم وزيارتكم في مقرنا الأكاديمي بسيدي بلعباس.' 
              : (language === 'fr'
                ? 'Nous sommes toujours heureux de répondre à vos suggestions, appels et visites dans notre siège à Sidi Bel Abbès.'
                : 'We are always happy to answer your suggestions, calls, and visits at our academy headquarters in Sidi Bel Abbes.')}
          </p>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column: Interactive Contact submission Form styled with Geometric Balance */}
          <div className="bg-white rounded-[16px] border border-[#12386a]/10 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="space-y-1.5 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-navy font-sans border-r-4 border-gold pr-3">أرسل استفسارك مباشرة</h3>
              <p className="text-xs text-slate-400">سيقوم طاقمنا بدراسة طلبك ومراسلتك خلال 24 ساعة كأقصى تقدير</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 font-sans">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">الاسم واللقب الكريم <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يونس بومدين"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-[10px] border border-[#12386a]/20 bg-white text-sm focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">رقم الهاتف <span className="text-rose-500">*</span></label>
                  <input
                    type="tel"
                    required
                    placeholder="مثال: 0555123456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-[10px] border border-[#12386a]/20 bg-white text-sm focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-all text-left [direction:ltr]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">البريد الإلكتروني <span className="text-slate-400 font-normal">(اختياري)</span></label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-[10px] border border-[#12386a]/20 bg-white text-sm focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-all text-left [direction:ltr]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">رسالتك بالتحديد <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  placeholder="اكتب تفاصيل استفسارك أو طلبك بوضوح..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full p-2.5 rounded-[10px] border border-[#12386a]/20 bg-white text-sm focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-all leading-relaxed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-navy hover:bg-[#12386a]/90 text-white rounded-[10px] text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جاري إرسال رسالتك الآن...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      إرسال الرسالة الإلكترونية
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Contact info details + Maps embed placeholder */}
          <div className="space-y-8 font-sans">
            
            <div className="bg-slate-50 border border-[#12386a]/10 p-6 rounded-[16px] space-y-6 shadow-sm">
              <h3 className="text-base font-bold text-navy border-r-4 border-gold pr-3">قنوات وسيلة الاتصال والوصول</h3>
              
              <div className="space-y-4 text-sm leading-relaxed">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block text-right">عنوان مقر الأكاديمية:</span>
                    <span className="text-xs text-slate-500">
                      {siteSettings?.address || 'شارع بومدين، قرب ساحة أول نوفمبر، وسط مدينة سيدي بلعباس، الجزائر'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block text-right">الهاتف والاستشارة:</span>
                    {siteSettings?.phone ? (
                      <span className="text-xs text-slate-500 block [direction:ltr] text-right">{siteSettings.phone}</span>
                    ) : (
                      <a href="tel:+21343271819" className="text-xs text-slate-500 block hover:underline [direction:ltr]">+213 43 27 18 19 / 0550 12 34 56</a>
                    )}
                    {/* Clickable WhatsApp link */}
                    <a 
                      href={`https://wa.me/${(siteSettings?.whatsapp || '213550123456').replace(/[\s\+\-]/g, '').trim()}`}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-emerald-600 font-bold block hover:underline mt-1"
                    >
                      تواصل عبر واتساب للمكتب: {siteSettings?.whatsapp || '+213 550 12 34 56'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block text-right">البريد المؤسساتي الداخلي:</span>
                    <a href={`mailto:${siteSettings?.email || 'contact@najiacademy.dz'}`} className="text-xs text-slate-500 hover:underline [direction:ltr]">
                      {siteSettings?.email || 'contact@najiacademy.dz'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block text-right">ساعات العمل الرسمية:</span>
                    <span className="text-xs text-slate-500">
                      {siteSettings?.working_hours || 'السبت إلى الخميس: من 09:00 صباحاً وحتى 19:00 مساءً (الجمعة عطلة)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Social links row */}
              <div className="pt-4 border-t border-slate-200">
                <span className="text-xs text-slate-400 block mb-2 font-bold">للبقاء في قلب الحدث عبر منصاتنا:</span>
                <div className="flex items-center gap-3">
                  <a 
                    href={siteSettings?.facebook ? (siteSettings.facebook.startsWith('http') ? siteSettings.facebook : `https://facebook.com/${siteSettings.facebook}`) : 'https://facebook.com/naji.academy.sidibelabbes'} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold rounded-[10px] text-xs transition-colors flex items-center gap-1"
                  >
                    <Facebook className="w-3.5 h-3.5" /> فيسبوك
                  </a>
                  <a 
                    href={siteSettings?.instagram ? (siteSettings.instagram.startsWith('http') ? siteSettings.instagram : `https://instagram.com/${siteSettings.instagram}`) : 'https://instagram.com/najiacademy_sidibelabbes'} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-3 py-1.5 bg-pink-50 text-pink-700 hover:bg-pink-100 font-bold rounded-[10px] text-xs transition-colors flex items-center gap-1"
                  >
                    <Instagram className="w-3.5 h-3.5" /> انستغرام
                  </a>
                  <a 
                    href={siteSettings?.youtube ? (siteSettings.youtube.startsWith('http') ? siteSettings.youtube : `https://youtube.com/${siteSettings.youtube}`) : 'https://youtube.com/@najiacademy'} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-[10px] text-xs transition-colors flex items-center gap-1"
                  >
                    <Youtube className="w-3.5 h-3.5" /> يوتيوب
                  </a>
                </div>
              </div>
            </div>

            {/* Google Maps embed placeholder */}
            <div className="w-full h-64 rounded-[16px] overflow-hidden border border-[#12386a]/10 group relative flex items-center justify-center bg-slate-100">
              <iframe
                title="موقع أكاديمية ناجي لتمكين اللغات في سيدي بلعباس"
                src={siteSettings?.map_url || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3283.4735515324317!2d-1.317585!3d34.88214!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzTCsDUyJzU1LjciTiAxwrAxOScwMy4zIlc!5e0!3m2!1sar!2sdz!4v1234567890123"}
                className="w-full h-full border-0 absolute inset-0 opacity-80"
                allowFullScreen
                loading="lazy"
              />
              <div className="absolute inset-0 bg-navy/10 pointer-events-none" />
              <div className="absolute top-4 right-4 bg-navy text-white text-xs px-3 py-1.5 rounded-[10px] border border-white/10 shadow flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                <span>وسط مدينة سيدي بلعباس، الجزائر</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-slate-50/50 py-16 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-2 mb-10">
            <span className="text-xs text-[#12386a] font-extrabold uppercase tracking-wider bg-[#12386a]/10 px-3 py-1 rounded-full">الأسئلة الشائعة</span>
            <h3 className="text-2xl font-black text-navy">لديك سؤال؟ تصفح الإجابات السريعة</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              قمنا بتجميع أكثر الأسئلة تكراراً من طرف طلبتنا وأوليائهم لتوفير وقتكم ومساعدتكم مباشرة.
            </p>
          </div>

          {faqs.length === 0 ? (
            <div className="text-center p-8 bg-white border border-slate-100 rounded-2xl text-slate-400 text-xs font-bold">
              لا توجد أسئلة شائعة مضافة حالياً.
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq) => {
                const isOpen = expandedId === faq.id;
                return (
                  <div 
                    key={faq.id} 
                    className="bg-white rounded-[14px] border border-slate-200/60 shadow-sm overflow-hidden transition-all duration-200"
                    id={`faq-item-${faq.id}`}
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-right cursor-pointer focus:outline-none focus:bg-slate-50/40"
                    >
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-5 h-5 text-gold shrink-0" />
                        <span className="font-extrabold text-navy-dark text-sm sm:text-base leading-snug">
                          {faq.question}
                        </span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        {isOpen ? (
                          <ChevronUp className="w-3.5 h-3.5 text-navy" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-navy" />
                        )}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/30">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
