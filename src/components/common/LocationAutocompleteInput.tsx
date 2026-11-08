import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, Search, Loader2, X, AlertCircle } from 'lucide-react';
import { GeocodedPlace } from '../../types';
import { searchGeographicalLocations } from '../../lib/geocodingService';

interface LocationAutocompleteInputProps {
  label: string;
  value: string;
  placeholder?: string;
  iconType?: 'origin' | 'destination';
  onChange: (value: string) => void;
  onSelect: (place: GeocodedPlace) => void;
  onUseCurrentLocation?: () => void;
  isLocating?: boolean;
  disabled?: boolean;
  className?: string;
}

export const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({
  label,
  value,
  placeholder = 'Search locality, address, or city...',
  iconType = 'origin',
  onChange,
  onSelect,
  onUseCurrentLocation,
  isLocating = false,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodedPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback((query: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setError(null);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    debounceTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const results = await searchGeographicalLocations(trimmed, controller.signal);
        setSuggestions(results);
        setIsLoading(false);
        setIsOpen(true);
        setHighlightedIndex(-1);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Geocoding error:', err);
          setError('Unable to fetch locations. Please check connection or try another query.');
          setIsLoading(false);
          setIsOpen(true);
        }
      }
    }, 300);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    fetchSuggestions(val);
  };

  const handleSelectSuggestion = (place: GeocodedPlace) => {
    onChange(place.shortName || place.displayName);
    onSelect(place);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    setError(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetIndex = highlightedIndex >= 0 ? highlightedIndex : 0;
      if (suggestions[targetIndex]) {
        handleSelectSuggestion(suggestions[targetIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const isOrigin = iconType === 'origin';

  return (
    <div ref={containerRef} className={`relative flex-1 ${className}`}>
      <div 
        className={`flex items-center gap-2.5 bg-white border transition-all duration-200 rounded-xl px-3.5 py-2.5 shadow-xs ${
          isOpen ? 'border-[#1E60F2] ring-2 ring-[#1E60F2]/10' : 'border-[#E2E8F0] hover:border-slate-300'
        }`}
      >
        <div className="shrink-0">
          {isOrigin ? (
            <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block leading-none mb-1">
            {label}
          </label>
          <input
            ref={inputRef}
            type="text"
            value={value}
            disabled={disabled}
            onChange={handleInputChange}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
              else if (value.trim().length >= 2) fetchSuggestions(value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full text-xs font-semibold text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none bg-transparent truncate"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={isOpen}
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isLoading && (
            <Loader2 className="w-3.5 h-3.5 text-[#1E60F2] animate-spin" />
          )}

          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-[#94A3B8] hover:text-[#0F172A] rounded-md transition-colors"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {onUseCurrentLocation && (
            <button
              type="button"
              onClick={onUseCurrentLocation}
              disabled={isLocating || disabled}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1 ${
                isLocating
                  ? 'bg-blue-50 text-[#1E60F2] border-blue-200'
                  : 'bg-[#F8FAFC] hover:bg-blue-50 text-[#64748B] hover:text-[#1E60F2] border-[#E2E8F0]'
              }`}
              title="Use current GPS location"
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1E60F2]" />
              ) : (
                <Navigation className="w-3.5 h-3.5 text-[#1E60F2]" />
              )}
              <span className="hidden sm:inline text-[10px] font-semibold text-[#1E60F2]">Current</span>
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden z-[1100] max-h-72 overflow-y-auto">
          {isLoading && suggestions.length === 0 && (
            <div className="p-3 text-center text-xs text-[#64748B] flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1E60F2]" />
              <span>Searching locations across India...</span>
            </div>
          )}

          {error && (
            <div className="p-3 text-xs text-rose-600 bg-rose-50/50 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isLoading && !error && suggestions.length === 0 && value.trim().length >= 2 && (
            <div className="p-3.5 text-center text-xs text-[#64748B]">
              <Search className="w-4 h-4 text-[#94A3B8] mx-auto mb-1" />
              <p className="font-medium text-[#0F172A]">No matching locations found</p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">Try searching by street, locality, landmark or city</p>
            </div>
          )}

          {suggestions.length > 0 && (
            <ul className="py-1 divide-y divide-[#F1F5F9]">
              {suggestions.map((item, index) => {
                const isSelected = index === highlightedIndex;
                return (
                  <li
                    key={item.id}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelectSuggestion(item)}
                    className={`px-3.5 py-2.5 cursor-pointer transition-colors flex items-start gap-2.5 text-left ${
                      isSelected ? 'bg-blue-50/80' : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="mt-0.5 text-[#64748B] shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-[#1E60F2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#0F172A] truncate">
                          {item.shortName || item.displayName}
                        </span>
                        {item.type && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-[#F1F5F9] text-[#64748B] shrink-0">
                            {item.type}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                        {item.displayName}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
