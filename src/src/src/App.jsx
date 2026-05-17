import React, { useState, useEffect } from 'react';
import { Check, RotateCcw, Settings, BookOpen, Calendar, Plus, Minus, X, Archive, Award, Trash2, ChevronLeft, ChevronRight, Sparkles, Moon, Sun, CloudSun, Sunset, Star, Zap, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

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
      const parts = formatter.formatToParts(adjustedDat
