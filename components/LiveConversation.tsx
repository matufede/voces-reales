import React, { useState, useRef, useEffect } from 'react';
import { LiveClient } from '../services/liveService';

const LiveConversation: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{user: boolean, text: string}[]>([]);
  const liveClient = useRef<LiveClient | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptions]);

  const toggleSession = async () => {
    if (isActive) {
      liveClient.current?.disconnect();
      liveClient.current = null;
      setIsActive(false);
    } else {
      liveClient.current = new LiveClient();
      try {
        await liveClient.current.connect((text, isUser) => {
          setTranscriptions(prev => {
             return [...prev, {user: isUser, text}];
          });
        });
        setIsActive(true);
      } catch (e) {
        console.error(e);
        alert("Error connecting to Live API (Check Console/API Key)");
      }
    }
  };

  return (
    <section aria-labelledby="live-heading" className="h-full flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
        <h2 id="live-heading" className="text-lg font-bold text-white flex items-center gap-3">
           <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isActive ? 'bg-green-400' : 'hidden'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
           </span>
        </h2>
        <button
          onClick={toggleSession}
          aria-pressed={isActive}
          className={`px-6 py-2 rounded-full font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
            isActive 
            ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500' 
            : 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
          }`}
        >
          {isActive ? 'Desconectar Llamada' : 'Iniciar Llamada'}
        </button>
      </div>
      
      {/* Transcript Log */}
      <div 
        className="flex-1 p-6 overflow-y-auto space-y-4 scroll-smooth" 
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        tabIndex={0}
        aria-label="Registro de la conversación"
      >
        {transcriptions.length === 0 && !isActive && (
           <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
              <svg className="w-16 h-16 mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              <p className="text-xl font-medium text-slate-200">Listo para conversar</p>
              <p className="text-sm mt-2 max-w-md">Presiona "Iniciar Llamada" y usa tu micrófono para interactuar con la IA en tiempo real.</p>
           </div>
        )}
        {transcriptions.map((t, i) => (
          <article key={i} className={`flex ${t.user ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-base leading-relaxed ${
              t.user 
              ? 'bg-brand-600 text-white rounded-tr-sm' 
              : 'bg-slate-700 text-slate-100 rounded-tl-sm border border-slate-600'
            }`}>
              <span className="sr-only">{t.user ? 'Tú dijiste:' : 'Gemini dijo:'}</span>
              {t.text}
            </div>
          </article>
        ))}
      </div>

      <div className="p-3 bg-slate-800 border-t border-slate-700 text-center">
        <p className="text-xs text-slate-400 font-medium">Impulsado por gemini-2.5-flash-native-audio-preview</p>
      </div>
    </section>
  );
};

export default LiveConversation;