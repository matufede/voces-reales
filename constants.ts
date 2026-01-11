import { Voice } from './types';

// Mapping Gemini voices to our UI personas
export const AVAILABLE_VOICES: Voice[] = [
  { id: 'Charon-Arg', name: 'Tomás 🇦🇷', gender: 'Male', style: 'Deep (Argentino)' },
  { id: 'Charon', name: 'Facundo', gender: 'Male', style: 'Deep' },
  { id: 'Fenrir', name: 'Diego', gender: 'Male', style: 'Bright' },
  { id: 'Kore', name: 'Valentina', gender: 'Female', style: 'Soft' },
  { id: 'Aoede', name: 'Camila', gender: 'Female', style: 'Balanced' },
  { id: 'Zephyr', name: 'Lucía', gender: 'Female', style: 'Bright' },
];

export const VOICE_STYLES = [
  'Natural',
  'Infantil',
  'Alegre',
  'Triste',
  'Susurro',
  'Storyteller',
  'Argentino'
];

export const DEFAULT_SCRIPT = ``;