import React from 'react';

export type Weather3DCondition = 
  | 'sunny' 
  | 'extreme_heat' 
  | 'partly_cloudy' 
  | 'heat_wave' 
  | 'thunderstorm' 
  | 'night_clear' 
  | 'hazy_heat'
  | 'rainy';

export type Weather3DSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;

export interface Weather3DIconProps {
  /**
   * Weather condition key or condition string
   */
  condition: Weather3DCondition | string;
  /**
   * Size presets ('sm': 32px, 'md': 48px, 'lg': 64px, 'xl': 96px, '2xl': 128px) or numeric pixel size
   */
  size?: Weather3DSize;
  /**
   * Subtle floating / breathing animation. Default: true
   */
  animated?: boolean;
  /**
   * Hover scale effect. Default: true
   */
  interactive?: boolean;
  /**
   * Additional container CSS classes
   */
  className?: string;
}

// Convert preset to pixel dimensions
function getPixelSize(size: Weather3DSize): number {
  if (typeof size === 'number') return size;
  switch (size) {
    case 'sm': return 32;
    case 'md': return 48;
    case 'lg': return 64;
    case 'xl': return 96;
    case '2xl': return 128;
    default: return 64;
  }
}

// Normalize free-form string to known condition
export function normalizeWeatherCondition(raw: string): Weather3DCondition {
  const s = (raw || '').toLowerCase().trim();
  if (s.includes('wave') || s.includes('flame') || s.includes('extreme heat') || s.includes('blistering')) {
    return 'heat_wave';
  }
  if (s.includes('thunder') || s.includes('storm') || s.includes('lightning')) {
    return 'thunderstorm';
  }
  if (s.includes('partly') || s.includes('cloud') || s.includes('overcast')) {
    return 'partly_cloudy';
  }
  if (s.includes('rain') || s.includes('shower') || s.includes('drizzle')) {
    return 'rainy';
  }
  if (s.includes('night') || s.includes('moon') || s.includes('clear night')) {
    return 'night_clear';
  }
  if (s.includes('haze') || s.includes('hazy') || s.includes('dust') || s.includes('smoke') || s.includes('mist')) {
    return 'hazy_heat';
  }
  if (s.includes('sun') || s.includes('clear') || s.includes('hot') || s.includes('fair')) {
    return 'sunny';
  }
  return 'sunny';
}

