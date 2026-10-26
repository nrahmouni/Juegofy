import React from 'react';

const SvgWrap = ({ children, size = 56 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
    {children}
  </svg>
);

export const IconComePalabras = ({ size = 56 }: { size?: number }) => (
  <SvgWrap size={size}>
    <defs>
      <linearGradient id="monGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#C084FC"/>
        <stop offset="100%" stopColor="#7C3AED"/>
      </linearGradient>
    </defs>
    <circle cx="64" cy="72" r="46" fill="url(#monGrad)"/>
    <ellipse cx="42" cy="38" rx="13" ry="20" fill="#6D28D9" transform="rotate(-18 42 38)"/>
    <ellipse cx="86" cy="38" rx="13" ry="20" fill="#6D28D9" transform="rotate(18 86 38)"/>
    <circle cx="48" cy="68" r="11" fill="white"/>
    <circle cx="80" cy="68" r="11" fill="white"/>
    <circle cx="51" cy="65" r="4.5" fill="#1E1B4B"/>
    <circle cx="83" cy="65" r="4.5" fill="#1E1B4B"/>
    <ellipse cx="64" cy="92" rx="20" ry="13" fill="#1E1B4B"/>
    <ellipse cx="64" cy="96" rx="11" ry="6" fill="#F472B6"/>
    <circle cx="28" cy="95" r="13" fill="#F472B6"/>
    <circle cx="28" cy="95" r="6" fill="#FBBF24"/>
  </SvgWrap>
);

export const IconTirachinas = ({ size = 56 }: { size?: number }) => (
  <SvgWrap size={size}>
    <path d="M36 95 Q64 25 92 95" stroke="#92400E" strokeWidth="14" fill="none" strokeLinecap="round"/>
    <path d="M48 52 Q64 78 80 52" stroke="#EC4899" strokeWidth="7" fill="none"/>
    <circle cx="64" cy="48" r="16" fill="#A855F7"/>
    <circle cx="64" cy="48" r="7" fill="#FBBF24"/>
    <path d="M72 38 L98 18 L102 30 L82 48 Z" fill="#F472B6"/>
  </SvgWrap>
);

export const IconCohete = ({ size = 56 }: { size?: number }) => (
  <SvgWrap size={size}>
    <defs>
      <linearGradient id="rockGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#22D3EE"/>
        <stop offset="100%" stopColor="#0284C7"/>
      </linearGradient>
    </defs>
    <path d="M64 14 L84 72 L64 110 L44 72 Z" fill="url(#rockGrad)"/>
    <circle cx="64" cy="56" r="14" fill="#E0F2FE"/>
    <circle cx="64" cy="56" r="7" fill="#0EA5E9"/>
    <path d="M44 72 L32 98 L54 86 Z" fill="#8B5CF6"/>
    <path d="M84 72 L96 98 L74 86 Z" fill="#8B5CF6"/>
    <path d="M56 110 L64 126 L72 110" fill="#F97316"/>
  </SvgWrap>
);

export const IconEmpareja = ({ size = 56 }: { size?: number }) => (
  <SvgWrap size={size}>
    <rect x="12" y="28" width="46" height="64" rx="12" fill="#A855F7"/>
    <circle cx="35" cy="54" r="13" fill="#FBBF24"/>
    <circle cx="31" cy="51" r="3" fill="#1E1B4B"/>
    <circle cx="39" cy="51" r="3" fill="#1E1B4B"/>
    <path d="M29 61 Q35 67 41 61" stroke="#1E1B4B" strokeWidth="2.5" fill="none"/>
    <rect x="70" y="28" width="46" height="64" rx="12" fill="#FBBF24"/>
    <text x="93" y="68" textAnchor="middle" fill="#1E1B4B" fontSize="16" fontWeight="800">Aa</text>
  </SvgWrap>
);

export const IconBurbujas = ({ size = 56 }: { size?: number }) => (
  <SvgWrap size={size}>
    <circle cx="48" cy="72" r="30" fill="#2DD4BF" opacity="0.9"/>
    <circle cx="42" cy="63" r="9" fill="white" opacity="0.45"/>
    <circle cx="88" cy="48" r="22" fill="#A78BFA" opacity="0.9"/>
    <circle cx="83" cy="42" r="7" fill="white" opacity="0.45"/>
    <circle cx="78" cy="98" r="17" fill="#F472B6" opacity="0.9"/>
  </SvgWrap>
);

export const IconVestir = ({ size = 56 }: { size?: number }) => (
  <SvgWrap size={size}>
    <circle cx="64" cy="34" r="18" fill="#FDBA74"/>
    <circle cx="58" cy="32" r="2.5" fill="#1E1B4B"/>
    <circle cx="70" cy="32" r="2.5" fill="#1E1B4B"/>
    <path d="M58 40 Q64 45 70 40" stroke="#1E1B4B" strokeWidth="2" fill="none"/>
    <path d="M38 52 L64 44 L90 52 L82 100 L46 100 Z" fill="#EC4899"/>
    <rect x="48" y="100" width="13" height="18" rx="4" fill="#7C3AED"/>
    <rect x="67" y="100" width="13" height="18" rx="4" fill="#7C3AED"/>
  </SvgWrap>
);

export const IconSafari = ({ size = 56 }: { size?: number }) => (
  <SvgWrap size={size}>
    <circle cx="64" cy="68" r="32" fill="#FBBF24"/>
    <circle cx="52" cy="62" r="6" fill="#1E1B4B"/>
    <circle cx="76" cy="62" r="6" fill="#1E1B4B"/>
    <ellipse cx="64" cy="78" rx="9" ry="6" fill="#1E1B4B"/>
    <path d="M38 48 Q52 28 64 40 Q76 28 90 48" fill="#F59E0B"/>
    <rect x="18" y="92" width="42" height="26" rx="7" fill="#F97316"/>
    <circle cx="39" cy="105" r="11" fill="#0EA5E9"/>
  </SvgWrap>
);

export const IconTren = ({ size = 56 }: { size?: number }) => (
  <SvgWrap size={size}>
    <rect x="16" y="48" width="52" height="42" rx="10" fill="#EF4444"/>
    <rect x="68" y="54" width="38" height="32" rx="8" fill="#FBBF24"/>
    <circle cx="34" cy="98" r="11" fill="#1E1B4B"/>
    <circle cx="88" cy="98" r="11" fill="#1E1B4B"/>
    <rect x="28" y="56" width="18" height="14" rx="3" fill="#E0F2FE"/>
    <path d="M16 70 L6 58 L6 82 Z" fill="#EF4444"/>
  </SvgWrap>
);

export const IconCocina = ({ size = 56 }: { size?: number }) => (
  <SvgWrap size={size}>
    <ellipse cx="64" cy="84" rx="38" ry="13" fill="#78716C"/>
    <path d="M28 84 Q28 38 64 38 Q100 38 100 84" fill="#F97316"/>
    <ellipse cx="64" cy="38" rx="22" ry="7" fill="#FB923C"/>
    <circle cx="48" cy="60" r="7" fill="#FBBF24"/>
    <circle cx="72" cy="54" r="6" fill="#EF4444"/>
    <circle cx="60" cy="72" r="5" fill="#22C55E"/>
  </SvgWrap>
);

export const IconCarrera = ({ size = 56 }: { size?: number }) => (
  <SvgWrap size={size}>
    <circle cx="64" cy="36" r="16" fill="#FDBA74"/>
    <path d="M48 52 L64 46 L80 52 L76 92 L52 92 Z" fill="#22C55E"/>
    <path d="M52 92 L46 114" stroke="#1E1B4B" strokeWidth="6" strokeLinecap="round"/>
    <path d="M76 92 L82 114" stroke="#1E1B4B" strokeWidth="6" strokeLinecap="round"/>
    <path d="M38 70 L22 58" stroke="#22C55E" strokeWidth="7" strokeLinecap="round"/>
    <path d="M90 70 L108 54" stroke="#22C55E" strokeWidth="7" strokeLinecap="round"/>
    <circle cx="102" cy="36" r="9" fill="#FBBF24"/>
  </SvgWrap>
);

export const GAME_ICONS: Record<string, React.FC<{ size?: number }>> = {
  monster_feeder: IconComePalabras,
  slingshot_magic: IconTirachinas,
  rocket_race: IconCohete,
  drag_match: IconEmpareja,
  bubble_pop: IconBurbujas,
  dress_up: IconVestir,
  safari_photo: IconSafari,
  sentence_train: IconTren,
  crazy_kitchen: IconCocina,
  word_dash: IconCarrera,
};
