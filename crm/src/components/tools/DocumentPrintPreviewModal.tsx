import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  FileDown,
  FileText,
  Stamp as StampIcon,
  Settings,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  Move,
  Layers,
  Lock,
  Unlock,
  Trash2,
  Upload,
  Edit2,
  Check,
  ChevronDown,
  ChevronUp,
  Layout,
  AlignRight,
  Eye,
  FileSpreadsheet,
  Calendar,
  Clock,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { PageSetupConfig, StampConfig } from '../../services/productivityService';
import { ResizeHandle } from '../workspace/resizable/ResizeHandle';

export interface StampAsset {
  id: string;
  name: string;
  url: string;
  svgUrl?: string;
  width?: number;
  height?: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy?: string;
}

interface DocumentPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentHtml: string;
  initialPageSetup?: PageSetupConfig;
  initialStampConfig?: StampConfig;
  initialTab?: 'preview' | 'pageSetup' | 'stamp' | 'export';
  onSaveSettings: (pageSetup: PageSetupConfig, stampConfig: StampConfig) => void;
  onNotification?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

// Paper dimensions in mm
export const PAPER_DIMENSIONS: Record<string, { width: number; height: number; label: string }> = {
  A4: { width: 210, height: 297, label: 'A4 (210 × 297 مم)' },
  A5: { width: 148, height: 210, label: 'A5 (148 × 210 مم)' },
  Letter: { width: 215.9, height: 279.4, label: 'Letter (216 × 279 مم)' },
  Legal: { width: 215.9, height: 355.6, label: 'Legal (216 × 356 مم)' },
  Custom: { width: 210, height: 297, label: 'مخصص (Custom Dimensions)' },
};

export const MARGIN_PRESETS = {
  normal: { label: 'عادي (15 مم)', top: 15, bottom: 15, left: 15, right: 15 },
  narrow: { label: 'ضيق (10 مم)', top: 10, bottom: 10, left: 10, right: 10 },
  wide: { label: 'واسع (25 مم)', top: 25, bottom: 25, left: 25, right: 25 },
  custom: { label: 'مخصص', top: 15, bottom: 15, left: 15, right: 15 },
};

export const STAMP_POSITION_PRESETS = [
  { id: 'bottom_right', label: 'أسفل اليمين (معتمد)', x: 80, y: 85 },
  { id: 'bottom_left', label: 'أسفل اليسار', x: 20, y: 85 },
  { id: 'bottom_center', label: 'أسفل الوسط', x: 50, y: 85 },
  { id: 'top_right', label: 'أعلى اليمين', x: 80, y: 15 },
  { id: 'top_left', label: 'أعلى اليسار', x: 20, y: 15 },
  { id: 'center', label: 'وسط المستند (علامة مائية)', x: 50, y: 50 },
  { id: 'custom', label: 'مخصص (سحب حر)', x: 80, y: 85 },
];

