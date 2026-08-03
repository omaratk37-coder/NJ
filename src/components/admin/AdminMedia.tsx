import React, { useState, useEffect } from 'react';
import { db, subscribeToRealtime } from '../../lib/supabase';
import { GalleryImage, Video } from '../../types';
import { Image, Video as VideoIcon, Plus, Trash2, Edit, CheckCircle, ExternalLink, HelpCircle, X } from 'lucide-react';
import { showToast } from '../Toast';

export default function AdminMedia() {
  const [activeTab, setActiveTab] = useState<'gallery' | 'videos'>('gallery');
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal forms
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Gallery Form inputs
  const [gTitle, setGTitle] = useState('');
  const [gUrl, setGUrl] = useState('');
  const [gCategory, setGCategory] = useState('قاعات');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [gFilePreview, setGFilePreview] = useState<string | null>(null);

  // Video Form inputs
  const [vTitle, setVTitle] = useState('');
  const [vUrl, setVUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [vFeatured, setVFeatured] = useState(false);
  const [videoUploadMode, setVideoUploadMode] = useState<'file' | 'url'>('url');
  const [vFilePreview, setVFilePreview] = useState<string | null>(null);

  // Editing inline title id
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');

  const fetchMedia = async () => {
    try {
      const [gRes, vRes] = await Promise.all([
        db.gallery.list(),
        db.videos.list()
      ]);
      setGallery(gRes);
      setVideos(vRes);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();

    const unsubscribe = subscribeToRealtime((key) => {
      if (key === 'naji_gallery' || key === 'naji_videos') {
        fetchMedia();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleFileConvert = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('يرجى اختيار ملف صورة صالح فقط', 'warning');
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      showToast('حجم الصورة كبير بعض الشيء (أكثر من 2.5MB)، يفضل استخدام صور بحجم أصغر للمزامنة المثالية', 'warning');
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setGFilePreview(result);
      setGUrl(result);
    };
    reader.onerror = () => {
      showToast('خطأ أثناء قراءة ملف الصورة', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleCreateGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gTitle.trim() || !gUrl.trim()) {
      showToast('يرجى تعبئة الحقول المطلوبة لوسيط الميديا', 'warning');
      return;
    }

    try {
      await db.gallery.create({
        title: gTitle.trim(),
        image_url: gUrl.trim(),
        category: gCategory
      });
      showToast('✓ تم إضافة الصورة الجديدة في المعرض والمزامنة تمت!', 'success');
      setIsGalleryModalOpen(false);
      // Reset
      setGTitle('');
      setGUrl('');
      setGFilePreview(null);
      setUploadMode('file');
      fetchMedia();
    } catch {
      showToast('تعذر حفظ الصورة', 'error');
    }
  };

  const handleVideoFileConvert = (file: File) => {
    if (!file.type.startsWith('video/')) {
      showToast('يرجى اختيار ملف فيديو صالح فقط (mp4, webm, etc.)', 'warning');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast('حجم الفيديو كبير بعض الشيء (أكثر من 15MB)، يرجى استخدام فيديو مضغوط أو بحجم أصغر لتجنب امتلاء التخزين المؤقت', 'warning');
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setVFilePreview(result);
      setVUrl(result);
      showToast('✓ تم معالجة وتجهيز ملف الفيديو بنجاح!', 'success');
    };
    reader.onerror = () => {
      showToast('خطأ أثناء قراءة ملف الفيديو', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vTitle.trim() || !vUrl.trim()) {
      showToast('يرجى كتابة عنوان وتضمين رابط أو ملف فيديو', 'warning');
      return;
    }

    try {
      await db.videos.create({
        title: vTitle.trim(),
        embed_url: vUrl.trim(),
        is_featured: vFeatured
      });
      showToast('✓ تم إدراج وتضمين الفيديو التعليمي بنجاح!', 'success');
      setIsVideoModalOpen(false);
      setVTitle('');
      setVUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
      setVFeatured(false);
      setVideoUploadMode('url');
      setVFilePreview(null);
      fetchMedia();
    } catch {
      showToast('فشل تضمين الفيديو', 'error');
    }
  };

  // Switch / toggle target featured video (only 1 featured exists) as requested
  const handleToggleVideoFeatured = async (v: Video) => {
    try {
      await db.videos.toggleFeatured(v.id);
      showToast('✓ تم ترشيح و تفعيل الفيديو كواجهة أساسية للتعريف بنجاح!', 'success');
      fetchMedia();
    } catch {
      showToast('عفواً، تعذر تبديل حالة فيديو الواجهة', 'error');
    }
  };

  // Inline Title edits saves instantly on enter or blur as requested!
  const handleStartInlineEdit = (id: string, currentVal: string) => {
    setEditingItemId(id);
    setTempTitle(currentVal);
  };

  const handleSaveInlineTitle = async (id: string, type: 'gallery' | 'video') => {
    if (!tempTitle.trim()) return;
    try {
      if (type === 'gallery') {
        await db.gallery.updateTitle(id, tempTitle.trim());
      } else {
        await db.videos.updateTitle(id, tempTitle.trim());
      }
      showToast('✓ تم حفظ العنوان محلياً وتحديث كشوفات المعرض بنجاح فوراً!', 'success');
      setEditingItemId(null);
      fetchMedia();
    } catch {
      showToast('تعذر حفظ المسميات', 'error');
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (!window.confirm('هل تود حذف هذه الصورة نهائياً من كشوفات المعرض؟')) return;
    try {
      await db.gallery.delete(id);
      showToast('✓ تم حذف الصورة بنجاح وتجريف ذاكرتها', 'success');
      fetchMedia();
    } catch {
      showToast('تعذر حذف السجل', 'error');
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!window.confirm('هل تود إلغاء وتدمير رابط هذا الفيديو من كراسات الوسائط المعتمدة؟')) return;
    try {
      await db.videos.delete(id);
      showToast('✓ تم إعفاء الفيديو بنجاح', 'success');
      fetchMedia();
    } catch {
      showToast('فشل في حذف الفيديو', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans text-right" style={{ direction: 'rtl' }}>
      
      {/* Header controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-navy font-sans">إعداد وإدارة الوسائط الموجهة</h3>
          <p className="text-xs text-slate-400">تحديث المعارض والصور والروابط التعليمية الخاصة بالطلاب</p>
        </div>

        {activeTab === 'gallery' ? (
          <button
            onClick={() => setIsGalleryModalOpen(true)}
            className="px-5 py-2.5 bg-gold text-slate-950 font-bold hover:bg-gold-dark rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md self-start"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>إضافة صورة للمعرض</span>
          </button>
        ) : (
          <button
            onClick={() => setIsVideoModalOpen(true)}
            className="px-5 py-2.5 bg-gold text-slate-950 font-bold hover:bg-gold-dark rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md self-start"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>تضمين فيديو جديد</span>
          </button>
        )}
      </div>

      {/* Tabs list filter */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => {
            setActiveTab('gallery');
            setEditingItemId(null);
          }}
          className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'gallery'
              ? 'border-gold text-slate-900 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>ألبوم صور الأكاديمية ({gallery.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('videos');
            setEditingItemId(null);
          }}
          className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'videos'
              ? 'border-gold text-slate-900 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <VideoIcon className="w-4 h-4" />
          <span>مكتبة الفيديوهات والورشات ({videos.length})</span>
        </button>
      </div>

      {/* Content Render panels */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">جاري قراءة الوسائط المدمجة...</div>
      ) : activeTab === 'gallery' ? (
        
        /* Album grid gallery layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gallery.map(img => (
            <div 
              key={img.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between group"
            >
              <div className="h-44 bg-slate-100 relative">
                <img 
                  src={img.image_url} 
                  alt={img.title} 
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 right-3 bg-navy text-gold text-[10px] px-2 py-0.5 rounded font-bold border border-gold/10">
                  {img.category}
                </span>
                
                {/* Delete button float on hover */}
                <button
                  onClick={() => handleDeleteGallery(img.id)}
                  className="absolute top-3 left-3 p-2 bg-rose-600 hover:bg-rose-755 text-white rounded-lg shadow cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  title="حذف من المعرض"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Title display or inline editing input block */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 text-right">
                
                {editingItemId === img.id ? (
                  <div className="flex items-center gap-1.5 w-full font-sans">
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveInlineTitle(img.id, 'gallery');
                      }}
                      className="p-1 px-2 border border-slate-300 rounded text-xs w-full focus:outline-none focus:border-navy"
                    />
                    <button
                      onClick={() => handleSaveInlineTitle(img.id, 'gallery')}
                      className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer"
                    >
                      حفظ
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between w-full gap-2">
                    <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-relaxed" title="انقر لتعديل العنوان">
                      {img.title}
                    </p>
                    <button
                      onClick={() => handleStartInlineEdit(img.id, img.title)}
                      className="p-1 hover:bg-slate-200 text-slate-450 hover:text-slate-700 rounded cursor-pointer shrink-0"
                      title="تعديل المسمى سريعاً"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

              </div>

            </div>
          ))}
        </div>

      ) : (

        /* Videos embedded list layout */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videos.map(vid => (
            <div 
              key={vid.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between group"
            >
              
              {/* Embed preview container */}
              <div className="aspect-video bg-neutral-900 relative">
                <iframe
                  src={vid.video_url}
                  title={vid.title}
                  className="w-full h-full border-0 absolute inset-0"
                  allowFullScreen
                />
                
                {/* Feature banner */}
                {vid.is_featured && (
                  <span className="absolute top-3 right-3 bg-gold text-slate-950 text-[10px] font-black px-2 py-0.5 rounded border border-white/20 shadow-md">
                    فيديو مميز بالواجهة
                  </span>
                )}
              </div>

              {/* Title & Actions panel block */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                
                {editingItemId === vid.id ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveInlineTitle(vid.id, 'video');
                      }}
                      className="p-1 px-2 border border-slate-300 rounded text-xs w-full"
                    />
                    <button
                      onClick={() => handleSaveInlineTitle(vid.id, 'video')}
                      className="px-2 py-1 bg-emerald-650 text-white rounded text-[10px] font-bold cursor-pointer"
                    >
                      تغيير
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{vid.title}</p>
                    <button
                      onClick={() => handleStartInlineEdit(vid.id, vid.title)}
                      className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-650 rounded cursor-pointer shrink-0"
                      title="تعديل العنوان"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Video controls buttons */}
                <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-xs font-sans">
                  
                  {/* Toggle Featured with exclusive single checker */}
                  <button
                    onClick={() => handleToggleVideoFeatured(vid)}
                    className={`px-3 py-1.5 font-bold rounded-lg text-[10px] transition-colors cursor-pointer flex items-center gap-1 ${
                      vid.is_featured
                        ? 'bg-gold/20 text-gold-dark border border-gold/30'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                    }`}
                  >
                    <CheckCircle className="w-3 h-3 text-gold-dark shrink-0" />
                    <span>{vid.is_featured ? 'معتمد بالواجهة العامة' : 'ترشيح للواجهة'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteVideo(vid.id)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg cursor-pointer flex items-center gap-1"
                    title="حذف الفيديو"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">إلغاء التضمين</span>
                  </button>

                </div>

              </div>

            </div>
          ))}
        </div>
      )}


      {/* GALLERY ADD POPUP */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setIsGalleryModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 overflow-hidden text-right font-sans">
            
            <div className="bg-navy p-4 text-white flex items-center justify-between">
              <h4 className="font-bold text-xs sm:text-sm">إدراج صورة جديدة بالألبوم</h4>
              <button onClick={() => setIsGalleryModalOpen(false)} className="text-white hover:text-gold cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGallery} className="p-6 space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">عنوان توضيحي للصورة <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="مثال: من حفل توزيع شهادات اللغة الإنجليزية"
                  value={gTitle}
                  onChange={(e) => setGTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">طريقة إدراج الصورة:</label>
                <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadMode('file');
                      setGUrl(gFilePreview || '');
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold transition-all ${
                      uploadMode === 'file' ? 'bg-navy text-white font-extrabold' : 'bg-slate-50 text-slate-650 hover:bg-slate-100'
                    }`}
                  >
                    رفع ملف من الحاسوب
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadMode('url');
                      setGUrl('');
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold transition-all ${
                      uploadMode === 'url' ? 'bg-navy text-white font-extrabold' : 'bg-slate-50 text-slate-650 hover:bg-slate-100'
                    }`}
                  >
                    رابط إنترنت (URL)
                  </button>
                </div>
              </div>

              {uploadMode === 'file' ? (
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">ملف الصورة من الجهاز <span className="text-rose-500">*</span></label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileConvert(file);
                    }}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                      isDragging ? 'border-gold bg-gold/5' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                    }`}
                    onClick={() => document.getElementById('gallery-file-input')?.click()}
                  >
                    <input
                      id="gallery-file-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileConvert(file);
                      }}
                    />
                    
                    {gFilePreview ? (
                      <div className="space-y-3">
                        <img 
                          src={gFilePreview} 
                          alt="Preview" 
                          className="h-28 mx-auto object-cover rounded-lg border border-slate-200 shadow-sm"
                        />
                        <p className="text-[10px] text-emerald-600 font-bold">✓ تم اختيار الملف بنجاح</p>
                        <span className="text-[10px] text-slate-500 hover:underline block">تغيير الصورة</span>
                      </div>
                    ) : (
                      <div className="space-y-2 py-2">
                        <Image className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-600">اسحب وأسقط ملف الصورة هنا، أو انقر لتصفح ملفاتك</p>
                        <p className="text-[9px] text-slate-400">يدعم صيغ JPG, PNG, WEBP, GIF</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">رابط صورة ويب مباشر <span className="text-rose-500">*</span></label>
                  <input
                    type="url"
                    required={uploadMode === 'url'}
                    placeholder="https://images.unsplash.com/..."
                    value={uploadMode === 'url' ? gUrl : ''}
                    onChange={(e) => setGUrl(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-left [direction:ltr]"
                  />
                  <span className="text-[10px] text-slate-400 block leading-normal mt-1">تلميح: يمكنك نسخ روابط مباشرة من الإنترنت بتبويب HTTPS هنا.</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">تصنيف وتبويب المعرض</label>
                <select
                  value={gCategory}
                  onChange={(e) => setGCategory(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="قاعات">قاعات الدراسة والمقر</option>
                  <option value="فعاليات">ورشات وفعاليات حية</option>
                  <option value="طلاب">لحظات طلابنا</option>
                  <option value="مناسبات">مناسبات وحفلات التخرج</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsGalleryModalOpen(false)} className="text-slate-650 font-bold">إلغاء</button>
                <button type="submit" className="px-5 py-2 bg-navy hover:bg-navy-dark text-white font-bold rounded-lg cursor-pointer">إدراج الصورة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIDEO ADD POPUP */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setIsVideoModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 overflow-hidden text-right font-sans">
            
            <div className="bg-navy p-4 text-white flex items-center justify-between">
              <h4 className="font-bold text-xs sm:text-sm">إضافة فيديو جديد للمكتبة</h4>
              <button onClick={() => setIsVideoModalOpen(false)} className="text-white hover:text-gold cursor-pointer border-0 bg-transparent">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVideo} className="p-6 space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">عنوان يوضح محتوى الفيديو <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ورك شوب مهارات العمل مع الشركات"
                  value={vTitle}
                  onChange={(e) => setVTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              {/* Toggle upload mode */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">مصدر الفيديو المعتمد:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setVideoUploadMode('url'); setVUrl(''); setVFilePreview(null); }}
                    className={`py-2 rounded-lg font-bold border transition-all cursor-pointer ${videoUploadMode === 'url' ? 'bg-navy text-white border-navy' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                  >
                    رابط تضمين YouTube 🔗
                  </button>
                  <button
                    type="button"
                    onClick={() => { setVideoUploadMode('file'); setVUrl(''); setVFilePreview(null); }}
                    className={`py-2 rounded-lg font-bold border transition-all cursor-pointer ${videoUploadMode === 'file' ? 'bg-navy text-white border-navy' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                  >
                    ملف من وسائط الهاتف 📱
                  </button>
                </div>
              </div>

              {videoUploadMode === 'url' ? (
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">رابط يوتيوب للتضمين (Embed URL) <span className="text-rose-500">*</span></label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/embed/..."
                    value={vUrl}
                    onChange={(e) => setVUrl(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-left [direction:ltr]"
                  />
                  <span className="text-[10px] text-slate-400 block leading-normal mt-1">تلميح: تأكد أن الرابط يحتوي كود <code className="bg-slate-100 p-0.5 rounded">/embed/</code> ومفعل عليه خاصية المشاهدة للاستكشاف.</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">اختر ملف الفيديو من الهاتف <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="video/*"
                      required={!vFilePreview}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleVideoFileConvert(e.target.files[0]);
                        }
                      }}
                      className="w-full text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-navy/10 file:text-navy hover:file:bg-navy/20 bg-white border border-slate-300 rounded-lg p-2.5"
                    />
                    {vFilePreview && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">جاهز ✓</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block leading-normal mt-1">يدعم ملفات MP4, WebM و OGG الملتقطة بهاتفك أو المحملة بجهازك.</span>
                </div>
              )}

              <div className="flex items-center gap-2 py-1 select-none cursor-pointer">
                <input
                  type="checkbox"
                  id="vFeatured"
                  checked={vFeatured}
                  onChange={(e) => setVFeatured(e.target.checked)}
                  className="rounded text-navy focus:ring-navy"
                />
                <label htmlFor="vFeatured" className="font-bold text-slate-700 cursor-pointer">ترشيح هذا الفيديو كواجهة مميزة بالصفحة الرئيسية للأكاديمية</label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsVideoModalOpen(false)} className="text-slate-650 font-bold border-0 bg-transparent cursor-pointer">إلغاء</button>
                <button type="submit" className="px-5 py-2 bg-navy hover:bg-navy-dark text-white font-bold rounded-lg cursor-pointer">حفظ وإدراج الفيديو</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
