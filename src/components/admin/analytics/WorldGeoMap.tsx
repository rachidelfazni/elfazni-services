import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Globe2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  MapPin,
  TrendingUp,
  Clock,
  Sparkles,
  Info,
  Check,
  ChevronDown,
  Navigation,
} from 'lucide-react';
import { WORLD_COUNTRIES, WORLD_VIEWBOX, WorldCountryData } from './worldMapData';

export interface TopCountryStat {
  code: string;
  name: string;
  flag: string;
  city?: string;
  visits: number;
  percentage: number;
}

interface WorldGeoMapProps {
  countries: TopCountryStat[];
  activeVisitors?: number;
  totalVisits?: number;
  lastUpdated?: string;
  onRefresh?: () => void;
}

export type ReportingPeriod = 'today' | '7days' | '30days' | 'year' | 'all';

export const WorldGeoMap: React.FC<WorldGeoMapProps> = ({
  countries = [],
  activeVisitors = 1,
  totalVisits = 0,
  lastUpdated,
  onRefresh,
}) => {
  // Navigation & Zoom State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Interaction State
  const [hoveredCountry, setHoveredCountry] = useState<WorldCountryData | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<WorldCountryData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<ReportingPeriod>('all');

  const containerRef = useRef<HTMLDivElement>(null);

  // Map of tracked stats keyed by country code and name
  const statsMap = useMemo(() => {
    const map = new Map<string, TopCountryStat>();
    countries.forEach((c) => {
      if (c.code) map.set(c.code.toUpperCase(), c);
      if (c.name) map.set(c.name.trim().toLowerCase(), c);
    });
    return map;
  }, [countries]);

  // Total visits calculation
  const totalTrackedVisits = useMemo(() => {
    return countries.reduce((acc, c) => acc + (c.visits || 0), 0) || totalVisits || 1;
  }, [countries, totalVisits]);

  // Filtered search list
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    return WORLD_COUNTRIES.filter(
      (c) =>
        c.nameAr.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  // Color Palette Constants as specified:
  // - Ocean Background: #08294B
  // - Land: #4076A1
  // - Country Borders: #92B6D5
  // - Turkey Highlight: #CC9048
  // - Morocco Highlight: #53C6E8
  // - Main Labels: #FFFFFF
  // - Secondary Labels: #DCEAF6
  const getCountryFill = (country: WorldCountryData, isHovered: boolean, isSelected: boolean) => {
    if (country.code === 'TR') {
      return isHovered ? '#E0A358' : isSelected ? '#B37835' : '#CC9048'; // Turkey Highlight
    }
    if (country.code === 'MA') {
      return isHovered ? '#72D7F3' : isSelected ? '#3BB0D2' : '#53C6E8'; // Morocco Highlight
    }

    const stat = statsMap.get(country.code) || statsMap.get(country.nameEn.toLowerCase());
    if (stat) {
      if (isHovered) return '#3B8FD4';
      if (isSelected) return '#1A68AA';
      return '#2679C6'; // Active visited country
    }

    if (isHovered) return '#5189B6';
    if (isSelected) return '#34658D';
    return '#4076A1'; // Default Land
  };

  // Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Zoom Handlers
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.35, 3.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.35, 0.75));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedCountry(null);
  };

  // Select and focus on a country
  const handleSelectCountry = (country: WorldCountryData) => {
    setSelectedCountry(country);
    setSearchQuery('');
    if (country.pin) {
      // Smoothly pan towards country center
      const targetX = -(country.pin.x - 1000) * 0.4;
      const targetY = -(country.pin.y - 428) * 0.4;
      setPan({ x: targetX, y: targetY });
      setZoom((z) => Math.max(z, 1.4));
    }
  };

  // Stats for currently hovered or selected country
  const activeStat = useMemo(() => {
    const target = hoveredCountry || selectedCountry;
    if (!target) return null;
    return (
      statsMap.get(target.code) ||
      statsMap.get(target.nameEn.toLowerCase()) || {
        code: target.code,
        name: target.nameAr,
        flag: target.flag,
        visits: 0,
        percentage: 0,
        city: 'لا توجد زيارات مسجلة',
      }
    );
  }, [hoveredCountry, selectedCountry, statsMap]);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col gap-5">
      {/* Top Header & Interactive Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-[#004AA5]">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0B2E57] text-base sm:text-lg flex items-center gap-2">
                <span>خريطة التوزيع الجغرافي للزوار (World Geo-Analytics)</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  رصد مباشر
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تتبع جغرافي حقيقي ومباشر لمصادر الزوار مع تمييز استراتيجي لتركيا والمغرب.
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Period Selector, Zoom Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Country Search Bar */}
          <div className="relative">
            <div className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-[#004AA5] text-xs">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن دولة…"
                className="bg-transparent border-none outline-none w-28 sm:w-36 text-slate-700 font-medium placeholder-slate-400"
              />
            </div>

            {/* Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-10 right-0 z-50 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 max-h-60 overflow-y-auto">
                {searchResults.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelectCountry(c)}
                    className="w-full px-3 py-1.5 text-right text-xs hover:bg-blue-50 flex items-center justify-between transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{c.flag}</span>
                      <span className="font-bold text-slate-800">{c.nameAr}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{c.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reporting Period Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setPeriod('all')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                period === 'all' ? 'bg-white text-[#004AA5] shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setPeriod('30days')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                period === '30days' ? 'bg-white text-[#004AA5] shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              30 يوم
            </button>
            <button
              onClick={() => setPeriod('7days')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                period === '7days' ? 'bg-white text-[#004AA5] shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              7 أيام
            </button>
            <button
              onClick={() => setPeriod('today')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                period === 'today' ? 'bg-white text-[#004AA5] shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              اليوم
            </button>
          </div>

          {/* Zoom and Navigation Controls */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              data-action="zoom-in"
              onClick={handleZoomIn}
              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition cursor-pointer"
              title="تكبير الخريطة (Zoom In)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              data-action="zoom-out"
              onClick={handleZoomOut}
              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition cursor-pointer"
              title="تصغير الخريطة (Zoom Out)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              data-action="zoom-reset"
              onClick={handleResetZoom}
              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition cursor-pointer"
              title="إعادة ضبط الموضع (Reset)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Map Viewport (Left/Center) & Live Ranking Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Map Viewport Box */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative h-[380px] sm:h-[440px] rounded-2xl overflow-hidden border border-[#0d3b6c] select-none cursor-grab active:cursor-grabbing shadow-inner"
            style={{ backgroundColor: '#08294B' }} // Ocean Background as required
          >
            {/* SVG Interactive Canvas */}
            <svg
              viewBox={WORLD_VIEWBOX}
              className="w-full h-full"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '50% 50%',
                transition: isPanning ? 'none' : 'transform 0.25s ease-out',
              }}
            >
              {/* Ocean Canvas Rect */}
              <rect width="1000" height="650" fill="#08294B" />

              {/* Country Polygons */}
              <g stroke="#92B6D5" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
                {WORLD_COUNTRIES.map((c) => {
                  const isHovered = hoveredCountry?.code === c.code;
                  const isSelected = selectedCountry?.code === c.code;
                  const fill = getCountryFill(c, isHovered, isSelected);

                  return (
                    <g
                      key={c.code}
                      data-country={c.code}
                      onMouseEnter={() => setHoveredCountry(c)}
                      onMouseLeave={() => setHoveredCountry(null)}
                      onClick={() => handleSelectCountry(c)}
                      className="transition-colors duration-150 cursor-pointer"
                    >
                      {c.paths.map((p, pIdx) => (
                        <path
                          key={pIdx}
                          d={p}
                          fill={fill}
                          data-country={c.code}
                          data-fill={fill}
                          stroke={isSelected ? '#FFFFFF' : isHovered ? '#FFFFFF' : '#92B6D5'}
                          strokeWidth={isSelected ? '1.5' : isHovered ? '1.2' : '0.8'}
                        />
                      ))}
                    </g>
                  );
                })}
              </g>

              {/* Dynamic Radar Pins & Hotspot Badges for Tracked Countries */}
              {WORLD_COUNTRIES.filter((c) => c.pin && (statsMap.has(c.code) || c.code === 'TR' || c.code === 'MA')).map(
                (c) => {
                  const pin = c.pin!;
                  const isTR = c.code === 'TR';
                  const isMA = c.code === 'MA';
                  const stat = statsMap.get(c.code);
                  const pinColor = isTR ? '#CC9048' : isMA ? '#53C6E8' : '#2A83D5';

                  return (
                    <g key={`pin-${c.code}`} className="pointer-events-none">
                      {/* Pulsing Radar Ring */}
                      <circle cx={pin.x} cy={pin.y} r="16" fill={pinColor} opacity="0.25" className="animate-ping" />
                      <circle cx={pin.x} cy={pin.y} r="6" fill={pinColor} stroke="#FFFFFF" strokeWidth="1.5" />

                      {/* Map Label (White / Light blue as required) */}
                      <g transform={`translate(${pin.x + 10}, ${pin.y - 10})`}>
                        <rect
                          x="0"
                          y="-14"
                          width={stat ? 90 : 75}
                          height="20"
                          rx="6"
                          fill="#08294B"
                          fillOpacity="0.85"
                          stroke={pinColor}
                          strokeWidth="1"
                        />
                        <text
                          x="6"
                          y="0"
                          fill="#FFFFFF" // Main Labels
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {c.flag} {c.nameAr}
                        </text>
                        {stat && (
                          <text
                            x="64"
                            y="0"
                            fill="#DCEAF6" // Secondary Labels
                            fontSize="10"
                            fontWeight="bold"
                          >
                            {stat.percentage}%
                          </text>
                        )}
                      </g>
                    </g>
                  );
                }
              )}
            </svg>

            {/* Interactive Floating Hover Tooltip */}
            {hoveredCountry && (
              <div
                className="absolute z-40 pointer-events-none bg-slate-900/95 text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs backdrop-blur-md transition-all duration-75"
                style={{
                  left: `${Math.min(Math.max(mousePos.x + 15, 10), 550)}px`,
                  top: `${Math.min(Math.max(mousePos.y - 60, 10), 340)}px`,
                }}
              >
                <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-slate-800">
                  <span className="text-base">{hoveredCountry.flag}</span>
                  <div>
                    <h5 className="font-bold text-white text-xs">{hoveredCountry.nameAr}</h5>
                    <p className="text-[10px] text-slate-400">{hoveredCountry.nameEn}</p>
                  </div>
                </div>

                {activeStat && activeStat.visits > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400 text-[11px]">عدد الزيارات:</span>
                      <span className="font-bold text-emerald-400">{activeStat.visits.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400 text-[11px]">نسبة التفاعل:</span>
                      <span className="font-bold text-[#53C6E8]">{activeStat.percentage}%</span>
                    </div>
                    {activeStat.city && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400 text-[11px]">المدن النشطة:</span>
                        <span className="text-slate-300 font-medium text-[10px] truncate max-w-[120px]">
                          {activeStat.city}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">لا توجد زيارات مسجلة لهذه الدولة حتى الآن</p>
                )}
              </div>
            )}

            {/* Bottom Map Legend & Palette Guide */}
            <div className="absolute bottom-3 right-3 left-3 flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-sm text-[11px] text-slate-300 pointer-events-auto">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#CC9048]" />
                  <strong className="text-white">تركيا</strong> (المركز الرئيسي)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#53C6E8]" />
                  <strong className="text-white">المغرب</strong> (بوابة إفريقيا)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#2679C6]" />
                  <span className="text-slate-300">دول الزوار</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#4076A1]" />
                  <span className="text-slate-400">باقي العالم</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">المحيطات: <code className="text-[#92B6D5]">#08294B</code></span>
                <span className="text-slate-500">|</span>
                <span className="text-emerald-400 font-bold">🟢 بيانات حقيقية 100%</span>
              </div>
            </div>
          </div>

          {/* Active Selected Country Card Details */}
          {selectedCountry && (
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between gap-3 text-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedCountry.flag}</span>
                <div>
                  <h4 className="font-bold text-[#0B2E57] text-sm">
                    {selectedCountry.nameAr} ({selectedCountry.nameEn})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {activeStat && activeStat.visits > 0
                      ? `سجلت ${activeStat.visits} زيارة (${activeStat.percentage}% من الإجمالي) — المدن: ${activeStat.city || '—'}`
                      : 'لم يتم رصد زيارات من هذه المنطقة في الفترة الحالية.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCountry(null)}
                className="px-3 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 font-bold hover:bg-blue-100 transition cursor-pointer"
              >
                إغلاق التحديد
              </button>
            </div>
          )}
        </div>

        {/* Live Ranking & Analytics Breakdown (Right Column) */}
        <div className="lg:col-span-4 bg-slate-50/70 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between h-[380px] sm:h-[440px]">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <h4 className="font-bold text-[#0B2E57] text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#004AA5]" />
                <span>ترتيب الدول حسب الزيارات</span>
              </h4>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100/70 text-[#004AA5]">
                {countries.length} دول مسجلة
              </span>
            </div>

            {/* List of Countries Ranked */}
            <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
              {countries.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Globe2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-600">في انتظار رصد الزوار</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    ستظهر هنا الدول بنسبتها الحقيقية فور دخول الزوار للموقع.
                  </p>
                </div>
              ) : (
                countries.map((c, idx) => {
                  const isTR = c.code === 'TR';
                  const isMA = c.code === 'MA';
                  const barColor = isTR ? 'bg-[#CC9048]' : isMA ? 'bg-[#53C6E8]' : 'bg-[#004AA5]';

                  return (
                    <div
                      key={c.code || idx}
                      onClick={() => {
                        const matched = WORLD_COUNTRIES.find((w) => w.code === c.code);
                        if (matched) handleSelectCountry(matched);
                      }}
                      className="p-2 rounded-xl bg-white border border-slate-200/80 hover:border-blue-400 transition cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                            #{idx + 1}
                          </span>
                          <span className="text-base">{c.flag}</span>
                          <span className="font-black text-[#0B2E57]">{c.name}</span>
                          {c.city && (
                            <span className="text-[10px] text-slate-400 font-normal truncate max-w-[100px]">
                              ({c.city})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-500 font-normal">{c.visits.toLocaleString()} زيارة</span>
                          <span className="font-black text-[#004AA5]">{c.percentage}%</span>
                        </div>
                      </div>

                      {/* Progress Bar with Color Highlight */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${Math.max(c.percentage, 3)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Info: Last Updated & Genuine Data Stamp */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>آخر تحديث: {lastUpdated || 'منذ لحظات'}</span>
            </span>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="text-[#004AA5] font-bold hover:underline cursor-pointer"
              >
                تحديث الآن
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
