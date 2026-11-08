import React from 'react';
import { LayerConfig, DEFAULT_LAYERS } from '../../../services/themeService';
import {
  Layers,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
  RotateCcw,
  Sliders,
} from 'lucide-react';

export interface ThemeLayerManagerProps {
  layers?: LayerConfig[];
  onChange: (layers: LayerConfig[]) => void;
  selectedLayerId?: string | null;
  onSelectLayer: (layerId: string) => void;
  language?: 'ar' | 'en' | 'fr';
}

export const ThemeLayerManager: React.FC<ThemeLayerManagerProps> = ({
  layers = DEFAULT_LAYERS,
  onChange,
  selectedLayerId,
  onSelectLayer,
  language = 'ar',
}) => {
  const isRtl = language === 'ar';

  // Ensure all 5 layers exist and sort by zIndex descending (top to bottom)
  const currentLayers = (layers && layers.length > 0 ? layers : DEFAULT_LAYERS);
  const sortedLayers = [...currentLayers].sort((a, b) => b.zIndex - a.zIndex);

  const updateLayer = (id: string, patch: Partial<LayerConfig>) => {
    const updated = currentLayers.map((l) => (l.id === id ? { ...l, ...patch } : l));
    onChange(updated);
  };

  const moveLayer = (id: string, direction: 'up' | 'down') => {
    const sorted = [...sortedLayers];
    const idx = sorted.findIndex((l) => l.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return; // already top
    if (direction === 'down' && idx === sorted.length - 1) return; // already bottom

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    // Swap z-indices
    const tempZ = sorted[idx].zIndex;
    sorted[idx].zIndex = sorted[targetIdx].zIndex;
    sorted[targetIdx].zIndex = tempZ;

    // If both have same zIndex, re-normalize
    sorted.sort((a, b) => b.zIndex - a.zIndex);
    sorted.forEach((l, i) => {
      l.zIndex = sorted.length - i;
    });

    onChange([...sorted]);
  };

  const resetToDefault = () => {
    onChange([...DEFAULT_LAYERS]);
  };

  return (
    <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#004AA5]" />
          <span>{isRtl ? 'مدير الطبقات البصرية (Stacking Layers)' : 'Visual Layers Manager'}</span>
        </label>
        <button
          type="button"
          onClick={resetToDefault}
          className="text-[11px] font-bold text-slate-500 hover:text-[#004AA5] flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{isRtl ? 'إعادة ضبط' : 'Reset'}</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        {isRtl
          ? 'رتّب الطبقات من الأعلى للأسفل، تحكم في الرؤية، الشفافية، وترتيب التراكب z-index.'
          : 'Reorder visual layers from top to bottom, control visibility, opacity, and z-index stacking.'}
      </p>

      {/* Layers List */}
      <div className="space-y-2">
        {sortedLayers.map((layer, index) => {
          const isSelected = selectedLayerId === layer.id;
          const isTop = index === 0;
          const isBottom = index === sortedLayers.length - 1;

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/70 border-[#004AA5] ring-1 ring-[#004AA5] shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              } ${!layer.visible ? 'opacity-60 bg-slate-50' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                {/* Left: Visibility toggle and name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLayer(layer.id, { visible: !layer.visible });
                    }}
                    title={layer.visible ? (isRtl ? 'إخفاء الطبقة' : 'Hide') : isRtl ? 'إظهار الطبقة' : 'Show'}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      layer.visible
                        ? 'text-[#004AA5] bg-blue-100/60 hover:bg-blue-200/60'
                        : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {isRtl ? layer.labelAr : layer.labelEn}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        z:{layer.zIndex}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {isTop
                        ? isRtl
                          ? 'الطبقة العلوية (Top)'
                          : 'Top Layer'
                        : isBottom
                        ? isRtl
                          ? 'الطبقة السفلية (Bottom)'
                          : 'Bottom Layer'
                        : isRtl
                        ? `طبقة داخلية ${sortedLayers.length - index}`
                        : `Layer ${sortedLayers.length - index}`}
                    </span>
                  </div>
                </div>

                {/* Right: Actions (Up, Down, Lock) */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    disabled={isTop || layer.locked}
                    onClick={() => moveLayer(layer.id, 'up')}
                    title={isRtl ? 'تقديم للأعلى' : 'Move Up'}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-[#004AA5] hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isBottom || layer.locked}
                    onClick={() => moveLayer(layer.id, 'down')}
                    title={isRtl ? 'تأخير للأسفل' : 'Move Down'}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-[#004AA5] hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateLayer(layer.id, { locked: !layer.locked })}
                    title={layer.locked ? (isRtl ? 'فك القفل' : 'Unlock') : isRtl ? 'قفل الطبقة' : 'Lock'}
                    className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                      layer.locked ? 'text-[#CC9048] bg-amber-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Opacity Slider for Selected or Expanded Layer */}
              {isSelected && (
                <div className="mt-2.5 pt-2 border-t border-blue-100/80 flex items-center gap-2">
                  <Sliders className="w-3 h-3 text-[#004AA5] shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                    {isRtl ? 'الشفافية' : 'Opacity'}:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={layer.opacity ?? 100}
                    onChange={(e) => updateLayer(layer.id, { opacity: parseInt(e.target.value, 10) })}
                    className="flex-1 accent-[#004AA5] cursor-pointer h-1.5"
                  />
                  <span className="text-[10px] font-mono text-slate-600 w-8 text-end">
                    {layer.opacity ?? 100}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
