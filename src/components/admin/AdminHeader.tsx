import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock } from 'lucide-react';
import { db, subscribeToRealtime } from '../../lib/supabase';
import { Booking } from '../../types';
import { showToast } from '../Toast';

interface AdminHeaderProps {
  title: string;
}

export default function AdminHeader({ title }: AdminHeaderProps) {
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchPending = async () => {
    try {
      const res = await db.bookings.list();
      setPendingBookings(res.filter(b => b.status === 'pending').slice(0, 5));
    } catch {}
  };

  useEffect(() => {
    fetchPending();

    // Subscribe to realtime updates to keep pending notifications live
    const unsubscribe = subscribeToRealtime((key) => {
      if (key === 'naji_bookings') {
        fetchPending();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleQuickAccept = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await db.bookings.updateStatus(id, 'confirmed');
      showToast('✓ تم قبول حجز الطالب وتحديث المقاعد التدريبية بنجاح!', 'success');
      fetchPending();
    } catch (err: any) {
      showToast(err.message || 'فشل قبول الحجز', 'error');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between font-sans relative z-40 print:hidden" style={{ direction: 'rtl' }}>
      
      {/* Title head */}
      <div>
        <h2 className="text-base font-extrabold text-navy font-sans mb-0.5">{title}</h2>
        <p className="text-[10px] text-slate-400 font-bold block">
          {new Date().toLocaleDateString('ar-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Quick panel indicators: Notification box */}
      <div className="flex items-center gap-4 relative">
        
        {/* Notification Bell trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors relative cursor-pointer"
          title="الإشعارات والمعالجة السريعة"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {pendingBookings.length > 0 && (
            <span className="absolute top-1 left-1 w-4.5 h-4.5 rounded-full bg-rose-500 border border-white text-[9.5px] font-bold text-white flex items-center justify-center animate-pulse">
              {pendingBookings.length}
            </span>
          )}
        </button>

        {/* Dropdown panel detail */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute left-0 top-14 w-80 bg-white rounded-xl border border-slate-200 shadow-2xl z-50 overflow-hidden font-sans">
              
              <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>طلبات حجز قيد المعالجة ({pendingBookings.length})</span>
                </span>
                <span className="text-[9.5px] font-black text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-md">المقاعد المباشرة</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto no-scrollbar">
                {pendingBookings.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-sans">
                    لا توجد أي حجوزات معلقة جديدة حالياً. عمل مذهل!
                  </div>
                ) : (
                  pendingBookings.map((b) => (
                    <div 
                      key={b.id} 
                      className="p-3 hover:bg-slate-50/50 flex flex-col justify-between gap-1.5 text-right font-sans"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-800">{b.student_name}</span>
                          <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5 shrink-0">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(b.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">الدورة: <span className="font-bold text-slate-700">{b.course_name}</span></p>
                        <p className="text-[10px] text-slate-500">حساب الهاتف: <span className="font-bold [direction:ltr]">{b.phone}</span></p>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          onClick={(e) => handleQuickAccept(b.id, e)}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-[9.5px] font-bold cursor-pointer"
                        >
                          قبول سريع للطلب
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </>
        )}

      </div>

    </header>
  );
}
