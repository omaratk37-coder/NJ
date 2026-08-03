import React, { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import { ShieldCheck, Mail, Lock, AlertTriangle } from 'lucide-react';
import { AdminUser } from '../../types';
import { showToast } from '../Toast';
import Logo from '../Logo';

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser) => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Lockout countdown display
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockCountdown, setLockCountdown] = useState(0);

  const checkLockState = () => {
    try {
      const failState = JSON.parse(localStorage.getItem('naji_login_failures') || '{"count":0,"lockedUntil":0}');
      if (failState.count >= 5 && failState.lockedUntil > Date.now()) {
        setLockedUntil(failState.lockedUntil);
        setLockCountdown(Math.ceil((failState.lockedUntil - Date.now()) / 1000));
      } else {
        setLockedUntil(null);
      }
    } catch {}
  };

  useEffect(() => {
    checkLockState();
    const interval = setInterval(() => {
      if (lockedUntil) {
        const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          setLockedUntil(null);
          // Reset failure counts in storage
          localStorage.setItem('naji_login_failures', JSON.stringify({ count: 0, lockedUntil: 0 }));
        } else {
          setLockCountdown(remaining);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast('الرجاء تعبئة البريد الإلكتروني وكلمة المرور', 'warning');
      return;
    }

    setLoading(true);
    try {
      const user = await db.auth.login(email.trim(), password);
      showToast(`✓ أهلاً بك مجدداً يا ${user.name}! تم الدخول بنجاح`, 'success');
      onLoginSuccess(user);
    } catch (err: any) {
      showToast(err.message || 'بيانات خاطئة، حاول مجدداً', 'error');
      // Re-trigger check lock state
      checkLockState();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-navy flex items-center justify-center p-4 font-sans text-slate-800" style={{ direction: 'rtl' }}>
      
      {/* Centered login Card panel */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/50 shadow-2xl overflow-hidden font-sans">
        
         {/* Brand Banner Header styled with the physical vector logo */}
        <div className="bg-navy-dark p-8 pb-5 text-center text-white space-y-4 border-b border-navy/20">
          <Logo size={70} variant="light" showSubtitle={true} />
          <div className="pt-2 border-t border-white/5">
            <h3 className="text-sm font-bold font-sans text-gold">لوحة تحكم الأكاديمية</h3>
            <p className="text-[10px] text-slate-300 mt-1 font-sans">بوابة الإداريين والمنسقين المعتمدين</p>
          </div>
        </div>

        {/* Info panel */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 text-center">
          <p className="text-[11px] text-slate-500 leading-relaxed font-sans font-medium">
            للتجربة السريعة، استخدم:<br />
            إداري رئيسي: <code className="bg-slate-200/80 px-1 py-0.5 rounded font-mono select-all font-bold">admin@najiacademy.dz</code> (رمز: <code className="bg-slate-200/80 px-1 py-0.5 rounded font-mono select-all font-bold">admin</code>)<br />
            منسق وسائط: <code className="bg-slate-200/80 px-1 py-0.5 rounded font-mono select-all font-bold">manager@najiacademy.dz</code> (رمز: <code className="bg-slate-200/80 px-1 py-0.5 rounded font-mono select-all font-bold">manager</code>)
          </p>
        </div>

        <div className="p-6 md:p-8">
          {lockedUntil ? (
            /* Lockout panel trigger */
            <div className="p-6 bg-rose-50 text-center rounded-xl border border-rose-200 space-y-3">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
              <h4 className="text-sm font-bold text-rose-900 font-sans">الحساب مقفل مؤقتاً لدواعي أمنية</h4>
              <p className="text-xs text-rose-700 leading-relaxed">
                لقد قمت بإدخال كلمة المرور خاطئة 5 مرات متتالية. تم قفل المحاولات الإدارية مؤقتاً لحماية الأمان. يرجى الانتظار للمحاولة مجدداً بعد:
              </p>
              <div className="py-2 text-xl font-black text-rose-600 font-mono">
                {Math.floor(lockCountdown / 60)}:{(lockCountdown % 60).toString().padStart(2, '0')} دقيقة
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">البريد الإلكتروني الإداري <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@najiacademy.dz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none transition-all text-left [direction:ltr]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">كلمة المرور المشفرة <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none transition-all text-left [direction:ltr]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-navy focus:ring-navy"
                  />
                  <span className="text-slate-600 font-bold">تذكّر بيانات الدخول</span>
                </label>
                <span className="text-slate-400 font-medium">مشفر وآمن 256-bit</span>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-navy hover:bg-navy-dark text-white rounded-lg text-xs font-bold tracking-wide transition-all shadowdisabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جاري التحقق والمصادقة...
                    </>
                  ) : (
                    'الولوج لورقة التحكم الآن'
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>

    </div>
  );
}
