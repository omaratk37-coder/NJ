import React, { useState, useEffect } from 'react';
import { db, subscribeToRealtime } from '../../lib/supabase';
import { FAQ } from '../../types';
import { HelpCircle, Trash2, Edit, Plus, Check, X, MoveUp, MoveDown } from 'lucide-react';
import { showToast } from '../Toast';

export default function AdminFAQ() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchFaqs = async () => {
    try {
      const res = await db.faq.list();
      // Sort by sort_order ascending, then by date
      setFaqs(res.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();

    const unsubscribe = subscribeToRealtime((key) => {
      if (key === 'naji_faqs') {
        fetchFaqs();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      showToast('يرجى إدخال السؤال أولاً', 'warning');
      return;
    }
    if (!answer.trim()) {
      showToast('يرجى إدخال الجواب بالتفصيل', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Update mode
        await db.faq.update(editingId, {
          question: question.trim(),
          answer: answer.trim(),
          sort_order: Number(sortOrder)
        });
        showToast('✓ تم تعديل السؤال الشائع بنجاح!', 'success');
        setEditingId(null);
      } else {
        // Create mode
        await db.faq.create({
          question: question.trim(),
          answer: answer.trim(),
          sort_order: Number(sortOrder)
        });
        showToast('✓ تم إضافة السؤال الشائع بنجاح!', 'success');
      }

      // Reset form
      setQuestion('');
      setAnswer('');
      setSortOrder(faqs.length + 2); // Set default sort order for next item
      fetchFaqs();
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء حفظ السؤال', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setSortOrder(faq.sort_order || 1);
    // Scroll form into view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setQuestion('');
    setAnswer('');
    setSortOrder(faqs.length + 1);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السؤال الشائع نهائياً؟')) return;
    try {
      await db.faq.delete(id);
      showToast('✓ تم حذف السؤال الشائع وتطهيره بنجاح!', 'success');
      fetchFaqs();
    } catch {
      showToast('تعذر حذف السؤال الشائع', 'error');
    }
  };

  const moveOrder = async (faq: FAQ, direction: 'up' | 'down') => {
    const currentIndex = faqs.findIndex(f => f.id === faq.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const otherFaq = faqs[targetIndex];
    const currentOrder = faq.sort_order || 1;
    const targetOrder = otherFaq.sort_order || 1;

    try {
      // Swap order
      await db.faq.update(faq.id, { sort_order: targetOrder });
      await db.faq.update(otherFaq.id, { sort_order: currentOrder });
      fetchFaqs();
      showToast('✓ تم إعادة ترتيب السؤال بنجاح', 'success');
    } catch {
      showToast('فشل إعادة الترتيب', 'error');
    }
  };

  return (
    <div className="p-6 space-y-8 font-sans text-right" style={{ direction: 'rtl' }}>
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-navy font-sans flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-gold shrink-0" />
            <span>إدارة الأسئلة الشائعة (FAQ)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            إضافة وتعديل الأسئلة والأجوبة التفصيلية التي تظهر للزوار في نافذة "تواصل معنا" لتسهيل وصولهم للمعلومة.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left block (1/3): Form to Add or Edit FAQs */}
        <div className="bg-white rounded-[16px] border border-slate-200/60 p-6 space-y-4 shadow-sm">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <span className="font-extrabold text-navy text-sm">
              {editingId ? 'تعديل السؤال الحالي' : 'إضافة سؤال شائع جديد'}
            </span>
            {editingId && (
              <button 
                onClick={handleCancelEdit}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> إلغاء التعديل
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-right">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">عنوان السؤال المطروح <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                placeholder="مثال: هل يمكن دفع رسوم الدورة بالتقسيط؟"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full p-2.5 rounded-[10px] border border-slate-200 text-xs focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">الجواب والوصف التفصيلي <span className="text-rose-500">*</span></label>
              <textarea
                required
                placeholder="اكتب الإجابة المفصلة والشافية لهذا السؤال هنا..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={5}
                className="w-full p-2.5 rounded-[10px] border border-slate-200 text-xs focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-all leading-relaxed"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">رقم الترتيب في العرض <span className="text-slate-400 font-normal">(أرقام أصغر تظهر أولاً)</span></label>
              <input
                type="number"
                min="1"
                required
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full p-2.5 rounded-[10px] border border-slate-200 text-xs focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-navy hover:bg-navy-dark text-white rounded-[10px] text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <span>جاري الحفظ...</span>
              ) : editingId ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>حفظ تعديلات السؤال</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>إدراج السؤال الجديد</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right block (2/3): FAQ listings and Management */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-white rounded-[16px] border border-slate-200/60 p-6 space-y-4 shadow-sm">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="font-extrabold text-navy text-sm">قائمة الأسئلة الشائعة المعروضة حالياً ({faqs.length})</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">جاري تحميل الأسئلة الشائعة...</div>
            ) : faqs.length === 0 ? (
              <div className="p-12 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p>قائمة الأسئلة فارغة تماماً.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div 
                    key={faq.id} 
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all hover:bg-slate-50"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold bg-gold/15 text-gold-dark px-2.5 py-0.5 rounded-full shrink-0">
                          ترتيب {faq.sort_order || 1}
                        </span>
                        <h4 className="font-extrabold text-navy text-sm leading-snug">
                          {faq.question}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed pr-2 border-r-2 border-slate-200">
                        {faq.answer}
                      </p>
                    </div>

                    {/* Actions tools panel */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end md:self-start">
                      {/* Order buttons */}
                      <button
                        onClick={() => moveOrder(faq, 'up')}
                        disabled={index === 0}
                        title="تحريك للأعلى"
                        className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-40 disabled:hover:text-slate-400 rounded-lg transition-colors cursor-pointer"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveOrder(faq, 'down')}
                        disabled={index === faqs.length - 1}
                        title="تحريك للأسفل"
                        className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-40 disabled:hover:text-slate-400 rounded-lg transition-colors cursor-pointer"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit buttons */}
                      <button
                        onClick={() => handleEdit(faq)}
                        title="تعديل السؤال والوصف"
                        className="p-1.5 bg-white border border-slate-200 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">تعديل</span>
                      </button>

                      {/* Delete buttons */}
                      <button
                        onClick={() => handleDelete(faq.id)}
                        title="حذف نهائي"
                        className="p-1.5 bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">حذف</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
