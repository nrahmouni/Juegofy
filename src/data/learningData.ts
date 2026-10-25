export interface LearningItem {
  id: string;
  emoji: string;
  es: string;
  targetText: string;
  subText?: string;
  audioText: string;
  audioLang: 'es-ES' | 'ar-SA' | 'nl-BE' | 'nl-NL' | 'fr-FR' | 'en-US';
  level: number; // Difficulty level 1-8 (1-5 words, 6-8 phrases & sentences)
  category?: string;
  isPhrase?: boolean;
}

export const MAX_GAME_LEVEL = 8;

export interface GameModeConfig {
  id:
    | 'lang_spanish_abc'
    | 'lang_flemish'
    | 'lang_spanish_words'
    | 'lang_arabic'
    | 'lang_french'
    | 'safari_adventure'
    | 'monster_feeder'
    | 'rocket_race'
    | 'slingshot_magic'
    | 'crazy_catcher';
  title: string;
  shortTitle: string;
  badge: string;
  mechanicBadge: string;
  icon: string;
  description: string;
  tagline: string;
  color: string;
  bgGradient: string;
  hasSpeech: boolean;
}

export function isLikelyFemaleName(name: string): boolean {
  const clean = name.trim().toLowerCase();
  const femaleNames = [
    'meriem',
    'mariam',
    'maryam',
    'noor',
    'nour',
    'carmen',
    'belen',
    'belén',
    'ines',
    'inés',
    'raquel',
    'isabel',
    'yasmin',
    'yasmín',
    'ester',
    'esther',
    'noemi',
    'noemí',
    'rocio',
    'rocío',
    'abril',
    'mar',
    'luz',
    'sol',
    'malak',
    'aya',
    'sara',
    'farah',
    'zainab',
    'iman',
    'imane',
    'kawtar',
    'hanan',
    'chloe',
    'chloé',
  ];
  const maleExceptions = [
    'luca',
    'borja',
    'noa',
    'mustafa',
    'moustapha',
    'hamza',
    'yahya',
    'zakaria',
    'isa',
    'moussa',
    'reda',
    'taha',
    'osama',
    'oussama',
  ];
  if (maleExceptions.includes(clean)) return false;
  if (femaleNames.includes(clean)) return true;
  return clean.endsWith('a');
}

export function getPersonalizedPraise(playerName: string, isLevelWin = false): string {
  const isFemale = isLikelyFemaleName(playerName);
  const champ = isFemale ? 'campeona' : 'campeón';
  if (isLevelWin) {
    const winPhrases = [
      `¡Muy bien, ${playerName}! ¡Nivel completado!`,
      `¡Increíble, ${playerName}! ¡Eres ${isFemale ? 'una' : 'un'} ${champ}!`,
      `¡Bravo, ${playerName}! ¡Lo has hecho genial!`,
      `¡Fantástico, ${playerName}! ¡Victoria total!`,
    ];
    return winPhrases[Math.floor(Math.random() * winPhrases.length)];
  }
  const streakPhrases = [
    `¡Muy bien, ${playerName}!`,
    `¡Eso es, ${playerName}!`,
    `¡Genial, ${playerName}!`,
    `¡Sigue así, ${playerName}!`,
    `¡Bravo, ${playerName}!`,
  ];
  return streakPhrases[Math.floor(Math.random() * streakPhrases.length)];
}

/**
 * Smart Adaptive Learning selector:
 * 1. Filters out already mastered words (`learnedWordIds`) so words never repeat until reset.
 * 2. Prioritizes words where a player previously made a mistake (`missedWordIds`) at the current or lower level for intelligent reinforcement.
 * 3. Fills the rest with fresh words at `selectedLevel`, falling back to adjacent levels if needed.
 */
export function selectAdaptiveItems(
  items: LearningItem[],
  selectedLevel: number,
  learnedWordIds: string[],
  missedWordIds: string[],
  count: number
): LearningItem[] {
  const unlearnedAll = items.filter((i) => !learnedWordIds.includes(i.id));
  const poolBase = unlearnedAll.length >= count ? unlearnedAll : items;

  // 1. Smart Review: pick up to 2 previously missed words from level <= selectedLevel + 1
  const reviewCandidates = poolBase
    .filter((i) => missedWordIds.includes(i.id) && i.level <= selectedLevel + 1)
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(2, Math.floor(count / 2)));

  const chosenIds = new Set(reviewCandidates.map((i) => i.id));

  // 2. Fresh words from exact selectedLevel
  const exactLevel = poolBase
    .filter((i) => i.level === selectedLevel && !chosenIds.has(i.id))
    .sort(() => Math.random() - 0.5);

  const result: LearningItem[] = [...reviewCandidates];
  for (const item of exactLevel) {
    if (result.length >= count) break;
    result.push(item);
    chosenIds.add(item.id);
  }

  // 3. Fallback to nearby levels if current level ran out of unlearned words
  if (result.length < count) {
    const nearby = poolBase
      .filter((i) => !chosenIds.has(i.id))
      .sort((a, b) => Math.abs(a.level - selectedLevel) - Math.abs(b.level - selectedLevel) || Math.random() - 0.5);
    for (const item of nearby) {
      if (result.length >= count) break;
      result.push(item);
      chosenIds.add(item.id);
    }
  }

  return result.sort(() => Math.random() - 0.5);
}

export const GAME_MODES: GameModeConfig[] = [
  {
    id: 'monster_feeder',
    title: '¡Come-Palabras!',
    shortTitle: 'Monstruo',
    badge: '👾 Arrastra y Lanza',
    mechanicBadge: '🍩 Arrastra a la Boca',
    icon: '👾',
    description: '¡Arrastra con el dedo o lanza la comida hablada directamente a la boca del monstruo glotón!',
    tagline: '¡Arrastra y alimenta al monstruo!',
    color: '#ec4899',
    bgGradient: 'from-pink-500 to-rose-600',
    hasSpeech: true,
  },
  {
    id: 'rocket_race',
    title: 'Cohete Espacial',
    shortTitle: 'Cohete',
    badge: '🚀 Pilota y Atrapa',
    mechanicBadge: '🪐 Mueve el Cohete',
    icon: '🚀',
    description: '¡Mueve el cohete espacial por los carriles galácticos y atrapa los astros de energía correcta!',
    tagline: '¡Pilota el cohete con turbo!',
    color: '#06b6d4',
    bgGradient: 'from-cyan-500 to-blue-600',
    hasSpeech: true,
  },
  {
    id: 'lang_spanish_words',
    title: 'Cofres del Tesoro',
    shortTitle: 'Español',
    badge: '🇪🇸 Español',
    mechanicBadge: '💎 Memoria',
    icon: '👑',
    description: '¡Abre los cofres mágicos y empareja cada dibujo con su palabra o frase escondida!',
    tagline: '¡Memoria pirata de vocabulario!',
    color: '#8b5cf6',
    bgGradient: 'from-violet-600 to-indigo-600',
    hasSpeech: true,
  },
  {
    id: 'lang_spanish_abc',
    title: 'Tren de Letras y Frases',
    shortTitle: 'Español ABC',
    badge: '🇪🇸 Español',
    mechanicBadge: '🚂 Constructor',
    icon: '🚂',
    description: '¡Explota los globos en orden para formar palabras (Niv. 1-5) o frases completas (Niv. 6-8)!',
    tagline: '¡Forma palabras y frases en el tren!',
    color: '#f43f5e',
    bgGradient: 'from-rose-500 to-orange-500',
    hasSpeech: true,
  },
  {
    id: 'lang_flemish',
    title: 'Topos Flamencos',
    shortTitle: 'Flamenco',
    badge: '🇧🇪 Flamenco',
    mechanicBadge: '🌻 Atrapa el Topo',
    icon: '🌻',
    description: '¡Escucha la palabra o frase en flamenco y atrapa el objeto correcto cuando asome de la maceta!',
    tagline: '¡Reflejos rápidos en el jardín!',
    color: '#eab308',
    bgGradient: 'from-amber-500 to-emerald-500',
    hasSpeech: true,
  },
  {
    id: 'lang_arabic',
    title: 'Burbujas del Genio',
    shortTitle: 'Árabe',
    badge: '🇸🇦 Árabe',
    mechanicBadge: '🫧 Explota Burbujas',
    icon: '🧞',
    description: '¡La lámpara mágica anuncia palabras y frases en árabe! Explota la burbuja correcta.',
    tagline: '¡Burbujas mágicas del desierto!',
    color: '#10b981',
    bgGradient: 'from-emerald-500 to-teal-600',
    hasSpeech: true,
  },
  {
    id: 'lang_french',
    title: 'El Chef de París',
    shortTitle: 'Francés',
    badge: '🇫🇷 Francés',
    mechanicBadge: '🥐 Sirve el Plato',
    icon: '👨‍🍳',
    description: '¡El Chef pide su plato o frase en francés! Destapa las bandejas y sírvele lo correcto.',
    tagline: '¡Cocina divertida en francés!',
    color: '#3b82f6',
    bgGradient: 'from-blue-500 to-indigo-600',
    hasSpeech: true,
  },
  {
    id: 'slingshot_magic',
    title: 'Tirachinas Mágico',
    shortTitle: 'Tirachinas',
    badge: '🏹 Tira y Apunta',
    mechanicBadge: '🎯 Estira y Dispara',
    icon: '🏹',
    description: '¡Estira la goma del tirachinas con el dedo, apunta la trayectoria y rompe la nube piñata correcta!',
    tagline: '¡Estira, apunta y lanza a las nubes!',
    color: '#d946ef',
    bgGradient: 'from-fuchsia-500 to-purple-600',
    hasSpeech: true,
  },
  {
    id: 'crazy_catcher',
    title: 'Atrapa-Paracaídas',
    shortTitle: 'Atrapa-Todo',
    badge: '🛹 Desliza y Atrapa',
    mechanicBadge: '🧺 Mueve la Cesta',
    icon: '🛹',
    description: '¡Desliza tu monopatín mágico de lado a lado con el dedo para atrapar las palabras que caen del cielo!',
    tagline: '¡Mueve la cesta y atrapa al vuelo!',
    color: '#14b8a6',
    bgGradient: 'from-teal-500 to-emerald-600',
    hasSpeech: true,
  },
  {
    id: 'safari_adventure',
    title: 'Safari Fotográfico',
    shortTitle: 'Safari',
    badge: '📸 Arrastra Cámara',
    mechanicBadge: '🦁 Enfoca y Dispara',
    icon: '📸',
    description: '¡Mueve el visor de tu cámara por la selva o toca el animal para hacerle una foto con flash!',
    tagline: '¡Haz fotos en la selva mágica!',
    color: '#f97316',
    bgGradient: 'from-orange-500 to-amber-500',
    hasSpeech: true,
  },
];

