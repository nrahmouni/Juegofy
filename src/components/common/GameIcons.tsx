import React from 'react';

/** Iconos SVG animados y chulos para los 10 juegos */

export const IconComePalabras = ({ size = 64 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
    <circle cx="64" cy="70" r="48" fill="#A855F7"/>
    <ellipse cx="48" cy="40" rx="14" ry="20" fill="#7C3AED" transform="rotate(-20 48 40)"/>
    <ellipse cx="80" cy="40" rx="14" ry="20" fill="#7C3AED" transform="rotate(20 80 40)"/>
    <circle cx="50" cy="68" r="10" fill="white"/>
    <circle cx="78" cy="68" r="10" fill="white"/>
    <circle cx="53" cy="65" r="4" fill="#1E1B4B"/>
    <circle cx="81" cy="65" r="4" fill="#1E1B4B"/>
    <ellipse cx="64" cy="88" rx="18" ry="12" fill="#1E1B4B"/>
    <ellipse cx="64" cy="92" rx="10" ry="6" fill="#F472B6"/>
    <circle cx="30" cy="90" r="12" fill="#F472B6"/>
    <circle cx="30" cy="90" r="6" fill="#FBBF24"/>
    <animateTransform attributeName="transform" type="translate" values="0 0; 0 -4; 0 0" dur="1.2s" repeatCount="indefinite"/>
  </svg>
);

export const IconTirachinas = ({ size = 64 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
    <path d="M40 90 Q64 30 88 90" stroke="#A16207" strokeWidth="12" fill="none" strokeLinecap="round"/>
    <path d="M48 50 Q64 70 80 50" stroke="#EC4899" strokeWidth="6" fill="none"/>
    <circle cx="64" cy="48" r="14" fill="#A855F7"/>
    <circle cx="64" cy="48" r="6" fill="#FBBF24"/>
    <path d="M70 40 L90 20 L95 30 L80 45 Z" fill="#F472B6"/>
    <circle cx="100" cy="25" r="4" fill="#FBBF24">
      <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite"/>
    </circle>
  </svg>
);

export const IconCohete = ({ size = 64 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
    <path d="M64 20 L80 70 L64 100 L48 70 Z" fill="#06B6D4"/>
    <circle cx="64" cy="55" r="12" fill="#E0F2FE"/>
    <circle cx="64" cy="55" r="6" fill="#0EA5E9"/>
    <path d="M48 70 L40 90 L56 80 Z" fill="#8B5CF6"/>
    <path d="M80 70 L88 90 L72 80 Z" fill="#8B5CF6"/>
    <path d="M58 100 L64 120 L70 100" fill="#F97316">
      <animate attributeName="d" values="M58 100 L64 120 L70 100; M56 100 L64 125 L72 100; M58 100 L64 120 L70 100" dur="0.4s" repeatCount="indefinite"/>
    </path>
  </svg>
);

export const IconEmpareja = ({ size = 64 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
    <rect x="16" y="30" width="44" height="60" rx="10" fill="#A855F7"/>
    <circle cx="38" cy="55" r="12" fill="#FBBF24"/>
    <circle cx="34" cy="52" r="3" fill="#1E1B4B"/>
    <circle cx="42" cy="52" r="3" fill="#1E1B4B"/>
    <path d="M32 62 Q38 68 44 62" stroke="#1E1B4B" strokeWidth="2" fill="none"/>
    <rect x="68" y="30" width="44" height="60" rx="10" fill="#FBBF24"/>
    <text x="90" y="68" textAnchor="middle" fill="#1E1B4B" fontSize="14" fontWeight="bold">Gato</text>
    <path d="M60 60 L68 60" stroke="#22C55E" strokeWidth="4" strokeLinecap="round">
      <animate attributeName="stroke-dasharray" values="0 20; 20 0" dur="1s" repeatCount="indefinite"/>
    </path>
  </svg>
);

export const IconBurbujas = ({ size = 64 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
    <circle cx="50" cy="70" r="28" fill="#2DD4BF" opacity="0.85"/>
    <circle cx="45" cy="62" r="8" fill="white" opacity="0.5"/>
    <text x="50" y="78" textAnchor="middle" fontSize="20">🐢</text>
    <circle cx="90" cy="50" r="20" fill="#A78BFA" opacity="0.85"/>
    <circle cx="85" cy="44" r="6" fill="white" opacity="0.5"/>
    <text x="90" y="56" textAnchor="middle" fontSize="14">🐙</text>
    <circle cx="80" cy="95" r="16" fill="#F472B6" opacity="0.85">
      <animate attributeName="cy" values="95;90;95" dur="1.5s" repeatCount="indefinite"/>
    </circle>
  </svg>
);

export const IconVestir = ({ size = 64 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
    <circle cx="64" cy="36" r="18" fill="#FDBA74"/>
    <circle cx="58" cy="34" r="2" fill="#1E1B4B"/>
    <circle cx="70" cy="34" r="2" fill="#1E1B4B"/>
    <path d="M58 42 Q64 46 70 42" stroke="#1E1B4B" strokeWidth="1.5" fill="none"/>
    <path d="M40 55 L64 48 L88 55 L80 95 L48 95 Z" fill="#EC4899"/>
    <rect x="48" y="95" width="12" height="18" rx="3" fill="#7C3AED"/>
    <rect x="68" y="95" width="12" height="18" rx="3" fill="#7C3AED"/>
    <path d="M30 50 Q40 40 50 55" fill="#A855F7"/>
  </svg>
);

export const IconSafari = ({ size = 64 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
    <circle cx="64" cy="70" r="30" fill="#FBBF24"/>
    <circle cx="54" cy="65" r="5" fill="#1E1B4B"/>
    <circle cx="74" cy="65" r="5" fill="#1E1B4B"/>
    <ellipse cx="64" cy="78" rx="8" ry="5" fill="#1E1B4B"/>
    <path d="M40 50 Q50 30 64 40 Q78 30 88 50" fill="#F59E0B"/>
    <rect x="20" y="90" width="40" height="25" rx="6" fill="#F97316"/>
    <circle cx="40" cy="102" r="10" fill="#0EA5E9"/>
  </svg>
);

export const IconTren = ({ size = 64 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
    <rect x="20" y="50" width="50" height="40" rx="8" fill="#EF4444"/>
    <rect x="70" y="55" width="35" height="30" rx="6" fill="#FBBF24"/>
    <circle cx="35" cy="95" r="10" fill="#1E1B4B"/>
    <circle cx="85" cy="95" r="10" fill="#1E1B4B"/>
    <rect x="30" y="58" width="16" height="12" rx="2" fill="#E0F2FE"/>
    <circle cx="45" cy="70" r="4" fill="#FBBF24"/>
    <path d="M20 70 L10 60 L10 80 Z" fill="#EF4444"/>
  </svg>
);

export const IconCocina = ({ size = 64 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
    <ellipse cx="64" cy="80" rx="36" ry="12" fill="#78716C"/>
    <path d="M30 80 Q30 40 64 40 Q98 40 98 80" fill="#F97316"/>
    <ellipse cx="64" cy="40" rx="20" ry="6" fill="#FB923C"/>
    <circle cx="50" cy="60" r="6" fill="#FBBF24"/>
    <circle cx="70" cy="55" r="5" fill="#EF4444"/>
    <circle cx="60" cy="70" r="4" fill="#22C55E"/>
    <path d="M90 30 Q100 20 110 35" stroke="#A3A3A3" strokeWidth="4" fill="none"/>
  </svg>
);

export const IconCarrera = ({ size = 64 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
    <circle cx="64" cy="40" r="16" fill="#FDBA74"/>
    <path d="M50 55 L64 50 L78 55 L74 90 L54 90 Z" fill="#22C55E"/>
    <path d="M54 90 L48 110" stroke="#1E1B4B" strokeWidth="5" strokeLinecap="round"/>
    <path d="M74 90 L80 110" stroke="#1E1B4B" strokeWidth="5" strokeLinecap="round"/>
    <path d="M40 70 L25 60" stroke="#22C55E" strokeWidth="6" strokeLinecap="round"/>
    <path d="M88 70 L105 55" stroke="#22C55E" strokeWidth="6" strokeLinecap="round"/>
    <circle cx="100" cy="40" r="8" fill="#FBBF24">
      <animate attributeName="cx" values="100;110;100" dur="0.6s" repeatCount="indefinite"/>
    </circle>
  </svg>
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
