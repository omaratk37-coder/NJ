import React from 'react';
import { ShieldAlert, BookOpen } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

interface LegalViewProps {
  type: 'privacy' | 'terms';
}

export default function LegalViews({ type }: LegalViewProps) {
  const { isRTL, language, t } = useLanguage();
  if (type === 'privacy') {
    return (
      <div className={`font-sans text-slate-800 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 ${isRTL ? 'text-right' : 'text-left'}`} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
        <div className="flex items-center gap-3 pb-4 border-b border-[#12386a]/10">
          <ShieldAlert className="w-10 h-10 text-gold" />
          <div className="border-r-4 border-gold pr-3">
            <h2 className="text-2xl font-bold text-navy font-sans py-0.5">سياسة الخصوصية وسرية البيانات</h2>
            <p className="text-xs text-slate-400 mt-0.5">تاريخ التحديث الأخير: يونيو 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-sm sm:text-base leading-relaxed text-slate-600 font-sans">
          <p>
            تولي <strong>أكاديمية ناجي لتمكين اللغات والمهارات</strong> أهمية قصوى لخصوصية وسرية معلومات الزوار والطلاب الكرام. نلتزم بموجب هذا البيان بالحفاظ على أمن بياناتكم الشخصية المسجلة طوعياً من خلال ملفات حجز المقاعد والدورات واتصالاتكم البريدية والهاتفية.
          </p>

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-navy">1. ما هي البيانات التي نجمعها؟</h3>
            <p className="text-slate-500 text-xs sm:text-sm">
              نجمع بدقة البيانات اللازمة للتسجيل والتدريس: الاسم واللقب، رقم هاتفكم المباشر في الجزائر، بريدكم الإلكتروني في حال توفره، وتفاصيل الدورة التدريبية المستهدفة والتقييمات الذاتية.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-navy">2. كيف نستخدم معلوماتكم؟</h3>
            <p className="text-slate-500 text-xs sm:text-sm">
              لا نقوم أبداً ببيع، أو تأجير، أو مشاركة بياناتكم مع أي أطراف ثالثة لأغراض تجارية. تنحصر استخداماتنا لبياناتكم في تأمين مقاعدكم للدورات، والرد على اتصالاتكم واستفساراتكم، والامتثال للمراجعات الإدارية التربوية للأكاديمية.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-navy">3. أمان وحماية البيانات</h3>
            <p className="text-slate-500 text-xs sm:text-sm">
              نطبق إجراءات حماية إلكترونية وفنية بالتعاون مع مزودي الخدمة السحابية والتحقق من الهوية لحظر أي محاولات غير مصرح بها للاطلاع أو تغيير معلوماتكم المخزنة.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-navy">4. تحديثات سياسة الخصوصية</h3>
            <p className="text-slate-500 text-xs sm:text-sm">
              قد نقوم بتحديث هذه السياسة من حين لآخر لتطابق أي تعديلات تطرأ على خدمات الأكاديمية أو النظم التنظيمية. يرجى مراجعة هذه الصفحة دورياً للاطلاع على أي تحديثات.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`font-sans text-slate-800 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 ${isRTL ? 'text-right' : 'text-left'}`} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      <div className="flex items-center gap-3 pb-4 border-b border-[#12386a]/10">
        <BookOpen className="w-10 h-10 text-gold" />
        <div className="border-r-4 border-gold pr-3">
          <h2 className="text-2xl font-bold text-navy font-sans py-0.5">شروط ولائحة الاستخدام الرسمية</h2>
          <p className="text-xs text-slate-400 mt-0.5">تاريخ التحديث الأخير: يونيو 2026</p>
        </div>
      </div>

      <div className="space-y-6 text-sm sm:text-base leading-relaxed text-slate-600 font-sans">
        <p>
          أهلاً بكم في المنصة الرقمية لـ <strong>أكاديمية ناجي لتمكين اللغات والمهارات</strong>. يرجى قراءة هذه الشروط والالتزامات بعناية قبل حجز مقاعدكم أو التسجيل في دوراتنا الحضورية بسيدي بلعباس.
        </p>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-navy">1. شروط حجز المقاعد والقبول</h3>
          <p className="text-slate-500 text-xs sm:text-sm">
            يعتبر حجز المقعد المسجل عبر المنصة طلباً أولياً معلقاً. لا يعتبر التسجيل نهائياً إلا بعد زيارة مقر الأكاديمية ودفع رسوم الدورة المخصصة والتحقق من الشروط اللغوية المطلوبة لكل مستوى.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-navy">2. الالتزام بالحصص والحضور</h3>
          <p className="text-slate-500 text-xs sm:text-sm">
            يتوجب على الطالب الحضور والانضباط في مواعيد الحصص المحددة في الجدول الزمني للدورة. في حال غياب الطالب المكرر دون عذر طبي أو قاهري للجنة الإدارية، يحق للأكاديمية حظر أحقيته في نيل شهادة الإتمام المعتمدة.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-navy">3. سياسة الاسترجاع أو التأجيل</h3>
          <p className="text-slate-500 text-xs sm:text-sm">
            رسوم الدورات المدفوعة غير قابلة للاسترجاع بعد انطلاق الحصة التدريبية الأولى للدورة. يمكن للطالب التقدم بطلب إداري مكتوب لتأجيل التحاقه بالدفعة التالية شريطة مراجعة الإدارة قبل 72 ساعة على الأكثر من الموعد الرسمي لانطلاق الدورة.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-navy">4. الملكية الفكرية وكتيبات المواد الدراسية</h3>
          <p className="text-slate-500 text-xs sm:text-sm">
            جميع المواد التعليمية والكتيبات الدراسية المقدمة لطلابنا هي ملك فكري حصري لأكاديمية ناجي وأساتذتها. يمنع منعاً باتاً محاولة إعادة نسخ، أو توزيع، أو نشر هذه المواد على منصات التواصل الاجتماعي دون موافقة الإدارة خطياً.
          </p>
        </div>
      </div>
    </div>
  );
}