// 1. ESPAÑOL ABC & FRASES (Tren de Letras y Frases - Levels 1-5 Words, Levels 6-8 Sentence Builder)
export const ALPHABET_LEARNING_ITEMS: LearningItem[] = [
  // Level 1: 3 letters
  { id: 'alp_sol', emoji: '☀️', es: 'Sol', targetText: 'SOL', subText: 'S - O - L', audioText: 'Sol', audioLang: 'es-ES', level: 1, category: 'Naturaleza' },
  { id: 'alp_pan', emoji: '🍞', es: 'Pan', targetText: 'PAN', subText: 'P - A - N', audioText: 'Pan', audioLang: 'es-ES', level: 1, category: 'Comida' },
  { id: 'alp_mar', emoji: '🌊', es: 'Mar', targetText: 'MAR', subText: 'M - A - R', audioText: 'Mar', audioLang: 'es-ES', level: 1, category: 'Naturaleza' },
  { id: 'alp_pez', emoji: '🐟', es: 'Pez', targetText: 'PEZ', subText: 'P - E - Z', audioText: 'Pez', audioLang: 'es-ES', level: 1, category: 'Animales' },
  { id: 'alp_oso', emoji: '🐻', es: 'Oso', targetText: 'OSO', subText: 'O - S - O', audioText: 'Oso', audioLang: 'es-ES', level: 1, category: 'Animales' },
  { id: 'alp_uva', emoji: '🍇', es: 'Uva', targetText: 'UVA', subText: 'U - V - A', audioText: 'Uva', audioLang: 'es-ES', level: 1, category: 'Frutas' },
  { id: 'alp_luz', emoji: '💡', es: 'Luz', targetText: 'LUZ', subText: 'L - U - Z', audioText: 'Luz', audioLang: 'es-ES', level: 1, category: 'Objetos' },
  { id: 'alp_rey', emoji: '🤴', es: 'Rey', targetText: 'REY', subText: 'R - E - Y', audioText: 'Rey', audioLang: 'es-ES', level: 1, category: 'Fantasía' },
  { id: 'alp_ojo', emoji: '👁️', es: 'Ojo', targetText: 'OJO', subText: 'O - J - O', audioText: 'Ojo', audioLang: 'es-ES', level: 1, category: 'Cuerpo' },
  // Level 2: 4 letters
  { id: 'alp_gato', emoji: '🐱', es: 'Gato', targetText: 'GATO', subText: 'Animal doméstico', audioText: 'Gato', audioLang: 'es-ES', level: 2, category: 'Animales' },
  { id: 'alp_luna', emoji: '🌙', es: 'Luna', targetText: 'LUNA', subText: 'Brilla de noche', audioText: 'Luna', audioLang: 'es-ES', level: 2, category: 'Espacio' },
  { id: 'alp_casa', emoji: '🏠', es: 'Casa', targetText: 'CASA', subText: 'Nuestro hogar', audioText: 'Casa', audioLang: 'es-ES', level: 2, category: 'Hogar' },
  { id: 'alp_pato', emoji: '🦆', es: 'Pato', targetText: 'PATO', subText: 'Hace cuac cuac', audioText: 'Pato', audioLang: 'es-ES', level: 2, category: 'Animales' },
  { id: 'alp_rana', emoji: '🐸', es: 'Rana', targetText: 'RANA', subText: 'Salta en el charco', audioText: 'Rana', audioLang: 'es-ES', level: 2, category: 'Animales' },
  { id: 'alp_tren', emoji: '🚂', es: 'Tren', targetText: 'TREN', subText: 'Viaja por la vía', audioText: 'Tren', audioLang: 'es-ES', level: 2, category: 'Transporte' },
  { id: 'alp_flor', emoji: '🌸', es: 'Flor', targetText: 'FLOR', subText: 'Huele muy bien', audioText: 'Flor', audioLang: 'es-ES', level: 2, category: 'Naturaleza' },
  { id: 'alp_mano', emoji: '✋', es: 'Mano', targetText: 'MANO', subText: 'Tiene cinco dedos', audioText: 'Mano', audioLang: 'es-ES', level: 2, category: 'Cuerpo' },
  { id: 'alp_nube', emoji: '☁️', es: 'Nube', targetText: 'NUBE', subText: 'Blanca en el cielo', audioText: 'Nube', audioLang: 'es-ES', level: 2, category: 'Clima' },
  // Level 3: 5 letters
  { id: 'alp_perro', emoji: '🐶', es: 'Perro', targetText: 'PERRO', subText: 'Mejor amigo', audioText: 'Perro', audioLang: 'es-ES', level: 3, category: 'Animales' },
  { id: 'alp_arbol', emoji: '🌳', es: 'Árbol', targetText: 'ARBOL', subText: 'Tiene hojas y ramas', audioText: 'Árbol', audioLang: 'es-ES', level: 3, category: 'Naturaleza' },
  { id: 'alp_queso', emoji: '🧀', es: 'Queso', targetText: 'QUESO', subText: 'Le gusta al ratón', audioText: 'Queso', audioLang: 'es-ES', level: 3, category: 'Comida' },
  { id: 'alp_globo', emoji: '🎈', es: 'Globo', targetText: 'GLOBO', subText: 'Flota en el aire', audioText: 'Globo', audioLang: 'es-ES', level: 3, category: 'Fiesta' },
  { id: 'alp_avion', emoji: '✈️', es: 'Avión', targetText: 'AVION', subText: 'Vuela por las nubes', audioText: 'Avión', audioLang: 'es-ES', level: 3, category: 'Transporte' },
  { id: 'alp_tigre', emoji: '🐯', es: 'Tigre', targetText: 'TIGRE', subText: 'Felino con rayas', audioText: 'Tigre', audioLang: 'es-ES', level: 3, category: 'Animales' },
  { id: 'alp_barco', emoji: '⛵', es: 'Barco', targetText: 'BARCO', subText: 'Navega en el mar', audioText: 'Barco', audioLang: 'es-ES', level: 3, category: 'Transporte' },
  { id: 'alp_reloj', emoji: '⏰', es: 'Reloj', targetText: 'RELOJ', subText: 'Marca las horas', audioText: 'Reloj', audioLang: 'es-ES', level: 3, category: 'Objetos' },
  { id: 'alp_robot', emoji: '🤖', es: 'Robot', targetText: 'ROBOT', subText: 'Amigo mecánico', audioText: 'Robot', audioLang: 'es-ES', level: 3, category: 'Ciencia' },
  // Level 4: 6 letters
  { id: 'alp_cohete', emoji: '🚀', es: 'Cohete', targetText: 'COHETE', subText: 'Viaja al espacio', audioText: 'Cohete', audioLang: 'es-ES', level: 4, category: 'Espacio' },
  { id: 'alp_conejo', emoji: '🐰', es: 'Conejo', targetText: 'CONEJO', subText: 'Come zanahorias', audioText: 'Conejo', audioLang: 'es-ES', level: 4, category: 'Animales' },
  { id: 'alp_delfin', emoji: '🐬', es: 'Delfín', targetText: 'DELFIN', subText: 'Salta en el océano', audioText: 'Delfín', audioLang: 'es-ES', level: 4, category: 'Animales' },
  { id: 'alp_helado', emoji: '🍦', es: 'Helado', targetText: 'HELADO', subText: 'Postre muy frío', audioText: 'Helado', audioLang: 'es-ES', level: 4, category: 'Comida' },
  { id: 'alp_camion', emoji: '🚚', es: 'Camión', targetText: 'CAMION', subText: 'Transporte grande', audioText: 'Camión', audioLang: 'es-ES', level: 4, category: 'Transporte' },
  { id: 'alp_corona', emoji: '👑', es: 'Corona', targetText: 'CORONA', subText: 'Joya de reyes', audioText: 'Corona', audioLang: 'es-ES', level: 4, category: 'Fantasía' },
  { id: 'alp_jirafa', emoji: '🦒', es: 'Jirafa', targetText: 'JIRAFA', subText: 'Cuello muy largo', audioText: 'Jirafa', audioLang: 'es-ES', level: 4, category: 'Animales' },
  { id: 'alp_pirata', emoji: '🏴‍☠️', es: 'Pirata', targetText: 'PIRATA', subText: 'Busca tesoros', audioText: 'Pirata', audioLang: 'es-ES', level: 4, category: 'Aventura' },
  { id: 'alp_volcan', emoji: '🌋', es: 'Volcán', targetText: 'VOLCAN', subText: 'Lanza lava caliente', audioText: 'Volcán', audioLang: 'es-ES', level: 4, category: 'Naturaleza' },
  // Level 5: 7-8 letters
  { id: 'alp_tortuga', emoji: '🐢', es: 'Tortuga', targetText: 'TORTUGA', subText: 'Lleva su caparazón', audioText: 'Tortuga', audioLang: 'es-ES', level: 5, category: 'Animales' },
  { id: 'alp_manzana', emoji: '🍎', es: 'Manzana', targetText: 'MANZANA', subText: 'Fruta roja o verde', audioText: 'Manzana', audioLang: 'es-ES', level: 5, category: 'Frutas' },
  { id: 'alp_elefante', emoji: '🐘', es: 'Elefante', targetText: 'ELEFANTE', subText: 'Tiene trompa larga', audioText: 'Elefante', audioLang: 'es-ES', level: 5, category: 'Animales' },
  { id: 'alp_mariposa', emoji: '🦋', es: 'Mariposa', targetText: 'MARIPOSA', subText: 'Alas de mil colores', audioText: 'Mariposa', audioLang: 'es-ES', level: 5, category: 'Animales' },
  { id: 'alp_estrella', emoji: '⭐', es: 'Estrella', targetText: 'ESTRELLA', subText: 'Brilla en el cosmos', audioText: 'Estrella', audioLang: 'es-ES', level: 5, category: 'Espacio' },
  { id: 'alp_castillo', emoji: '🏰', es: 'Castillo', targetText: 'CASTILLO', subText: 'Fortaleza medieval', audioText: 'Castillo', audioLang: 'es-ES', level: 5, category: 'Fantasía' },
  { id: 'alp_guitarra', emoji: '🎸', es: 'Guitarra', targetText: 'GUITARRA', subText: 'Instrumento musical', audioText: 'Guitarra', audioLang: 'es-ES', level: 5, category: 'Música' },
  { id: 'alp_arcoiris', emoji: '🌈', es: 'Arcoíris', targetText: 'ARCOIRIS', subText: 'Siete colores', audioText: 'Arcoíris', audioLang: 'es-ES', level: 5, category: 'Clima' },
  { id: 'alp_diamante', emoji: '💎', es: 'Diamante', targetText: 'DIAMANTE', subText: 'Joya brillante', audioText: 'Diamante', audioLang: 'es-ES', level: 5, category: 'Tesoro' },
  // Level 6: Frases Cortas (3 palabras en el tren)
  { id: 'alp_fr_sol_brilla', emoji: '☀️', es: 'El sol brilla', targetText: 'EL SOL BRILLA', subText: 'Ordena las 3 palabras', audioText: 'El sol brilla', audioLang: 'es-ES', level: 6, category: 'Frases', isPhrase: true },
  { id: 'alp_fr_gato_salta', emoji: '🐱', es: 'Mi gato salta', targetText: 'MI GATO SALTA', subText: 'Ordena las 3 palabras', audioText: 'Mi gato salta', audioLang: 'es-ES', level: 6, category: 'Frases', isPhrase: true },
  { id: 'alp_fr_perro_corre', emoji: '🐶', es: 'El perro corre', targetText: 'EL PERRO CORRE', subText: 'Ordena las 3 palabras', audioText: 'El perro corre', audioLang: 'es-ES', level: 6, category: 'Frases', isPhrase: true },
  { id: 'alp_fr_luna_blanca', emoji: '🌙', es: 'La luna blanca', targetText: 'LA LUNA BLANCA', subText: 'Ordena las 3 palabras', audioText: 'La luna blanca', audioLang: 'es-ES', level: 6, category: 'Frases', isPhrase: true },
  { id: 'alp_fr_pato_nada', emoji: '🦆', es: 'El pato nada', targetText: 'EL PATO NADA', subText: 'Ordena las 3 palabras', audioText: 'El pato nada', audioLang: 'es-ES', level: 6, category: 'Frases', isPhrase: true },
  { id: 'alp_fr_flor_roja', emoji: '🌹', es: 'La flor roja', targetText: 'LA FLOR ROJA', subText: 'Ordena las 3 palabras', audioText: 'La flor roja', audioLang: 'es-ES', level: 6, category: 'Frases', isPhrase: true },
  // Level 7: Frases de Acción (3-4 palabras)
  { id: 'alp_fr_como_manzana', emoji: '🍎', es: 'Yo como manzana', targetText: 'YO COMO MANZANA', subText: 'Frase saludable', audioText: 'Yo como manzana', audioLang: 'es-ES', level: 7, category: 'Frases', isPhrase: true },
  { id: 'alp_fr_cohete_vuela', emoji: '🚀', es: 'El cohete vuela alto', targetText: 'EL COHETE VUELA ALTO', subText: 'Frase espacial', audioText: 'El cohete vuela alto', audioLang: 'es-ES', level: 7, category: 'Frases', isPhrase: true },
  { id: 'alp_fr_tren_rapido', emoji: '🚂', es: 'El tren va rápido', targetText: 'EL TREN VA RAPIDO', subText: 'Frase viajera', audioText: 'El tren va rápido', audioLang: 'es-ES', level: 7, category: 'Frases', isPhrase: true },
  { id: 'alp_fr_leon_ruge', emoji: '🦁', es: 'El león ruge fuerte', targetText: 'EL LEON RUGE FUERTE', subText: 'Frase de la selva', audioText: 'El león ruge fuerte', audioLang: 'es-ES', level: 7, category: 'Frases', isPhrase: true },
  { id: 'alp_fr_leo_libro', emoji: '📖', es: 'Yo leo un libro', targetText: 'YO LEO UN LIBRO', subText: 'Frase escolar', audioText: 'Yo leo un libro', audioLang: 'es-ES', level: 7, category: 'Frases', isPhrase: true },
  { id: 'alp_fr_barco_mar', emoji: '⛵', es: 'El barco en el mar', targetText: 'EL BARCO NAVEGA HOY', subText: 'Frase marina', audioText: 'El barco navega hoy', audioLang: 'es-ES', level: 7, category: 'Frases', isPhrase: true },
  // Level 8: Super Frases Mágicas (4 palabras)
  { id: 'alp_fr_jugar_amigos', emoji: '🤸', es: 'Me gusta jugar mucho', targetText: 'ME GUSTA JUGAR MUCHO', subText: 'Super frase', audioText: 'Me gusta jugar mucho', audioLang: 'es-ES', level: 8, category: 'Frases', isPhrase: true },
  { id: 'alp_fr_dragon_fuego', emoji: '🐉', es: 'El dragón lanza fuego', targetText: 'EL DRAGON LANZA FUEGO', subText: 'Super frase mágica', audioText: 'El dragón lanza fuego', audioLang: 'es-ES', level: 8, category: 'Frases', isPhrase: true },
  { id: 'alp_fr_estrellas_noche', emoji: '🌌', es: 'Las estrellas brillan hoy', targetText: 'LAS ESTRELLAS BRILLAN HOY', subText: 'Super frase nocturna', audioText: 'Las estrellas brillan hoy', audioLang: 'es-ES', level: 8, category: 'Frases', isPhrase: true },
  { id: 'alp_fr_mariposa_vuela', emoji: '🦋', es: 'La mariposa tiene alas', targetText: 'LA MARIPOSA TIENE ALAS', subText: 'Super frase natural', audioText: 'La mariposa tiene alas', audioLang: 'es-ES', level: 8, category: 'Frases', isPhrase: true },
  { id: 'alp_fr_quiero_helado', emoji: '🍦', es: 'Quiero un helado rico', targetText: 'QUIERO UN HELADO RICO', subText: 'Super frase dulce', audioText: 'Quiero un helado rico', audioLang: 'es-ES', level: 8, category: 'Frases', isPhrase: true },
  { id: 'alp_fr_castillo_rey', emoji: '🏰', es: 'El castillo es grande', targetText: 'EL CASTILLO ES GRANDE', subText: 'Super frase real', audioText: 'El castillo es grande', audioLang: 'es-ES', level: 8, category: 'Frases', isPhrase: true },
];

