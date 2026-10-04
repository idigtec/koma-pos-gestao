import React from 'react';

interface KomaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'horizontal' | 'icon';
  theme?: 'light' | 'dark';
  className?: string;
}

export const KomaLogo: React.FC<KomaLogoProps> = ({
  size = 'md',
  variant = 'full',
  theme = 'light',
  className = '',
}) => {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#1C1917';
  const subtextColor = isDark ? '#E2E8F0' : '#292524';
  const orange = '#FF6B00';
  const orangeDark = '#EA580C';
  const orangeGlow = '#FFA500';

  if (variant === 'icon') {
    const dim = size === 'sm' ? 32 : size === 'md' ? 42 : size === 'lg' ? 52 : 64;
    return (
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <rect width="64" height="64" rx="18" fill="url(#koma-orange-grad)" />
        <circle cx="32" cy="32" r="28" fill="#FF7800" opacity="0.4" />
        
        {/* Bitten 'O' */}
        <path
          d="M32 12C20.954 12 12 20.954 12 32C12 43.046 20.954 52 32 52C43.046 52 52 43.046 52 32C52 30.6 51.85 29.2 51.58 27.9C49.2 28.5 46.5 27.8 44.8 26C43.4 24.5 43 22.3 43.7 20.5C41.8 20.2 40.2 18.7 39.7 16.8C39.2 14.8 40.1 12.9 41.8 11.8C38.8 10.6 35.5 10 32 10V12Z"
          fill="#FFFFFF"
        />
        <circle cx="30" cy="32" r="9" fill={orange} />
        
        {/* Chef hat */}
        <path
          d="M45 16C43.5 16 42.5 14.5 43 13C43.5 11.8 44.8 11 46 11.2C46.8 10.1 48.2 9.5 49.5 9.8C50.8 10.2 51.6 11.3 51.8 12.6C52.9 12.9 53.8 14 53.5 15.3C53.3 16.4 52.3 17.2 51.2 17.2H45.8"
          fill="#FFF7ED"
          stroke="#1C1917"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Hat band */}
        <rect x="44.5" y="16.5" width="7.5" height="2.5" rx="1" fill="#FED7AA" stroke="#1C1917" strokeWidth="1" />

        {/* Crumbs */}
        <circle cx="46" cy="22" r="1.5" fill="#FFE8D6" />
        <circle cx="50" cy="26" r="1.2" fill="#FFE8D6" />

        <defs>
          <linearGradient id="koma-orange-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF7A00" />
            <stop offset="1" stopColor="#EA580C" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // Full and horizontal responsive logo matching the user's uploaded image
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Visual Icon Mark */}
      <div className="relative shrink-0">
        <svg
          width={size === 'sm' ? 36 : size === 'md' ? 46 : size === 'lg' ? 58 : 72}
          height={size === 'sm' ? 36 : size === 'md' ? 46 : size === 'lg' ? 58 : 72}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Orange Bitten Donut with highlights */}
          <circle cx="48" cy="52" r="38" fill={orange} />
          <circle cx="48" cy="52" r="38" fill="url(#koma-glow)" />

          {/* Golden crispy highlight */}
          <path
            d="M26 30C32 20 44 16 56 18C44 21 34 27 28 36L26 30Z"
            fill="#FBBF24"
            opacity="0.8"
          />

          {/* Inner Donut hole */}
          <circle cx="44" cy="54" r="16" fill={isDark ? '#0F172A' : '#FFFFFF'} />

          {/* Boy Chef Bite Profile */}
          {/* Head & Face */}
          <circle cx="70" cy="38" r="18" fill="#FFEDD5" stroke="#1C1917" strokeWidth="3" />
          
          {/* Brown Hair */}
          <path
            d="M58 32C58 26 64 21 72 21C78 21 84 25 86 31C87 34 85 36 82 35C80 34 78 31 74 31C70 31 66 33 64 35C62 37 60 37 58 32Z"
            fill="#78350F"
          />
          {/* Hair tuft */}
          <path d="M68 21C67 17 62 17 61 20C60 23 64 24 66 23" fill="#78350F" />

          {/* Chef Hat */}
          <path
            d="M74 19C72 15 74 10 79 10C83 10 86 13 87 17C89 16 92 18 92 21C92 24 89 26 86 26L75 26C73 26 73 22 74 19Z"
            fill="#FFFFFF"
            stroke="#1C1917"
            strokeWidth="2.5"
          />
          <rect x="74" y="23" width="13" height="4" rx="1.5" fill="#FED7AA" stroke="#1C1917" strokeWidth="1.8" />

          {/* Big happy bite mouth eating into the orange O */}
          <path
            d="M60 42C56 42 50 46 54 52C58 58 66 54 66 48C66 44 63 42 60 42Z"
            fill="#991B1B"
            stroke="#1C1917"
            strokeWidth="2.5"
          />
          {/* Little teeth */}
          <rect x="56" y="43" width="6" height="3" rx="1.5" fill="#FFFFFF" />

          {/* Happy closed eye */}
          <path d="M68 36C70 34 73 34 75 36" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Rosy blush cheek */}
          <circle cx="76" cy="42" r="3.5" fill="#F87171" opacity="0.6" />

          {/* Boy arm/hand holding the food */}
          <path
            d="M62 55C66 52 74 54 75 58C73 64 66 64 62 60"
            fill="#FFEDD5"
            stroke="#1C1917"
            strokeWidth="2.5"
          />

          {/* Crumbs flying */}
          <circle cx="56" cy="30" r="2.2" fill={orange} />
          <circle cx="60" cy="25" r="1.8" fill="#FBBF24" />
          <circle cx="52" cy="27" r="1.5" fill="#EA580C" />

          <defs>
            <radialGradient id="koma-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(38 42) rotate(45) scale(40)">
              <stop stopColor="#FFA000" stopOpacity="0.4" />
              <stop offset="1" stopColor="#FF6B00" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Typography: KOMA + FAST FOOD TAKEAWAY + FRESH • TASTY • HAPPY */}
      <div className="flex flex-col">
        <div className="flex items-baseline">
          <span
            className="font-black tracking-tight leading-none"
            style={{
              fontSize: size === 'sm' ? '1.25rem' : size === 'md' ? '1.65rem' : size === 'lg' ? '2.1rem' : '2.6rem',
              color: textColor,
              fontFamily: "'Inter', system-ui, sans-serif",
              letterSpacing: '-0.03em',
            }}
          >
            K<span style={{ color: orange }}>O</span>MA
          </span>
        </div>

        <div
          className="font-black uppercase tracking-wider leading-none mt-0.5"
          style={{
            fontSize: size === 'sm' ? '0.55rem' : size === 'md' ? '0.65rem' : size === 'lg' ? '0.78rem' : '0.9rem',
            color: subtextColor,
            letterSpacing: '0.12em',
          }}
        >
          Fast Food Takeaway
        </div>

        <div
          className="flex items-center gap-1.5 font-bold uppercase mt-1 leading-none text-slate-400"
          style={{
            fontSize: size === 'sm' ? '0.45rem' : size === 'md' ? '0.52rem' : size === 'lg' ? '0.62rem' : '0.7rem',
            letterSpacing: '0.14em',
          }}
        >
          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: orange }} />
          <span>Fresh</span>
          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: orange }} />
          <span>Tasty</span>
          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: orange }} />
          <span>Happy</span>
          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: orange }} />
        </div>
      </div>
    </div>
  );
};
