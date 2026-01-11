import React from 'react';

interface InputZoneProps {
  script: string;
  setScript: (s: string) => void;
}

const InputZone: React.FC<InputZoneProps> = ({ script, setScript }) => {
  
  const insertTag = (tag: string) => {
    setScript(prev => prev + ` ${tag} `);
    // Retornar foco al editor después de insertar (opcional, pero buena práctica UX)
    document.getElementById('script-editor')?.focus();
  };

  return (
    <section className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl h-full flex flex-col" aria-labelledby="input-heading">
      <h2 id="input-heading" className="text-xl font-bold mb-4 text-brand-500 flex items-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        Editor de Guion
      </h2>

      <div className="flex-1 flex flex-col relative">
        <label htmlFor="script-editor" className="sr-only">Editor de texto del guion</label>
        
        {/* Accessibility Toolbar */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2" role="toolbar" aria-label="Herramientas de actuación">
          {['[pausa]', '[risa]', '[grito]', '[llanto]'].map(tag => (
            <button 
              key={tag} 
              onClick={() => insertTag(tag)} 
              className="text-xs font-medium bg-slate-700 hover:bg-slate-600 text-brand-200 px-3 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              aria-label={`Insertar etiqueta de actuación ${tag.replace('[', '').replace(']', '')}`}
            >
              {tag}
            </button>
          ))}
        </div>

        <textarea
          id="script-editor"
          value={script}
          onChange={(e) => setScript(e.target.value)}
          className="flex-1 w-full bg-slate-900 text-slate-200 p-4 rounded-lg border border-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/50 outline-none resize-none font-mono text-sm leading-relaxed"
          placeholder="Escribe o pega tu guion aquí..."
          spellCheck="false"
        />
      </div>
    </section>
  );
};

export default InputZone;