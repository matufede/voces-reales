import React, { useState } from 'react';
import { VoiceSettings } from '../types';
import { AVAILABLE_VOICES, VOICE_STYLES } from '../constants';

interface MixingConsoleProps {
  voiceSettings: VoiceSettings;
  setVoiceSettings: (v: VoiceSettings) => void;
}

const MixingConsole: React.FC<MixingConsoleProps> = ({
  voiceSettings, setVoiceSettings
}) => {
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');

  // Filter voices based on selected gender
  const filteredVoices = AVAILABLE_VOICES.filter(v => 
    genderFilter === 'All' || v.gender === genderFilter
  );

  const VoiceControls = ({ settings, onChange, label, idPrefix }: { settings: VoiceSettings, onChange: (v: VoiceSettings) => void, label: string, idPrefix: string }) => {
    const voiceSelectId = `${idPrefix}-voice-select`;
    const styleGroupId = `${idPrefix}-style-group`;
    const speedId = `${idPrefix}-speed`;
    const pitchId = `${idPrefix}-pitch`;
    const genderGroupId = `${idPrefix}-gender-group`;

    return (
      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700" role="group" aria-labelledby={`${idPrefix}-heading`}>
        <h3 id={`${idPrefix}-heading`} className="text-sm font-bold text-slate-300 uppercase mb-3 tracking-wide">{label}</h3>
        
        {/* Gender Filter */}
        <div className="mb-5">
          <span id={genderGroupId} className="text-xs font-semibold text-slate-400 block mb-2">Filtrar por Género</span>
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700" role="radiogroup" aria-labelledby={genderGroupId}>
            {(['All', 'Male', 'Female'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                  genderFilter === g 
                  ? 'bg-brand-500 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {g === 'All' ? 'Todos' : g === 'Male' ? 'Hombre' : 'Mujer'}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Selector */}
        <div className="mb-5">
          <label htmlFor={voiceSelectId} className="text-xs font-semibold text-slate-400 block mb-1.5">Voz Seleccionada</label>
          <div className="relative">
            <select 
              id={voiceSelectId}
              value={settings.voiceId} 
              onChange={(e) => onChange({...settings, voiceId: e.target.value})}
              className="w-full bg-slate-800 border border-slate-600 rounded p-2.5 text-sm text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/50 outline-none appearance-none"
            >
              {filteredVoices.map(v => (
                <option key={v.id} value={v.id}>{v.name} - {v.style}</option>
              ))}
              {filteredVoices.length === 0 && (
                <option disabled>No hay voces disponibles</option>
              )}
            </select>
            {/* Custom Arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        {/* Style Selector */}
        <div className="mb-5" role="radiogroup" aria-labelledby={styleGroupId}>
          <span id={styleGroupId} className="text-xs font-semibold text-slate-400 block mb-2">Estilo Emocional</span>
          <div className="grid grid-cols-3 gap-2">
            {VOICE_STYLES.map(style => (
              <button
                key={style}
                role="radio"
                aria-checked={settings.style === style}
                onClick={() => onChange({...settings, style})}
                className={`text-xs p-2 rounded font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900 focus:ring-brand-500 ${
                  settings.style === style 
                  ? 'bg-brand-600 border border-brand-500 text-white shadow-md' 
                  : 'border border-slate-600 text-slate-300 hover:border-brand-500 hover:bg-slate-800'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-5">
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <label htmlFor={speedId} className="font-semibold">Velocidad</label>
              <span className="font-mono text-brand-400" aria-hidden="true">{settings.speed}x</span>
            </div>
            <input 
              id={speedId}
              type="range" min="0.5" max="2" step="0.1" 
              value={settings.speed}
              aria-valuemin={0.5}
              aria-valuemax={2}
              aria-valuenow={settings.speed}
              aria-valuetext={`Velocidad ${settings.speed}x`}
              onChange={(e) => onChange({...settings, speed: parseFloat(e.target.value)})}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <label htmlFor={pitchId} className="font-semibold">Tono</label>
              <span className="font-mono text-accent-400" aria-hidden="true">{settings.pitch}</span>
            </div>
            <input 
              id={pitchId}
              type="range" min="-10" max="10" step="1" 
              value={settings.pitch}
              aria-valuemin={-10}
              aria-valuemax={10}
              aria-valuenow={settings.pitch}
              aria-valuetext={`Tono ${settings.pitch}`}
              onChange={(e) => onChange({...settings, pitch: parseInt(e.target.value)})}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl h-full flex flex-col" aria-labelledby="mixer-heading">
      <h2 id="mixer-heading" className="text-xl font-bold mb-4 text-brand-500 flex items-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
        Mesa de Mezclas
      </h2>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <VoiceControls 
          label="Configuración de Voz" 
          settings={voiceSettings} 
          onChange={setVoiceSettings}
          idPrefix="single"
        />
      </div>
    </section>
  );
};

export default MixingConsole;