// 2. ESPAÑOL VOCABULARIO Y FRASES (Levels 1-5 Vocab, Levels 6-8 Phrases & Actions) - 76 items
export const SPANISH_VOCAB_ITEMS: LearningItem[] = [
  // Level 1: Animales Amigos
  { id: 'es_perro', emoji: '🐶', es: 'Perro', targetText: 'PERRO', subText: 'Dice guau guau', audioText: 'El perro', audioLang: 'es-ES', level: 1, category: 'Animales' },
  { id: 'es_gato', emoji: '🐱', es: 'Gato', targetText: 'GATO', subText: 'Dice miau', audioText: 'El gato', audioLang: 'es-ES', level: 1, category: 'Animales' },
  { id: 'es_leon', emoji: '🦁', es: 'León', targetText: 'LEÓN', subText: 'Rey de la selva', audioText: 'El león', audioLang: 'es-ES', level: 1, category: 'Animales' },
  { id: 'es_vaca', emoji: '🐮', es: 'Vaca', targetText: 'VACA', subText: 'Nos da leche', audioText: 'La vaca', audioLang: 'es-ES', level: 1, category: 'Animales' },
  { id: 'es_mono', emoji: '🐵', es: 'Mono', targetText: 'MONO', subText: 'Come plátanos', audioText: 'El mono', audioLang: 'es-ES', level: 1, category: 'Animales' },
  { id: 'es_pollo', emoji: '🐥', es: 'Pollito', targetText: 'POLLITO', subText: 'Amarillo y pequeñito', audioText: 'El pollito', audioLang: 'es-ES', level: 1, category: 'Animales' },
  { id: 'es_oso', emoji: '🐻', es: 'Oso', targetText: 'OSO', subText: 'Le encanta la miel', audioText: 'El oso', audioLang: 'es-ES', level: 1, category: 'Animales' },
  { id: 'es_pato', emoji: '🦆', es: 'Pato', targetText: 'PATO', subText: 'Nada en el lago', audioText: 'El pato', audioLang: 'es-ES', level: 1, category: 'Animales' },
  { id: 'es_cerdo', emoji: '🐷', es: 'Cerdito', targetText: 'CERDITO', subText: 'Color rosa', audioText: 'El cerdito', audioLang: 'es-ES', level: 1, category: 'Animales' },
  { id: 'es_oveja', emoji: '🐑', es: 'Oveja', targetText: 'OVEJA', subText: 'Tiene lana suave', audioText: 'La oveja', audioLang: 'es-ES', level: 1, category: 'Animales' },
  { id: 'es_caballo', emoji: '🐴', es: 'Caballo', targetText: 'CABALLO', subText: 'Galopa muy rápido', audioText: 'El caballo', audioLang: 'es-ES', level: 1, category: 'Animales' },
  // Level 2: Frutas y Comida Rica
  { id: 'es_manzana', emoji: '🍎', es: 'Manzana', targetText: 'MANZANA', subText: 'Fruta roja y dulce', audioText: 'La manzana', audioLang: 'es-ES', level: 2, category: 'Comida' },
  { id: 'es_platano', emoji: '🍌', es: 'Plátano', targetText: 'PLÁTANO', subText: 'Fruta amarilla', audioText: 'El plátano', audioLang: 'es-ES', level: 2, category: 'Comida' },
  { id: 'es_fresa', emoji: '🍓', es: 'Fresa', targetText: 'FRESA', subText: 'Roja con puntitos', audioText: 'La fresa', audioLang: 'es-ES', level: 2, category: 'Comida' },
  { id: 'es_sandia', emoji: '🍉', es: 'Sandía', targetText: 'SANDÍA', subText: 'Verde por fuera, roja por dentro', audioText: 'La sandía', audioLang: 'es-ES', level: 2, category: 'Comida' },
  { id: 'es_pizza', emoji: '🍕', es: 'Pizza', targetText: 'PIZZA', subText: 'Con queso fundido', audioText: 'La pizza', audioLang: 'es-ES', level: 2, category: 'Comida' },
  { id: 'es_pastel', emoji: '🎂', es: 'Pastel', targetText: 'PASTEL', subText: 'De cumpleaños', audioText: 'El pastel', audioLang: 'es-ES', level: 2, category: 'Comida' },
  { id: 'es_helado', emoji: '🍦', es: 'Helado', targetText: 'HELADO', subText: 'Muy fresquito', audioText: 'El helado', audioLang: 'es-ES', level: 2, category: 'Comida' },
  { id: 'es_queso', emoji: '🧀', es: 'Queso', targetText: 'QUESO', subText: 'Delicioso con pan', audioText: 'El queso', audioLang: 'es-ES', level: 2, category: 'Comida' },
  { id: 'es_dona', emoji: '🍩', es: 'Rosquilla', targetText: 'ROSQUILLA', subText: 'Redonda y dulce', audioText: 'La rosquilla', audioLang: 'es-ES', level: 2, category: 'Comida' },
  { id: 'es_uvas', emoji: '🍇', es: 'Uvas', targetText: 'UVAS', subText: 'Racimo morado', audioText: 'Las uvas', audioLang: 'es-ES', level: 2, category: 'Comida' },
  { id: 'es_zanahoria', emoji: '🥕', es: 'Zanahoria', targetText: 'ZANAHORIA', subText: 'Naranja y crujiente', audioText: 'La zanahoria', audioLang: 'es-ES', level: 2, category: 'Comida' },
  // Level 3: Naturaleza, Espacio y Clima
  { id: 'es_sol', emoji: '☀️', es: 'Sol', targetText: 'SOL', subText: 'Nos da calor y luz', audioText: 'El sol', audioLang: 'es-ES', level: 3, category: 'Naturaleza' },
  { id: 'es_luna', emoji: '🌙', es: 'Luna', targetText: 'LUNA', subText: 'Sale por la noche', audioText: 'La luna', audioLang: 'es-ES', level: 3, category: 'Espacio' },
  { id: 'es_arbol', emoji: '🌳', es: 'Árbol', targetText: 'ÁRBOL', subText: 'Con tronco y hojas', audioText: 'El árbol', audioLang: 'es-ES', level: 3, category: 'Naturaleza' },
  { id: 'es_flor', emoji: '🌻', es: 'Girasol', targetText: 'GIRASOL', subText: 'Mira hacia el sol', audioText: 'El girasol', audioLang: 'es-ES', level: 3, category: 'Naturaleza' },
  { id: 'es_arcoiris', emoji: '🌈', es: 'Arcoíris', targetText: 'ARCOÍRIS', subText: 'Sale tras la lluvia', audioText: 'El arcoíris', audioLang: 'es-ES', level: 3, category: 'Clima' },
  { id: 'es_volcan', emoji: '🌋', es: 'Volcán', targetText: 'VOLCÁN', subText: 'Montaña de fuego', audioText: 'El volcán', audioLang: 'es-ES', level: 3, category: 'Naturaleza' },
  { id: 'es_estrella', emoji: '⭐', es: 'Estrella', targetText: 'ESTRELLA', subText: 'Brilla en el cielo', audioText: 'La estrella', audioLang: 'es-ES', level: 3, category: 'Espacio' },
  { id: 'es_planeta', emoji: '🪐', es: 'Planeta', targetText: 'PLANETA', subText: 'Tiene anillos mágicos', audioText: 'El planeta', audioLang: 'es-ES', level: 3, category: 'Espacio' },
  { id: 'es_nieve', emoji: '⛄', es: 'Muñeco de Nieve', targetText: 'NIEVE', subText: 'Blanco y frío', audioText: 'El muñeco de nieve', audioLang: 'es-ES', level: 3, category: 'Clima' },
  { id: 'es_ola', emoji: '🌊', es: 'Ola del Mar', targetText: 'OLA', subText: 'Agua del océano', audioText: 'La ola del mar', audioLang: 'es-ES', level: 3, category: 'Naturaleza' },
  { id: 'es_fuego', emoji: '🔥', es: 'Fuego', targetText: 'FUEGO', subText: 'Quema y calienta', audioText: 'El fuego', audioLang: 'es-ES', level: 3, category: 'Naturaleza' },
  // Level 4: Transporte, Hogar y Objetos
  { id: 'es_coche', emoji: '🚗', es: 'Coche', targetText: 'COCHE', subText: 'Tiene cuatro ruedas', audioText: 'El coche', audioLang: 'es-ES', level: 4, category: 'Transporte' },
  { id: 'es_barco', emoji: '⛵', es: 'Barco', targetText: 'BARCO', subText: 'Navega con vela', audioText: 'El barco', audioLang: 'es-ES', level: 4, category: 'Transporte' },
  { id: 'es_bici', emoji: '🚲', es: 'Bicicleta', targetText: 'BICICLETA', subText: 'Se mueve pedaleando', audioText: 'La bicicleta', audioLang: 'es-ES', level: 4, category: 'Transporte' },
  { id: 'es_libro', emoji: '📖', es: 'Libro', targetText: 'LIBRO', subText: 'Lleno de cuentos', audioText: 'El libro', audioLang: 'es-ES', level: 4, category: 'Escuela' },
  { id: 'es_reloj', emoji: '⏰', es: 'Reloj', targetText: 'RELOJ', subText: 'Hace tic tac', audioText: 'El reloj', audioLang: 'es-ES', level: 4, category: 'Hogar' },
  { id: 'es_llave', emoji: '🔑', es: 'Llave', targetText: 'LLAVE', subText: 'Abre la puerta', audioText: 'La llave', audioLang: 'es-ES', level: 4, category: 'Hogar' },
  { id: 'es_casa', emoji: '🏠', es: 'Casa', targetText: 'CASA', subText: 'Con techo y ventana', audioText: 'La casa', audioLang: 'es-ES', level: 4, category: 'Hogar' },
  { id: 'es_tren', emoji: '🚂', es: 'Locomotora', targetText: 'TREN', subText: 'Hace chu-chu', audioText: 'El tren', audioLang: 'es-ES', level: 4, category: 'Transporte' },
  { id: 'es_helicoptero', emoji: '🚁', es: 'Helicóptero', targetText: 'HELICÓPTERO', subText: 'Vuela con hélices', audioText: 'El helicóptero', audioLang: 'es-ES', level: 4, category: 'Transporte' },
  { id: 'es_paraguas', emoji: '☂️', es: 'Paraguas', targetText: 'PARAGUAS', subText: 'Para la lluvia', audioText: 'El paraguas', audioLang: 'es-ES', level: 4, category: 'Objetos' },
  { id: 'es_globo_aerostatico', emoji: '🎈', es: 'Globo', targetText: 'GLOBO', subText: 'Sube por el cielo', audioText: 'El globo', audioLang: 'es-ES', level: 4, category: 'Fiesta' },
  // Level 5: Música, Ciencia, Safari y Fantasía
  { id: 'es_guitarra', emoji: '🎸', es: 'Guitarra', targetText: 'GUITARRA', subText: 'Tiene seis cuerdas', audioText: 'La guitarra', audioLang: 'es-ES', level: 5, category: 'Música' },
  { id: 'es_tambor', emoji: '🥁', es: 'Tambor', targetText: 'TAMBOR', subText: 'Se toca con baquetas', audioText: 'El tambor', audioLang: 'es-ES', level: 5, category: 'Música' },
  { id: 'es_telescopio', emoji: '🔭', es: 'Telescopio', targetText: 'TELESCOPIO', subText: 'Para ver estrellas', audioText: 'El telescopio', audioLang: 'es-ES', level: 5, category: 'Ciencia' },
  { id: 'es_robot', emoji: '🤖', es: 'Robot', targetText: 'ROBOT', subText: 'Máquina inteligente', audioText: 'El robot', audioLang: 'es-ES', level: 5, category: 'Ciencia' },
  { id: 'es_dragon', emoji: '🐉', es: 'Dragón', targetText: 'DRAGÓN', subText: 'Vuela y echa fuego', audioText: 'El dragón', audioLang: 'es-ES', level: 5, category: 'Fantasía' },
  { id: 'es_diamante', emoji: '💎', es: 'Diamante', targetText: 'DIAMANTE', subText: 'Joya del tesoro', audioText: 'El diamante', audioLang: 'es-ES', level: 5, category: 'Tesoro' },
  { id: 'es_dinosaurio', emoji: '🦖', es: 'Dinosaurio', targetText: 'DINOSAURIO', subText: 'Gigante prehistórico', audioText: 'El dinosaurio', audioLang: 'es-ES', level: 5, category: 'Aventura' },
  { id: 'es_unicornio', emoji: '🦄', es: 'Unicornio', targetText: 'UNICORNIO', subText: 'Caballo con cuerno mágico', audioText: 'El unicornio', audioLang: 'es-ES', level: 5, category: 'Fantasía' },
  { id: 'es_astronauta', emoji: '🧑‍🚀', es: 'Astronauta', targetText: 'ASTRONAUTA', subText: 'Viajero del espacio', audioText: 'El astronauta', audioLang: 'es-ES', level: 5, category: 'Espacio' },
  { id: 'es_castillo', emoji: '🏰', es: 'Castillo', targetText: 'CASTILLO', subText: 'Hogar de príncipes', audioText: 'El castillo', audioLang: 'es-ES', level: 5, category: 'Fantasía' },
  { id: 'es_pulpo', emoji: '🐙', es: 'Pulpo', targetText: 'PULPO', subText: 'Tiene ocho tentáculos', audioText: 'El pulpo', audioLang: 'es-ES', level: 5, category: 'Océano' },
  // Level 6: Frases Descriptivas (Sustantivo + Adjetivo)
  { id: 'es_fr_perro_grande', emoji: '🐕', es: 'El perro grande', targetText: 'EL PERRO GRANDE', subText: 'Un perrito muy alto y fiel', audioText: 'El perro grande', audioLang: 'es-ES', level: 6, category: 'Frases', isPhrase: true },
  { id: 'es_fr_manzana_roja', emoji: '🍎', es: 'La manzana roja', targetText: 'LA MANZANA ROJA', subText: 'Fruta dulce y brillante', audioText: 'La manzana roja', audioLang: 'es-ES', level: 6, category: 'Frases', isPhrase: true },
  { id: 'es_fr_sol_brillante', emoji: '🌞', es: 'El sol brillante', targetText: 'EL SOL BRILLANTE', subText: 'Ilumina todo el día', audioText: 'El sol brillante', audioLang: 'es-ES', level: 6, category: 'Frases', isPhrase: true },
  { id: 'es_fr_coche_veloz', emoji: '🏎️', es: 'El coche veloz', targetText: 'EL COCHE VELOZ', subText: 'Corre por la pista', audioText: 'El coche veloz', audioLang: 'es-ES', level: 6, category: 'Frases', isPhrase: true },
  { id: 'es_fr_gato_dormilon', emoji: '😺', es: 'El gato dormilón', targetText: 'EL GATO DORMILÓN', subText: 'Duerme en el sofá', audioText: 'El gato dormilón', audioLang: 'es-ES', level: 6, category: 'Frases', isPhrase: true },
  { id: 'es_fr_flor_bonita', emoji: '🌺', es: 'La flor bonita', targetText: 'LA FLOR BONITA', subText: 'Crece en el jardín', audioText: 'La flor bonita', audioLang: 'es-ES', level: 6, category: 'Frases', isPhrase: true },
  { id: 'es_fr_castillo_magico', emoji: '🏰', es: 'El castillo mágico', targetText: 'EL CASTILLO MÁGICO', subText: 'De cuento de hadas', audioText: 'El castillo mágico', audioLang: 'es-ES', level: 6, category: 'Frases', isPhrase: true },
  // Level 7: Frases de Acciones Cotidianas
  { id: 'es_fr_comer_fruta', emoji: '🥗', es: 'Comer fruta sana', targetText: 'COMER FRUTA SANA', subText: 'Nos da mucha energía', audioText: 'Comer fruta sana', audioLang: 'es-ES', level: 7, category: 'Acciones', isPhrase: true },
  { id: 'es_fr_leer_cuento', emoji: '📚', es: 'Leer un cuento', targetText: 'LEER UN CUENTO', subText: 'Aprender historias mágicas', audioText: 'Leer un cuento', audioLang: 'es-ES', level: 7, category: 'Acciones', isPhrase: true },
  { id: 'es_fr_lavar_manos', emoji: '🧼', es: 'Lavarse las manos', targetText: 'LAVARSE LAS MANOS', subText: 'Con agua y jabón', audioText: 'Lavarse las manos', audioLang: 'es-ES', level: 7, category: 'Acciones', isPhrase: true },
  { id: 'es_fr_tocar_musica', emoji: '🎵', es: 'Tocar la guitarra', targetText: 'TOCAR LA GUITARRA', subText: 'Cantar una canción', audioText: 'Tocar la guitarra', audioLang: 'es-ES', level: 7, category: 'Acciones', isPhrase: true },
  { id: 'es_fr_jugar_futbol', emoji: '⚽', es: 'Jugar al balón', targetText: 'JUGAR AL BALÓN', subText: 'Meter un gran gol', audioText: 'Jugar al balón', audioLang: 'es-ES', level: 7, category: 'Acciones', isPhrase: true },
  { id: 'es_fr_pintar_cuadro', emoji: '🎨', es: 'Pintar un dibujo', targetText: 'PINTAR UN DIBUJO', subText: 'Con muchos colores', audioText: 'Pintar un dibujo', audioLang: 'es-ES', level: 7, category: 'Acciones', isPhrase: true },
  { id: 'es_fr_dormir_temprano', emoji: '🛌', es: 'Dormir por la noche', targetText: 'DORMIR POR LA NOCHE', subText: 'Soñar con los angelitos', audioText: 'Dormir por la noche', audioLang: 'es-ES', level: 7, category: 'Acciones', isPhrase: true },
  // Level 8: Expresiones y Oraciones Completas
  { id: 'es_fr_buenos_dias', emoji: '🌅', es: '¡Buenos días!', targetText: '¡BUENOS DÍAS!', subText: 'Saludo por la mañana', audioText: '¡Buenos días!', audioLang: 'es-ES', level: 8, category: 'Expresiones', isPhrase: true },
  { id: 'es_fr_muchas_gracias', emoji: '🙏', es: '¡Muchas gracias!', targetText: '¡MUCHAS GRACIAS!', subText: 'Palabra mágica de cortesía', audioText: '¡Muchas gracias!', audioLang: 'es-ES', level: 8, category: 'Expresiones', isPhrase: true },
  { id: 'es_fr_viajar_espacio', emoji: '🚀', es: 'Viajar a las estrellas', targetText: 'VIAJAR A LAS ESTRELLAS', subText: 'Aventura en cohete', audioText: 'Viajar a las estrellas', audioLang: 'es-ES', level: 8, category: 'Oraciones', isPhrase: true },
  { id: 'es_fr_cuidar_planeta', emoji: '🌍', es: 'Cuidar el planeta Tierra', targetText: 'CUIDAR EL PLANETA', subText: 'Amar la naturaleza', audioText: 'Cuidar el planeta Tierra', audioLang: 'es-ES', level: 8, category: 'Oraciones', isPhrase: true },
  { id: 'es_fr_compartir_juguetes', emoji: '🧸', es: 'Compartir con amigos', targetText: 'COMPARTIR CON AMIGOS', subText: 'Jugar todos juntos', audioText: 'Compartir con amigos', audioLang: 'es-ES', level: 8, category: 'Oraciones', isPhrase: true },
  { id: 'es_fr_buenas_noches', emoji: '🌠', es: '¡Buenas noches!', targetText: '¡BUENAS NOCHES!', subText: 'Antes de ir a dormir', audioText: '¡Buenas noches!', audioLang: 'es-ES', level: 8, category: 'Expresiones', isPhrase: true },
  { id: 'es_fr_estoy_feliz', emoji: '😄', es: '¡Estoy muy feliz!', targetText: '¡ESTOY MUY FELIZ!', subText: 'Con una gran sonrisa', audioText: '¡Estoy muy feliz!', audioLang: 'es-ES', level: 8, category: 'Expresiones', isPhrase: true },
];

