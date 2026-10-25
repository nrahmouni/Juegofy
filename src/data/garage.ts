import { VehicleId, CostumeId } from '../types/game';

export interface VehicleDef {
  id: VehicleId;
  name: string;
  icon: string;
  cost: number;
  description: string;
  speedBonus: string;
}

export interface CostumeDef {
  id: CostumeId;
  name: string;
  icon: string;
  cost: number;
  description: string;
}

export const VEHICLES: VehicleDef[] = [
  {
    id: 'kart',
    name: 'Kart Carrera 🏎️',
    icon: '🏎️',
    cost: 0,
    description: 'Bólido rojo inicial con motor turbo.',
    speedBonus: 'Estándar',
  },
  {
    id: 'rocket',
    name: 'Cohete Galáctico 🚀',
    icon: '🚀',
    cost: 50,
    description: 'Propulsor de plasma para volar super rápido.',
    speedBonus: 'Turbo +15%',
  },
  {
    id: 'ufo',
    name: 'Platillo OVNI 🛸',
    icon: '🛸',
    cost: 100,
    description: 'Nave flotante con antigravedad luminosa.',
    speedBonus: 'Super Agilidad',
  },
  {
    id: 'dragon',
    name: 'Dragón Volador 🐉',
    icon: '🐉',
    cost: 150,
    description: 'Monstruo legendario con fuego y destellos.',
    speedBonus: 'Escudo Fuego',
  },
  {
    id: 'broom',
    name: 'Escoba Mágica 🧹',
    icon: '🧹',
    cost: 200,
    description: 'Escoba voladora de hechicero con rastro estelar.',
    speedBonus: 'Imán Dorado',
  },
  {
    id: 'cyber',
    name: 'Moto Cyberpunk 🏍️',
    icon: '🏍️',
    cost: 300,
    description: 'Super vehículo neón de máxima velocidad.',
    speedBonus: 'Ultra Nitro',
  },
];

export const COSTUMES: CostumeDef[] = [
  {
    id: 'none',
    name: 'Sin Disfraz ✨',
    icon: '✨',
    cost: 0,
    description: 'Aspecto natural de tu avatar.',
  },
  {
    id: 'crown',
    name: 'Corona Real 👑',
    icon: '👑',
    cost: 30,
    description: 'Luce como el rey o la reina de la pista.',
  },
  {
    id: 'hero_cape',
    name: 'Capa Superhéroe 🦸',
    icon: '🦸',
    cost: 60,
    description: '¡Volando a toda velocidad con capa roja!',
  },
  {
    id: 'pirate',
    name: 'Sombrero Pirata 🏴‍☠️',
    icon: '🏴‍☠️',
    cost: 90,
    description: 'Capitán de los mares y buscador de monedas.',
  },
  {
    id: 'astronaut',
    name: 'Casco Astronauta 🧑‍🚀',
    icon: '🧑‍🚀',
    cost: 120,
    description: 'Casco espacial con visera reluciente.',
  },
  {
    id: 'dino',
    name: 'Traje Dinosaurio 🦖',
    icon: '🦖',
    cost: 180,
    description: 'Divertido rugido de T-Rex para espantar bombas.',
  },
  {
    id: 'rainbow_shades',
    name: 'Gafas Arcoíris 😎',
    icon: '😎',
    cost: 250,
    description: 'Estilo legendario con destellos de sol.',
  },
];
