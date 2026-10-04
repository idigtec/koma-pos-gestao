import React, { useState } from 'react';

interface ProductIllustrationProps {
  productName: string;
  sku?: string;
  imageUrl?: string;
  categoryId?: string;
  categoryName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ProductIllustration: React.FC<ProductIllustrationProps> = ({
  productName,
  sku = '',
  imageUrl,
  categoryId = '',
  categoryName = '',
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const nameLower = (productName || '').toLowerCase();
  const skuLower = (sku || '').toLowerCase();
  const catLower = (categoryName || '').toLowerCase();

  // Detect specific product type
  const is2M = nameLower.includes('2m') || skuLower.includes('2m');
  const isLaurentinaPreta = nameLower.includes('laurentina') && (nameLower.includes('preta') || skuLower.includes('preta'));
  const isLaurentinaClara = nameLower.includes('laurentina') && (nameLower.includes('clara') || !nameLower.includes('preta'));
  const isCervejaGeneric = (nameLower.includes('cerveja') || catLower.includes('cerveja')) && !is2M && !isLaurentinaPreta && !isLaurentinaClara;
  
  const isBurger = nameLower.includes('hambúrguer') || nameLower.includes('hamburguer') || nameLower.includes('burger') || catLower.includes('hambúrguer');
  const isPizza = nameLower.includes('pizza') || catLower.includes('pizza');
  const isBatata = nameLower.includes('batata') || nameLower.includes('fritas') || catLower.includes('acompanhamento');
  const isDonut = nameLower.includes('donut') || nameLower.includes('doce') || nameLower.includes('sobremesa');
  const isCafe = nameLower.includes('café') || nameLower.includes('cafe') || nameLower.includes('expresso');
  const isCoca = nameLower.includes('coca') || nameLower.includes('cola');
  const isFanta = nameLower.includes('fanta');
  const isAgua = nameLower.includes('água') || nameLower.includes('agua') || nameLower.includes('namaacha');
  const isCombo = nameLower.includes('combo') || catLower.includes('combo');

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  }[size];

  // If there's an image URL and it hasn't errored out, show image with fallback
  if (imageUrl && !imageError && imageUrl.trim().length > 5) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-slate-100 flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}>
        <img
          src={imageUrl}
          alt={productName}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
          loading="lazy"
        />
      </div>
    );
  }

  // --- SVG ILLUSTRATIONS ---

  // 1. Cerveja 2M (Lata de Moçambique)
  if (is2M) {
    return (
      <div className={`relative rounded-xl bg-gradient-to-b from-red-600 to-red-800 p-1 flex items-center justify-center shrink-0 shadow-inner overflow-hidden ${sizeClasses} ${className}`}>
        {/* Condensed droplets effect */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:6px_6px]" />
        
        {/* 2M Can vector design */}
        <svg viewBox="0 0 100 140" className="w-full h-full max-h-full drop-shadow-md">
          {/* Can top rim */}
          <ellipse cx="50" cy="18" rx="28" ry="8" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
          <ellipse cx="50" cy="17" rx="22" ry="5" fill="#E2E8F0" />
          {/* Can tab */}
          <ellipse cx="50" cy="17" rx="6" ry="2.5" fill="#64748B" />
          <circle cx="50" cy="17" r="1.5" fill="#334155" />

          {/* Can Body */}
          <path d="M 22 18 Q 20 22 20 30 L 20 120 Q 20 130 50 130 Q 80 130 80 120 L 80 30 Q 80 22 78 18 Z" fill="#DC2626" />
          {/* Can shading highlight */}
          <path d="M 24 25 L 32 25 L 32 125 L 24 122 Z" fill="#FFFFFF" opacity="0.25" />
          <path d="M 72 25 L 77 25 L 77 122 L 72 125 Z" fill="#000000" opacity="0.2" />

          {/* White Ribbon Band */}
          <path d="M 20 45 L 80 40 L 80 88 L 20 93 Z" fill="#FFFFFF" />
          <path d="M 20 48 L 80 43 L 80 46 L 20 51 Z" fill="#D97706" />
          <path d="M 20 84 L 80 79 L 80 82 L 20 87 Z" fill="#D97706" />

          {/* 2M Bold Typography */}
          <text x="50" y="74" textAnchor="middle" fill="#DC2626" fontWeight="900" fontSize="32" fontFamily="Impact, Arial Black, sans-serif" letterSpacing="-1">
            2M
          </text>
          <text x="50" y="83" textAnchor="middle" fill="#1E293B" fontWeight="bold" fontSize="5" letterSpacing="0.8" fontFamily="sans-serif">
            CERVEJA NACIONAL
          </text>

          {/* Gold Star / Badge */}
          <circle cx="50" cy="38" r="4.5" fill="#F59E0B" />
          <polygon points="50,34 51.5,37 54.5,37.5 52,39.5 53,42.5 50,40.5 47,42.5 48,39.5 45.5,37.5 48.5,37" fill="#FEF3C7" />

          {/* Bottom rim */}
          <ellipse cx="50" cy="120" rx="27" ry="6" fill="#94A3B8" opacity="0.7" />
          <ellipse cx="50" cy="122" rx="22" ry="4" fill="#CBD5E1" />
        </svg>

        <span className="absolute bottom-0.5 right-1 px-1 rounded text-[8px] font-black bg-yellow-400 text-red-950 uppercase tracking-tighter">
          2M
        </span>
      </div>
    );
  }

  // 2. Cerveja Laurentina Preta (Moçambique)
  if (isLaurentinaPreta) {
    return (
      <div className={`relative rounded-xl bg-gradient-to-b from-stone-900 to-black p-1 flex items-center justify-center shrink-0 shadow-inner overflow-hidden border border-amber-900/30 ${sizeClasses} ${className}`}>
        <svg viewBox="0 0 100 140" className="w-full h-full max-h-full drop-shadow-md">
          {/* Bottle neck & crown */}
          <rect x="42" y="10" width="16" height="6" rx="2" fill="#D97706" stroke="#92400E" strokeWidth="1" />
          <path d="M 44 16 L 44 32 Q 44 45 28 58 L 28 122 Q 28 128 50 128 Q 72 128 72 122 L 72 58 Q 56 45 56 32 L 56 16 Z" fill="#1C1917" stroke="#44403C" strokeWidth="1" />
          
          {/* Glass reflection */}
          <path d="M 32 60 Q 38 60 38 120 L 33 120 Z" fill="#FFFFFF" opacity="0.12" />

          {/* Laurentina Shield Label (Black & Gold) */}
          <rect x="33" y="66" width="34" height="42" rx="4" fill="#0A0A0A" stroke="#D97706" strokeWidth="1.5" />
          <rect x="35" y="68" width="30" height="38" rx="2" fill="none" stroke="#FBBF24" strokeWidth="0.8" opacity="0.8" />

          {/* Gold Wreath & Star */}
          <circle cx="50" cy="74" r="3.5" fill="#F59E0B" />
          <polygon points="50,71 51,73 53,73.5 51.5,75 52,77 50,75.8 48,77 48.5,75 47,73.5 49,73" fill="#FFFBEB" />

          {/* Text */}
          <text x="50" y="85" textAnchor="middle" fill="#F59E0B" fontWeight="900" fontSize="5.5" fontFamily="serif" letterSpacing="0.3">
            LAURENTINA
          </text>
          <text x="50" y="93" textAnchor="middle" fill="#FFFFFF" fontWeight="900" fontSize="6.5" fontFamily="sans-serif" letterSpacing="0.8">
            PRETA
          </text>
          <text x="50" y="99" textAnchor="middle" fill="#D97706" fontWeight="bold" fontSize="3.8" fontFamily="sans-serif">
            DESDE 1932
          </text>
        </svg>

        <span className="absolute bottom-0.5 right-1 px-1 rounded text-[8px] font-black bg-amber-500 text-stone-950 uppercase tracking-tighter">
          PRETA
        </span>
      </div>
    );
  }

  // 3. Cerveja Laurentina Clara
  if (isLaurentinaClara) {
    return (
      <div className={`relative rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 p-1 flex items-center justify-center shrink-0 shadow-inner overflow-hidden border border-amber-300 ${sizeClasses} ${className}`}>
        <svg viewBox="0 0 100 140" className="w-full h-full max-h-full drop-shadow-md">
          {/* Can top */}
          <ellipse cx="50" cy="18" rx="28" ry="8" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
          <ellipse cx="50" cy="17" rx="22" ry="5" fill="#E2E8F0" />
          <ellipse cx="50" cy="17" rx="6" ry="2.5" fill="#64748B" />

          {/* Can Body */}
          <path d="M 22 18 Q 20 22 20 30 L 20 120 Q 20 130 50 130 Q 80 130 80 120 L 80 30 Q 80 22 78 18 Z" fill="#F59E0B" />
          <path d="M 24 25 L 32 25 L 32 125 L 24 122 Z" fill="#FFFFFF" opacity="0.3" />

          {/* Green Ribbon */}
          <path d="M 20 46 L 80 42 L 80 88 L 20 92 Z" fill="#065F46" />
          <path d="M 20 48 L 80 44 L 80 46 L 20 50 Z" fill="#FBBF24" />
          <path d="M 20 86 L 80 82 L 80 84 L 20 88 Z" fill="#FBBF24" />

          {/* Laurentina Logo */}
          <text x="50" y="66" textAnchor="middle" fill="#FDE68A" fontWeight="900" fontSize="7.5" fontFamily="serif" letterSpacing="0.4">
            LAURENTINA
          </text>
          <text x="50" y="78" textAnchor="middle" fill="#FFFFFF" fontWeight="900" fontSize="9" fontFamily="sans-serif" letterSpacing="1">
            CLARA
          </text>
          <text x="50" y="85" textAnchor="middle" fill="#A7F3D0" fontWeight="bold" fontSize="4.5" fontFamily="sans-serif">
            CERVEJA PREMIUM
          </text>

          {/* Bottom */}
          <ellipse cx="50" cy="120" rx="27" ry="6" fill="#94A3B8" opacity="0.7" />
          <ellipse cx="50" cy="122" rx="22" ry="4" fill="#CBD5E1" />
        </svg>

        <span className="absolute bottom-0.5 right-1 px-1 rounded text-[8px] font-black bg-emerald-800 text-amber-200 uppercase tracking-tighter">
          CLARA
        </span>
      </div>
    );
  }

  // 4. Cerveja Genérica
  if (isCervejaGeneric) {
    return (
      <div className={`relative rounded-xl bg-gradient-to-b from-amber-500 to-amber-700 p-2 flex flex-col items-center justify-center shrink-0 ${sizeClasses} ${className}`}>
        <span className="text-3xl filter drop-shadow">🍺</span>
        <span className="text-[9px] font-black text-amber-100 uppercase tracking-tighter mt-1">Cerveja</span>
      </div>
    );
  }

  // 5. Hambúrguer KOMA
  if (isBurger) {
    return (
      <div className={`relative rounded-xl bg-gradient-to-b from-amber-100 to-orange-100 p-1 flex items-center justify-center shrink-0 border border-orange-200 ${sizeClasses} ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
          {/* Top Bun */}
          <path d="M 18 42 Q 50 10 82 42 Q 80 48 50 48 Q 20 48 18 42 Z" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
          {/* Sesame seeds */}
          <ellipse cx="38" cy="28" rx="2" ry="1.2" fill="#FEF3C7" transform="rotate(-15 38 28)" />
          <ellipse cx="52" cy="24" rx="2" ry="1.2" fill="#FEF3C7" />
          <ellipse cx="65" cy="30" rx="2" ry="1.2" fill="#FEF3C7" transform="rotate(20 65 30)" />
          <ellipse cx="46" cy="34" rx="2" ry="1.2" fill="#FEF3C7" transform="rotate(5 46 34)" />

          {/* Lettuce */}
          <path d="M 14 50 Q 24 45 32 50 Q 42 45 52 50 Q 62 45 72 50 Q 80 46 86 50 Q 82 56 14 56 Z" fill="#22C55E" />

          {/* Tomato */}
          <rect x="22" y="54" width="56" height="6" rx="3" fill="#EF4444" />

          {/* Cheese Melt */}
          <polygon points="18,60 82,60 76,68 62,64 50,71 36,63 24,69" fill="#FBBF24" />

          {/* Beef Patty */}
          <rect x="16" y="64" width="68" height="13" rx="6" fill="#78350F" stroke="#451A03" strokeWidth="1" />
          {/* Grill marks */}
          <line x1="30" y1="67" x2="36" y2="74" stroke="#451A03" strokeWidth="1.5" />
          <line x1="46" y1="67" x2="52" y2="74" stroke="#451A03" strokeWidth="1.5" />
          <line x1="62" y1="67" x2="68" y2="74" stroke="#451A03" strokeWidth="1.5" />

          {/* Bottom Bun */}
          <path d="M 20 78 Q 50 80 80 78 L 78 88 Q 50 94 22 88 Z" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  // 6. Pizza Artesanal
  if (isPizza) {
    return (
      <div className={`relative rounded-xl bg-gradient-to-b from-rose-50 to-amber-50 p-1 flex items-center justify-center shrink-0 border border-rose-200 ${sizeClasses} ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
          {/* Crust */}
          <path d="M 20 20 Q 50 8 80 20 L 50 90 Z" fill="#D97706" />
          {/* Cheese */}
          <path d="M 24 25 Q 50 16 76 25 L 50 82 Z" fill="#FBBF24" />
          {/* Pepperoni / Toppings */}
          <circle cx="44" cy="38" r="7" fill="#DC2626" />
          <circle cx="42" cy="36" r="2" fill="#B91C1C" />
          <circle cx="60" cy="46" r="6" fill="#DC2626" />
          <circle cx="50" cy="62" r="5" fill="#DC2626" />
          <circle cx="36" cy="52" r="4.5" fill="#15803D" />
          <circle cx="54" cy="32" r="3.5" fill="#15803D" />
        </svg>
      </div>
    );
  }

  // 7. Batatas Fritas KOMA
  if (isBatata) {
    return (
      <div className={`relative rounded-xl bg-gradient-to-b from-amber-50 to-orange-100 p-1 flex items-center justify-center shrink-0 border border-amber-200 ${sizeClasses} ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
          {/* Fries sticking out */}
          <rect x="28" y="14" width="7" height="42" rx="2" fill="#FBBF24" stroke="#D97706" strokeWidth="1" transform="rotate(-12 31 35)" />
          <rect x="42" y="10" width="8" height="46" rx="2" fill="#FCD34D" stroke="#D97706" strokeWidth="1" />
          <rect x="56" y="16" width="7" height="40" rx="2" fill="#FBBF24" stroke="#D97706" strokeWidth="1" transform="rotate(10 59 36)" />
          <rect x="35" y="18" width="7" height="38" rx="2" fill="#F59E0B" />
          <rect x="50" y="20" width="7" height="36" rx="2" fill="#F59E0B" />
          <rect x="66" y="22" width="6" height="34" rx="2" fill="#FCD34D" transform="rotate(18 69 39)" />

          {/* Red KOMA Sleeve */}
          <path d="M 22 48 L 78 48 L 70 92 Q 50 96 30 92 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
          {/* Yellow Emblem */}
          <circle cx="50" cy="70" r="10" fill="#FBBF24" />
          <text x="50" y="74" textAnchor="middle" fill="#7C2D12" fontWeight="900" fontSize="10" fontFamily="sans-serif">
            K
          </text>
        </svg>
      </div>
    );
  }

  // 8. Refrigerante Coca-Cola / Lata
  if (isCoca) {
    return (
      <div className={`relative rounded-xl bg-gradient-to-b from-red-600 to-red-800 p-1 flex items-center justify-center shrink-0 shadow-inner ${sizeClasses} ${className}`}>
        <svg viewBox="0 0 100 140" className="w-full h-full max-h-full drop-shadow-md">
          <ellipse cx="50" cy="18" rx="26" ry="7" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />
          <path d="M 24 18 L 24 120 Q 24 128 50 128 Q 76 128 76 120 L 76 18 Z" fill="#DC2626" />
          <path d="M 26 22 L 32 22 L 32 124 L 26 120 Z" fill="#FFFFFF" opacity="0.25" />
          {/* Wave */}
          <path d="M 24 68 Q 50 48 76 72 L 76 86 Q 50 62 24 82 Z" fill="#FFFFFF" />
          <text x="50" y="102" textAnchor="middle" fill="#FFFFFF" fontWeight="900" fontSize="10" fontFamily="serif" fontStyle="italic">
            Cola
          </text>
          <ellipse cx="50" cy="120" rx="25" ry="5" fill="#94A3B8" opacity="0.6" />
        </svg>
      </div>
    );
  }

  // 9. Fanta Laranja
  if (isFanta) {
    return (
      <div className={`relative rounded-xl bg-gradient-to-b from-orange-500 to-orange-700 p-1 flex items-center justify-center shrink-0 shadow-inner ${sizeClasses} ${className}`}>
        <svg viewBox="0 0 100 140" className="w-full h-full max-h-full drop-shadow-md">
          <ellipse cx="50" cy="18" rx="26" ry="7" fill="#CBD5E1" />
          <path d="M 24 18 L 24 120 Q 24 128 50 128 Q 76 128 76 120 L 76 18 Z" fill="#EA580C" />
          <circle cx="50" cy="70" r="18" fill="#1D4ED8" />
          <text x="50" y="74" textAnchor="middle" fill="#FFFFFF" fontWeight="900" fontSize="11" fontFamily="Impact, sans-serif">
            FANTA
          </text>
          <path d="M 50 50 Q 56 46 60 52 Z" fill="#16A34A" />
        </svg>
      </div>
    );
  }

  // 10. Água Mineral
  if (isAgua) {
    return (
      <div className={`relative rounded-xl bg-gradient-to-b from-sky-400 to-blue-600 p-1 flex items-center justify-center shrink-0 shadow-inner ${sizeClasses} ${className}`}>
        <svg viewBox="0 0 100 140" className="w-full h-full max-h-full drop-shadow-md">
          {/* Cap */}
          <rect x="44" y="12" width="12" height="8" rx="2" fill="#1D4ED8" />
          {/* Bottle */}
          <path d="M 46 20 L 46 34 Q 46 44 32 54 L 32 120 Q 32 126 50 126 Q 68 126 68 120 L 68 54 Q 54 44 54 34 L 54 20 Z" fill="#BAE6FD" opacity="0.9" />
          {/* Blue Label */}
          <rect x="32" y="70" width="36" height="24" rx="2" fill="#0284C7" />
          <text x="50" y="82" textAnchor="middle" fill="#FFFFFF" fontWeight="900" fontSize="6" fontFamily="sans-serif">
            ÁGUA
          </text>
          <text x="50" y="89" textAnchor="middle" fill="#E0F2FE" fontSize="4.5" fontFamily="sans-serif">
            Natural
          </text>
        </svg>
      </div>
    );
  }

  // 11. Donut KOMA
  if (isDonut) {
    return (
      <div className={`relative rounded-xl bg-gradient-to-b from-amber-50 to-orange-100 p-1 flex items-center justify-center shrink-0 border border-orange-200 ${sizeClasses} ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
          <circle cx="50" cy="50" r="38" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
          {/* Glaze */}
          <path d="M 50 16 C 68 16 80 28 80 46 C 76 52 70 48 64 54 C 58 60 62 68 54 72 C 46 76 40 70 34 76 C 26 80 20 70 20 54 C 20 34 32 16 50 16 Z" fill="#F43F5E" />
          {/* Donut hole */}
          <circle cx="50" cy="50" r="14" fill="#FFF7ED" stroke="#D97706" strokeWidth="2" />
          {/* Sprinkles */}
          <rect x="36" y="32" width="6" height="2.5" rx="1" fill="#FEF08A" transform="rotate(25 39 33)" />
          <rect x="62" y="34" width="6" height="2.5" rx="1" fill="#67E8F9" transform="rotate(-30 65 35)" />
          <rect x="34" y="60" width="6" height="2.5" rx="1" fill="#FFFFFF" transform="rotate(45 37 61)" />
          <rect x="64" y="58" width="6" height="2.5" rx="1" fill="#A7F3D0" transform="rotate(15 67 59)" />
        </svg>
      </div>
    );
  }

  // 12. Café
  if (isCafe) {
    return (
      <div className={`relative rounded-xl bg-gradient-to-b from-stone-100 to-amber-100 p-1 flex items-center justify-center shrink-0 border border-amber-300 ${sizeClasses} ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
          {/* Saucer */}
          <ellipse cx="50" cy="80" rx="34" ry="7" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
          {/* Cup */}
          <path d="M 28 40 L 34 72 Q 50 78 66 72 L 72 40 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
          {/* Handle */}
          <path d="M 70 46 Q 84 50 82 62 Q 80 70 66 68" fill="none" stroke="#CBD5E1" strokeWidth="3" />
          {/* Coffee Surface */}
          <ellipse cx="50" cy="40" rx="22" ry="5.5" fill="#451A03" />
          <ellipse cx="48" cy="39" rx="16" ry="3.5" fill="#78350F" />
          {/* Steam */}
          <path d="M 44 32 Q 41 24 45 16" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <path d="M 52 30 Q 56 22 51 14" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        </svg>
      </div>
    );
  }

  // 13. Combo KOMA
  if (isCombo) {
    return (
      <div className={`relative rounded-xl bg-gradient-to-b from-orange-500 to-red-600 p-2 flex flex-col items-center justify-center shrink-0 text-white shadow-md ${sizeClasses} ${className}`}>
        <span className="text-2xl filter drop-shadow">🔥🍔🥤</span>
        <span className="text-[9px] font-black uppercase tracking-tighter mt-1 bg-black/30 px-1.5 py-0.5 rounded">
          COMBO
        </span>
      </div>
    );
  }

  // Generic fallback with Category Icon
  return (
    <div className={`relative rounded-xl bg-gradient-to-b from-orange-50 to-amber-100 p-2 flex flex-col items-center justify-center shrink-0 border border-orange-200 text-orange-950 ${sizeClasses} ${className}`}>
      <span className="text-2xl">📦</span>
      <span className="text-[8px] font-bold uppercase tracking-tight text-slate-500 mt-0.5 truncate max-w-full text-center">
        {sku || 'KOMA'}
      </span>
    </div>
  );
};