// 3. FLAMENCO (Topos Flamencos - Levels 1-5 Words, Levels 6-8 Flemish Phrases) - 60 items
export const FLEMISH_LEARNING_ITEMS: LearningItem[] = [
  // Level 1
  { id: 'fl_dog', emoji: '🐶', es: 'Perro', targetText: 'De Hond', subText: 'Pronunciación: Hond', audioText: 'De hond', audioLang: 'nl-BE', level: 1, category: 'Animales' },
  { id: 'fl_cat', emoji: '🐱', es: 'Gato', targetText: 'De Kat', subText: 'Pronunciación: Kat', audioText: 'De kat', audioLang: 'nl-BE', level: 1, category: 'Animales' },
  { id: 'fl_apple', emoji: '🍎', es: 'Manzana', targetText: 'De Appel', subText: 'Pronunciación: Ápel', audioText: 'De appel', audioLang: 'nl-BE', level: 1, category: 'Comida' },
  { id: 'fl_sun', emoji: '☀️', es: 'Sol', targetText: 'De Zon', subText: 'Pronunciación: Zon', audioText: 'De zon', audioLang: 'nl-BE', level: 1, category: 'Naturaleza' },
  { id: 'fl_horse', emoji: '🐴', es: 'Caballo', targetText: 'Het Paard', subText: 'Pronunciación: Paard', audioText: 'Het paard', audioLang: 'nl-BE', level: 1, category: 'Animales' },
  { id: 'fl_fish', emoji: '🐟', es: 'Pez', targetText: 'De Vis', subText: 'Pronunciación: Vis', audioText: 'De vis', audioLang: 'nl-BE', level: 1, category: 'Animales' },
  { id: 'fl_cow', emoji: '🐮', es: 'Vaca', targetText: 'De Koe', subText: 'Pronunciación: Ku', audioText: 'De koe', audioLang: 'nl-BE', level: 1, category: 'Animales' },
  { id: 'fl_bear', emoji: '🐻', es: 'Oso', targetText: 'De Beer', subText: 'Pronunciación: Ber', audioText: 'De beer', audioLang: 'nl-BE', level: 1, category: 'Animales' },
  // Level 2
  { id: 'fl_moon', emoji: '🌙', es: 'Luna', targetText: 'De Maan', subText: 'Pronunciación: Maan', audioText: 'De maan', audioLang: 'nl-BE', level: 2, category: 'Espacio' },
  { id: 'fl_tree', emoji: '🌳', es: 'Árbol', targetText: 'De Boom', subText: 'Pronunciación: Boom', audioText: 'De boom', audioLang: 'nl-BE', level: 2, category: 'Naturaleza' },
  { id: 'fl_flower', emoji: '🌸', es: 'Flor', targetText: 'De Bloem', subText: 'Pronunciación: Blum', audioText: 'De bloem', audioLang: 'nl-BE', level: 2, category: 'Naturaleza' },
  { id: 'fl_milk', emoji: '🥛', es: 'Leche', targetText: 'De Melk', subText: 'Pronunciación: Melk', audioText: 'De melk', audioLang: 'nl-BE', level: 2, category: 'Comida' },
  { id: 'fl_bread', emoji: '🍞', es: 'Pan', targetText: 'Het Brood', subText: 'Pronunciación: Brod', audioText: 'Het brood', audioLang: 'nl-BE', level: 2, category: 'Comida' },
  { id: 'fl_cheese', emoji: '🧀', es: 'Queso', targetText: 'De Kaas', subText: 'Pronunciación: Kaas', audioText: 'De kaas', audioLang: 'nl-BE', level: 2, category: 'Comida' },
  { id: 'fl_banana', emoji: '🍌', es: 'Plátano', targetText: 'De Banaan', subText: 'Pronunciación: Banán', audioText: 'De banaan', audioLang: 'nl-BE', level: 2, category: 'Comida' },
  { id: 'fl_egg', emoji: '🥚', es: 'Huevo', targetText: 'Het Ei', subText: 'Pronunciación: Éi', audioText: 'Het ei', audioLang: 'nl-BE', level: 2, category: 'Comida' },
  // Level 3
  { id: 'fl_house', emoji: '🏠', es: 'Casa', targetText: 'Het Huis', subText: 'Pronunciación: Jœis', audioText: 'Het huis', audioLang: 'nl-BE', level: 3, category: 'Hogar' },
  { id: 'fl_bike', emoji: '🚲', es: 'Bicicleta', targetText: 'De Fiets', subText: 'Pronunciación: Fits', audioText: 'De fiets', audioLang: 'nl-BE', level: 3, category: 'Transporte' },
  { id: 'fl_car', emoji: '🚗', es: 'Coche', targetText: 'De Auto', subText: 'Pronunciación: Áuto', audioText: 'De auto', audioLang: 'nl-BE', level: 3, category: 'Transporte' },
  { id: 'fl_boat', emoji: '⛵', es: 'Barco', targetText: 'De Boot', subText: 'Pronunciación: Bot', audioText: 'De boot', audioLang: 'nl-BE', level: 3, category: 'Transporte' },
  { id: 'fl_book', emoji: '📖', es: 'Libro', targetText: 'Het Boek', subText: 'Pronunciación: Buk', audioText: 'Het boek', audioLang: 'nl-BE', level: 3, category: 'Escuela' },
  { id: 'fl_water', emoji: '💧', es: 'Agua', targetText: 'Het Water', subText: 'Pronunciación: Váter', audioText: 'Het water', audioLang: 'nl-BE', level: 3, category: 'Naturaleza' },
  { id: 'fl_train', emoji: '🚂', es: 'Tren', targetText: 'De Trein', subText: 'Pronunciación: Tréin', audioText: 'De trein', audioLang: 'nl-BE', level: 3, category: 'Transporte' },
  { id: 'fl_key', emoji: '🔑', es: 'Llave', targetText: 'De Sleutel', subText: 'Pronunciación: Slótel', audioText: 'De sleutel', audioLang: 'nl-BE', level: 3, category: 'Hogar' },
  // Level 4
  { id: 'fl_bird', emoji: '🐦', es: 'Pájaro', targetText: 'De Vogel', subText: 'Pronunciación: Fójel', audioText: 'De vogel', audioLang: 'nl-BE', level: 4, category: 'Animales' },
  { id: 'fl_rabbit', emoji: '🐰', es: 'Conejo', targetText: 'Het Konijn', subText: 'Pronunciación: Konéin', audioText: 'Het konijn', audioLang: 'nl-BE', level: 4, category: 'Animales' },
  { id: 'fl_frog', emoji: '🐸', es: 'Rana', targetText: 'De Kikker', subText: 'Pronunciación: Kíker', audioText: 'De kikker', audioLang: 'nl-BE', level: 4, category: 'Animales' },
  { id: 'fl_lion', emoji: '🦁', es: 'León', targetText: 'De Leeuw', subText: 'Pronunciación: Leu', audioText: 'De leeuw', audioLang: 'nl-BE', level: 4, category: 'Animales' },
  { id: 'fl_star', emoji: '⭐', es: 'Estrella', targetText: 'De Ster', subText: 'Pronunciación: Ster', audioText: 'De ster', audioLang: 'nl-BE', level: 4, category: 'Espacio' },
  { id: 'fl_monkey', emoji: '🐵', es: 'Mono', targetText: 'De Aap', subText: 'Pronunciación: Aap', audioText: 'De aap', audioLang: 'nl-BE', level: 4, category: 'Animales' },
  { id: 'fl_elephant', emoji: '🐘', es: 'Elefante', targetText: 'De Olifant', subText: 'Pronunciación: Ólifant', audioText: 'De olifant', audioLang: 'nl-BE', level: 4, category: 'Animales' },
  { id: 'fl_duck', emoji: '🦆', es: 'Pato', targetText: 'De Eend', subText: 'Pronunciación: End', audioText: 'De eend', audioLang: 'nl-BE', level: 4, category: 'Animales' },
  // Level 5
  { id: 'fl_butterfly', emoji: '🦋', es: 'Mariposa', targetText: 'De Vlinder', subText: 'Pronunciación: Flínder', audioText: 'De vlinder', audioLang: 'nl-BE', level: 5, category: 'Animales' },
  { id: 'fl_plane', emoji: '✈️', es: 'Avión', targetText: 'Het Vliegtuig', subText: 'Pronunciación: Flíjtuig', audioText: 'Het vliegtuig', audioLang: 'nl-BE', level: 5, category: 'Transporte' },
  { id: 'fl_shoes', emoji: '👟', es: 'Zapatos', targetText: 'De Schoenen', subText: 'Pronunciación: Sjúnen', audioText: 'De schoenen', audioLang: 'nl-BE', level: 5, category: 'Ropa' },
  { id: 'fl_strawberry', emoji: '🍓', es: 'Fresa', targetText: 'De Aardbei', subText: 'Pronunciación: Áardbei', audioText: 'De aardbei', audioLang: 'nl-BE', level: 5, category: 'Comida' },
  { id: 'fl_rainbow', emoji: '🌈', es: 'Arcoíris', targetText: 'De Regenboog', subText: 'Pronunciación: Réjenboj', audioText: 'De regenboog', audioLang: 'nl-BE', level: 5, category: 'Clima' },
  { id: 'fl_castle', emoji: '🏰', es: 'Castillo', targetText: 'Het Kasteel', subText: 'Pronunciación: Kastél', audioText: 'Het kasteel', audioLang: 'nl-BE', level: 5, category: 'Fantasía' },
  { id: 'fl_rocket', emoji: '🚀', es: 'Cohete', targetText: 'De Raket', subText: 'Pronunciación: Rakét', audioText: 'De raket', audioLang: 'nl-BE', level: 5, category: 'Espacio' },
  { id: 'fl_crown', emoji: '👑', es: 'Corona', targetText: 'De Kroon', subText: 'Pronunciación: Kron', audioText: 'De kroon', audioLang: 'nl-BE', level: 5, category: 'Fantasía' },
  { id: 'fl_icecream', emoji: '🍦', es: 'Helado', targetText: 'Het IJsje', subText: 'Pronunciación: Éisje', audioText: 'Het ijsje', audioLang: 'nl-BE', level: 5, category: 'Comida' },
  { id: 'fl_turtle', emoji: '🐢', es: 'Tortuga', targetText: 'De Schildpad', subText: 'Pronunciación: Sjíldpad', audioText: 'De schildpad', audioLang: 'nl-BE', level: 5, category: 'Animales' },
  // Level 6: Frases Cortas en Flamenco
  { id: 'fl_fr_big_dog', emoji: '🐕', es: 'El perro grande', targetText: 'De grote hond', subText: 'Pronunciación: De jrote hond', audioText: 'De grote hond', audioLang: 'nl-BE', level: 6, category: 'Frases', isPhrase: true },
  { id: 'fl_fr_red_apple', emoji: '🍎', es: 'La manzana roja', targetText: 'De rode appel', subText: 'Pronunciación: De rode ápel', audioText: 'De rode appel', audioLang: 'nl-BE', level: 6, category: 'Frases', isPhrase: true },
  { id: 'fl_fr_small_cat', emoji: '🐱', es: 'El gato pequeño', targetText: 'De kleine kat', subText: 'Pronunciación: De kléine kat', audioText: 'De kleine kat', audioLang: 'nl-BE', level: 6, category: 'Frases', isPhrase: true },
  { id: 'fl_fr_blue_car', emoji: '🚙', es: 'El coche azul', targetText: 'De blauwe auto', subText: 'Pronunciación: De bláuwe auto', audioText: 'De blauwe auto', audioLang: 'nl-BE', level: 6, category: 'Frases', isPhrase: true },
  { id: 'fl_fr_pretty_flower', emoji: '🌺', es: 'Una flor bonita', targetText: 'Een mooie bloem', subText: 'Pronunciación: En móie blum', audioText: 'Een mooie bloem', audioLang: 'nl-BE', level: 6, category: 'Frases', isPhrase: true },
  { id: 'fl_fr_sweet_milk', emoji: '🥛', es: 'Leche calentita', targetText: 'Warme melk', subText: 'Pronunciación: Várme melk', audioText: 'Warme melk', audioLang: 'nl-BE', level: 6, category: 'Frases', isPhrase: true },
  // Level 7: Saludos y Expresiones en Flamenco
  { id: 'fl_fr_good_morning', emoji: '🌅', es: 'Buenos días', targetText: 'Goedemorgen', subText: 'Pronunciación: Júdemorjen', audioText: 'Goedemorgen', audioLang: 'nl-BE', level: 7, category: 'Saludos', isPhrase: true },
  { id: 'fl_fr_thank_you', emoji: '🙏', es: 'Muchas gracias', targetText: 'Dank u wel', subText: 'Pronunciación: Dank u vel', audioText: 'Dank u wel', audioLang: 'nl-BE', level: 7, category: 'Cortesía', isPhrase: true },
  { id: 'fl_fr_good_night', emoji: '🌠', es: 'Buenas noches', targetText: 'Slaapwel', subText: 'Pronunciación: Slápvel', audioText: 'Slaapwel', audioLang: 'nl-BE', level: 7, category: 'Saludos', isPhrase: true },
  { id: 'fl_fr_please', emoji: '✨', es: 'Por favor', targetText: 'Alstublieft', subText: 'Pronunciación: Alstublíft', audioText: 'Alstublieft', audioLang: 'nl-BE', level: 7, category: 'Cortesía', isPhrase: true },
  { id: 'fl_fr_hello_friend', emoji: '👋', es: 'Hola amigo', targetText: 'Dag vriend', subText: 'Pronunciación: Daj frind', audioText: 'Dag vriend', audioLang: 'nl-BE', level: 7, category: 'Saludos', isPhrase: true },
  { id: 'fl_fr_well_done', emoji: '🏆', es: '¡Bien hecho!', targetText: 'Goed gedaan', subText: 'Pronunciación: Jud jedán', audioText: 'Goed gedaan', audioLang: 'nl-BE', level: 7, category: 'Expresiones', isPhrase: true },
  // Level 8: Oraciones Completas en Flamenco
  { id: 'fl_fr_sun_shines', emoji: '☀️', es: 'El sol brilla', targetText: 'De zon schijnt', subText: 'Pronunciación: De zon sjéint', audioText: 'De zon schijnt', audioLang: 'nl-BE', level: 8, category: 'Oraciones', isPhrase: true },
  { id: 'fl_fr_i_am_happy', emoji: '😄', es: 'Estoy muy feliz', targetText: 'Ik ben blij', subText: 'Pronunciación: Ik ben bléi', audioText: 'Ik ben blij', audioLang: 'nl-BE', level: 8, category: 'Oraciones', isPhrase: true },
  { id: 'fl_fr_bird_flies', emoji: '🐦', es: 'El pájaro vuela', targetText: 'De vogel vliegt', subText: 'Pronunciación: De fójel flijt', audioText: 'De vogel vliegt', audioLang: 'nl-BE', level: 8, category: 'Oraciones', isPhrase: true },
  { id: 'fl_fr_i_read_book', emoji: '📖', es: 'Yo leo un libro', targetText: 'Ik lees een boek', subText: 'Pronunciación: Ik les en buk', audioText: 'Ik lees een boek', audioLang: 'nl-BE', level: 8, category: 'Oraciones', isPhrase: true },
  { id: 'fl_fr_we_play', emoji: '⚽', es: 'Jugamos juntos', targetText: 'Wij spelen samen', subText: 'Pronunciación: Véi spelen samen', audioText: 'Wij spelen samen', audioLang: 'nl-BE', level: 8, category: 'Oraciones', isPhrase: true },
  { id: 'fl_fr_fish_swims', emoji: '🐟', es: 'El pez nada', targetText: 'De vis zwemt', subText: 'Pronunciación: De vis zvemt', audioText: 'De vis zwemt', audioLang: 'nl-BE', level: 8, category: 'Oraciones', isPhrase: true },
];

