import React, { useState, useRef, useEffect } from 'react';
import { Plane, MapPin, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  WORLD_AIRPORTS,
  WorldAirport,
  formatAirportLabel,
  searchWorldAirports,
} from '../data/worldAirports';

interface AirportAutocompleteInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compactBox?: boolean;
}

export const AirportAutocompleteInput: React.FC<AirportAutocompleteInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  compactBox = true,
}) => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = searchWorldAirports(isOpen ? searchQuery : '');

  const handleSelectAirport = (airport: WorldAirport) => {
    const formatted = formatAirportLabel(airport, language);
    setSearchQuery(formatted);
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchQuery('');
    onChange('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const getCityName = (a: WorldAirport) => {
    if (language === 'tr') return a.cityTr;
    if (language === 'en') return a.cityEn;
    if (language === 'fr') return a.cityFr;
    return a.cityAr;
  };

  const getAirportName = (a: WorldAirport) => {
    if (language === 'tr') return a.nameTr;
    if (language === 'en') return a.nameEn;
    if (language === 'fr') return a.nameFr;
    return a.nameAr;
  };

  const getCountryName = (a: WorldAirport) => {
    if (language === 'tr') return a.countryTr;
    if (language === 'en') return a.countryEn;
    if (language === 'fr') return a.countryFr;
    return a.countryAr;
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`w-full h-[60px] flex flex-col justify-center rounded-xl border transition-all bg-white cursor-text ${
          isOpen
            ? 'border-[#004AA5] ring-2 ring-[#004AA5]/15 shadow-xs'
            : 'border-slate-300 hover:border-[#004AA5]/60'
        } ${compactBox ? 'px-3.5 py-2' : 'px-4 py-2.5'}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-bold text-slate-600 block select-none">
            {label}
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="w-6 h-6 min-w-[24px] min-h-[24px] rounded-full bg-slate-800 hover:bg-slate-950 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label={t('مسح')}
              title={t('مسح')}
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder || t('ابحث عن مدينة أو مطار أو رمز IATA...')}
          className="w-full bg-transparent text-xs sm:text-sm font-bold text-[#0B2E57] placeholder:text-slate-400 placeholder:font-normal outline-none truncate mt-0.5"
        />
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-[#D7E7F7] shadow-[0_16px_40px_rgba(18,85,154,0.16)] max-h-72 overflow-y-auto divide-y divide-slate-100 animate-fade-in">
          <div className="px-3.5 py-2 bg-[#eaf4ff]/60 text-[11px] font-bold text-[#0B2E57] flex items-center justify-between">
            <span>{t('قائمة مطارات العالم')}</span>
            <span className="text-[#5E7086] font-medium">{WORLD_AIRPORTS.length}+ {t('مطار دولي')}</span>
          </div>

          {results.length > 0 ? (
            results.map((airport) => (
              <button
                key={`${airport.code}-${airport.nameEn}`}
                type="button"
                onClick={() => handleSelectAirport(airport)}
                className="w-full px-3.5 py-2.5 text-start hover:bg-[#eaf4ff]/70 transition-colors flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      airport.isAllAirports
                        ? 'bg-[#CC9048]/15 text-[#CC9048]'
                        : 'bg-[#eaf4ff] text-[#004AA5]'
                    }`}
                  >
                    {airport.isAllAirports ? (
                      <MapPin className="w-3.5 h-3.5" />
                    ) : (
                      <Plane className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[#0B2E57] truncate">
                      {getCityName(airport)}{' '}
                      <span className="font-normal text-[#5E7086]">({getAirportName(airport)})</span>
                    </div>
                    <div className="text-[11px] text-[#5E7086] truncate">
                      {getCountryName(airport)}
                    </div>
                  </div>
                </div>

                <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-[#0B2E57] shrink-0">
                  {airport.code}
                </span>
              </button>
            ))
          ) : (
            <div className="p-3.5 text-xs text-slate-500 text-center">
              {t('يمكنك كتابة اسم أي مطار أو مدينة مباشرة وسيتم تضمينها في طلبك.')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
