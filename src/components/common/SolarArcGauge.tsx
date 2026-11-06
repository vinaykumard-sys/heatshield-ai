import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sun, 
  Moon, 
  Sunrise, 
  Sunset, 
  Clock, 
  Sparkles, 
  Eye, 
  ArrowRight,
  Calendar,
  Compass
} from 'lucide-react';

export interface SolarArcGaugeProps {
  /**
   * Sunrise time string (e.g. "06:24 AM")
   */
  sunrise?: string;
  /**
   * Sunset time string (e.g. "05:15 PM")
   */
  sunset?: string;
  /**
   * Tomorrow's expected sunrise (e.g. "06:23 AM")
   */
  tomorrowSunrise?: string;
  /**
   * Tomorrow's expected sunset (e.g. "05:16 PM")
   */
  tomorrowSunset?: string;
  /**
   * Optional manual time override (e.g. "14:35:46" or Date object). If omitted, runs live clock.
   */
  customTime?: Date | string;
  /**
   * Custom title displayed above gauge. Default: "Celestial Solar Tracker"
   */
  title?: string;
  /**
   * Additional container CSS classes
   */
  className?: string;
  /**
   * Enable user-controllable Day / Night cycle preview toggle
   */
  showControls?: boolean;
}

// Convert "06:24 AM" or "05:15 PM" to minutes past midnight
function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 360; // fallback 6:00 AM
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// Format double digit
function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export const SolarArcGauge: React.FC<SolarArcGaugeProps> = ({
  sunrise = '06:24 AM',
  sunset = '05:15 PM',
  tomorrowSunrise = '06:23 AM',
  tomorrowSunset = '05:16 PM',
  customTime,
  title = 'Solar Celestial Tracker',
  className = '',
  showControls = true,
}) => {
  // Live clock state
  const [now, setNow] = useState<Date>(() => {
    if (customTime instanceof Date) return customTime;
    if (typeof customTime === 'string') return new Date(customTime);
    return new Date();
  });

  // Cycle simulation mode: 'auto' (live time), 'day-preview', 'night-preview'
  const [cycleMode, setCycleMode] = useState<'auto' | 'day' | 'night'>('auto');

  // Update clock every second when in auto mode
  useEffect(() => {
    if (customTime || cycleMode !== 'auto') return;
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [customTime, cycleMode]);

  // Current time in minutes past midnight
  const currentMinutes = useMemo(() => {
    if (cycleMode === 'day') return 14 * 60 + 35; // 2:35 PM (peak day)
    if (cycleMode === 'night') return 22 * 60 + 15; // 10:15 PM (night)
    return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  }, [now, cycleMode]);

  const sunriseMinutes = useMemo(() => parseTimeToMinutes(sunrise), [sunrise]);
  const sunsetMinutes = useMemo(() => parseTimeToMinutes(sunset), [sunset]);

  // Is daylight currently active?
  const isDaylight = currentMinutes >= sunriseMinutes && currentMinutes <= sunsetMinutes;
  const isNight = !isDaylight;

  // Daylight progress percentage (0.0 to 1.0)
  const daylightProgress = useMemo(() => {
    if (cycleMode === 'day') return 0.68; // matches reference 2:35 PM
    if (cycleMode === 'night') return 0.25;
    if (isDaylight) {
      const totalDayDuration = Math.max(1, sunsetMinutes - sunriseMinutes);
      const elapsed = Math.max(0, currentMinutes - sunriseMinutes);
      return Math.min(1, Math.max(0, elapsed / totalDayDuration));
    } else {
      // Night progress between sunset and sunrise
      let totalNightDuration = (1440 - sunsetMinutes) + sunriseMinutes;
      let elapsedNight = currentMinutes > sunsetMinutes 
        ? currentMinutes - sunsetMinutes 
        : (1440 - sunsetMinutes) + currentMinutes;
      return Math.min(1, Math.max(0, elapsedNight / Math.max(1, totalNightDuration)));
    }
  }, [currentMinutes, sunriseMinutes, sunsetMinutes, isDaylight, cycleMode]);

  // Remaining Daylight or Night calculation
  const remainingText = useMemo(() => {
    if (isDaylight) {
      const minutesLeft = Math.max(0, Math.round(sunsetMinutes - currentMinutes));
      const h = Math.floor(minutesLeft / 60);
      const m = minutesLeft % 60;
      return `${h}h ${m}m of daylight remaining`;
    } else {
      let minutesTillSunrise = currentMinutes < sunriseMinutes
        ? Math.round(sunriseMinutes - currentMinutes)
        : Math.round((1440 - currentMinutes) + sunriseMinutes);
      const h = Math.floor(minutesTillSunrise / 60);
      const m = minutesTillSunrise % 60;
      return `${h}h ${m}m until sunrise`;
    }
  }, [isDaylight, sunsetMinutes, sunriseMinutes, currentMinutes]);

  // Digital clock display string (HH:mm:ss)
  const digitalTimeStr = useMemo(() => {
    if (cycleMode === 'day') return '02:35:46';
    if (cycleMode === 'night') return '10:15:32';
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }, [now, cycleMode]);

  // Geometry calculations for semicircular gauge
  // Center: (160, 140), Radius: 105, Angle: 180 deg
  const cx = 160;
  const cy = 135;
  const r = 100;
  const arcLength = Math.PI * r; // ~314.159

  // Calculate sun/moon coordinates along the arc (from left to right)
  // angle goes from PI (left, sunrise) to 0 (right, sunset)
  const sunAngle = Math.PI - daylightProgress * Math.PI;
  const sunX = cx + r * Math.cos(sunAngle);
  const sunY = cy - r * Math.sin(sunAngle);

  // Dashoffset for progress stroke
  const strokeDashoffset = arcLength * (1 - daylightProgress);

  return (
    <div className={`bg-white rounded-card-lg border border-app-border p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${className}`}>
      {/* Top Header & Day/Night Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${isDaylight ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
            {isDaylight ? <Sun className="w-5 h-5 animate-spin-slow" /> : <Moon className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">{title}</h3>
            <p className="text-xs text-slate-500 font-medium">
              {isDaylight ? 'Solar Daylight Tracking' : 'Nocturnal Cooling Window'}
            </p>
          </div>
        </div>

        {/* Day / Night Simulation Toggle */}
        {showControls && (
          <div className="flex items-center bg-slate-100 p-0.5 rounded-full text-xs font-semibold">
            <button
              onClick={() => setCycleMode('auto')}
              className={`px-2.5 py-1 rounded-full transition-all ${
                cycleMode === 'auto'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Follow Live System Time"
            >
              Live
            </button>
            <button
              onClick={() => setCycleMode('day')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
                cycleMode === 'day'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Simulate Daytime Peak"
            >
              <Sun className="w-3 h-3" />
              Day
            </button>
            <button
              onClick={() => setCycleMode('night')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
                cycleMode === 'night'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Simulate Night Sky"
            >
              <Moon className="w-3 h-3" />
              Night
            </button>
          </div>
        )}
      </div>

      {/* Main Semicircular Celestial Gauge Container */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <svg
          viewBox="0 0 320 160"
          className="w-full max-w-[340px] overflow-visible"
        >
          <defs>
            {/* Background track gradient */}
            <linearGradient id="arcBgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="50%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>

            {/* Active daylight progress gradient (Golden sunrise -> Solar orange) */}
            <linearGradient id="daylightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>

            {/* Night progress gradient (Deep blue -> Purple) */}
            <linearGradient id="nightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#4338CA" />
            </linearGradient>

            {/* Sun orb radial glow */}
            <radialGradient id="sunOrbGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#FDE047" />
              <stop offset="80%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </radialGradient>

            {/* Moon orb radial glow */}
            <radialGradient id="moonOrbGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#C7D2FE" />
              <stop offset="100%" stopColor="#818CF8" />
            </radialGradient>

            {/* Drop shadow filters for realistic 3D depth */}
            <filter id="sunGlowFilter" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#F59E0B" floodOpacity="0.5" />
            </filter>
            <filter id="moonGlowFilter" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#6366F1" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Semicircular Horizon Base Guide Line */}
          <line
            x1="35"
            y1={cy}
            x2="285"
            y2={cy}
            stroke="#E2E8F0"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* 1. Inactive/Background Track (Semicircle Arc) */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="3"
            strokeDasharray="4 6"
            strokeLinecap="round"
          />

          {/* 2. Active Progress Arc with Rich Gradient */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={isDaylight ? 'url(#daylightGrad)' : 'url(#nightGrad)'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />

          {/* 3. Small Ray Ticks around the Apex for solar dial fidelity */}
          {[150, 120, 90, 60, 30].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x1 = cx + (r - 10) * Math.cos(rad);
            const y1 = cy - (r - 10) * Math.sin(rad);
            const x2 = cx + (r - 4) * Math.cos(rad);
            const y2 = cy - (r - 4) * Math.sin(rad);
            return (
              <line
                key={deg}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#94A3B8"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
            );
          })}

          {/* 4. Glowing Celestial Body (Sun or Moon) along the Arc */}
          <g
            transform={`translate(${sunX}, ${sunY})`}
            filter={isDaylight ? 'url(#sunGlowFilter)' : 'url(#moonGlowFilter)'}
            className="transition-transform duration-500 ease-out"
          >
            {/* Outer pulsating beacon ring */}
            <circle
              r="14"
              fill={isDaylight ? '#FEF08A' : '#C7D2FE'}
              opacity="0.3"
              className="animate-ping"
            />
            {/* Outer soft halo */}
            <circle
              r="12"
              fill={isDaylight ? '#FDE047' : '#A5B4FC'}
              opacity="0.6"
            />
            {/* Main celestial orb */}
            <circle
              r="8"
              fill={isDaylight ? 'url(#sunOrbGlow)' : 'url(#moonOrbGlow)'}
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            {/* Tiny center glint */}
            <circle r="2.5" fill="#FFFFFF" />
          </g>
        </svg>

        {/* Central High-Contrast Digital Time Display ("02:35:46") */}
        <div className="absolute top-[52px] flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
            {digitalTimeStr}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isDaylight ? 'bg-amber-500 animate-pulse' : 'bg-indigo-500 animate-pulse'
              }`}
            />
            <span className="text-xs font-semibold text-slate-600">
              {isDaylight ? `${Math.round(daylightProgress * 100)}% Daylight Elapsed` : 'Night Phase'}
            </span>
          </div>
        </div>

        {/* Sunrise & Sunset Anchors directly beneath arc base */}
        <div className="w-full flex items-center justify-between px-2 pt-1 mt-[-6px]">
          {/* Sunrise Pill */}
          <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200/60 px-3 py-1.5 rounded-xl shadow-2xs">
            <Sunrise className="w-4 h-4 text-amber-600" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Sunrise</span>
              <span className="text-xs font-bold text-slate-800 font-mono">{sunrise}</span>
            </div>
          </div>

          {/* Sunset Pill */}
          <div className="flex items-center gap-2 bg-orange-50/80 border border-orange-200/60 px-3 py-1.5 rounded-xl shadow-2xs">
            <Sunset className="w-4 h-4 text-orange-600" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-700">Sunset</span>
              <span className="text-xs font-bold text-slate-800 font-mono">{sunset}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Card: Remaining Daylight & Tomorrow's Sun Times */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">{remainingText}</span>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
            Peak UV: 11:30 AM – 3:30 PM
          </span>
        </div>

        {/* Tomorrow's Celestial Times */}
        <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 text-xs text-slate-600 border border-slate-100">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700">Tomorrow</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-amber-700 flex items-center gap-1">
              <Sunrise className="w-3 h-3 text-amber-500 inline" /> {tomorrowSunrise}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-orange-700 flex items-center gap-1">
              <Sunset className="w-3 h-3 text-orange-500 inline" /> {tomorrowSunset}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