// 4. ÁRABE (Burbujas del Genio - Levels 1-5 Words, Levels 6-8 Arabic Phrases) - 60 items
export const ARABIC_LEARNING_ITEMS: LearningItem[] = [
  // Level 1
  { id: 'ar_lion', emoji: '🦁', es: 'León', targetText: 'أسد', subText: 'Asad', audioText: 'أسد', audioLang: 'ar-SA', level: 1, category: 'Animales' },
  { id: 'ar_cat', emoji: '🐱', es: 'Gato', targetText: 'قطة', subText: 'Qitta', audioText: 'قطة', audioLang: 'ar-SA', level: 1, category: 'Animales' },
  { id: 'ar_dog', emoji: '🐶', es: 'Perro', targetText: 'كلب', subText: 'Kalb', audioText: 'كلب', audioLang: 'ar-SA', level: 1, category: 'Animales' },
  { id: 'ar_elephant', emoji: '🐘', es: 'Elefante', targetText: 'فيل', subText: 'Fil', audioText: 'فيل', audioLang: 'ar-SA', level: 1, category: 'Animales' },
  { id: 'ar_sun', emoji: '☀️', es: 'Sol', targetText: 'شمس', subText: 'Shams', audioText: 'شمس', audioLang: 'ar-SA', level: 1, category: 'Naturaleza' },
  { id: 'ar_moon', emoji: '🌙', es: 'Luna', targetText: 'قمر', subText: 'Qamar', audioText: 'قمر', audioLang: 'ar-SA', level: 1, category: 'Espacio' },
  { id: 'ar_bear', emoji: '🐻', es: 'Oso', targetText: 'دب', subText: 'Dubb', audioText: 'دب', audioLang: 'ar-SA', level: 1, category: 'Animales' },
  { id: 'ar_duck', emoji: '🦆', es: 'Pato', targetText: 'بطة', subText: 'Batta', audioText: 'بطة', audioLang: 'ar-SA', level: 1, category: 'Animales' },
  // Level 2
  { id: 'ar_apple', emoji: '🍎', es: 'Manzana', targetText: 'تفاحة', subText: 'Tuffaha', audioText: 'تفاحة', audioLang: 'ar-SA', level: 2, category: 'Comida' },
  { id: 'ar_banana', emoji: '🍌', es: 'Plátano', targetText: 'موزة', subText: 'Mawza', audioText: 'موزة', audioLang: 'ar-SA', level: 2, category: 'Comida' },
  { id: 'ar_orange', emoji: '🍊', es: 'Naranja', targetText: 'برتقال', subText: 'Burtuqal', audioText: 'برتقال', audioLang: 'ar-SA', level: 2, category: 'Comida' },
  { id: 'ar_water', emoji: '💧', es: 'Agua', targetText: 'ماء', subText: "Ma'a", audioText: 'ماء', audioLang: 'ar-SA', level: 2, category: 'Naturaleza' },
  { id: 'ar_milk', emoji: '🥛', es: 'Leche', targetText: 'حليب', subText: 'Halib', audioText: 'حليب', audioLang: 'ar-SA', level: 2, category: 'Comida' },
  { id: 'ar_bread', emoji: '🍞', es: 'Pan', targetText: 'خبز', subText: 'Khubz', audioText: 'خبز', audioLang: 'ar-SA', level: 2, category: 'Comida' },
  { id: 'ar_strawberry', emoji: '🍓', es: 'Fresa', targetText: 'فراولة', subText: 'Farawla', audioText: 'فراولة', audioLang: 'ar-SA', level: 2, category: 'Comida' },
  { id: 'ar_grapes', emoji: '🍇', es: 'Uvas', targetText: 'عنب', subText: 'Inab', audioText: 'عنب', audioLang: 'ar-SA', level: 2, category: 'Comida' },
  // Level 3
  { id: 'ar_house', emoji: '🏠', es: 'Casa', targetText: 'بيت', subText: 'Bayt', audioText: 'بيت', audioLang: 'ar-SA', level: 3, category: 'Hogar' },
  { id: 'ar_tree', emoji: '🌳', es: 'Árbol', targetText: 'شجرة', subText: 'Shajara', audioText: 'شجرة', audioLang: 'ar-SA', level: 3, category: 'Naturaleza' },
  { id: 'ar_flower', emoji: '🌸', es: 'Flor', targetText: 'زهرة', subText: 'Zahra', audioText: 'زهرة', audioLang: 'ar-SA', level: 3, category: 'Naturaleza' },
  { id: 'ar_fish', emoji: '🐟', es: 'Pez', targetText: 'سمكة', subText: 'Samaka', audioText: 'سمكة', audioLang: 'ar-SA', level: 3, category: 'Animales' },
  { id: 'ar_bird', emoji: '🐦', es: 'Pájaro', targetText: 'عصفور', subText: 'Usfur', audioText: 'عصفور', audioLang: 'ar-SA', level: 3, category: 'Animales' },
  { id: 'ar_star', emoji: '⭐', es: 'Estrella', targetText: 'نجمة', subText: 'Najma', audioText: 'نجمة', audioLang: 'ar-SA', level: 3, category: 'Espacio' },
  { id: 'ar_sea', emoji: '🌊', es: 'Mar', targetText: 'بحر', subText: 'Bahr', audioText: 'بحر', audioLang: 'ar-SA', level: 3, category: 'Naturaleza' },
  { id: 'ar_cloud', emoji: '☁️', es: 'Nube', targetText: 'سحابة', subText: 'Sahaba', audioText: 'سحابة', audioLang: 'ar-SA', level: 3, category: 'Clima' },
  // Level 4
  { id: 'ar_car', emoji: '🚗', es: 'Coche', targetText: 'سيارة', subText: 'Sayyara', audioText: 'سيارة', audioLang: 'ar-SA', level: 4, category: 'Transporte' },
  { id: 'ar_airplane', emoji: '✈️', es: 'Avión', targetText: 'طائرة', subText: "Ta'ira", audioText: 'طائرة', audioLang: 'ar-SA', level: 4, category: 'Transporte' },
  { id: 'ar_book', emoji: '📖', es: 'Libro', targetText: 'كتاب', subText: 'Kitab', audioText: 'كتاب', audioLang: 'ar-SA', level: 4, category: 'Escuela' },
  { id: 'ar_cheese', emoji: '🧀', es: 'Queso', targetText: 'جبنة', subText: 'Jubna', audioText: 'جبنة', audioLang: 'ar-SA', level: 4, category: 'Comida' },
  { id: 'ar_horse', emoji: '🐴', es: 'Caballo', targetText: 'حصان', subText: 'Hisan', audioText: 'حصان', audioLang: 'ar-SA', level: 4, category: 'Animales' },
  { id: 'ar_rabbit', emoji: '🐰', es: 'Conejo', targetText: 'أرنب', subText: 'Arnab', audioText: 'أرنب', audioLang: 'ar-SA', level: 4, category: 'Animales' },
  { id: 'ar_train', emoji: '🚂', es: 'Tren', targetText: 'قطار', subText: 'Qitar', audioText: 'قطار', audioLang: 'ar-SA', level: 4, category: 'Transporte' },
  { id: 'ar_ship', emoji: '⛵', es: 'Barco', targetText: 'سفينة', subText: 'Safina', audioText: 'سفينة', audioLang: 'ar-SA', level: 4, category: 'Transporte' },
  // Level 5
  { id: 'ar_butterfly', emoji: '🦋', es: 'Mariposa', targetText: 'فراشة', subText: 'Farasha', audioText: 'فراشة', audioLang: 'ar-SA', level: 5, category: 'Animales' },
  { id: 'ar_school', emoji: '🏫', es: 'Escuela', targetText: 'مدرسة', subText: 'Madrasa', audioText: 'مدرسة', audioLang: 'ar-SA', level: 5, category: 'Escuela' },
  { id: 'ar_key', emoji: '🔑', es: 'Llave', targetText: 'مفتاح', subText: 'Miftah', audioText: 'مفتاح', audioLang: 'ar-SA', level: 5, category: 'Hogar' },
  { id: 'ar_crown', emoji: '👑', es: 'Corona', targetText: 'تاج', subText: 'Taj', audioText: 'تاج', audioLang: 'ar-SA', level: 5, category: 'Fantasía' },
  { id: 'ar_camel', emoji: '🐪', es: 'Camello', targetText: 'جمل', subText: 'Jamal', audioText: 'جمل', audioLang: 'ar-SA', level: 5, category: 'Animales' },
  { id: 'ar_rocket', emoji: '🚀', es: 'Cohete', targetText: 'صاروخ', subText: 'Sarukh', audioText: 'صاروخ', audioLang: 'ar-SA', level: 5, category: 'Espacio' },
  { id: 'ar_turtle', emoji: '🐢', es: 'Tortuga', targetText: 'سلحفاة', subText: 'Sulhafa', audioText: 'سلحفاة', audioLang: 'ar-SA', level: 5, category: 'Animales' },
  { id: 'ar_castle', emoji: '🏰', es: 'Castillo', targetText: 'قلعة', subText: "Qal'a", audioText: 'قلعة', audioLang: 'ar-SA', level: 5, category: 'Fantasía' },
  { id: 'ar_rainbow', emoji: '🌈', es: 'Arcoíris', targetText: 'قوس قزح', subText: 'Qaws Quzah', audioText: 'قوس قزح', audioLang: 'ar-SA', level: 5, category: 'Clima' },
  { id: 'ar_diamond', emoji: '💎', es: 'Diamante', targetText: 'ألماس', subText: 'Almas', audioText: 'ألماس', audioLang: 'ar-SA', level: 5, category: 'Tesoro' },
  // Level 6: Frases Cortas en Árabe
  { id: 'ar_fr_big_lion', emoji: '🦁', es: 'El león grande', targetText: 'الأسد الكبير', subText: 'Al-asad al-kabir', audioText: 'الأسد الكبير', audioLang: 'ar-SA', level: 6, category: 'Frases', isPhrase: true },
  { id: 'ar_fr_red_apple', emoji: '🍎', es: 'La manzana roja', targetText: 'التفاحة الحمراء', subText: 'At-tuffaha al-hamra', audioText: 'التفاحة الحمراء', audioLang: 'ar-SA', level: 6, category: 'Frases', isPhrase: true },
  { id: 'ar_fr_small_cat', emoji: '🐱', es: 'El gato pequeño', targetText: 'القطة الصغيرة', subText: 'Al-qitta as-saghira', audioText: 'القطة الصغيرة', audioLang: 'ar-SA', level: 6, category: 'Frases', isPhrase: true },
  { id: 'ar_fr_pretty_house', emoji: '🏠', es: 'La casa bonita', targetText: 'البيت الجميل', subText: 'Al-bayt al-jamil', audioText: 'البيت الجميل', audioLang: 'ar-SA', level: 6, category: 'Frases', isPhrase: true },
  { id: 'ar_fr_fast_car', emoji: '🏎️', es: 'El coche rápido', targetText: 'السيارة السريعة', subText: 'As-sayyara as-sari’a', audioText: 'السيارة السريعة', audioLang: 'ar-SA', level: 6, category: 'Frases', isPhrase: true },
  { id: 'ar_fr_bright_moon', emoji: '🌕', es: 'La luna llena', targetText: 'القمر المنير', subText: 'Al-qamar al-munir', audioText: 'القمر المنير', audioLang: 'ar-SA', level: 6, category: 'Frases', isPhrase: true },
  // Level 7: Saludos y Expresiones en Árabe
  { id: 'ar_fr_good_morning', emoji: '🌅', es: 'Buenos días', targetText: 'صباح الخير', subText: 'Sabah al-khayr', audioText: 'صباح الخير', audioLang: 'ar-SA', level: 7, category: 'Saludos', isPhrase: true },
  { id: 'ar_fr_thank_you', emoji: '🙏', es: 'Muchas gracias', targetText: 'شكراً جزيلاً', subText: 'Shukran jazilan', audioText: 'شكراً جزيلاً', audioLang: 'ar-SA', level: 7, category: 'Cortesía', isPhrase: true },
  { id: 'ar_fr_good_night', emoji: '🌠', es: 'Buenas noches', targetText: 'تصبح على خير', subText: 'Tusbih ala khayr', audioText: 'تصبح على خير', audioLang: 'ar-SA', level: 7, category: 'Saludos', isPhrase: true },
  { id: 'ar_fr_welcome', emoji: '🤗', es: 'Bienvenido amigo', targetText: 'أهلاً يا صديقي', subText: 'Ahlan ya sadiqi', audioText: 'أهلاً يا صديقي', audioLang: 'ar-SA', level: 7, category: 'Saludos', isPhrase: true },
  { id: 'ar_fr_please', emoji: '✨', es: 'Por favor', targetText: 'من فضلك', subText: 'Min fadlik', audioText: 'من فضلك', audioLang: 'ar-SA', level: 7, category: 'Cortesía', isPhrase: true },
  { id: 'ar_fr_bravo', emoji: '🏆', es: '¡Excelente trabajo!', targetText: 'عمل رائع', subText: 'Amal ra’i', audioText: 'عمل رائع', audioLang: 'ar-SA', level: 7, category: 'Expresiones', isPhrase: true },
  // Level 8: Oraciones Completas en Árabe
  { id: 'ar_fr_sun_shines', emoji: '☀️', es: 'El sol está brillando', targetText: 'الشمس مشرقة', subText: 'Ash-shams mushriqa', audioText: 'الشمس مشرقة', audioLang: 'ar-SA', level: 8, category: 'Oraciones', isPhrase: true },
  { id: 'ar_fr_i_am_happy', emoji: '😄', es: 'Estoy muy feliz', targetText: 'أنا سعيد جداً', subText: 'Ana sa’id jiddan', audioText: 'أنا سعيد جداً', audioLang: 'ar-SA', level: 8, category: 'Oraciones', isPhrase: true },
  { id: 'ar_fr_i_love_reading', emoji: '📖', es: 'Me gusta leer', targetText: 'أحب القراءة', subText: 'Uhibbu al-qira’a', audioText: 'أحب القراءة', audioLang: 'ar-SA', level: 8, category: 'Oraciones', isPhrase: true },
  { id: 'ar_fr_bird_sings', emoji: '🐦', es: 'El pájaro canta', targetText: 'العصفور يغرد', subText: 'Al-usfur yugharrid', audioText: 'العصفور يغرد', audioLang: 'ar-SA', level: 8, category: 'Oraciones', isPhrase: true },
  { id: 'ar_fr_we_play', emoji: '⚽', es: 'Jugamos juntos', targetText: 'نحن نلعب معاً', subText: 'Nahnu nal’ab ma’an', audioText: 'نحن نلعب معاً', audioLang: 'ar-SA', level: 8, category: 'Oraciones', isPhrase: true },
  { id: 'ar_fr_fish_sea', emoji: '🐟', es: 'El pez en el mar', targetText: 'السمكة في البحر', subText: 'As-samaka fi al-bahr', audioText: 'السمكة في البحر', audioLang: 'ar-SA', level: 8, category: 'Oraciones', isPhrase: true },
];

