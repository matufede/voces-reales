import React, { useState } from 'react';
import InputZone from './components/InputZone';
import MixingConsole from './components/MixingConsole';
import { generateAudioProduction, pcmToWav, getDurationFromBase64PCM, generateSRTFile } from './services/geminiService';
import { TTSMode, VoiceSettings, Production } from './types';
import { DEFAULT_SCRIPT, AVAILABLE_VOICES } from './constants';

const App = () => {
  // Studio State
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    voiceId: AVAILABLE_VOICES[0].id,
    speed: 1.0,
    pitch: 0,
    style: 'Natural'
  });

  const [history, setHistory] = useState<Production[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!script.trim()) return alert("El guion está vacío.");
    setIsGenerating(true);
    
    try {
      // 1. Generate Raw Audio
      const rawPcmBase64 = await generateAudioProduction(script, voiceSettings);
      
      // 2. Convert to Wav
      const wavUrl = pcmToWav(rawPcmBase64);
      
      // 3. Calculate Duration & Generate Subtitles
      const duration = getDurationFromBase64PCM(rawPcmBase64);
      const srtUrl = generateSRTFile(script, duration);
      
      const newProd: Production = {
        id: Date.now().toString(),
        name: `Producción ${history.length + 1}`,
        type: TTSMode.SINGLE,
        audioUrl: wavUrl,
        srtUrl: srtUrl,
        createdAt: Date.now()
      };
      setHistory([newProd, ...history]);
    } catch (e) {
      console.error(e);
      alert("Error generando audio. Verifica tu conexión.");
    } finally {
      setIsGenerating(false);
    }
  };

  const clearHistory = () => {
    if (history.length === 0) return;
    if (window.confirm("¿Borrar todo el historial?")) {
      setHistory([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white uppercase">Voces<span className="text-brand-500">Reales</span></h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">AI Audio Production Studio</p>
            </div>
          </div>
          
          <div className="hidden md:block">
            <span className="text-[10px] bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700 font-bold uppercase tracking-widest">Estudio Profesional v2.0</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full animate-in fade-in duration-500">
          {/* Left Col: Input */}
          <div className="lg:col-span-5">
            <InputZone script={script} setScript={setScript} />
          </div>

          {/* Middle Col: Mixer */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <MixingConsole 
              voiceSettings={voiceSettings}
              setVoiceSettings={setVoiceSettings}
            />
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-5 rounded-2xl font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-3 border-b-4 ${
                isGenerating 
                ? 'bg-slate-800 border-slate-900 cursor-not-allowed text-slate-500' 
                : 'bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 border-brand-800 text-white transform hover:-translate-y-1 active:translate-y-0 active:border-b-0'
              }`}
            >
              {isGenerating ? (
                <><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div><span>PROCESANDO...</span></>
              ) : (
                <><svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>GENERAR AUDIO</>
              )}
            </button>
          </div>

          {/* Right Col: History */}
          <aside className="lg:col-span-3 bg-slate-900/50 rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Historial de Grabación</h3>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase">Limpiar</button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  <p className="text-xs font-bold uppercase tracking-widest">Vacío</p>
                </div>
              ) : (
                history.map((prod) => (
                  <div key={prod.id} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 group hover:border-brand-500 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="block text-xs font-bold text-white mb-1">{prod.name}</span>
                        <span className="text-[10px] font-black text-brand-500 uppercase tracking-tighter">{new Date(prod.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2">
                         {prod.srtUrl && (
                          <a 
                            href={prod.srtUrl} 
                            download={`${prod.name}.srt`} 
                            className="text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 p-1.5 rounded-lg transition-colors flex items-center gap-1"
                            title="Descargar SRT"
                          >
                            <span className="text-[9px] font-bold">SRT</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </a>
                        )}
                        <a 
                          href={prod.audioUrl} 
                          download={`${prod.name}.wav`} 
                          className="text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 p-1.5 rounded-lg transition-colors flex items-center gap-1"
                          title="Descargar Audio"
                        >
                           <span className="text-[9px] font-bold">WAV</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </a>
                      </div>
                    </div>
                    <audio src={prod.audioUrl} controls className="w-full h-8 accent-brand-500" />
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </main>

      <footer className="p-4 border-t border-slate-900 bg-slate-950 text-center">
         <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">Built with Gemini 2.5 Flash TTS API</p>
      </footer>
    </div>
  );
};

export default App;