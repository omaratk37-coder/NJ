import React, { useState, useEffect } from 'react';
import { X, Calendar, Phone, Mail, FileText, Check, AlertTriangle } from 'lucide-react';
import { db } from '../lib/supabase';
import { Course } from '../types';
import { showToast } from './Toast';

interface BookingModalProps {
  courseId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BookingModal({ courseId, onClose, onSuccess }: BookingModalProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(courseId || '');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Field error states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Esc key to close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    // Fetch active courses
    db.courses.list()
      .then(res => {
        const active = res.filter(c => c.status === 'active');
        setCourses(active);
        if (!selectedCourseId && active.length > 0) {
          setSelectedCourseId(active[0].id);
        }
        setLoadingCourses(false);
      })
      .catch(() => {
        setLoadingCourses(false);
      });

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, selectedCourseId]);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const isWebFull = selectedCourse ? selectedCourse.enrolled_count >= selectedCourse.max_seats : false;

  // Validation function
  const validateForm = (): boolean => {
    const tempErrors: { [key: string]: string } = {};
    
    if (!name.trim()) {
      tempErrors.name = 'الاسم الكامل مطلوب';
    } else if (name.trim().length < 3) {
      tempErrors.name = 'الاسم يجب أن يكون ثلاثي أو ثنائي كامل';
    }

    if (!phone) {
      tempErrors.phone = 'رقم الهاتف مطلوب';
    } else {
      // Validate Algerian mobile format: 05, 06, 07 followed by exactly 8 digits (total 10 digits)
      const algPhoneRegex = /^(05|06|07)\d{8}$/;
      if (!algPhoneRegex.test(phone)) {
        tempErrors.phone = 'رقم هاتف غير صالح. يجب أن يبدأ بـ 05 أو 06 أو 07 ويتكون من 10 أرقام';
      }
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      tempErrors.email = 'عنوان البريد الإلكتروني غير صالح';
    }

    if (!selectedCourseId) {
      tempErrors.course = 'الرجاء اختيار الدورة المراد حجزها';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('يرجى تصحيح الأخطاء في النموذج قبل الإرسال', 'warning');
      return;
    }

    if (isWebFull) {
      showToast('عذراً، هذه الدورة ممتلئة تماماً. يمكنك الاتصال بنا للتسجيل في قائمة الانتظار', 'warning');
      return;
    }

    setLoading(true);
    try {
      await db.bookings.create({
        student_name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        course_id: selectedCourseId,
        course_name: selectedCourse?.name || 'دورة غير محددة',
        message: message.trim() || undefined
      });

      showToast('✓ تم إرسال طلبك بنجاح! سنتواصل معك في أقرب وقت لتأكيد المقعد', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'فشل إرسال طلب الحجز. يرجى المحاولة لاحقاً', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" id="booking-modal-overlay bg">
      {/* Semi-transparent overlay block */}
      <div 
        className="absolute inset-0 bg-navy/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Main card panel content */}
      <div className="relative w-full max-w-lg bg-white rounded-[16px] border border-[#12386a]/10 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        
        {/* Header Block with primary color scheme */}
        <div className="bg-navy p-5 text-white flex items-center justify-between border-b border-gold/20">
          <div>
            <h3 className="text-xl font-bold font-sans">طلب التسجيل والالتحاق</h3>
            <p className="text-xs text-gold-light mt-1">احجز مقعدك الآن في أكاديمية ناجي لمهارات المستقبل</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-[10px] bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto font-sans">
          {loadingCourses ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">جاري تحميل الدورات المتاحة وتفاصيل الحجز...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Course Selection Block with details indicators */}
              <div className="space-y-1">
                <label className="block text-sm font-bold text-slate-700">الدورة التدريبية المستهدفة <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <select
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      // Clear errors if set
                      if (errors.course) setErrors(prev => ({ ...prev, course: '' }));
                    }}
                    className={`w-full p-3 rounded-[10px] border text-sm bg-white focus:bg-white focus:outline-none transition-all ${
                      errors.course ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#12386a]/20 focus:border-gold focus:ring-1 focus:ring-gold'
                    }`}
                  >
                    <option value="" disabled>اختر دورة من القائمة المتاحة</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.name} ({course.duration}) — {course.price} دج
                      </option>
                    ))}
                  </select>
                </div>
                {errors.course && <p className="text-xs text-rose-500 font-medium mt-1">{errors.course}</p>}

                {/* Selected Course Seat Tracker State Visuals */}
                {selectedCourse && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-[10px] border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-600">المقاعد الشاغرة للدورة:</p>
                      <p className="text-xs text-slate-500 mt-0.5">{selectedCourse.schedule}</p>
                    </div>
                    <div>
                      {selectedCourse.max_seats - selectedCourse.enrolled_count > 5 ? (
                        <span className="px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                          {selectedCourse.max_seats - selectedCourse.enrolled_count} مقعد متاح
                        </span>
                      ) : selectedCourse.max_seats - selectedCourse.enrolled_count > 0 ? (
                        <span className="px-3 py-1 text-xs font-bold bg-amber-50 text-amber-700 rounded-full border border-amber-200 animate-pulse">
                          متبقي {selectedCourse.max_seats - selectedCourse.enrolled_count} مقاعد فقط!
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-bold bg-rose-50 text-rose-700 rounded-full border border-rose-200">
                          مكتمل المقاعد
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {isWebFull ? (
                /* Course Full Warning view inside modal as requested */
                <div className="p-5 bg-rose-50 rounded-[10px] border border-rose-200 text-center space-y-3">
                  <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
                  <h4 className="text-base font-bold text-rose-900 font-sans">هذه الدورة مكتملة — تواصل معنا لقائمة الانتظار</h4>
                  <p className="text-xs text-rose-700 leading-relaxed max-w-sm mx-auto">
                    لقد تم حجز جميع المقاعد المتاحة لهذه الدورة التدريبية. يرجى الاتصال بنا هاتفياً أو عبر واتساب لحجز اسمك في قائمة الانتظار الاحتياطية لتشغيل الدفعة الموالية.
                  </p>
                  <div className="pt-2">
                    <a
                      href="https://wa.me/213550123456"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow"
                    >
                      تواصل معنا الآن عبر واتساب
                    </a>
                  </div>
                </div>
              ) : (
                /* Active Booking Form */
                <>
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-slate-700">الاسم واللقب الكامل <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="أحمد بلعباسي"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                        }}
                        onBlur={() => {
                          if (!name.trim()) setErrors(prev => ({ ...prev, name: 'الاسم الكامل مطلوب' }));
                        }}
                        className={`w-full p-3 rounded-[10px] border text-sm bg-white focus:bg-white focus:outline-none transition-all ${
                          errors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#12386a]/20 focus:border-gold focus:ring-1 focus:ring-gold'
                        }`}
                      />
                    </div>
                    {errors.name ? (
                      <p className="text-xs text-rose-500 font-medium mt-1">{errors.name}</p>
                    ) : (
                      name.trim() && <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">✓ يبدو الاسم ممتازاً</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-bold text-slate-700">رقم الهاتف <span className="text-rose-500">*</span></label>
                      <input
                        type="tel"
                        placeholder="0555123456"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\s+/g, ''));
                          if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                        }}
                        onBlur={() => {
                          const algPhoneRegex = /^(05|06|07)\d{8}$/;
                          if (!phone) {
                            setErrors(prev => ({ ...prev, phone: 'رقم الهاتف مطلوب' }));
                          } else if (!algPhoneRegex.test(phone)) {
                            setErrors(prev => ({ ...prev, phone: 'يجب أن يبدأ بـ 05/06/07 ويتكون من 10 أرقام' }));
                          }
                        }}
                        className={`w-full p-3 rounded-[10px] border text-sm bg-white focus:bg-white focus:outline-none transition-all text-left [direction:ltr] ${
                          errors.phone ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#12386a]/20 focus:border-gold focus:ring-1 focus:ring-gold'
                        }`}
                      />
                      {errors.phone ? (
                        <p className="text-xs text-rose-500 font-medium mt-1">{errors.phone}</p>
                      ) : (
                        /^(05|06|07)\d{8}$/.test(phone) && <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">✓ رقم الهاتف مسجل بالصيغة الصحيحة</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-bold text-slate-700">البريد الإلكتروني <span className="text-slate-400 font-normal">(اختياري)</span></label>
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                        }}
                        className={`w-full p-3 rounded-[10px] border text-sm bg-white focus:bg-white focus:outline-none transition-all text-left [direction:ltr] ${
                          errors.email ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#12386a]/20 focus:border-gold focus:ring-1 focus:ring-gold'
                        }`}
                      />
                      {errors.email && <p className="text-xs text-rose-500 font-medium mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-slate-700">رسالة أو ملاحظة خاصة <span className="text-slate-400 font-normal">(اختياري)</span></label>
                    <textarea
                      placeholder="اكتب هنا أي استفسار بخصوص الدورة أو مستواك الدراسي الحالي..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="w-full p-3 rounded-[10px] border border-[#12386a]/20 bg-white focus:bg-white focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-all text-sm leading-relaxed"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 rounded-[10px] bg-gold hover:bg-[#b49218] text-[#12386a] font-bold text-sm tracking-wide transition-all shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          جاري معالجة الحجز...
                        </>
                      ) : (
                        'تأكيد حجز المقعد الآن'
                      )}
                    </button>
                  </div>
                </>
              )}

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