// 5. FRANCÉS (El Chef de París - Levels 1-5 Words, Levels 6-8 French Phrases) - 60 items
export const FRENCH_LEARNING_ITEMS: LearningItem[] = [
  // Level 1
  { id: 'fr_apple', emoji: '🍎', es: 'Manzana', targetText: 'La Pomme', subText: 'Pronunciación: Pom', audioText: 'La pomme', audioLang: 'fr-FR', level: 1, category: 'Comida' },
  { id: 'fr_croissant', emoji: '🥐', es: 'Cruasán', targetText: 'Le Croissant', subText: 'Pronunciación: Cruasán', audioText: 'Le croissant', audioLang: 'fr-FR', level: 1, category: 'Comida' },
  { id: 'fr_cheese', emoji: '🧀', es: 'Queso', targetText: 'Le Fromage', subText: 'Pronunciación: Fromash', audioText: 'Le fromage', audioLang: 'fr-FR', level: 1, category: 'Comida' },
  { id: 'fr_cat', emoji: '🐱', es: 'Gato', targetText: 'Le Chat', subText: 'Pronunciación: Sha', audioText: 'Le chat', audioLang: 'fr-FR', level: 1, category: 'Animales' },
  { id: 'fr_dog', emoji: '🐶', es: 'Perro', targetText: 'Le Chien', subText: 'Pronunciación: Shian', audioText: 'Le chien', audioLang: 'fr-FR', level: 1, category: 'Animales' },
  { id: 'fr_sun', emoji: '☀️', es: 'Sol', targetText: 'Le Soleil', subText: 'Pronunciación: Soléi', audioText: 'Le soleil', audioLang: 'fr-FR', level: 1, category: 'Naturaleza' },
  { id: 'fr_banana', emoji: '🍌', es: 'Plátano', targetText: 'La Banane', subText: 'Pronunciación: Banán', audioText: 'La banane', audioLang: 'fr-FR', level: 1, category: 'Comida' },
  { id: 'fr_cow', emoji: '🐮', es: 'Vaca', targetText: 'La Vache', subText: 'Pronunciación: Vash', audioText: 'La vache', audioLang: 'fr-FR', level: 1, category: 'Animales' },
  // Level 2
  { id: 'fr_bread', emoji: '🥖', es: 'Pan', targetText: 'Le Pain', subText: 'Pronunciación: Pan', audioText: 'Le pain', audioLang: 'fr-FR', level: 2, category: 'Comida' },
  { id: 'fr_milk', emoji: '🥛', es: 'Leche', targetText: 'Le Lait', subText: 'Pronunciación: Le', audioText: 'Le lait', audioLang: 'fr-FR', level: 2, category: 'Comida' },
  { id: 'fr_strawberry', emoji: '🍓', es: 'Fresa', targetText: 'La Fraise', subText: 'Pronunciación: Fres', audioText: 'La fraise', audioLang: 'fr-FR', level: 2, category: 'Comida' },
  { id: 'fr_cake', emoji: '🍰', es: 'Pastel', targetText: 'Le Gâteau', subText: 'Pronunciación: Gató', audioText: 'Le gâteau', audioLang: 'fr-FR', level: 2, category: 'Comida' },
  { id: 'fr_egg', emoji: '🥚', es: 'Huevo', targetText: "L'Œuf", subText: 'Pronunciación: Lof', audioText: "L'œuf", audioLang: 'fr-FR', level: 2, category: 'Comida' },
  { id: 'fr_water', emoji: '💧', es: 'Agua', targetText: "L'Eau", subText: 'Pronunciación: Lo', audioText: "L'eau", audioLang: 'fr-FR', level: 2, category: 'Naturaleza' },
  { id: 'fr_orange', emoji: '🍊', es: 'Naranja', targetText: "L'Orange", subText: 'Pronunciación: Loránsh', audioText: "L'orange", audioLang: 'fr-FR', level: 2, category: 'Comida' },
  { id: 'fr_grapes', emoji: '🍇', es: 'Uvas', targetText: 'Le Raisin', subText: 'Pronunciación: Resán', audioText: 'Le raisin', audioLang: 'fr-FR', level: 2, category: 'Comida' },
  // Level 3
  { id: 'fr_butterfly', emoji: '🦋', es: 'Mariposa', targetText: 'Le Papillon', subText: 'Pronunciación: Papiyón', audioText: 'Le papillon', audioLang: 'fr-FR', level: 3, category: 'Animales' },
  { id: 'fr_star', emoji: '⭐', es: 'Estrella', targetText: "L'Étoile", subText: 'Pronunciación: Letuál', audioText: "L'étoile", audioLang: 'fr-FR', level: 3, category: 'Espacio' },
  { id: 'fr_bird', emoji: '🐦', es: 'Pájaro', targetText: "L'Oiseau", subText: 'Pronunciación: Luasó', audioText: "L'oiseau", audioLang: 'fr-FR', level: 3, category: 'Animales' },
  { id: 'fr_flower', emoji: '🌸', es: 'Flor', targetText: 'La Fleur', subText: 'Pronunciación: Fler', audioText: 'La fleur', audioLang: 'fr-FR', level: 3, category: 'Naturaleza' },
  { id: 'fr_moon', emoji: '🌙', es: 'Luna', targetText: 'La Lune', subText: 'Pronunciación: Lun', audioText: 'La lune', audioLang: 'fr-FR', level: 3, category: 'Espacio' },
  { id: 'fr_fish', emoji: '🐟', es: 'Pez', targetText: 'Le Poisson', subText: 'Pronunciación: Puasón', audioText: 'Le poisson', audioLang: 'fr-FR', level: 3, category: 'Animales' },
  { id: 'fr_tree', emoji: '🌳', es: 'Árbol', targetText: "L'Arbre", subText: 'Pronunciación: Larbr', audioText: "L'arbre", audioLang: 'fr-FR', level: 3, category: 'Naturaleza' },
  { id: 'fr_horse', emoji: '🐴', es: 'Caballo', targetText: 'Le Cheval', subText: 'Pronunciación: Shevál', audioText: 'Le cheval', audioLang: 'fr-FR', level: 3, category: 'Animales' },
  // Level 4
  { id: 'fr_house', emoji: '🏠', es: 'Casa', targetText: 'La Maison', subText: 'Pronunciación: Mesón', audioText: 'La maison', audioLang: 'fr-FR', level: 4, category: 'Hogar' },
  { id: 'fr_car', emoji: '🚗', es: 'Coche', targetText: 'La Voiture', subText: 'Pronunciación: Vuatur', audioText: 'La voiture', audioLang: 'fr-FR', level: 4, category: 'Transporte' },
  { id: 'fr_bike', emoji: '🚲', es: 'Bicicleta', targetText: 'Le Vélo', subText: 'Pronunciación: Veló', audioText: 'Le vélo', audioLang: 'fr-FR', level: 4, category: 'Transporte' },
  { id: 'fr_boat', emoji: '🚢', es: 'Barco', targetText: 'Le Bateau', subText: 'Pronunciación: Bató', audioText: 'Le bateau', audioLang: 'fr-FR', level: 4, category: 'Transporte' },
  { id: 'fr_lion', emoji: '🦁', es: 'León', targetText: 'Le Lion', subText: 'Pronunciación: Lión', audioText: 'Le lion', audioLang: 'fr-FR', level: 4, category: 'Animales' },
  { id: 'fr_book', emoji: '📖', es: 'Libro', targetText: 'Le Livre', subText: 'Pronunciación: Livr', audioText: 'Le livre', audioLang: 'fr-FR', level: 4, category: 'Escuela' },
  { id: 'fr_train', emoji: '🚂', es: 'Tren', targetText: 'Le Train', subText: 'Pronunciación: Tran', audioText: 'Le train', audioLang: 'fr-FR', level: 4, category: 'Transporte' },
  { id: 'fr_plane', emoji: '✈️', es: 'Avión', targetText: "L'Avion", subText: 'Pronunciación: Lavión', audioText: "L'avion", audioLang: 'fr-FR', level: 4, category: 'Transporte' },
  // Level 5
  { id: 'fr_rainbow', emoji: '🌈', es: 'Arcoíris', targetText: "L'Arc-en-ciel", subText: 'Pronunciación: Arkansiel', audioText: "L'arc-en-ciel", audioLang: 'fr-FR', level: 5, category: 'Clima' },
  { id: 'fr_mushroom', emoji: '🍄', es: 'Seta', targetText: 'Le Champignon', subText: 'Pronunciación: Shampiñón', audioText: 'Le champignon', audioLang: 'fr-FR', level: 5, category: 'Naturaleza' },
  { id: 'fr_rabbit', emoji: '🐰', es: 'Conejo', targetText: 'Le Lapin', subText: 'Pronunciación: Lapán', audioText: 'Le lapin', audioLang: 'fr-FR', level: 5, category: 'Animales' },
  { id: 'fr_icecream', emoji: '🍦', es: 'Helado', targetText: 'La Glace', subText: 'Pronunciación: Glas', audioText: 'La glace', audioLang: 'fr-FR', level: 5, category: 'Comida' },
  { id: 'fr_crown', emoji: '👑', es: 'Corona', targetText: 'La Couronne', subText: 'Pronunciación: Curón', audioText: 'La couronne', audioLang: 'fr-FR', level: 5, category: 'Fantasía' },
  { id: 'fr_castle', emoji: '🏰', es: 'Castillo', targetText: 'Le Château', subText: 'Pronunciación: Sható', audioText: 'Le château', audioLang: 'fr-FR', level: 5, category: 'Fantasía' },
  { id: 'fr_rocket', emoji: '🚀', es: 'Cohete', targetText: 'La Fusée', subText: 'Pronunciación: Füze', audioText: 'La fusée', audioLang: 'fr-FR', level: 5, category: 'Espacio' },
  { id: 'fr_turtle', emoji: '🐢', es: 'Tortuga', targetText: 'La Tortue', subText: 'Pronunciación: Tortü', audioText: 'La tortue', audioLang: 'fr-FR', level: 5, category: 'Animales' },
  { id: 'fr_frog', emoji: '🐸', es: 'Rana', targetText: 'La Grenouille', subText: 'Pronunciación: Grenúi', audioText: 'La grenouille', audioLang: 'fr-FR', level: 5, category: 'Animales' },
  { id: 'fr_diamond', emoji: '💎', es: 'Diamante', targetText: 'Le Diamant', subText: 'Pronunciación: Diamán', audioText: 'Le diamant', audioLang: 'fr-FR', level: 5, category: 'Tesoro' },
  // Level 6: Frases Cortas en Francés
  { id: 'fr_fr_small_cat', emoji: '🐱', es: 'El gatito pequeño', targetText: 'Le petit chat', subText: 'Pronunciación: Le petí sha', audioText: 'Le petit chat', audioLang: 'fr-FR', level: 6, category: 'Frases', isPhrase: true },
  { id: 'fr_fr_red_apple', emoji: '🍎', es: 'La manzana roja', targetText: 'La pomme rouge', subText: 'Pronunciación: La pom rush', audioText: 'La pomme rouge', audioLang: 'fr-FR', level: 6, category: 'Frases', isPhrase: true },
  { id: 'fr_fr_big_dog', emoji: '🐕', es: 'El perro grande', targetText: 'Le grand chien', subText: 'Pronunciación: Le gran shian', audioText: 'Le grand chien', audioLang: 'fr-FR', level: 6, category: 'Frases', isPhrase: true },
  { id: 'fr_fr_good_cake', emoji: '🎂', es: 'Un pastel delicioso', targetText: 'Un bon gâteau', subText: 'Pronunciación: An bon gató', audioText: 'Un bon gâteau', audioLang: 'fr-FR', level: 6, category: 'Frases', isPhrase: true },
  { id: 'fr_fr_pretty_flower', emoji: '🌺', es: 'La flor bonita', targetText: 'La jolie fleur', subText: 'Pronunciación: La sholí fler', audioText: 'La jolie fleur', audioLang: 'fr-FR', level: 6, category: 'Frases', isPhrase: true },
  { id: 'fr_fr_big_castle', emoji: '🏰', es: 'Un gran castillo', targetText: 'Un grand château', subText: 'Pronunciación: An gran sható', audioText: 'Un grand château', audioLang: 'fr-FR', level: 6, category: 'Frases', isPhrase: true },
  // Level 7: Saludos y Expresiones en Francés
  { id: 'fr_fr_hello_friend', emoji: '👋', es: 'Hola amigo mío', targetText: 'Bonjour mon ami', subText: 'Pronunciación: Bonshúr mon amí', audioText: 'Bonjour mon ami', audioLang: 'fr-FR', level: 7, category: 'Saludos', isPhrase: true },
  { id: 'fr_fr_thank_you', emoji: '🙏', es: 'Muchas gracias', targetText: 'Merci beaucoup', subText: 'Pronunciación: Mersí bocú', audioText: 'Merci beaucoup', audioLang: 'fr-FR', level: 7, category: 'Cortesía', isPhrase: true },
  { id: 'fr_fr_good_night', emoji: '🌠', es: 'Buenas noches', targetText: 'Bonne nuit', subText: 'Pronunciación: Bon nuí', audioText: 'Bonne nuit', audioLang: 'fr-FR', level: 7, category: 'Saludos', isPhrase: true },
  { id: 'fr_fr_please', emoji: '✨', es: 'Por favor', targetText: "S'il te plaît", subText: 'Pronunciación: Sil te ple', audioText: "S'il te plaît", audioLang: 'fr-FR', level: 7, category: 'Cortesía', isPhrase: true },
  { id: 'fr_fr_bon_appetit', emoji: '🍽️', es: '¡Buen provecho!', targetText: 'Bon appétit', subText: 'Pronunciación: Bon apetí', audioText: 'Bon appétit', audioLang: 'fr-FR', level: 7, category: 'Expresiones', isPhrase: true },
  { id: 'fr_fr_very_well', emoji: '🏆', es: '¡Muy bien hecho!', targetText: 'Très bien joué', subText: 'Pronunciación: Tre bian shuée', audioText: 'Très bien joué', audioLang: 'fr-FR', level: 7, category: 'Expresiones', isPhrase: true },
  // Level 8: Oraciones Completas en Francés
  { id: 'fr_fr_sun_shines', emoji: '☀️', es: 'El sol brilla', targetText: 'Le soleil brille', subText: 'Pronunciación: Le soléi bríi', audioText: 'Le soleil brille', audioLang: 'fr-FR', level: 8, category: 'Oraciones', isPhrase: true },
  { id: 'fr_fr_i_am_happy', emoji: '😄', es: 'Estoy muy contento', targetText: 'Je suis très content', subText: 'Pronunciación: She suí tre contán', audioText: 'Je suis très content', audioLang: 'fr-FR', level: 8, category: 'Oraciones', isPhrase: true },
  { id: 'fr_fr_bird_sings', emoji: '🐦', es: 'El pájaro canta', targetText: "L'oiseau chante", subText: 'Pronunciación: Luasó shant', audioText: "L'oiseau chante", audioLang: 'fr-FR', level: 8, category: 'Oraciones', isPhrase: true },
  { id: 'fr_fr_i_eat_apple', emoji: '🍎', es: 'Yo como una manzana', targetText: 'Je mange une pomme', subText: 'Pronunciación: She mansh ün pom', audioText: 'Je mange une pomme', audioLang: 'fr-FR', level: 8, category: 'Oraciones', isPhrase: true },
  { id: 'fr_fr_we_play', emoji: '⚽', es: 'Jugamos juntos', targetText: 'Nous jouons ensemble', subText: 'Pronunciación: Nu shuón ansámbl', audioText: 'Nous jouons ensemble', audioLang: 'fr-FR', level: 8, category: 'Oraciones', isPhrase: true },
  { id: 'fr_fr_rocket_space', emoji: '🚀', es: 'El cohete va al espacio', targetText: 'La fusée va dans le ciel', subText: 'Pronunciación: La füze va dan le siel', audioText: 'La fusée va dans le ciel', audioLang: 'fr-FR', level: 8, category: 'Oraciones', isPhrase: true },
];

export const ALL_LEARNING_ITEMS: LearningItem[] = [
  ...SPANISH_VOCAB_ITEMS,
  ...ALPHABET_LEARNING_ITEMS,
  ...FLEMISH_LEARNING_ITEMS,
  ...ARABIC_LEARNING_ITEMS,
  ...FRENCH_LEARNING_ITEMS,
];
