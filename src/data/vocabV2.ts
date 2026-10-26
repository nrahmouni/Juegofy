import { LearningItemV2 } from '../types/learning';

/** Vocabulario unificado multi-idioma (ejemplo inicial) */
export const VOCAB_ITEMS: LearningItemV2[] = [
  // Animales
  {
    id: 'dog',
    icon: '🐶',
    translations: { es: 'perro', en: 'dog', fr: 'chien', ar: 'كلب', nl: 'hond' },
    level: 1,
    category: 'animals',
  },
  {
    id: 'cat',
    icon: '🐱',
    translations: { es: 'gato', en: 'cat', fr: 'chat', ar: 'قط', nl: 'kat' },
    level: 1,
    category: 'animals',
  },
  {
    id: 'bird',
    icon: '🐦',
    translations: { es: 'pájaro', en: 'bird', fr: 'oiseau', ar: 'طائر', nl: 'vogel' },
    level: 1,
    category: 'animals',
  },
  {
    id: 'fish',
    icon: '🐟',
    translations: { es: 'pez', en: 'fish', fr: 'poisson', ar: 'سمكة', nl: 'vis' },
    level: 1,
    category: 'animals',
  },
  {
    id: 'rabbit',
    icon: '🐰',
    translations: { es: 'conejo', en: 'rabbit', fr: 'lapin', ar: 'أرنب', nl: 'konijn' },
    level: 2,
    category: 'animals',
  },
  // Comida
  {
    id: 'apple',
    icon: '🍎',
    translations: { es: 'manzana', en: 'apple', fr: 'pomme', ar: 'تفاحة', nl: 'appel' },
    level: 1,
    category: 'food',
  },
  {
    id: 'bread',
    icon: '🍞',
    translations: { es: 'pan', en: 'bread', fr: 'pain', ar: 'خبز', nl: 'brood' },
    level: 1,
    category: 'food',
  },
  {
    id: 'milk',
    icon: '🥛',
    translations: { es: 'leche', en: 'milk', fr: 'lait', ar: 'حليب', nl: 'melk' },
    level: 1,
    category: 'food',
  },
  {
    id: 'cheese',
    icon: '🧀',
    translations: { es: 'queso', en: 'cheese', fr: 'fromage', ar: 'جبن', nl: 'kaas' },
    level: 2,
    category: 'food',
  },
  // Objetos escuela (para el Point-and-Click)
  {
    id: 'backpack',
    icon: '🎒',
    translations: { es: 'mochila', en: 'backpack', fr: 'sac à dos', ar: 'حقيبة', nl: 'rugzak' },
    level: 2,
    category: 'school',
  },
  {
    id: 'book',
    icon: '📖',
    translations: { es: 'libro', en: 'book', fr: 'livre', ar: 'كتاب', nl: 'boek' },
    level: 1,
    category: 'school',
  },
  {
    id: 'pencil',
    icon: '✏️',
    translations: { es: 'lápiz', en: 'pencil', fr: 'crayon', ar: 'قلم', nl: 'potlood' },
    level: 1,
    category: 'school',
  },
  {
    id: 'key',
    icon: '🔑',
    translations: { es: 'llave', en: 'key', fr: 'clé', ar: 'مفتاح', nl: 'sleutel' },
    level: 2,
    category: 'objects',
  },
  {
    id: 'door',
    icon: '🚪',
    translations: { es: 'puerta', en: 'door', fr: 'porte', ar: 'باب', nl: 'deur' },
    level: 1,
    category: 'objects',
  },
  {
    id: 'window',
    icon: '🪟',
    translations: { es: 'ventana', en: 'window', fr: 'fenêtre', ar: 'نافذة', nl: 'raam' },
    level: 2,
    category: 'objects',
  },
  {
    id: 'chair',
    icon: '🪑',
    translations: { es: 'silla', en: 'chair', fr: 'chaise', ar: 'كرسي', nl: 'stoel' },
    level: 1,
    category: 'objects',
  },
  {
    id: 'desk',
    icon: '🗄️',
    translations: { es: 'pupitre', en: 'desk', fr: 'bureau', ar: 'مكتب', nl: 'bureau' },
    level: 2,
    category: 'school',
  },
];
