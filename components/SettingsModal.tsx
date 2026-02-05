import React from 'react';
import { X, Volume2, Wind, Zap, Activity } from 'lucide-react';

export interface GameSettings {
  masterVolume: number;
  ambienceVolume: number;
  sfxVolume: number;
  reduceMotion: boolean;
  weatherEnabled: boolean;
}

interface SettingsModalProps {
  settings: GameSettings;
  onUpdate: (newSettings: GameSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdate, onClose }) => {
  const handleChange = (key: keyof GameSettings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="bg-slate-900/95 text-slate-100 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.8)] max-w-md w-full border border-slate-700 relative overflow-hidden transform transition-all animate-slide-up">
        
        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-950/50">
          <h2 className="text-xl font-bold flex items-center gap-2 text-cyan-400">
            <Activity size={20} /> App Settings
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8 max-h-[60vh] overflow-y-auto">
          
          {/* Audio Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-800 pb-1">Audio Configuration</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm items-center">
                <span className="flex items-center gap-2 font-medium"><Volume2 size={16} className="text-cyan-300"/> Master Volume</span>
                <span className="text-cyan-300 font-mono text-xs bg-cyan-900/30 px-2 py-0.5 rounded">{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={settings.masterVolume}
                onChange={(e) => handleChange('masterVolume', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm items-center">
                <span className="flex items-center gap-2 font-medium text-slate-300"><Wind size={16} className="text-indigo-300"/> Ambience (Rumble)</span>
                <span className="text-slate-400 font-mono text-xs">{Math.round(settings.ambienceVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={settings.ambienceVolume}
                onChange={(e) => handleChange('ambienceVolume', parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm items-center">
                <span className="flex items-center gap-2 font-medium text-slate-300"><Zap size={16} className="text-yellow-300"/> Effects (Rain/Fog)</span>
                <span className="text-slate-400 font-mono text-xs">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={settings.sfxVolume}
                onChange={(e) => handleChange('sfxVolume', parseFloat(e.target.value))}
                className="w-full accent-yellow-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Graphics Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-800 pb-1">Visual Preferences</h3>
            
            <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-slate-800/30 rounded-lg transition">
              <span className="flex flex-col">
                <span className="font-medium text-slate-200">Weather Particles</span>
                <span className="text-xs text-slate-500 group-hover:text-slate-400">Show rain, fog, and lightning effects</span>
              </span>
              <div className="relative">
                <input type="checkbox" className="sr-only peer" checked={settings.weatherEnabled} onChange={(e) => handleChange('weatherEnabled', e.target.checked)} />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-slate-800/30 rounded-lg transition">
               <span className="flex flex-col">
                <span className="font-medium text-slate-200">Reduced Motion</span>
                <span className="text-xs text-slate-500 group-hover:text-slate-400">Disable swaying UI and auto-rotation</span>
              </span>
              <div className="relative">
                <input type="checkbox" className="sr-only peer" checked={settings.reduceMotion} onChange={(e) => handleChange('reduceMotion', e.target.checked)} />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </div>
            </label>
          </div>

        </div>

        <div className="p-5 bg-slate-950/50 border-t border-slate-800 text-right">
           <button onClick={onClose} className="px-6 py-2 bg-slate-100 hover:bg-white text-slate-900 font-bold rounded-xl transition shadow-lg active:scale-95">
             Save & Close
           </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;