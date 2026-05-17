import React, { useState, useEffect } from 'react';
import { Check, RotateCcw, Settings, BookOpen, Calendar, Plus, Minus, X, Archive, Award, Trash2, ChevronLeft, ChevronRight, Sparkles, Moon, Sun, CloudSun, Sunset, Star, Zap, AlertCircle, CheckCircle2, AlertTriangle, Share2 }from 'lucide-react';

const storage = {
  get: async (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? { value } : null;
    } catch (e) {
      return null;
    }
  },
  set: async (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }
};

export default function App() {
  const [hijriOffset, setHijriOffset] = useState(0);
  const [completedPages, setCompletedPages] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showAddArchive, setShowAddArchive] = useState(false);
  const [archivedKhatmas, setArchivedKhatmas] = useState([]);
  const [currentCycleStart, setCurrentCycleStart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newArchive, setNewArchive] = useState({ month: '', year: '', notes: '' });
  const [selectedDay, setSelectedDay] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const prayers = [
    { id: 'fajr', name: 'الفجر', color: 'from-indigo-600 via-blue-700 to-indigo-900', icon: Star },
    { id: 'dhuhr', name: 'الظهر', color: 'from-amber-400 via-yellow-500 to-orange-500', icon: Sun },
    { id: 'asr', name: 'العصر', color: 'from-orange-500 via-amber-600 to-orange-700', icon: CloudSun },
    { id: 'maghrib', name: 'المغرب', color: 'from-rose-500 via-pink-600 to-purple-700', icon: Sunset },
    { id: 'isha', name: 'العشاء', color: 'from-slate-700 via-indigo-900 to-slate-900', icon: Moon }
  ];

  const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const hijriMonths = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
  const gregorianMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmDialog({ message, onConfirm });
  };

  const getHijriDate = (date, offset = 0) => {
    const adjustedDate = new Date(date);
    adjustedDate.setDate(adjustedDate.getDate() + offset);
    try {
      const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-nu-latn', {
        day: 'numeric', month: 'numeric', year: 'numeric'
      });
      const parts = formatter.formatToParts(adjustedDate);
      return {
        day: parseInt(parts.find(p => p.type === 'day').value),
        month: parseInt(parts.find(p => p.type === 'month').value),
        year: parseInt(parts.find(p => p.type === 'year').value)
      };
    } catch (e) {
      return { day: 1, month: 1, year: 1447 };
    }
  };

  const today = new Date();
  const hijriDate = getHijriDate(today, hijriOffset);
  const dayOfWeek = arabicDays[today.getDay()];

  const getActualDay = () => {
    if (!currentCycleStart) return 1;
    const start = new Date(currentCycleStart);
    const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    return ((diff % 30) + 30) % 30 + 1;
  };

  const actualDay = getActualDay();
  const displayDay = selectedDay !== null ? selectedDay : actualDay;

  useEffect(() => {
    let mounted = true;
    const todayStr = new Date().toISOString().split('T')[0];
    setCurrentCycleStart(todayStr);
    
    const loadData = async () => {
      try {
        const [c, o, a, s] = await Promise.all([
          storage.get('completed_pages'),
          storage.get('hijri_offset'),
          storage.get('archived_khatmas'),
          storage.get('cycle_start')
        ]);
        if (!mounted) return;
        if (c?.value) try { setCompletedPages(JSON.parse(c.value)); } catch (e) {}
        if (o?.value) { const v = parseInt(o.value); if (!isNaN(v)) setHijriOffset(v); }
        if (a?.value) try { setArchivedKhatmas(JSON.parse(a.value)); } catch (e) {}
        if (s?.value) setCurrentCycleStart(s.value);
        else storage.set('cycle_start', todayStr);
      } catch (e) {}
      if (mounted) setLoading(false);
    };
    loadData();
    return () => { mounted = false; };
  }, []);

  const savePages = (pages) => storage.set('completed_pages', JSON.stringify(pages));

  const saveHijriOffset = (offset) => {
    setHijriOffset(offset);
    storage.set('hijri_offset', offset.toString());
  };

  const getDayPageRange = (day) => ({ startPage: (day - 1) * 20 + 1, endPage: day * 20 });
  const getPrayerPageRange = (i, d) => { const s = (d - 1) * 20 + i * 4 + 1; return { startPage: s, endPage: s + 3 }; };
  const getDayCompletedCount = (day) => (completedPages[`day_${day}`] || []).length;
  const isPrayerCompleteForDay = (i, d) => (completedPages[`day_${d}`] || []).includes(`prayer_${i}`);
  const isDayComplete = (day) => getDayCompletedCount(day) === 5;

  const togglePrayer = (prayerIndex) => {
    const dayKey = `day_${displayDay}`;
    const prayerKey = `prayer_${prayerIndex}`;
    const newCompleted = { ...completedPages };
    if (!newCompleted[dayKey]) newCompleted[dayKey] = [];
    if (newCompleted[dayKey].includes(prayerKey)) {
      newCompleted[dayKey] = newCompleted[dayKey].filter(p => p !== prayerKey);
    } else {
      newCompleted[dayKey] = [...newCompleted[dayKey], prayerKey];
    }
    setCompletedPages(newCompleted);
    savePages(newCompleted);
  };

  const completeFullDay = () => {
    const dayKey = `day_${displayDay}`;
    const newCompleted = { ...completedPages };
    newCompleted[dayKey] = isDayComplete(displayDay) ? [] : ['prayer_0', 'prayer_1', 'prayer_2', 'prayer_3', 'prayer_4'];
    setCompletedPages(newCompleted);
    savePages(newCompleted);
  };

  const goToNextDay = () => { const t = displayDay + 1; if (t > 30) return; setSelectedDay(t === actualDay ? null : t); };
  const goToPreviousDay = () => { const t = displayDay - 1; if (t < 1) return; setSelectedDay(t === actualDay ? null : t); };

  const dayStats = {
    completed: getDayCompletedCount(displayDay) * 4,
    total: 20,
    percentage: Math.round((getDayCompletedCount(displayDay) / 5) * 100)
  };
  dayStats.remaining = dayStats.total - dayStats.completed;

  const getAdvanceStatus = () => {
    let total = 0;
    for (let i = 1; i <= 30; i++) if (isDayComplete(i)) total++;
    const diff = total - actualDay + (isDayComplete(actualDay) ? 0 : 1);
    return { totalCompletedDays: total, diff };
  };

  const advanceStatus = getAdvanceStatus();
  const cycleStats = { completedDays: advanceStatus.totalCompletedDays, completed: 0 };
  for (let i = 1; i <= 30; i++) cycleStats.completed += getDayCompletedCount(i) * 4;
  cycleStats.remaining = 600 - cycleStats.completed;
  cycleStats.percentage = Math.round((cycleStats.completed / 600) * 100);

  const startNewCycle = () => {
    showConfirm('هل تريد بدء دورة قراءة جديدة؟ سيتم مسح التقدم الحالي.', () => {
      setCompletedPages({});
      setSelectedDay(null);
      const todayStr = new Date().toISOString().split('T')[0];
      setCurrentCycleStart(todayStr);
      storage.set('completed_pages', JSON.stringify({}));
      storage.set('cycle_start', todayStr);
      showToast('تم بدء دورة جديدة', 'success');
    });
  };

  const performArchive = () => {
    const monthName = hijriMonths[hijriDate.month - 1];
    const newKhatma = {
      id: Date.now(), month: monthName, year: hijriDate.year,
      completedPages: cycleStats.completed, totalPages: 600,
      dateArchived: new Date().toISOString(), notes: ''
    };
    const newArchives = [...archivedKhatmas, newKhatma];
    setArchivedKhatmas(newArchives);
    storage.set('archived_khatmas', JSON.stringify(newArchives));
    setCompletedPages({});
    setSelectedDay(null);
    const todayStr = new Date().toISOString().split('T')[0];
    setCurrentCycleStart(todayStr);
    storage.set('completed_pages', JSON.stringify({}));
    storage.set('cycle_start', todayStr);
    showToast(`تم حفظ ختمة ${monthName} ${hijriDate.year} هـ`, 'success');
  };

  const archiveCurrentKhatma = () => {
    if (cycleStats.completed < 600) {
      showConfirm(`الختمة غير مكتملة (${cycleStats.completed}/600). أرشفتها؟`, performArchive);
    } else performArchive();
  };

  const addManualArchive = () => {
    if (!newArchive.month || !newArchive.year) { showToast('يرجى اختيار الشهر والسنة', 'error'); return; }
    const khatma = {
      id: Date.now(), month: newArchive.month, year: parseInt(newArchive.year),
      completedPages: 600, totalPages: 600, dateArchived: new Date().toISOString(),
      notes: newArchive.notes, manuallyAdded: true
    };
    const newArchives = [...archivedKhatmas, khatma];
    setArchivedKhatmas(newArchives);
    storage.set('archived_khatmas', JSON.stringify(newArchives));
    setNewArchive({ month: '', year: '', notes: '' });
    setShowAddArchive(false);
    showToast('تمت الإضافة', 'success');
  };

  const shareViaWhatsApp = () => {
    const message = `السلام عليكم ورحمة الله وبركاته

أشارككم تطبيق MAMINA-Khatma لتنظيم قراءة القرآن الكريم، بمعدل 20 صفحة يومياً موزعة على الصلوات الخمس، لإتمام ختمة كل شهر بإذن الله.

الرابط: https://mamina-khatma.vercel.app

نسأل الله القبول والتوفيق.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };
  const deleteArchive = (id) => {
    showConfirm('حذف هذه الختمة؟', () => {
      const newArchives = archivedKhatmas.filter(k => k.id !== id);
      setArchivedKhatmas(newArchives);
      storage.set('archived_khatmas', JSON.stringify(newArchives));
      showToast('تم الحذف', 'success');
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900" dir="rtl">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-amber-300 text-xl">MAMINA-Khatma</div>
        </div>
      </div>
    );
  }

  const dayCompletedFlag = isDayComplete(displayDay);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50" dir="rtl" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50" style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}>
          <div className={`px-5 py-3 rounded-2xl shadow-2xl text-white font-bold text-sm ${toastMessage.type === 'error' ? 'bg-rose-500' : 'bg-emerald-600'}`}>
            {toastMessage.message}
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setConfirmDialog(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-lg font-bold">تأكيد العملية</h3>
              </div>
            </div>
            <div className="p-5">
              <p className="text-slate-700 text-sm mb-5">{confirmDialog.message}</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDialog(null)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm">إلغاء</button>
                <button onClick={() => { const fn = confirmDialog.onConfirm; setConfirmDialog(null); if (fn) fn(); }} className="flex-1 px-4 py-3 bg-gradient-to-l from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-sm">تأكيد</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-2.5 rounded-2xl shadow-lg">
                <BookOpen className="w-6 h-6 text-emerald-900" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold bg-gradient-to-l from-amber-300 to-amber-100 bg-clip-text text-transparent truncate">MAMINA-Khatma</h1>
                <p className="text-emerald-200/80 text-[11px] truncate">القراءة المنظمة للقرآن الكريم</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowArchive(true)} className="p-3 bg-white/10 rounded-xl relative" style={{ minWidth: '44px', minHeight: '44px' }}>
                <Archive className="w-5 h-5" />
                {archivedKhatmas.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-emerald-900 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{archivedKhatmas.length}</span>
                )}
              </button>
              <button onClick={() => setShowSettings(true)} className="p-3 bg-white/10 rounded-xl" style={{ minWidth: '44px', minHeight: '44px' }}>
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="border-l border-white/10 pl-2">
                <p className="text-amber-300/80 text-[10px]">اليوم</p>
                <p className="text-sm font-bold">{dayOfWeek}</p>
              </div>
              <div className="border-l border-white/10 pl-2">
                <p className="text-amber-300/80 text-[10px]">الهجري</p>
                <p className="text-[13px] font-bold leading-tight">{hijriDate.day} {hijriMonths[hijriDate.month - 1]}</p>
                <p className="text-[10px] text-emerald-200/60">{hijriDate.year} هـ</p>
              </div>
              <div>
                <p className="text-amber-300/80 text-[10px]">الميلادي</p>
                <p className="text-[13px] font-bold leading-tight">{today.getDate()} {gregorianMonths[today.getMonth()]}</p>
                <p className="text-[10px] text-emerald-200/60">{today.getFullYear()} م</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5">
        
        {advanceStatus.diff !== 0 && (
          <div className={`mb-4 rounded-2xl p-3 border-r-4 ${advanceStatus.diff > 0 ? 'bg-emerald-50 border-emerald-500' : 'bg-amber-50 border-amber-500'}`}>
            <div className="flex items-center gap-3">
              {advanceStatus.diff > 0 ? <Zap className="w-5 h-5 text-emerald-700" /> : <AlertCircle className="w-5 h-5 text-amber-700" />}
              <p className={`font-bold text-sm ${advanceStatus.diff > 0 ? 'text-emerald-900' : 'text-amber-900'}`}>
                {advanceStatus.diff > 0 ? `متقدم بـ ${advanceStatus.diff} أيام` : `متأخر بـ ${Math.abs(advanceStatus.diff)} أيام`}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-2xl shadow-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-700">إحصائيات اليوم</h3>
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 mb-2">{displayDay} <span className="text-sm text-slate-500">/ 30</span></div>
            <div className="grid grid-cols-3 gap-1.5 mb-2 text-center">
              <div className="bg-emerald-50 rounded-lg p-1.5"><p className="text-base font-bold text-emerald-700">{dayStats.completed}</p><p className="text-[10px]">مقروءة</p></div>
              <div className="bg-amber-50 rounded-lg p-1.5"><p className="text-base font-bold text-amber-600">{dayStats.remaining}</p><p className="text-[10px]">متبقية</p></div>
              <div className="bg-teal-50 rounded-lg p-1.5"><p className="text-base font-bold text-teal-700">{dayStats.percentage}%</p><p className="text-[10px]">الإنجاز</p></div>
            </div>
            <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-l from-emerald-500 to-teal-500" style={{ width: `${dayStats.percentage}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-700">إحصائيات الدورة</h3>
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-600 mb-2">{cycleStats.completedDays} <span className="text-sm text-slate-500">يوم / 30</span></div>
            <div className="grid grid-cols-3 gap-1.5 mb-2 text-center">
              <div className="bg-emerald-50 rounded-lg p-1.5"><p className="text-base font-bold text-emerald-700">{cycleStats.completed}</p><p className="text-[10px]">مقروءة</p></div>
              <div className="bg-amber-50 rounded-lg p-1.5"><p className="text-base font-bold text-amber-600">{cycleStats.remaining}</p><p className="text-[10px]">متبقية</p></div>
              <div className="bg-teal-50 rounded-lg p-1.5"><p className="text-base font-bold text-teal-700">{cycleStats.percentage}%</p><p className="text-[10px]">الإنجاز</p></div>
            </div>
            <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-l from-amber-500 to-orange-500" style={{ width: `${cycleStats.percentage}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-2 mb-4 flex items-center justify-between gap-2">
          <button onClick={goToPreviousDay} disabled={displayDay <= 1} className="p-3 bg-slate-100 disabled:opacity-30 rounded-xl" style={{ minWidth: '48px', minHeight: '48px' }}>
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="text-center flex-1">
            <p className="text-[10px] text-slate-500">الجلسة الحالية</p>
            <p className="text-base font-bold text-emerald-700">اليوم {displayDay}</p>
            {selectedDay !== null && (
              <button onClick={() => setSelectedDay(null)} className="mt-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-[11px] font-bold">اليوم ({actualDay})</button>
            )}
          </div>
          <button onClick={goToNextDay} disabled={displayDay >= 30} className="p-3 bg-slate-100 disabled:opacity-30 rounded-xl" style={{ minWidth: '48px', minHeight: '48px' }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <button onClick={completeFullDay} className={`w-full mb-4 p-4 rounded-2xl shadow-lg ${dayCompletedFlag ? 'bg-gradient-to-l from-emerald-600 to-teal-700 text-white' : 'bg-white text-emerald-900 border-2 border-dashed border-emerald-300'}`} style={{ minHeight: '64px' }}>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              {dayCompletedFlag ? <CheckCircle2 className="w-5 h-5" /> : <Zap className="w-5 h-5 text-amber-600" />}
              <span className="font-bold text-sm">{dayCompletedFlag ? `اليوم ${displayDay} مكتمل` : `إكمال اليوم ${displayDay}`}</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-[11px] font-bold ${dayCompletedFlag ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              الصفحات {getDayPageRange(displayDay).startPage} → {getDayPageRange(displayDay).endPage}
            </div>
          </div>
        </button>

        <h2 className="text-sm font-bold text-slate-700 mb-2 text-center">الصلوات الخمس — 4 صفحات لكل صلاة</h2>
        
        <div className="grid grid-cols-5 gap-1.5">
          {prayers.map((prayer, idx) => {
            const done = isPrayerCompleteForDay(idx, displayDay);
            const Icon = prayer.icon;
            const range = getPrayerPageRange(idx, displayDay);
            return (
              <button key={prayer.id} onClick={() => togglePrayer(idx)} className="active:scale-95 transition-transform" style={{ minHeight: '110px' }}>
                <div className={`bg-gradient-to-br ${prayer.color} rounded-2xl p-2 shadow-lg h-full ${done ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}>
                  <div className="flex flex-col items-center text-white h-full justify-between">
                    <div className={`rounded-full p-1.5 ${done ? 'bg-amber-400 text-emerald-900' : 'bg-white/20'}`}>
                      {done ? <Check className="w-4 h-4" strokeWidth={3} /> : <Icon className="w-4 h-4" />}
                    </div>
                    <h3 className="text-xs font-bold">{prayer.name}</h3>
                    <div className="bg-white/15 rounded-md px-1.5 py-0.5">
                      <p className="text-[10px] font-bold leading-none">{range.startPage}-{range.endPage}</p>
                    </div>
                    <p className="text-[9px] text-white/70">{done ? '✓' : '4 ص'}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {dayCompletedFlag && (
          <div className="mt-5 bg-gradient-to-l from-emerald-500 to-teal-600 rounded-2xl p-4 text-white text-center shadow-xl">
            <Award className="w-9 h-9 mx-auto mb-2 text-amber-300" />
            <p className="text-lg font-bold">بارك الله فيك!</p>
            <p className="text-xs">أتممت ورد اليوم {displayDay}</p>
          </div>
        )}

        <div className="mt-6 text-center pb-4">
          <p className="text-sm text-emerald-900/80 font-bold mb-1">﴿ إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ ﴾</p>
          <p className="text-[10px] text-slate-500">MAMINA-Khatma © Dr. Ahmed El Heiba Mamina</p>
        </div>
      </main>

      {showSettings && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="bg-gradient-to-br from-slate-900 to-teal-900 text-white p-4 flex items-center justify-between sticky top-0">
              <h2 className="text-lg font-bold flex items-center gap-2"><Settings className="w-5 h-5" />الإعدادات</h2>
              <button onClick={() => setShowSettings(false)} className="p-2" style={{ minWidth: '44px', minHeight: '44px' }}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-5">
              <div>
                <h3 className="font-bold text-sm mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-600" />تعديل التاريخ الهجري</h3>
                <p className="text-[11px] text-slate-600 mb-3">لمواءمة التقويم مع الرؤية الشرعية في موريتانيا</p>
                <div className="bg-emerald-50 rounded-2xl p-3 mb-3">
                  <p className="text-center text-base font-bold text-emerald-900">{hijriDate.day} {hijriMonths[hijriDate.month - 1]} {hijriDate.year} هـ</p>
                  <p className="text-center text-[11px] mt-1">الإزاحة: {hijriOffset > 0 ? '+' : ''}{hijriOffset}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveHijriOffset(hijriOffset - 1)} className="flex-1 py-3 bg-rose-50 text-rose-700 rounded-xl font-bold text-xs" style={{ minHeight: '48px' }}><Minus className="w-4 h-4 inline" /> يوم</button>
                  <button onClick={() => saveHijriOffset(0)} className="flex-1 py-3 bg-slate-50 rounded-xl font-bold text-xs" style={{ minHeight: '48px' }}>ضبط</button>
                  <button onClick={() => saveHijriOffset(hijriOffset + 1)} className="flex-1 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs" style={{ minHeight: '48px' }}><Plus className="w-4 h-4 inline" /> يوم</button>
                </div>
              </div>
              <div className="border-t pt-5">
                <h3 className="font-bold text-sm mb-2 flex items-center gap-2"><Award className="w-4 h-4 text-amber-600" />إدارة الدورة</h3>
                <button onClick={() => { setShowSettings(false); setTimeout(archiveCurrentKhatma, 100); }} className="w-full py-3 bg-gradient-to-l from-emerald-500 to-teal-600 text-white rounded-xl font-bold mb-3 text-sm" style={{ minHeight: '48px' }}>حفظ الختمة الحالية</button>
                <button onClick={() => { setShowSettings(false); setTimeout(startNewCycle, 100); }} className="w-full py-3 bg-amber-50 text-amber-800 rounded-xl font-bold text-xs" style={{ minHeight: '48px' }}>بدء دورة جديدة</button>
              </div><div className="border-t pt-5">
                <h3 className="font-bold text-sm mb-2 flex items-center gap-2"><Share2 className="w-4 h-4 text-emerald-600" />مشاركة التطبيق</h3>
                <p className="text-[11px] text-slate-600 mb-3">شارك التطبيق مع الأهل والأصدقاء لينالوا أجر القراءة المنظمة بإذن الله</p>
                <button onClick={() => { setShowSettings(false); setTimeout(shareViaWhatsApp, 100); }} className="w-full py-3 bg-gradient-to-l from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2" style={{ minHeight: '48px' }}>
                  <Share2 className="w-4 h-4" />
                  مشاركة عبر واتساب
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showArchive && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50" onClick={() => setShowArchive(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="bg-gradient-to-br from-slate-900 to-teal-900 text-white p-4 flex items-center justify-between sticky top-0">
              <h2 className="text-lg font-bold flex items-center gap-2"><Archive className="w-5 h-5" />الأرشيف</h2>
              <button onClick={() => setShowArchive(false)} className="p-2" style={{ minWidth: '44px', minHeight: '44px' }}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <button onClick={() => { setShowArchive(false); setTimeout(() => setShowAddArchive(true), 100); }} className="w-full py-3 bg-gradient-to-l from-emerald-500 to-teal-600 text-white rounded-xl font-bold mb-4 text-sm" style={{ minHeight: '48px' }}>
                <Plus className="w-4 h-4 inline mr-1" /> إضافة ختمة سابقة
              </button>
              {archivedKhatmas.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Archive className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-bold">لا توجد ختمات محفوظة</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {archivedKhatmas.sort((a, b) => b.year - a.year).map((k) => (
                    <div key={k.id} className="bg-emerald-50 rounded-2xl p-3 border-r-4 border-emerald-600">
                      <div className="flex justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-emerald-900">ختمة {k.month} {k.year} هـ</h4>
                          <p className="text-[11px] mt-1">الصفحات: {k.completedPages}/{k.totalPages} ({Math.round((k.completedPages/k.totalPages)*100)}%)</p>
                          {k.notes && <p className="text-[11px] italic bg-white/70 p-2 rounded-lg mt-2">{k.notes}</p>}
                        </div>
                        <button onClick={() => deleteArchive(k.id)} className="p-2 text-rose-600" style={{ minWidth: '40px', minHeight: '40px' }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddArchive && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50" onClick={() => setShowAddArchive(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="bg-gradient-to-br from-slate-900 to-teal-900 text-white p-4 flex items-center justify-between sticky top-0">
              <h2 className="text-lg font-bold">إضافة ختمة سابقة</h2>
              <button onClick={() => setShowAddArchive(false)} className="p-2" style={{ minWidth: '44px', minHeight: '44px' }}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-2">الشهر الهجري</label>
                <select value={newArchive.month} onChange={(e) => setNewArchive({ ...newArchive, month: e.target.value })} className="w-full p-3 border-2 border-emerald-100 rounded-xl text-sm font-bold" style={{ minHeight: '48px', fontSize: '16px' }}>
                  <option value="">-- اختر --</option>
                  {hijriMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-2">السنة الهجرية</label>
                <input type="number" inputMode="numeric" value={newArchive.year} onChange={(e) => setNewArchive({ ...newArchive, year: e.target.value })} placeholder={`${hijriDate.year}`} className="w-full p-3 border-2 border-emerald-100 rounded-xl text-sm font-bold" style={{ minHeight: '48px', fontSize: '16px' }} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2">ملاحظات</label>
                <textarea value={newArchive.notes} onChange={(e) => setNewArchive({ ...newArchive, notes: e.target.value })} rows="3" className="w-full p-3 border-2 border-emerald-100 rounded-xl text-sm" style={{ fontSize: '16px' }} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddArchive(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-sm" style={{ minHeight: '48px' }}>إلغاء</button>
                <button onClick={addManualArchive} className="flex-1 py-3 bg-gradient-to-l from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-sm" style={{ minHeight: '48px' }}>حفظ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
