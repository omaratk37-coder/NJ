import React, { useState, useEffect } from 'react';
import { db, subscribeToRealtime } from '../../lib/supabase';
import { Review } from '../../types';
import { Star, CheckCircle, Trash2, ShieldAlert, Heart, HelpCircle } from 'lucide-react';
import { showToast } from '../Toast';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await db.reviews.list();
      setReviews(res);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();

    const unsubscribe = subscribeToRealtime((key) => {
      if (key === 'naji_reviews') {
        fetchReviews();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await db.reviews.approve(id);
      showToast('✓ تم قبول التقييم والمصادقة على نشره في الصفحة الرئيسية للأكاديمية!', 'success');
      fetchReviews();
    } catch {
      showToast('تعذر قبول التقييم', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التقييم نهائياً؟')) return;
    try {
      await db.reviews.delete(id);
      showToast('✓ تم حذف التقييم وتطهير الكود بنجاح!', 'success');
      fetchReviews();
    } catch {
      showToast('تعذر حذف التقييم', 'error');
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (activeTab === 'pending') return !r.is_approved;
    return r.is_approved;
  });

  return (
    <div className="p-6 space-y-6 font-sans text-right" style={{ direction: 'rtl' }}>
      
      {/* Header title */}
      <div>
        <h3 className="text-base font-extrabold text-navy font-sans">إدارة ومراجعة آداء وآراء المترشحين</h3>
        <p className="text-xs text-slate-400">تصفية التقييمات وقبول نشر المشرق منها على الواجهة العامة</p>
      </div>

      {/* Tabs selectors pending/approved */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'pending'
              ? 'border-gold text-slate-900 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          طلب آراء معلقة جديدة ({reviews.filter(r => !r.is_approved).length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'approved'
              ? 'border-gold text-slate-900 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          الآراء المعتمدة والمنشورة حالياً ({reviews.filter(r => r.is_approved).length})
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">جاري مسح الآراء والنجوم...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-16 border rounded-2xl border-dashed border-slate-350 text-center max-w-sm mx-auto space-y-2 text-slate-400 text-xs">
          <Heart className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-navy">القسم فارغ تماماً</h4>
          <p className="text-slate-450 leading-relaxed font-sans">
            {activeTab === 'pending' 
              ? 'لا توجد أية آراء أو مراجعات معلقة حالياً تتطلب موافقتك!' 
              : 'لم يتم اعتماد أي آراء لنشرها حتى الآن. انقر على الآراء المعلقة لاعتمادها!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((r) => (
            <div 
              key={r.id}
              className="bg-white rounded-2xl border border-slate-205 p-5 space-y-4 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-colors text-right font-sans"
            >
              
              <div className="space-y-2.5">
                {/* Stars and date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map(starIdx => (
                      <Star 
                        key={starIdx} 
                        className={`w-3.5 h-3.5 ${
                          starIdx <= r.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>

                {/* Comment text */}
                <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium italic">
                  "{r.comment}"
                </p>
              </div>

              {/* Bottom information */}
              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-sans">
                <div>
                  <h5 className="font-extrabold text-navy">{r.student_name}</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">الدورة المقيمة: <span className="font-bold text-slate-500">{r.course_name || 'عام'}</span></p>
                </div>

                <div className="flex items-center gap-2">
                  {activeTab === 'pending' && (
                    <button
                      onClick={() => handleApprove(r.id)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-[10px] cursor-pointer shadow-sm transition-colors"
                    >
                      قبول وإعتماد النشر
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg cursor-pointer border border-rose-200"
                    title="حذف التقييم نهائياً"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
