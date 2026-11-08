import React, { useState, useEffect } from 'react';
import { RefreshCw, Check, Pipette } from 'lucide-react';
import { OFFICIAL_BRAND_COLORS } from '../../../services/themeService';

interface ThemeColorPickerProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  officialValue?: string;
  allowReset?: boolean;
}

export const ThemeColorPicker: React.FC<ThemeColorPickerProps> = ({
  label,
  value,
  onChange,
  officialValue,
  allowReset = true,
}) => {
  const [hexInput, setHexInput] = useState(value || '#004AA5');
  const [rgb, setRgb] = useState({ r: 0, g: 74, b: 165 });

  useEffect(() => {
    setHexInput(value || '#004AA5');
    parseHexToRgb(value || '#004AA5');
  }, [value]);

  const parseHexToRgb = (hex: string) => {
    const clean = hex.replace('#', '');
    if (clean.length === 6) {
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        setRgb({ r, g, b });
      }
    }
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onChange(val);
      parseHexToRgb(val);
    }
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', valStr: string) => {
    const num = Math.min(255, Math.max(0, parseInt(valStr, 10) || 0));
    const newRgb = { ...rgb, [channel]: num };
    setRgb(newRgb);
    const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
    const newHex = `#${toHex(newRgb.r)}${toHex(newRgb.g)}${toHex(newRgb.b)}`;
    setHexInput(newHex);
    onChange(newHex);
  };

  const palette = [
    '#004AA5', // Official Blue
    '#CC9048', // Official Gold
    '#81521C', // Accessible Gold Text
    '#0B2E57', // Deep Navy
    '#10345B', // Support Navy
    '#FFFFFF', // White
    '#F7F9FC', // Page Surface
    '#102D4D', // Primary Text
    '#16A34A', // Success
    '#DC2626', // Error
    '#D97706', // Warning
    '#0F172A', // Dark Slate
  ];

  return (
    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <span
            className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs shrink-0"
            style={{ backgroundColor: value }}
          />
          <span>{label}</span>
        </label>
        {allowReset && officialValue && value !== officialValue && (
          <button
            type="button"
            onClick={() => onChange(officialValue)}
            className="text-[11px] text-[#004AA5] hover:text-[#0B2E57] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            title="إعادة التعيين إلى اللون الرسمي"
          >
            <RefreshCw className="w-3 h-3" />
            <span>اللون الأصلي</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative shrink-0">
          <input
            type="color"
            value={value?.startsWith('#') && value.length === 7 ? value : '#004AA5'}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setHexInput(val);
              onChange(val);
              parseHexToRgb(val);
            }}
            className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white shadow-xs"
          />
        </div>

        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            placeholder="#004AA5"
            maxLength={7}
            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004AA5]/30 focus:border-[#004AA5]"
            dir="ltr"
          />
        </div>
      </div>

      {/* RGB breakdown inputs */}
      <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px]" dir="ltr">
        <div>
          <span className="text-[10px] text-slate-400 font-bold block">R</span>
          <input
            type="number"
            min={0}
            max={255}
            value={rgb.r}
            onChange={(e) => handleRgbChange('r', e.target.value)}
            className="w-full px-1.5 py-1 text-center bg-slate-50 border border-slate-200 rounded text-slate-700 font-mono text-[11px]"
          />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold block">G</span>
          <input
            type="number"
            min={0}
            max={255}
            value={rgb.g}
            onChange={(e) => handleRgbChange('g', e.target.value)}
            className="w-full px-1.5 py-1 text-center bg-slate-50 border border-slate-200 rounded text-slate-700 font-mono text-[11px]"
          />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold block">B</span>
          <input
            type="number"
            min={0}
            max={255}
            value={rgb.b}
            onChange={(e) => handleRgbChange('b', e.target.value)}
            className="w-full px-1.5 py-1 text-center bg-slate-50 border border-slate-200 rounded text-slate-700 font-mono text-[11px]"
          />
        </div>
      </div>

      {/* Official Palettes Quick Select */}
      <div className="pt-2 border-t border-slate-100">
        <span className="text-[10px] text-slate-400 font-bold block mb-1.5 text-right">ألوان الهوية المعتمدة:</span>
        <div className="flex flex-wrap gap-1.5">
          {palette.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => {
                setHexInput(hex);
                onChange(hex);
                parseHexToRgb(hex);
              }}
              style={{ backgroundColor: hex }}
              className={`w-5 h-5 rounded-md border border-slate-300/80 shadow-xs transition-transform hover:scale-110 cursor-pointer flex items-center justify-center ${
                value?.toUpperCase() === hex.toUpperCase() ? 'ring-2 ring-[#004AA5] ring-offset-1 scale-105' : ''
              }`}
              title={hex}
            >
              {value?.toUpperCase() === hex.toUpperCase() && (
                <Check
                  className={`w-3 h-3 ${
                    ['#FFFFFF', '#F7F9FC'].includes(hex.toUpperCase()) ? 'text-[#0B2E57]' : 'text-white'
                  }`}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