export const DocumentPrintPreviewModal: React.FC<DocumentPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  documentHtml,
  initialPageSetup,
  initialStampConfig,
  initialTab = 'preview',
  onSaveSettings,
  onNotification = () => {},
}) => {
  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'preview' | 'pageSetup' | 'stamp' | 'export'>(initialTab);

  // Page Setup State
  const [pageSetup, setPageSetup] = useState<PageSetupConfig>(() => ({
    paperSize: initialPageSetup?.paperSize || 'A4',
    customWidthMm: initialPageSetup?.customWidthMm || 210,
    customHeightMm: initialPageSetup?.customHeightMm || 297,
    orientation: initialPageSetup?.orientation || 'portrait',
    margins: {
      topMm: initialPageSetup?.margins?.topMm ?? 15,
      bottomMm: initialPageSetup?.margins?.bottomMm ?? 15,
      leftMm: initialPageSetup?.margins?.leftMm ?? 15,
      rightMm: initialPageSetup?.margins?.rightMm ?? 15,
    },
    header: {
      enabled: initialPageSetup?.header?.enabled ?? true,
      text: initialPageSetup?.header?.text ?? 'الفزني للخدمات — وثيقة معتمدة',
      showTitle: initialPageSetup?.header?.showTitle ?? true,
      showDate: initialPageSetup?.header?.showDate ?? true,
    },
    footer: {
      enabled: initialPageSetup?.footer?.enabled ?? true,
      text: initialPageSetup?.footer?.text ?? 'الفزني للخدمات — ELFAZNI SERVICES',
      showPageNumbers: initialPageSetup?.footer?.showPageNumbers ?? true,
      showDate: initialPageSetup?.footer?.showDate ?? true,
    },
    printBackground: initialPageSetup?.printBackground ?? true,
    pageBreaks: initialPageSetup?.pageBreaks ?? true,
  }));

  // Stamp Config State
  const [stampConfig, setStampConfig] = useState<StampConfig>(() => ({
    enabled: initialStampConfig?.enabled ?? false,
    stampId: initialStampConfig?.stampId || 'stamp_official_blue',
    stampUrl: initialStampConfig?.stampUrl || '/assets/stamps/elfazni-official-stamp.png',
    stampName: initialStampConfig?.stampName || 'خاتم رسمي معتمد — الفزني للخدمات',
    targetPages: initialStampConfig?.targetPages || 'last',
    presetPosition: initialStampConfig?.presetPosition || 'bottom_right',
    xPercent: initialStampConfig?.xPercent ?? 80,
    yPercent: initialStampConfig?.yPercent ?? 85,
    scalePercent: initialStampConfig?.scalePercent ?? 100,
    rotationDeg: initialStampConfig?.rotationDeg ?? -5,
    opacityPercent: initialStampConfig?.opacityPercent ?? 90,
    layer: initialStampConfig?.layer || 'foreground',
    locked: initialStampConfig?.locked ?? false,
  }));

  // Stamp Asset Library State
  const [stampsList, setStampsList] = useState<StampAsset[]>([]);
  const [isLoadingStamps, setIsLoadingStamps] = useState(false);
  const [isUploadingStamp, setIsUploadingStamp] = useState(false);
  const [editingStampId, setEditingStampId] = useState<string | null>(null);
  const [editingStampName, setEditingStampName] = useState('');

  // Zoom & Preview Display
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showMarginGuides, setShowMarginGuides] = useState<boolean>(true);
  const [activePageNumber, setActivePageNumber] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string>('');

  // Interactive Drag & Transform State for Stamp Canvas
  const [isDraggingStamp, setIsDraggingStamp] = useState<boolean>(false);
  const [dragStartPos, setDragStartPos] = useState<{ mouseX: number; mouseY: number; startXPercent: number; startYPercent: number }>({
    mouseX: 0,
    mouseY: 0,
    startXPercent: 80,
    startYPercent: 85,
  });

  const [isResizingStamp, setIsResizingStamp] = useState<boolean>(false);
  const [resizeStartScale, setResizeStartScale] = useState<number>(100);
  const [resizeStartDistance, setResizeStartDistance] = useState<number>(0);

  const [isRotatingStamp, setIsRotatingStamp] = useState<boolean>(false);
  const [rotateStartAngle, setRotateStartAngle] = useState<number>(0);

  const previewSheetRef = useRef<HTMLDivElement>(null);
  const stampOverlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resizable Sidebar Panel Width (Preferences saved in localStorage)
  const DEFAULT_SIDEBAR_WIDTH = 380;
  const MIN_SIDEBAR_WIDTH = 280;
  const MAX_SIDEBAR_WIDTH = 540;

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('elfazni_doc_studio_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
          return parsed;
        }
      }
    }
    return DEFAULT_SIDEBAR_WIDTH;
  });

  const handleSidebarResize = useCallback((delta: number) => {
    setSidebarWidth((prev) => {
      const next = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, prev + delta));
      try {
        localStorage.setItem('elfazni_doc_studio_sidebar_width', String(next));
      } catch {}
      return next;
    });
  }, []);

  const handleResetSidebar = useCallback(() => {
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    try {
      localStorage.setItem('elfazni_doc_studio_sidebar_width', String(DEFAULT_SIDEBAR_WIDTH));
    } catch {}
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown, true);
    }
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  // Sync initial tab when changed from props
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Fetch stamps library from server
  const fetchStamps = useCallback(async () => {
    setIsLoadingStamps(true);
    try {
      const res = await fetch('/api/documents/stamps');
      if (res.ok) {
        const data = await res.json();
        if (data.stamps && Array.isArray(data.stamps)) {
          setStampsList(data.stamps);
        }
      }
    } catch (e) {
      console.error('Error fetching stamps library:', e);
    } finally {
      setIsLoadingStamps(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchStamps();
    }
  }, [isOpen, fetchStamps]);

  // Upload new stamp
  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/png', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      onNotification('صيغة الملف غير مدعومة. يرجى رفع ملف PNG أو WebP أو SVG شفاف فقط.', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onNotification('حجم الملف كبير جداً. الحد الأقصى 10 ميغابايت.', 'error');
      return;
    }

    setIsUploadingStamp(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name.replace(/\.[^.]+$/, ''));

      const res = await fetch('/api/documents/stamps', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.stamp) {
        setStampsList((prev) => [...prev, data.stamp]);
        // Auto select newly uploaded stamp
        setStampConfig((prev) => ({
          ...prev,
          enabled: true,
          stampId: data.stamp.id,
          stampUrl: data.stamp.url,
          stampName: data.stamp.name,
        }));
        onNotification(`تم رفع وحفظ الختم "${data.stamp.name}" بنجاح في المكتبة الخاصة!`, 'success');
      } else {
        onNotification(data.error || 'فشل رفع الختم.', 'error');
      }
    } catch (err: any) {
      onNotification('خطأ في الاتصال أثناء رفع الختم: ' + err.message, 'error');
    } finally {
      setIsUploadingStamp(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Rename stamp
  const handleSaveRenameStamp = async (id: string) => {
    if (!editingStampName.trim()) return;
    try {
      const res = await fetch(`/api/documents/stamps/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingStampName.trim() }),
      });
      const data = await res.json();
      if (data.success && data.stamp) {
        setStampsList((prev) => prev.map((s) => (s.id === id ? data.stamp : s)));
        if (stampConfig.stampId === id) {
          setStampConfig((prev) => ({ ...prev, stampName: data.stamp.name }));
        }
        setEditingStampId(null);
        onNotification('تم تحديث اسم الختم بنجاح.', 'success');
      }
    } catch (e: any) {
      onNotification('فشل تعديل الاسم: ' + e.message, 'error');
    }
  };

  // Delete stamp
  const handleDeleteStamp = async (id: string, name: string) => {
    if (['stamp_official_blue', 'stamp_certified_gold', 'stamp_confidential_red'].includes(id)) {
      onNotification('الأختام الرسمية المعتمدة لا يمكن حذفها من النظام.', 'error');
      return;
    }
    if (!window.confirm(`هل أنت متأكد من حذف الختم "${name}" نهائياً من المكتبة؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/documents/stamps/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStampsList((prev) => prev.filter((s) => s.id !== id));
        if (stampConfig.stampId === id) {
          // Fallback to first available stamp
          const remaining = stampsList.filter((s) => s.id !== id);
          if (remaining.length > 0) {
            setStampConfig((prev) => ({
              ...prev,
              stampId: remaining[0].id,
              stampUrl: remaining[0].url,
              stampName: remaining[0].name,
            }));
          } else {
            setStampConfig((prev) => ({ ...prev, enabled: false }));
          }
        }
        onNotification(`تم حذف الختم "${name}" من المكتبة.`, 'info');
      }
    } catch (e: any) {
      onNotification('فشل حذف الختم: ' + e.message, 'error');
    }
  };

  // Select stamp from library
  const handleSelectStamp = (stamp: StampAsset) => {
    setStampConfig((prev) => ({
      ...prev,
      enabled: true,
      stampId: stamp.id,
      stampUrl: stamp.url,
      stampName: stamp.name,
    }));
    onNotification(`تم اختيار الختم "${stamp.name}".`, 'info');
  };

  // Apply placement preset
  const handleApplyPreset = (presetId: string) => {
    const preset = STAMP_POSITION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setStampConfig((prev) => ({
      ...prev,
      presetPosition: presetId as any,
      xPercent: preset.x,
      yPercent: preset.y,
    }));
  };

  // -------------------------------------------------------------
  // Interactive Mouse/Touch Handlers for Dragging Stamp on Sheet
  // -------------------------------------------------------------
  const handleStampMouseDown = (e: React.MouseEvent) => {
    if (stampConfig.locked) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDraggingStamp(true);
    setDragStartPos({
      mouseX: e.clientX,
      mouseY: e.clientY,
      startXPercent: stampConfig.xPercent ?? 80,
      startYPercent: stampConfig.yPercent ?? 85,
    });
  };

  // Corner resize start
  const handleCornerResizeMouseDown = (e: React.MouseEvent) => {
    if (stampConfig.locked) return;
    e.preventDefault();
    e.stopPropagation();

    if (!stampOverlayRef.current) return;
    const rect = stampOverlayRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY);

    setIsResizingStamp(true);
    setResizeStartScale(stampConfig.scalePercent ?? 100);
    setResizeStartDistance(distance);
  };

  // Rotation start
  const handleRotateMouseDown = (e: React.MouseEvent) => {
    if (stampConfig.locked) return;
    e.preventDefault();
    e.stopPropagation();

    if (!stampOverlayRef.current) return;
    const rect = stampOverlayRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const angleDeg = (angleRad * 180) / Math.PI;

    setIsRotatingStamp(true);
    setRotateStartAngle(angleDeg - (stampConfig.rotationDeg ?? 0));
  };

  // Global mousemove / mouseup listeners for drag, resize, rotate
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingStamp && previewSheetRef.current) {
        const sheetRect = previewSheetRef.current.getBoundingClientRect();
        const deltaX = e.clientX - dragStartPos.mouseX;
        const deltaY = e.clientY - dragStartPos.mouseY;

        // Convert delta pixels to percentage of sheet width/height
        const deltaPercentX = (deltaX / sheetRect.width) * 100;
        const deltaPercentY = (deltaY / sheetRect.height) * 100;

        let newX = Math.round(dragStartPos.startXPercent + deltaPercentX);
        let newY = Math.round(dragStartPos.startYPercent + deltaPercentY);

        // Clamp between 5% and 95%
        newX = Math.max(5, Math.min(95, newX));
        newY = Math.max(5, Math.min(95, newY));

        setStampConfig((prev) => ({
          ...prev,
          presetPosition: 'custom',
          xPercent: newX,
          yPercent: newY,
        }));
      } else if (isResizingStamp && stampOverlayRef.current) {
        const rect = stampOverlayRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const currentDistance = Math.hypot(e.clientX - centerX, e.clientY - centerY);

        if (resizeStartDistance > 0) {
          const ratio = currentDistance / resizeStartDistance;
          let newScale = Math.round(resizeStartScale * ratio);
          newScale = Math.max(10, Math.min(400, newScale));
          setStampConfig((prev) => ({ ...prev, scalePercent: newScale }));
        }
      } else if (isRotatingStamp && stampOverlayRef.current) {
        const rect = stampOverlayRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const currentAngleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        let currentAngleDeg = Math.round((currentAngleRad * 180) / Math.PI);

        let finalAngle = Math.round(currentAngleDeg - rotateStartAngle);
        // Normalize between -180 and 180
        while (finalAngle > 180) finalAngle -= 360;
        while (finalAngle < -180) finalAngle += 360;

        setStampConfig((prev) => ({ ...prev, rotationDeg: finalAngle }));
      }
    };

    const handleMouseUp = () => {
      if (isDraggingStamp) setIsDraggingStamp(false);
      if (isResizingStamp) setIsResizingStamp(false);
      if (isRotatingStamp) setIsRotatingStamp(false);
    };

    if (isDraggingStamp || isResizingStamp || isRotatingStamp) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDraggingStamp,
    isResizingStamp,
    isRotatingStamp,
    dragStartPos,
    resizeStartScale,
    resizeStartDistance,
    rotateStartAngle,
  ]);

  // -------------------------------------------------------------
  // EXPORT FUNCTIONS: Real PDF, Real DOCX, Clean Print
  // -------------------------------------------------------------

  // 1. Export PDF (Stamped or Clean)
  const handleExportPdf = async (isStamped: boolean) => {
    setIsExporting(true);
    setExportMessage(isStamped ? 'جارٍ توليد نسخة PDF مختومة...' : 'جارٍ توليد نسخة PDF نظيفة...');
    try {
      const payload = {
        title: documentTitle || 'وثيقة الفزني للخدمات',
        html: documentHtml,
        pageSetup,
        stampConfig,
        isStamped,
      };

      const res = await fetch('/api/documents/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'فشل توليد ملف PDF');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const stampSuffix = isStamped ? '-مختوم' : '-نظيف';
      link.download = `${(documentTitle || 'وثيقة').replace(/[\s/\\:*?"<>|]/g, '_')}${stampSuffix}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      onNotification(isStamped ? 'تم تصدير ملف PDF مختوم بنجاح!' : 'تم تصدير ملف PDF نظيف بنجاح!', 'success');
    } catch (err: any) {
      console.error('PDF Export error:', err);
      onNotification('خطأ أثناء تصدير PDF: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
      setExportMessage('');
    }
  };

  // 2. Export Word (DOCX)
  const handleExportDocx = async () => {
    setIsExporting(true);
    setExportMessage('جارٍ توليد ملف Microsoft Word (DOCX)...');
    try {
      const payload = {
        title: documentTitle || 'وثيقة الفزني للخدمات',
        html: documentHtml,
        pageSetup,
        stampConfig,
      };

      const res = await fetch('/api/documents/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'فشل توليد ملف DOCX');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(documentTitle || 'وثيقة').replace(/[\s/\\:*?"<>|]/g, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      onNotification('تم تصدير مستند Word (DOCX) الأصلي بنجاح!', 'success');
    } catch (err: any) {
      console.error('DOCX Export error:', err);
      onNotification('خطأ أثناء تصدير Word: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
      setExportMessage('');
    }
  };

  // 3. Print directly using browser window.print()
  const handlePrint = () => {
    window.print();
  };

  // 4. Save settings to note
  const handleSaveAndClose = () => {
    onSaveSettings(pageSetup, stampConfig);
    onNotification('تم حفظ إعدادات الصفحة والختم بنجاح في الملاحظة.', 'success');
    onClose();
  };

  if (!isOpen) return null;

  // Paper Aspect Ratio calculation
  const paperKey = pageSetup.paperSize || 'A4';
  const paperDim = PAPER_DIMENSIONS[paperKey] || PAPER_DIMENSIONS.A4;
  const isLandscape = pageSetup.orientation === 'landscape';
  const sheetWidthMm = isLandscape ? paperDim.height : paperDim.width;
  const sheetHeightMm = isLandscape ? paperDim.width : paperDim.height;
  const aspectRatio = sheetWidthMm / sheetHeightMm;

  // Zoom styles
  const zoomFactor = zoomLevel / 100;

  // Compute Word Count & Stats
  const plainText = documentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText.length > 0 ? plainText.split(' ').length : 0;
  const charCount = plainText.length;
  const estimatedReadingTime = Math.ceil(wordCount / 180) || 1;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex flex-col bg-slate-900/85 backdrop-blur-sm overflow-hidden text-slate-800 animate-in fade-in duration-150"
      dir="rtl"
    >
      {/* ------------------------------------------------------------- */}
      {/* Top Header Bar */}
      {/* ------------------------------------------------------------- */}
      <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs select-none shrink-0 z-20">
        <div className="flex items-center gap-3">
          {/* Prominent Back to Notebook button */}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition flex items-center gap-1.5 border border-slate-300 shadow-2xs hover:text-[#004AA5] cursor-pointer"
            title="العودة إلى المفكرة الذكية (Esc)"
          >
            <ArrowRight size={15} className="rtl:rotate-180" />
            <span className="hidden sm:inline">العودة للمفكرة</span>
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#004AA5] shadow-xs shrink-0">
            <Printer size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-[#0B2E57] tracking-tight truncate">
                مركز الطباعة والتصدير والأختام الرسمية
              </h2>
              <span className="hidden lg:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                ELFAZNI Professional Suite
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate max-w-xs sm:max-w-md">
              {documentTitle || 'مستند بدون عنوان'} — إعدادات A4 المعتمدة والأختام المؤسسية
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-white text-[#004AA5] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Eye size={14} />
            <span>معاينة الطباعة</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pageSetup')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'pageSetup'
                ? 'bg-white text-[#004AA5] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Layout size={14} />
            <span>إعدادات الصفحة</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stamp')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'stamp'
                ? 'bg-white text-[#004AA5] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <StampIcon size={14} />
            <span>إدارة الختم</span>
            {stampConfig.enabled && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'export'
                ? 'bg-white text-[#004AA5] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FileDown size={14} />
            <span>خيارات التصدير</span>
          </button>
        </div>

        {/* Fast Action Buttons in Header */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="طباعة فورية"
          >
            <Printer size={14} />
            <span className="hidden xl:inline">طباعة</span>
          </button>

          <button
            type="button"
            onClick={handleExportDocx}
            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#004AA5] border border-blue-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer hidden md:flex"
            title="حفظ بصيغة Word"
          >
            <FileDown size={14} />
            <span className="hidden xl:inline">حفظ Word</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportPdf(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#004AA5] hover:bg-[#003882] text-white text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="تصدير PDF مختوم فوري"
          >
            <StampIcon size={14} className="text-[#CC9048]" />
            <span>تصدير مختوم</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAndClose}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="حفظ الإعدادات وإغلاق"
          >
            <Check size={14} />
            <span className="hidden sm:inline">حفظ</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200 cursor-pointer"
            title="إغلاق النافذة (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2-Panel Main Layout with Working Resizable Handle */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex overflow-hidden">
        {/* ============================================================= */}
        {/* PANEL 1 (CONTROLS ASIDE): Resizable Width */}
        {/* ============================================================= */}
        <aside
          id="doc-studio-settings-aside"
          style={{ width: `${sidebarWidth}px` }}
          className="bg-white border-e border-slate-200 flex flex-col shrink-0 overflow-y-auto z-10"
        >
          {/* Sub Navigation Bar for Small Screens */}
          <div className="flex md:hidden border-b border-slate-200 p-2 gap-1 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-1 rounded-md ${activeTab === 'preview' ? 'bg-blue-100 text-blue-900' : 'text-slate-600'}`}
            >
              المعاينة
            </button>
            <button
              onClick={() => setActiveTab('pageSetup')}
              className={`px-2.5 py-1 rounded-md ${activeTab === 'pageSetup' ? 'bg-blue-100 text-blue-900' : 'text-slate-600'}`}
            >
              الصفحة
            </button>
            <button
              onClick={() => setActiveTab('stamp')}
              className={`px-2.5 py-1 rounded-md ${activeTab === 'stamp' ? 'bg-blue-100 text-blue-900' : 'text-slate-600'}`}
            >
              الختم
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-2.5 py-1 rounded-md ${activeTab === 'export' ? 'bg-blue-100 text-blue-900' : 'text-slate-600'}`}
            >
              التصدير
            </button>
          </div>

          <div className="p-4 space-y-5">
            {/* --------------------------------------------------------- */}
            {/* TAB: PAGE SETUP */}
            {/* --------------------------------------------------------- */}
            {(activeTab === 'pageSetup' || activeTab === 'preview') && (
              <section className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layout size={16} className="text-[#004AA5]" />
                    <h3 className="text-xs font-black text-[#0B2E57] uppercase tracking-wider">
                      إعدادات الصفحة والطباعة
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {pageSetup.paperSize} — {pageSetup.orientation === 'portrait' ? 'عمودي' : 'أفقي'}
                  </span>
                </div>

                {/* 1. Paper Size */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حجم الورق (Paper Size)</label>
                  <select
                    value={pageSetup.paperSize}
                    onChange={(e) => setPageSetup({ ...pageSetup, paperSize: e.target.value as any })}
                    className="w-full text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#004AA5]/20 focus:border-[#004AA5]"
                  >
                    {Object.entries(PAPER_DIMENSIONS).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>

                {pageSetup.paperSize === 'Custom' && (
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-blue-50/50 border border-blue-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">العرض (مم)</label>
                      <input
                        type="number"
                        min={50}
                        max={500}
                        value={pageSetup.customWidthMm}
                        onChange={(e) => setPageSetup({ ...pageSetup, customWidthMm: Number(e.target.value) })}
                        className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">الارتفاع (مم)</label>
                      <input
                        type="number"
                        min={50}
                        max={800}
                        value={pageSetup.customHeightMm}
                        onChange={(e) => setPageSetup({ ...pageSetup, customHeightMm: Number(e.target.value) })}
                        className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* 2. Orientation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الاتجاه (Orientation)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPageSetup({ ...pageSetup, orientation: 'portrait' })}
                      className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        pageSetup.orientation === 'portrait'
                          ? 'border-[#004AA5] bg-blue-50 text-[#004AA5]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-3.5 h-4.5 border-2 border-current rounded-xs" />
                      <span>عمودي (Portrait)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPageSetup({ ...pageSetup, orientation: 'landscape' })}
                      className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        pageSetup.orientation === 'landscape'
                          ? 'border-[#004AA5] bg-blue-50 text-[#004AA5]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-4.5 h-3.5 border-2 border-current rounded-xs" />
                      <span>أفقي (Landscape)</span>
                    </button>
                  </div>
                </div>

                {/* 3. Margins */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">الهوامش (Margins)</label>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      {pageSetup.margins?.topMm} × {pageSetup.margins?.rightMm} مم
                    </span>
                  </div>

                  {/* Preset Pills */}
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {['normal', 'narrow', 'wide'].map((presetKey) => {
                      const p = MARGIN_PRESETS[presetKey as keyof typeof MARGIN_PRESETS];
                      const isCurrent =
                        pageSetup.margins?.topMm === p.top &&
                        pageSetup.margins?.bottomMm === p.bottom &&
                        pageSetup.margins?.leftMm === p.left &&
                        pageSetup.margins?.rightMm === p.right;
                      return (
                        <button
                          key={presetKey}
                          type="button"
                          onClick={() =>
                            setPageSetup({
                              ...pageSetup,
                              margins: { topMm: p.top, bottomMm: p.bottom, leftMm: p.left, rightMm: p.right },
                            })
                          }
                          className={`py-1 px-2 rounded-md border text-[11px] font-bold text-center transition ${
                            isCurrent
                              ? 'border-[#004AA5] bg-blue-50 text-[#004AA5]'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                          }`}
                        >
                          {presetKey === 'normal' ? 'عادي 15mm' : presetKey === 'narrow' ? 'ضيق 10mm' : 'واسع 25mm'}
                        </button>
                      );
                    })}
                  </div>

                  {/* 4 Margin Inputs */}
                  <div className="grid grid-cols-4 gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">أعلى</span>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={pageSetup.margins?.topMm ?? 15}
                        onChange={(e) =>
                          setPageSetup({
                            ...pageSetup,
                            margins: { ...pageSetup.margins, topMm: Number(e.target.value) },
                          })
                        }
                        className="w-full text-xs text-center border border-slate-300 rounded py-1 bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">أسفل</span>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={pageSetup.margins?.bottomMm ?? 15}
                        onChange={(e) =>
                          setPageSetup({
                            ...pageSetup,
                            margins: { ...pageSetup.margins, bottomMm: Number(e.target.value) },
                          })
                        }
                        className="w-full text-xs text-center border border-slate-300 rounded py-1 bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">يمين</span>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={pageSetup.margins?.rightMm ?? 15}
                        onChange={(e) =>
                          setPageSetup({
                            ...pageSetup,
                            margins: { ...pageSetup.margins, rightMm: Number(e.target.value) },
                          })
                        }
                        className="w-full text-xs text-center border border-slate-300 rounded py-1 bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">يسار</span>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={pageSetup.margins?.leftMm ?? 15}
                        onChange={(e) =>
                          setPageSetup({
                            ...pageSetup,
                            margins: { ...pageSetup.margins, leftMm: Number(e.target.value) },
                          })
                        }
                        className="w-full text-xs text-center border border-slate-300 rounded py-1 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Header & Footer Toggles */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  {/* Header */}
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-slate-800">ترويسة الصفحة (Header)</span>
                      <input
                        type="checkbox"
                        checked={pageSetup.header?.enabled}
                        onChange={(e) =>
                          setPageSetup({
                            ...pageSetup,
                            header: { ...pageSetup.header, enabled: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-[#004AA5] focus:ring-0 cursor-pointer"
                      />
                    </label>

                    {pageSetup.header?.enabled && (
                      <div className="space-y-2 pt-1 border-t border-slate-200/60 text-xs">
                        <input
                          type="text"
                          placeholder="نص الترويسة..."
                          value={pageSetup.header.text}
                          onChange={(e) =>
                            setPageSetup({
                              ...pageSetup,
                              header: { ...pageSetup.header, text: e.target.value },
                            })
                          }
                          className="w-full border border-slate-300 rounded-lg px-2 py-1 bg-white text-xs"
                        />
                        <div className="flex items-center gap-4 text-[11px] text-slate-600">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pageSetup.header.showTitle}
                              onChange={(e) =>
                                setPageSetup({
                                  ...pageSetup,
                                  header: { ...pageSetup.header, showTitle: e.target.checked },
                                })
                              }
                            />
                            <span>عرض عنوان المستند</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pageSetup.header.showDate}
                              onChange={(e) =>
                                setPageSetup({
                                  ...pageSetup,
                                  header: { ...pageSetup.header, showDate: e.target.checked },
                                })
                              }
                            />
                            <span>عرض التاريخ</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-slate-800">تذييل الصفحة (Footer)</span>
                      <input
                        type="checkbox"
                        checked={pageSetup.footer?.enabled}
                        onChange={(e) =>
                          setPageSetup({
                            ...pageSetup,
                            footer: { ...pageSetup.footer, enabled: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-[#004AA5] focus:ring-0 cursor-pointer"
                      />
                    </label>

                    {pageSetup.footer?.enabled && (
                      <div className="space-y-2 pt-1 border-t border-slate-200/60 text-xs">
                        <input
                          type="text"
                          placeholder="نص التذييل..."
                          value={pageSetup.footer.text}
                          onChange={(e) =>
                            setPageSetup({
                              ...pageSetup,
                              footer: { ...pageSetup.footer, text: e.target.value },
                            })
                          }
                          className="w-full border border-slate-300 rounded-lg px-2 py-1 bg-white text-xs"
                        />
                        <div className="flex items-center gap-4 text-[11px] text-slate-600">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pageSetup.footer.showPageNumbers}
                              onChange={(e) =>
                                setPageSetup({
                                  ...pageSetup,
                                  footer: { ...pageSetup.footer, showPageNumbers: e.target.checked },
                                })
                              }
                            />
                            <span>أرقام الصفحات</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pageSetup.footer.showDate}
                              onChange={(e) =>
                                setPageSetup({
                                  ...pageSetup,
                                  footer: { ...pageSetup.footer, showDate: e.target.checked },
                                })
                              }
                            />
                            <span>تاريخ اليوم</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Print Backgrounds */}
                  <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer text-xs font-bold text-slate-700">
                    <span>طباعة خلفيات وألوان الجداول والمربعات</span>
                    <input
                      type="checkbox"
                      checked={pageSetup.printBackground}
                      onChange={(e) => setPageSetup({ ...pageSetup, printBackground: e.target.checked })}
                      className="w-4 h-4 rounded text-[#004AA5] focus:ring-0 cursor-pointer"
                    />
                  </label>
                </div>
              </section>
            )}

            {/* --------------------------------------------------------- */}
            {/* TAB: STAMP MANAGER */}
            {/* --------------------------------------------------------- */}
            {(activeTab === 'stamp' || (activeTab === 'preview' && stampConfig.enabled)) && (
              <section className="space-y-4 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <StampIcon size={16} className="text-[#CC9048]" />
                    <h3 className="text-xs font-black text-[#0B2E57] uppercase tracking-wider">
                      إدارة وتخصيص الختم الرسمي
                    </h3>
                  </div>

                  {/* Master Stamp Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stampConfig.enabled}
                      onChange={(e) => setStampConfig({ ...stampConfig, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#004AA5]" />
                  </label>
                </div>

                {stampConfig.enabled ? (
                  <div className="space-y-4">
                    {/* Stamp Library Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">مكتبة الأختام المعتمدة</label>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] font-bold text-[#004AA5] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Upload size={11} />
                          <span>رفع ختم جديد</span>
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept=".png,.webp,.svg,image/png,image/webp,image/svg+xml"
                          onChange={handleStampUpload}
                          className="hidden"
                        />
                      </div>

                      {/* Stamp Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        {stampsList.map((st) => {
                          const isSelected = stampConfig.stampId === st.id;
                          return (
                            <div
                              key={st.id}
                              onClick={() => handleSelectStamp(st)}
                              className={`group relative p-2 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition ${
                                isSelected
                                  ? 'border-[#004AA5] bg-blue-50/70 ring-2 ring-[#004AA5]/20 shadow-xs'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <div className="w-14 h-14 flex items-center justify-center mb-1 relative">
                                <img
                                  src={st.url}
                                  alt={st.name}
                                  className="max-w-full max-h-full object-contain filter drop-shadow-xs"
                                />
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#004AA5] rounded-full text-white flex items-center justify-center">
                                    <Check size={10} />
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 line-clamp-1 w-full" title={st.name}>
                                {st.name}
                              </span>

                              {/* Rename or delete buttons */}
                              {!['stamp_official_blue', 'stamp_certified_gold', 'stamp_confidential_red'].includes(
                                st.id
                              ) && (
                                <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5 bg-white/90 p-0.5 rounded shadow-xs">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingStampId(st.id);
                                      setEditingStampName(st.name);
                                    }}
                                    className="p-1 hover:text-blue-600"
                                    title="إعادة تسمية"
                                  >
                                    <Edit2 size={10} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteStamp(st.id, st.name);
                                    }}
                                    className="p-1 hover:text-rose-600"
                                    title="حذف"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Rename inline popup */}
                      {editingStampId && (
                        <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-1.5 text-xs">
                          <input
                            type="text"
                            value={editingStampName}
                            onChange={(e) => setEditingStampName(e.target.value)}
                            className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                            placeholder="الاسم الجديد للختم..."
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRenameStamp(editingStampId)}
                            className="px-2 py-1 bg-[#004AA5] text-white rounded text-xs font-bold"
                          >
                            حفظ
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStampId(null)}
                            className="p-1 text-slate-500 hover:text-slate-800"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Scale (10% to 400%) */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>الحجم والمقياس (Scale)</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={10}
                            max={400}
                            value={stampConfig.scalePercent}
                            onChange={(e) =>
                              setStampConfig({ ...stampConfig, scalePercent: Number(e.target.value) })
                            }
                            className="w-14 text-center border border-slate-300 rounded px-1 py-0.5 text-xs font-bold"
                          />
                          <span className="text-slate-500">%</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={400}
                        step={5}
                        value={stampConfig.scalePercent}
                        onChange={(e) =>
                          setStampConfig({ ...stampConfig, scalePercent: Number(e.target.value) })
                        }
                        className="w-full accent-[#004AA5] cursor-pointer"
                      />
                    </div>

                    {/* Rotation (-180° to 180°) */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>زاوية الدوران (Rotation)</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={-180}
                            max={180}
                            value={stampConfig.rotationDeg}
                            onChange={(e) =>
                              setStampConfig({ ...stampConfig, rotationDeg: Number(e.target.value) })
                            }
                            className="w-14 text-center border border-slate-300 rounded px-1 py-0.5 text-xs font-bold"
                          />
                          <span className="text-slate-500">°</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        step={1}
                        value={stampConfig.rotationDeg}
                        onChange={(e) =>
                          setStampConfig({ ...stampConfig, rotationDeg: Number(e.target.value) })
                        }
                        className="w-full accent-[#004AA5] cursor-pointer"
                      />
                    </div>

                    {/* Opacity (10% to 100%) */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>الشفافية (Opacity)</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={10}
                            max={100}
                            value={stampConfig.opacityPercent}
                            onChange={(e) =>
                              setStampConfig({ ...stampConfig, opacityPercent: Number(e.target.value) })
                            }
                            className="w-14 text-center border border-slate-300 rounded px-1 py-0.5 text-xs font-bold"
                          />
                          <span className="text-slate-500">%</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        step={5}
                        value={stampConfig.opacityPercent}
                        onChange={(e) =>
                          setStampConfig({ ...stampConfig, opacityPercent: Number(e.target.value) })
                        }
                        className="w-full accent-[#004AA5] cursor-pointer"
                      />
                    </div>

                    {/* Placement Presets */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">الموقع المحدد مسبقاً</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {STAMP_POSITION_PRESETS.map((pst) => (
                          <button
                            key={pst.id}
                            type="button"
                            onClick={() => handleApplyPreset(pst.id)}
                            className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-start transition ${
                              stampConfig.presetPosition === pst.id
                                ? 'border-[#004AA5] bg-blue-50 text-[#004AA5]'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {pst.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Layer & Page Target */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">طبقة العرض</label>
                        <select
                          value={stampConfig.layer}
                          onChange={(e) => setStampConfig({ ...stampConfig, layer: e.target.value as any })}
                          className="w-full text-xs font-medium border border-slate-300 rounded-lg px-2 py-1 bg-white"
                        >
                          <option value="foreground">أمام النص (ختم رسمي)</option>
                          <option value="watermark">خلف النص (علامة مائية)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">الصفحات المستهدفة</label>
                        <select
                          value={stampConfig.targetPages}
                          onChange={(e) =>
                            setStampConfig({ ...stampConfig, targetPages: e.target.value as any })
                          }
                          className="w-full text-xs font-medium border border-slate-300 rounded-lg px-2 py-1 bg-white"
                        >
                          <option value="last">الصفحة الأخيرة فقط (توقيع)</option>
                          <option value="first">الصفحة الأولى فقط</option>
                          <option value="all">جميع الصفحات</option>
                          <option value="current">الصفحة الحالية</option>
                        </select>
                      </div>
                    </div>

                    {/* Lock & Remove Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setStampConfig({ ...stampConfig, locked: !stampConfig.locked })}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition ${
                          stampConfig.locked
                            ? 'border-amber-300 bg-amber-50 text-amber-900'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {stampConfig.locked ? <Lock size={13} /> : <Unlock size={13} />}
                        <span>{stampConfig.locked ? 'موقع الختم مقفل' : 'قفل موقع الختم'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStampConfig({ ...stampConfig, enabled: false })}
                        className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1"
                      >
                        <Trash2 size={13} />
                        <span>إزالة الختم</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center space-y-2 bg-slate-50">
                    <StampIcon size={28} className="mx-auto text-slate-400" />
                    <p className="text-xs text-slate-600 font-bold">الختم غير مفعل حالياً على هذا المستند</p>
                    <button
                      type="button"
                      onClick={() => setStampConfig({ ...stampConfig, enabled: true })}
                      className="px-3 py-1.5 rounded-lg bg-[#004AA5] text-white text-xs font-bold hover:bg-[#003882] transition"
                    >
                      تفعيل وإضافة ختم
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* --------------------------------------------------------- */}
            {/* TAB: EXPORT OPTIONS */}
            {/* --------------------------------------------------------- */}
            {(activeTab === 'export' || activeTab === 'preview') && (
              <section className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2 pb-1">
                  <FileDown size={16} className="text-blue-600" />
                  <h3 className="text-xs font-black text-[#0B2E57] uppercase tracking-wider">
                    إجراءات التصدير والحفظ
                  </h3>
                </div>

                <div className="space-y-2">
                  {/* Export Stamped PDF */}
                  <button
                    type="button"
                    onClick={() => handleExportPdf(true)}
                    disabled={isExporting}
                    className="w-full p-2.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 text-start flex items-center justify-between text-xs font-bold text-[#004AA5] transition group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#004AA5] text-white flex items-center justify-center">
                        <StampIcon size={14} className="text-[#CC9048]" />
                      </div>
                      <div>
                        <div className="font-black text-[#0B2E57]">تصدير نسخة مختومة PDF</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          تتضمن الختم الرسمي والألوان والهوامش المحددة
                        </div>
                      </div>
                    </div>
                    <FileDown size={14} className="text-[#004AA5] group-hover:translate-x-[-2px] transition" />
                  </button>

                  {/* Export Clean PDF */}
                  <button
                    type="button"
                    onClick={() => handleExportPdf(false)}
                    disabled={isExporting}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-start flex items-center justify-between text-xs font-bold text-slate-800 transition group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                        <FileText size={14} />
                      </div>
                      <div>
                        <div className="font-black text-slate-800">تصدير نسخة بدون ختم (Clean PDF)</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          مستند احترافي نظيف جاهز للطباعة الخارجية
                        </div>
                      </div>
                    </div>
                    <FileDown size={14} className="text-slate-400 group-hover:translate-x-[-2px] transition" />
                  </button>

                  {/* Export DOCX */}
                  <button
                    type="button"
                    onClick={handleExportDocx}
                    disabled={isExporting}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-start flex items-center justify-between text-xs font-bold text-slate-800 transition group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                        <FileDown size={14} />
                      </div>
                      <div>
                        <div className="font-black text-slate-800">تصدير بصيغة Word (DOCX)</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          ملف وورد أصلي قابل للتحرير مع تنسيقات RTL
                        </div>
                      </div>
                    </div>
                    <FileDown size={14} className="text-slate-400 group-hover:translate-x-[-2px] transition" />
                  </button>

                  {/* Native Print */}
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-start flex items-center justify-between text-xs font-bold text-slate-800 transition group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
                        <Printer size={14} />
                      </div>
                      <div>
                        <div className="font-black text-slate-800">طباعة المستند مباشرة</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          إرسال المستند مباشرة إلى الطابعة المحلية
                        </div>
                      </div>
                    </div>
                    <Printer size={14} className="text-slate-400 group-hover:translate-x-[-2px] transition" />
                  </button>
                </div>
              </section>
            )}
          </div>
        </aside>

        {/* Working Resizable Divider */}
        <ResizeHandle
          id="doc-studio-sidebar-resize"
          direction="horizontal"
          isRtl={true}
          currentSize={sidebarWidth}
          minSize={MIN_SIDEBAR_WIDTH}
          maxSize={MAX_SIDEBAR_WIDTH}
          onResize={handleSidebarResize}
          onReset={handleResetSidebar}
          ariaLabel="تغيير عرض لوحة الإعدادات"
        />

        {/* ============================================================= */}
        {/* PANEL 2 (CENTER): Live Document Preview Canvas Sheet */}
        {/* ============================================================= */}
        <main className="flex-1 min-w-0 bg-slate-200/80 flex flex-col overflow-hidden relative">
          {/* Zoom & Canvas Top Controls */}
          <div className="h-10 px-4 bg-white/90 backdrop-blur-xs border-b border-slate-200 flex items-center justify-between text-xs select-none shrink-0 z-10">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold">حجم العرض:</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(25, z - 10))}
                className="p-1 rounded hover:bg-slate-100 text-slate-700 transition"
                title="تصغير (-)"
              >
                <ZoomOut size={14} />
              </button>
              <span className="w-12 text-center font-bold text-slate-800">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
                className="p-1 rounded hover:bg-slate-100 text-slate-700 transition"
                title="تكبير (+)"
              >
                <ZoomIn size={14} />
              </button>
              <div className="h-4 w-px bg-slate-300 mx-1" />
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="px-2 py-0.5 rounded hover:bg-slate-100 text-slate-700 font-bold"
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(80)}
                className="px-2 py-0.5 rounded hover:bg-slate-100 text-slate-700 font-bold"
              >
                ملائمة الصفحة
              </button>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-slate-600 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMarginGuides}
                  onChange={(e) => setShowMarginGuides(e.target.checked)}
                  className="rounded text-[#004AA5]"
                />
                <span>إظهار خطوط الهوامش</span>
              </label>

              {stampConfig.enabled && (
                <div className="flex items-center gap-1.5 text-xs text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <StampIcon size={12} className="text-amber-700" />
                  <span>اسحب الختم بالماوس لتغيير موقعه</span>
                </div>
              )}
            </div>
          </div>

          {/* Export Loader Overlay */}
          {isExporting && (
            <div className="absolute inset-0 z-30 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-[#004AA5] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-black text-[#0B2E57]">{exportMessage}</p>
            </div>
          )}

          {/* Canvas Scroll Area */}
          <div className="flex-1 overflow-auto p-6 flex justify-center items-start">
            {/* The Document Sheet */}
            <div
              ref={previewSheetRef}
              data-testid="document-print-sheet"
              id="elfazni-printable-document"
              className="relative bg-white shadow-2xl transition-transform origin-top select-none print:shadow-none print:m-0"
              style={{
                width: `${sheetWidthMm * 3.78}px`, // ~3.78px per mm at 96dpi
                minHeight: `${sheetHeightMm * 3.78}px`,
                transform: `scale(${zoomFactor})`,
                fontFamily: "'Bahij TheSansArabic', 'Cairo', sans-serif",
                color: '#0B2E57',
              }}
            >
              {/* Margin Guide Dashed Box */}
              {showMarginGuides && (
                <div
                  className="absolute pointer-events-none border border-dashed border-blue-400/50 print:hidden"
                  style={{
                    top: `${(pageSetup.margins?.topMm ?? 15) * 3.78}px`,
                    bottom: `${(pageSetup.margins?.bottomMm ?? 15) * 3.78}px`,
                    right: `${(pageSetup.margins?.rightMm ?? 15) * 3.78}px`,
                    left: `${(pageSetup.margins?.leftMm ?? 15) * 3.78}px`,
                  }}
                />
              )}

              {/* Sheet Inner Content with Margins */}
              <div
                className="p-8 flex flex-col justify-between"
                style={{
                  paddingTop: `${(pageSetup.margins?.topMm ?? 15) * 3.78}px`,
                  paddingBottom: `${(pageSetup.margins?.bottomMm ?? 15) * 3.78}px`,
                  paddingRight: `${(pageSetup.margins?.rightMm ?? 15) * 3.78}px`,
                  paddingLeft: `${(pageSetup.margins?.leftMm ?? 15) * 3.78}px`,
                  minHeight: `${sheetHeightMm * 3.78}px`,
                }}
              >
                {/* 1. Document Header */}
                {pageSetup.header?.enabled && (
                  <header className="pb-4 mb-6 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-bold shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-[#004AA5] text-white flex items-center justify-center text-[10px] font-black">
                        E
                      </div>
                      <span>
                        {pageSetup.header.showTitle
                          ? documentTitle || 'الفزني للخدمات'
                          : pageSetup.header.text || 'الفزني للخدمات'}
                      </span>
                    </div>
                    {pageSetup.header.showDate && (
                      <span className="text-[11px] font-normal">
                        {new Date().toLocaleDateString('ar-MA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </header>
                )}

                {/* 2. Main Content Body */}
                <main className="flex-1 space-y-4">
                  <h1 className="text-2xl font-black text-[#0B2E57] tracking-tight mb-4 border-b pb-2 border-slate-100">
                    {documentTitle || 'مستند بدون عنوان'}
                  </h1>

                  <div
                    className="document-body-content text-sm leading-relaxed text-slate-800 space-y-3"
                    dangerouslySetInnerHTML={{
                      __html:
                        documentHtml ||
                        `<p class="text-slate-400 italic">محتوى المستند فارغ. يمكنك كتابة وتنسيق النص في المفكرة الذكية قبل الطباعة.</p>`,
                    }}
                  />
                </main>

                {/* 3. Interactive Draggable & Resizable Stamp Overlay */}
                {stampConfig.enabled && stampConfig.stampUrl && (
                  <div
                    ref={stampOverlayRef}
                    data-testid="interactive-stamp-overlay"
                    onMouseDown={handleStampMouseDown}
                    className={`absolute select-none transition-shadow ${
                      isDraggingStamp ? 'cursor-grabbing ring-2 ring-[#004AA5]' : 'cursor-grab hover:ring-1 hover:ring-blue-400'
                    }`}
                    style={{
                      left: `${stampConfig.xPercent ?? 80}%`,
                      top: `${stampConfig.yPercent ?? 85}%`,
                      transform: `translate(-50%, -50%) rotate(${stampConfig.rotationDeg ?? 0}deg) scale(${
                        (stampConfig.scalePercent ?? 100) / 100
                      })`,
                      opacity: (stampConfig.opacityPercent ?? 90) / 100,
                      zIndex: stampConfig.layer === 'watermark' ? 5 : 30,
                    }}
                  >
                    {/* Visual Stamp Image */}
                    <div className="relative group p-1">
                      <img
                        src={stampConfig.stampUrl}
                        alt={stampConfig.stampName || 'خاتم رسمي'}
                        className="w-36 h-36 object-contain pointer-events-none drop-shadow-md"
                        draggable={false}
                      />

                      {/* Interactive Transform Handles (When Unlocked) */}
                      {!stampConfig.locked && (
                        <div className="print:hidden">
                          {/* Corner Scale Handles */}
                          <div
                            onMouseDown={handleCornerResizeMouseDown}
                            className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#004AA5] rounded-full cursor-nwse-resize shadow-xs hover:scale-125 transition-transform"
                            title="تغيير الحجم"
                          />
                          <div
                            onMouseDown={handleCornerResizeMouseDown}
                            className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#004AA5] rounded-full cursor-nwse-resize shadow-xs hover:scale-125 transition-transform"
                            title="تغيير الحجم"
                          />
                          <div
                            onMouseDown={handleCornerResizeMouseDown}
                            className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#004AA5] rounded-full cursor-nesw-resize shadow-xs hover:scale-125 transition-transform"
                            title="تغيير الحجم"
                          />
                          <div
                            onMouseDown={handleCornerResizeMouseDown}
                            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#004AA5] rounded-full cursor-nesw-resize shadow-xs hover:scale-125 transition-transform"
                            title="تغيير الحجم"
                          />

                          {/* Top Rotation Stalk Handle */}
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                            <div
                              onMouseDown={handleRotateMouseDown}
                              className="w-4 h-4 bg-white border-2 border-amber-600 rounded-full cursor-crosshair shadow-xs flex items-center justify-center hover:scale-125 transition-transform"
                              title="تدوير الختم"
                            >
                              <RotateCw size={9} className="text-amber-700" />
                            </div>
                            <div className="w-0.5 h-2 bg-amber-500" />
                          </div>

                          {/* Info Coordinate Pill */}
                          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-[#0B2E57]/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            X: {stampConfig.xPercent}% | Y: {stampConfig.yPercent}% | {stampConfig.scalePercent}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Document Footer */}
                {pageSetup.footer?.enabled && (
                  <footer className="pt-4 mt-8 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-bold shrink-0">
                    <span>{pageSetup.footer.text || 'الفزني للخدمات — وثيقة معتمدة'}</span>
                    <div className="flex items-center gap-3">
                      {pageSetup.footer.showDate && (
                        <span>
                          {new Date().toLocaleDateString('ar-MA', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                      {pageSetup.footer.showPageNumbers && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          صفحة {activePageNumber} من {totalPages}
                        </span>
                      )}
                    </div>
                  </footer>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* ============================================================= */}
        {/* PANEL 3 (RIGHT / END): Thumbnails & Document Stats */}
        {/* ============================================================= */}
        <aside className="w-64 bg-white border-s border-slate-200 flex flex-col shrink-0 overflow-y-auto hidden lg:flex">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-xs font-black text-[#0B2E57] uppercase tracking-wider mb-1">
              معاينة الصفحات والإحصاءات
            </h3>
            <p className="text-[11px] text-slate-500">نظرة عامة على المستند المجهز للطباعة</p>
          </div>

          {/* Page Thumbnail */}
          <div className="p-4 space-y-3">
            <div className="text-xs font-bold text-slate-700">الصفحات ({totalPages})</div>
            <div
              onClick={() => setActivePageNumber(1)}
              className="p-2 rounded-xl border-2 border-[#004AA5] bg-blue-50/50 flex flex-col items-center justify-center cursor-pointer shadow-xs hover:shadow-md transition"
            >
              <div
                className="w-28 bg-white border border-slate-300 rounded shadow-xs p-2 text-[6px] space-y-1 relative overflow-hidden"
                style={{ height: '150px' }}
              >
                <div className="h-1 bg-slate-400 rounded-full w-3/4 mb-2" />
                <div className="h-0.5 bg-slate-300 rounded-full w-full" />
                <div className="h-0.5 bg-slate-300 rounded-full w-5/6" />
                <div className="h-0.5 bg-slate-300 rounded-full w-4/5" />
                <div className="h-0.5 bg-slate-300 rounded-full w-full" />

                {/* Stamp miniature preview */}
                {stampConfig.enabled && stampConfig.stampUrl && (
                  <div
                    className="absolute w-8 h-8 opacity-80"
                    style={{
                      left: `${stampConfig.xPercent ?? 80}%`,
                      top: `${stampConfig.yPercent ?? 85}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <img src={stampConfig.stampUrl} alt="stamp" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
              <span className="text-xs font-bold text-[#004AA5] mt-2">الصفحة 1 (الرئيسية)</span>
            </div>
          </div>

          {/* Document Stats Box */}
          <div className="p-4 space-y-3 mt-auto border-t border-slate-100 bg-slate-50/60">
            <div className="text-xs font-bold text-slate-700">بيانات المستند</div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>عدد الكلمات:</span>
                <span className="font-bold text-slate-800">{wordCount} كلمة</span>
              </div>
              <div className="flex items-center justify-between">
                <span>عدد الأحرف:</span>
                <span className="font-bold text-slate-800">{charCount} حرف</span>
              </div>
              <div className="flex items-center justify-between">
                <span>وقت القراءة التقديري:</span>
                <span className="font-bold text-slate-800">~{estimatedReadingTime} دقيقة</span>
              </div>
              <div className="flex items-center justify-between">
                <span>حالة الختم:</span>
                <span
                  className={`font-bold ${
                    stampConfig.enabled ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {stampConfig.enabled ? 'مختوم رسمي' : 'بدون ختم'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveAndClose}
                className="w-full py-2 bg-[#004AA5] hover:bg-[#003882] text-white rounded-xl text-xs font-black transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check size={14} />
                <span>حفظ التفضيلات في الملاحظة</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Bottom Floating Action Bar for Quick Export */}
      {/* ------------------------------------------------------------- */}
      <footer className="h-14 px-6 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 shadow-lg select-none">
        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>المستند جاهز للطباعة والتصدير بكامل جودة المتجهات والخطوط العربية</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={14} />
            <span>طباعة المستند</span>
          </button>

          <button
            type="button"
            onClick={handleExportDocx}
            className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#004AA5] border border-blue-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown size={14} />
            <span>حفظ Word (DOCX)</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportPdf(false)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileText size={14} />
            <span>تصدير PDF نظيف</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportPdf(true)}
            className="px-4 py-1.5 rounded-xl bg-[#004AA5] hover:bg-[#003882] text-white text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <StampIcon size={14} className="text-[#CC9048]" />
            <span>تصدير نسخة مختومة PDF</span>
          </button>
        </div>
      </footer>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
