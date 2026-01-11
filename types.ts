export enum TTSMode {
  SINGLE = 'SINGLE',
}

export interface Voice {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  style: string;
}

export interface Production {
  id: string;
  name: string;
  type: TTSMode;
  audioUrl: string; 
  srtUrl?: string;
  createdAt: number;
}

export interface VoiceSettings {
  voiceId: string;
  speed: number;
  pitch: number; 
  style: string;
}