export const Weather3DIcon: React.FC<Weather3DIconProps> = ({
  condition,
  size = 'lg',
  animated = true,
  interactive = true,
  className = '',
}) => {
  const px = getPixelSize(size);
  const normalized = normalizeWeatherCondition(condition);

  // Render SVG based on condition
  const renderIconContent = () => {
    switch (normalized) {
      // 1. SUNNY / EXTREME HEAT (Glossy 3D golden sphere with 3D rounded ray droplets)
      case 'sunny':
      case 'extreme_heat':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <radialGradient id="sun3dBody" cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="25%" stopColor="#FCD34D" />
                <stop offset="65%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </radialGradient>
              <radialGradient id="sunRayGrad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="60%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EA580C" />
              </radialGradient>
              <filter id="sun3dShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#D97706" floodOpacity="0.35" />
              </filter>
            </defs>

            {/* Ambient Corona Halo */}
            <circle cx="50" cy="50" r="42" fill="#FDE68A" opacity="0.35" className={animated ? "animate-pulse" : ""} />

            {/* 3D Pill Rays radiating in 8 directions */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50)`}>
                <rect
                  x="46"
                  y="6"
                  width="8"
                  height="14"
                  rx="4"
                  fill="url(#sunRayGrad)"
                  filter="url(#sun3dShadow)"
                />
                {/* Ray glossy highlight */}
                <circle cx="50" cy="10" r="2" fill="#FFFFFF" opacity="0.8" />
              </g>
            ))}

            {/* Main 3D Spherical Sun Body */}
            <circle
              cx="50"
              cy="50"
              r="26"
              fill="url(#sun3dBody)"
              filter="url(#sun3dShadow)"
            />

            {/* Clay / Glossy Specular Crescent Highlight */}
            <ellipse cx="42" cy="40" rx="9" ry="6" fill="#FFFFFF" opacity="0.65" transform="rotate(-25 42 40)" />
            <circle cx="38" cy="36" r="3" fill="#FFFFFF" opacity="0.9" />
          </svg>
        );

      // 2. PARTLY CLOUDY (Glossy puffy volumetric white cloud overlapping 3D glowing sun)
      case 'partly_cloudy':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <radialGradient id="sunBehindGrad" cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="60%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EA580C" />
              </radialGradient>
              <linearGradient id="cloudBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="65%" stopColor="#F1F5F9" />
                <stop offset="100%" stopColor="#CBD5E1" />
              </linearGradient>
              <linearGradient id="cloudTopHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
              <filter id="cloudShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#64748B" floodOpacity="0.25" />
              </filter>
              <filter id="sunBehindShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#F59E0B" floodOpacity="0.4" />
              </filter>
            </defs>

            {/* Sun in background (Top Right) */}
            <g transform="translate(18, -6)">
              <circle cx="50" cy="40" r="19" fill="url(#sunBehindGrad)" filter="url(#sunBehindShadow)" />
              {/* Sun highlight */}
              <ellipse cx="44" cy="33" rx="6" ry="4" fill="#FFFFFF" opacity="0.7" transform="rotate(-20 44 33)" />
              {/* Short rays */}
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <rect
                  key={deg}
                  x="48"
                  y="14"
                  width="4"
                  height="6"
                  rx="2"
                  fill="#FBBF24"
                  transform={`rotate(${deg} 50 40)`}
                />
              ))}
            </g>

            {/* Foreground 3D Puffy Cloud (Layered overlapping circles with smooth base) */}
            <g filter="url(#cloudShadow)">
              {/* Main merged cloud shape */}
              <path
                d="M 24 72 
                   L 74 72 
                   A 14 14 0 0 0 74 44 
                   A 18 18 0 0 0 46 36 
                   A 15 15 0 0 0 24 50 
                   A 13 13 0 0 0 24 72 Z"
                fill="url(#cloudBodyGrad)"
              />
              {/* 3D Volumetric bulb caps for clay depth */}
              <circle cx="50" cy="46" r="16" fill="url(#cloudTopHighlight)" />
              <circle cx="34" cy="56" r="12" fill="url(#cloudTopHighlight)" />
              <circle cx="70" cy="58" r="11" fill="url(#cloudTopHighlight)" />
              
              {/* Specular gloss glints on cloud peaks */}
              <ellipse cx="48" cy="38" rx="8" ry="4" fill="#FFFFFF" opacity="0.85" />
              <circle cx="32" cy="50" r="3" fill="#FFFFFF" opacity="0.8" />
            </g>
          </svg>
        );

      // 3. HEAT WAVE / FLAME (3D glossy thermal fire with plasma core and shimmer rays)
      case 'heat_wave':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="flameOuterGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#DC2626" />
                <stop offset="45%" stopColor="#EA580C" />
                <stop offset="85%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#FBBF24" />
              </linearGradient>
              <linearGradient id="flameInnerGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#EA580C" />
                <stop offset="40%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#FFFBEB" />
              </linearGradient>
              <filter id="flameGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#EA580C" floodOpacity="0.45" />
              </filter>
            </defs>

            {/* Thermal Convection Wavy Lines behind */}
            <path
              d="M 16 35 Q 22 25 16 15 Q 10 5 16 -2"
              fill="none"
              stroke="#F97316"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.4"
            />
            <path
              d="M 84 35 Q 90 25 84 15 Q 78 5 84 -2"
              fill="none"
              stroke="#EA580C"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.4"
            />

            {/* Outer 3D Flame Bulb */}
            <path
              d="M 50 10 
                 C 58 26, 78 45, 78 66 
                 C 78 82, 65 92, 50 92 
                 C 35 92, 22 82, 22 66 
                 C 22 45, 42 26, 50 10 Z"
              fill="url(#flameOuterGrad)"
              filter="url(#flameGlow)"
            />

            {/* Inner Blazing 3D Core */}
            <path
              d="M 50 36 
                 C 55 48, 66 60, 66 72 
                 C 66 82, 58 87, 50 87 
                 C 42 87, 34 82, 34 72 
                 C 34 60, 45 48, 50 36 Z"
              fill="url(#flameInnerGrad)"
            />

            {/* Glossy High-Intensity Specular Sheen */}
            <ellipse cx="40" cy="55" rx="5" ry="12" fill="#FFFFFF" opacity="0.6" transform="rotate(-15 40 55)" />
            <circle cx="38" cy="46" r="3" fill="#FFFFFF" opacity="0.85" />
            <circle cx="50" cy="76" r="4" fill="#FFFFFF" opacity="0.75" />
          </svg>
        );

      // 4. THUNDERSTORM (Volumetric slate storm cloud + 3D glossy neon bolt)
      case 'thunderstorm':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="stormCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="60%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>
              <linearGradient id="lightning3dGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="40%" stopColor="#FACC15" />
                <stop offset="100%" stopColor="#EAB308" />
              </linearGradient>
              <filter id="stormShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#0F172A" floodOpacity="0.35" />
              </filter>
              <filter id="boltGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#FACC15" floodOpacity="0.65" />
              </filter>
            </defs>

            {/* Dark Storm Cloud */}
            <g filter="url(#stormShadow)">
              <path
                d="M 22 58 
                   L 76 58 
                   A 15 15 0 0 0 76 28 
                   A 20 20 0 0 0 46 20 
                   A 16 16 0 0 0 22 36 
                   A 14 14 0 0 0 22 58 Z"
                fill="url(#stormCloudGrad)"
              />
              {/* Subtle top rim light on cloud */}
              <ellipse cx="48" cy="22" rx="10" ry="3" fill="#94A3B8" opacity="0.4" />
            </g>

            {/* Sharp Glossy 3D Lightning Bolt */}
            <polygon
              points="52,44 40,64 50,64 44,92 64,60 54,60"
              fill="url(#lightning3dGrad)"
              filter="url(#boltGlow)"
              stroke="#FEF08A"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Specular glint on upper bolt corner */}
            <circle cx="50" cy="54" r="2.5" fill="#FFFFFF" />
          </svg>
        );

      // 5. NIGHT CLEAR (Glossy crescent moon + celestial 3D star diamonds)
      case 'night_clear':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="moonGrad" x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="35%" stopColor="#E0E7FF" />
                <stop offset="70%" stopColor="#C7D2FE" />
                <stop offset="100%" stopColor="#818CF8" />
              </linearGradient>
              <filter id="moonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#6366F1" floodOpacity="0.4" />
              </filter>
            </defs>

            {/* Main 3D Glossy Crescent Moon */}
            <path
              d="M 52 14 
                 C 32 14, 18 30, 18 50 
                 C 18 70, 34 86, 54 86 
                 C 66 86, 76 80, 82 72 
                 C 62 74, 44 60, 44 42 
                 C 44 28, 52 18, 62 14 
                 C 58 14, 55 14, 52 14 Z"
              fill="url(#moonGrad)"
              filter="url(#moonGlow)"
            />

            {/* Subtle Moon Crater indentation */}
            <circle cx="34" cy="52" r="4.5" fill="#A5B4FC" opacity="0.4" />
            <circle cx="42" cy="68" r="3" fill="#A5B4FC" opacity="0.35" />

            {/* Specular moon rim highlight */}
            <path
              d="M 50 17 C 34 19, 22 33, 22 50 C 22 62, 28 72, 36 78"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.75"
            />

            {/* Twinkling 3D Star Diamonds */}
            <g transform="translate(68, 26)">
              <polygon points="6,0 8,5 13,6 8,8 6,13 5,8 0,6 5,5" fill="#FEF08A" />
              <circle cx="6" cy="6" r="1.5" fill="#FFFFFF" />
            </g>
            <g transform="translate(74, 54)">
              <polygon points="4,0 5,3 8,4 5,5 4,8 3,5 0,4 3,3" fill="#E0E7FF" />
            </g>
          </svg>
        );

      // 6. HAZY HEAT / DUST (Warm amber cloud + thermal dust wave)
      case 'hazy_heat':
      default:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="hazySunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FED7AA" />
                <stop offset="50%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
            </defs>
            {/* Diffuse warm sun */}
            <circle cx="50" cy="44" r="24" fill="url(#hazySunGrad)" opacity="0.85" />
            <ellipse cx="44" cy="38" rx="8" ry="5" fill="#FFFFFF" opacity="0.5" transform="rotate(-20 44 38)" />

            {/* Horizontal Haze Layers */}
            <path
              d="M 14 62 Q 50 56 86 62"
              fill="none"
              stroke="#EA580C"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M 22 72 Q 50 67 78 72"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path
              d="M 30 82 Q 50 78 70 82"
              fill="none"
              stroke="#FBBF24"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>
        );
    }
  };

  return (
    <div
      style={{ width: `${px}px`, height: `${px}px` }}
      className={`relative inline-flex items-center justify-center select-none ${
        interactive ? 'transition-transform duration-300 hover:scale-110 cursor-pointer' : ''
      } ${animated ? 'animate-float' : ''} ${className}`}
      title={condition}
    >
      {renderIconContent()}
    </div>
  );
};
