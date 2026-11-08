import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Check,
  Trash2,
  ShieldCheck,
  Search,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';
import { ThemeAsset, themeService } from '../../../services/themeService';

interface ThemeMediaLibraryProps {
  assets: ThemeAsset[];
  onAssetSelect?: (asset: ThemeAsset) => void;
  onAssetsChange: (assets: ThemeAsset[]) => void;
  selectedAssetUrl?: string;
  isPickerMode?: boolean;
}

export const ThemeMediaLibrary: React.FC<ThemeMediaLibraryProps> = ({
  assets,
  onAssetSelect,
  onAssetsChange,
  selectedAssetUrl,
  isPickerMode = false,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<ThemeAsset | null>(null);
  const [dimensionsMap, setDimensionsMap] = useState<Record<string, { w: number; h: number }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { id: 'all', label: 'الكل' },
    { id: 'illustration', label: 'المجسمات 3D الشفافة' },
    { id: 'background', label: 'الخلفيات والبوسترات' },
    { id: 'logo', label: 'الشعارات' },
    { id: 'photo', label: 'الصور العامة' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    try {
      const file = files[0];
      const category = filterCategory === 'all' ? 'illustration' : (filterCategory as ThemeAsset['category']);
      const newAsset = await themeService.uploadMedia(file, category);
      onAssetsChange([newAsset, ...assets]);
      if (onAssetSelect) {
        onAssetSelect(newAsset);
      }
    } catch (err: any) {
      setUploadError(err.message || 'فشل رفع الملف، يرجى المحاولة مرة أخرى');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (asset: ThemeAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`هل أنت متأكد من حذف الملف "${asset.originalName}"؟`)) return;

    try {
      await themeService.deleteMedia(asset.id);
      onAssetsChange(assets.filter((a) => a.id !== asset.id));
      if (previewAsset?.id === asset.id) setPreviewAsset(null);
    } catch (err: any) {
      alert(err.message || 'فشل حذف الملف');
    }
  };

  const isTransparentFormat = (asset: ThemeAsset) => {
    const mime = (asset.mimeType || '').toLowerCase();
    const url = (asset.url || '').toLowerCase();
    return (
      mime.includes('png') ||
      mime.includes('svg') ||
      mime.includes('webp') ||
      mime.includes('avif') ||
      url.includes('transparent') ||
      url.endsWith('.png') ||
      url.endsWith('.svg') ||
      url.endsWith('.webp')
    );
  };

  const getFormatBadge = (asset: ThemeAsset) => {
    const mime = (asset.mimeType || '').toLowerCase();
    if (mime.includes('svg')) return 'SVG';
    if (mime.includes('avif')) return 'AVIF';
    if (mime.includes('webp')) return 'WEBP';
    if (mime.includes('png')) return 'PNG';
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'JPG';
    return mime.split('/')[1]?.toUpperCase() || 'IMG';
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesCat = filterCategory === 'all' || asset.category === filterCategory;
    const matchesQuery =
      asset.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6" dir="rtl">
      {/* Header and Security Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#0B2E57] flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#CC9048]" />
            <span>مكتبة الصور والشعارات والمجسمات 3D</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            دعم كامل لصيغ PNG الشفافة، JPG، WebP، SVG، وAVIF مع الحفاظ على الأبعاد الأصلية دون قص تلقائي.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>PNG / JPG / WebP / SVG / AVIF ✓</span>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 rounded-xl bg-[#004AA5] hover:bg-[#003B84] text-white text-xs font-bold flex items-center gap-2 transition shadow-md shadow-[#004AA5]/20 cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'جاري الفحص والرفع...' : 'رفع صورة جديدة'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif,.png,.jpg,.jpeg,.webp,.svg,.avif"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
          {uploadError}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filterCategory === cat.id
                  ? 'bg-[#004AA5] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم الصورة أو النوع..."
            className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004AA5]/30 focus:border-[#004AA5]"
          />
        </div>
      </div>

      {/* Grid of Media Assets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredAssets.map((asset) => {
          const isSelected = selectedAssetUrl === asset.url;
          const dims = dimensionsMap[asset.id] || (asset.width && asset.height ? { w: asset.width, h: asset.height } : null);
          const transparent = isTransparentFormat(asset);
          const formatLabel = getFormatBadge(asset);

          return (
            <div
              key={asset.id}
              onClick={() => onAssetSelect ? onAssetSelect(asset) : setPreviewAsset(asset)}
              className={`group relative rounded-2xl border transition-all overflow-hidden flex flex-col cursor-pointer ${
                isSelected
                  ? 'border-[#004AA5] ring-2 ring-[#004AA5]/30 shadow-md bg-[#F0F6FF]'
                  : 'border-slate-200 hover:border-[#004AA5]/50 hover:shadow-md bg-white'
              }`}
            >
              {/* Image Preview Box - Preserves natural aspect ratio without forcing square crop */}
              <div
                className="h-44 w-full p-3 flex items-center justify-center relative overflow-hidden"
                style={{
                  backgroundColor: '#f8fafc',
                  backgroundImage: transparent
                    ? 'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)'
                    : undefined,
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
                }}
              >
                <img
                  src={asset.url}
                  alt={asset.originalName}
                  className="max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth && img.naturalHeight) {
                      setDimensionsMap((prev) => ({
                        ...prev,
                        [asset.id]: { w: img.naturalWidth, h: img.naturalHeight },
                      }));
                    }
                  }}
                />

                {/* Top Badges: Format & Transparency */}
                <div className="absolute top-2 left-2 flex items-center gap-1 pointer-events-none" dir="ltr">
                  <span className="px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-mono font-bold">
                    {formatLabel}
                  </span>
                  {transparent && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-600/90 text-white text-[9px] font-bold flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>شفاف</span>
                    </span>
                  )}
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2 bg-[#004AA5] text-white p-1 rounded-full shadow-md">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Hover Overlay Actions */}
                <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  {onAssetSelect && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssetSelect(asset);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#004AA5] text-white text-xs font-bold hover:bg-[#003B84] shadow-md cursor-pointer transition flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>اختيار</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewAsset(asset);
                    }}
                    className="p-2 rounded-xl bg-white/95 text-slate-800 hover:bg-white shadow cursor-pointer transition"
                    title="معاينة ومعلومات الملف"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {asset.uploadedBy !== 'system' && (
                    <button
                      type="button"
                      onClick={(e) => handleDelete(asset, e)}
                      className="p-2 rounded-xl bg-red-600/90 text-white hover:bg-red-600 shadow cursor-pointer transition"
                      title="حذف الملف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Asset Meta Info */}
              <div className="p-3 bg-white border-t border-slate-100 flex flex-col justify-between flex-1 space-y-1.5">
                <div className="text-xs font-bold text-slate-800 truncate" title={asset.originalName}>
                  {asset.originalName}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono" dir="ltr">
                  <span>{dims ? `${dims.w}×${dims.h}px` : formatLabel}</span>
                  <span>{asset.size > 0 ? `${Math.max(1, Math.round(asset.size / 1024))} KB` : 'System 3D'}</span>
                </div>
                {isPickerMode && onAssetSelect && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssetSelect(asset);
                    }}
                    className={`w-full mt-1 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-50 text-[#004AA5] hover:bg-[#004AA5] hover:text-white'
                    }`}
                  >
                    {isSelected ? 'تم الاختيار ✓' : 'اختيار هذه الصورة'}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredAssets.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            لا توجد ملفات مطابقة في هذا التصنيف. يمكنك رفع ملف جديد بالأعلى.
          </div>
        )}
      </div>

      {/* Full Preview Modal */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-[#0B2E57] truncate">{previewAsset.originalName}</h4>
                {isTransparentFormat(previewAsset) && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                    يدعم الشفافية (Transparent)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="h-80 w-full rounded-2xl flex items-center justify-center p-6 overflow-hidden border border-slate-200"
              style={{
                backgroundColor: '#0f172a',
                backgroundImage:
                  'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
              }}
            >
              <img
                src={previewAsset.url}
                alt={previewAsset.originalName}
                className="max-h-full max-w-full object-contain drop-shadow-xl"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">أبعاد الصورة:</span>
                <span className="font-mono font-bold text-slate-800" dir="ltr">
                  {dimensionsMap[previewAsset.id]
                    ? `${dimensionsMap[previewAsset.id].w} × ${dimensionsMap[previewAsset.id].h} px`
                    : 'أبعاد أصلية كاملة'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">النوع والحجم:</span>
                <span className="font-semibold text-slate-800" dir="ltr">
                  {getFormatBadge(previewAsset)} ·{' '}
                  {previewAsset.size > 0 ? `${(previewAsset.size / 1024).toFixed(1)} KB` : 'System Asset'}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px]">الرابط المباشر:</span>
                <span className="font-mono text-slate-700 text-[11px] select-all truncate block" dir="ltr">
                  {previewAsset.url}
                </span>
              </div>
            </div>

            {onAssetSelect && (
              <button
                type="button"
                onClick={() => {
                  onAssetSelect(previewAsset);
                  setPreviewAsset(null);
                }}
                className="w-full py-2.5 rounded-xl bg-[#004AA5] hover:bg-[#003B84] text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>اختيار واستخدام هذه الصورة</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
